"""Groups: several challenges in one ranking, with a shared goal and streak."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Any

from homeassistant.config_entries import (
    SIGNAL_CONFIG_ENTRY_CHANGED,
    ConfigEntry,
    ConfigEntryChange,
    ConfigEntryState,
)
from homeassistant.const import CONF_ICON
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator
from homeassistant.util import dt as dt_util

from .calculations import (
    GoalPeriod,
    GoalProgress,
    Member,
    RankingMetric,
    RankingPeriod,
    Score,
    all_reached_today,
    goal_progress,
    group_streak,
    leaders,
    ranking,
    week_winners,
)
from .const import (
    CONF_CREATED,
    CONF_GROUP_GOAL,
    CONF_GROUP_GOAL_PERIOD,
    CONF_KIND,
    CONF_MEMBERS,
    CONF_PERSON,
    CONF_RANKING,
    CONF_UNIT,
    DOMAIN,
    KIND_GROUP,
    LOGGER,
)
from .coordinator import SIGNAL_CHALLENGE_UPDATED, ChallengeCoordinator
from .people import person_info

type GroupConfigEntry = ConfigEntry[GroupCoordinator]
type GroupEventListener = Callable[[str, dict[str, Any]], None]

EVENT_LEAD_CHANGE = "lead_change"
EVENT_WEEK_WINNER = "week_winner"
EVENT_GOAL_REACHED = "goal_reached"
GROUP_EVENTS = [EVENT_LEAD_CHANGE, EVENT_WEEK_WINNER, EVENT_GOAL_REACHED]


def is_group(entry: ConfigEntry | None) -> bool:
    """Return whether a config entry is a group (not a challenge)."""
    return entry is not None and entry.data.get(CONF_KIND) == KIND_GROUP


def raise_if_group(entry: ConfigEntry) -> None:
    """Raise a translated error for actions that need a challenge."""
    if is_group(entry):
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="is_group",
            translation_placeholders={"name": entry.title},
        )


@callback
def display_name(hass: HomeAssistant, entry: ConfigEntry) -> str:
    """Return the name of a member: its person, else the challenge."""
    info = person_info(hass, entry.options.get(CONF_PERSON))
    return (info or {}).get("name") or entry.title


@dataclass(frozen=True, slots=True)
class MemberInfo:
    """How a member is shown in a ranking."""

    key: str
    name: str
    challenge: str
    unit: str
    icon: str
    person: str | None
    picture: str | None


@dataclass(frozen=True, slots=True)
class GroupStats:
    """All figures of a group as seen today."""

    today: date
    members: dict[str, MemberInfo]
    week_ranking: list[Score]
    leaders: list[str]
    streak: int
    best_streak: int
    all_reached_today: bool
    last_week: date
    last_week_winners: list[str]
    wins: dict[str, int] = field(default_factory=dict)
    goal: GoalProgress | None = None


class GroupCoordinator(DataUpdateCoordinator[GroupStats]):
    """Calculates a group from the data of its member challenges."""

    config_entry: GroupConfigEntry

    def __init__(self, hass: HomeAssistant, entry: GroupConfigEntry) -> None:
        """Initialize the coordinator."""
        super().__init__(
            hass,
            LOGGER,
            config_entry=entry,
            name=f"{DOMAIN} group {entry.title}",
            update_interval=None,
        )
        self._event_listeners: list[GroupEventListener] = []
        # The last member that led the week alone (survives ties).
        self._sole_leader: str | None = None

    @property
    def metric(self) -> RankingMetric:
        """Return what the group ranks by."""
        return RankingMetric(
            self.config_entry.options.get(CONF_RANKING, RankingMetric.PERCENT)
        )

    @property
    def member_ids(self) -> list[str]:
        """Return the configured member challenges."""
        return list(self.config_entry.options.get(CONF_MEMBERS, []))

    @property
    def unit(self) -> str | None:
        """Return the unit shared by all members, if they share one."""
        units = {info.unit for info in self.data.members.values()}
        return units.pop() if len(units) == 1 else None

    def loaded_members(self) -> list[tuple[ConfigEntry, ChallengeCoordinator]]:
        """Return the member challenges that are loaded."""
        result = []
        for entry_id in self.member_ids:
            entry = self.hass.config_entries.async_get_entry(entry_id)
            if (
                entry is not None
                and entry.state is ConfigEntryState.LOADED
                and isinstance(
                    getattr(entry, "runtime_data", None), ChallengeCoordinator
                )
            ):
                result.append((entry, entry.runtime_data))
        return result

    def members(self) -> list[Member]:
        """Return the data of the loaded members for the calculations."""
        return [
            Member(
                entry.entry_id,
                coordinator.store.days,
                coordinator.store.target_history,
                coordinator.settings,
            )
            for entry, coordinator in self.loaded_members()
        ]

    async def _async_setup(self) -> None:
        """Follow the members: their changes and their loading."""
        entry = self.config_entry

        @callback
        def _member_updated(entry_id: str) -> None:
            if entry_id in self.member_ids:
                self.async_member_changed()

        @callback
        def _entry_changed(change: ConfigEntryChange, changed: ConfigEntry) -> None:
            if changed.entry_id in self.member_ids:
                self.async_member_changed()

        entry.async_on_unload(
            async_dispatcher_connect(
                self.hass, SIGNAL_CHALLENGE_UPDATED, _member_updated
            )
        )
        entry.async_on_unload(
            async_dispatcher_connect(
                self.hass, SIGNAL_CONFIG_ENTRY_CHANGED, _entry_changed
            )
        )

    async def _async_update_data(self) -> GroupStats:
        stats = self.calculate()
        self._sole_leader = stats.leaders[0] if len(stats.leaders) == 1 else None
        return stats

    def calculate(self, today: date | None = None) -> GroupStats:
        """Calculate all figures of the group."""
        today = today or dt_util.now().date()
        loaded = self.loaded_members()
        members = self.members()
        infos = {entry.entry_id: self._info(entry) for entry, _coordinator in loaded}
        metric = self.metric
        week = ranking(members, metric, RankingPeriod.WEEK, today)
        streak, best = group_streak(members, today)
        created = self.config_entry.options.get(CONF_CREATED)
        since = date.fromisoformat(created) if created else today
        winners = week_winners(members, metric, since, today)
        wins: dict[str, int] = dict.fromkeys(infos, 0)
        for keys in winners.values():
            for key in keys:
                wins[key] = wins.get(key, 0) + 1
        last_week = today - timedelta(days=today.weekday() + 7)
        goal_amount = self.config_entry.options.get(CONF_GROUP_GOAL)
        goal = (
            goal_progress(
                members,
                int(goal_amount),
                GoalPeriod(
                    self.config_entry.options.get(
                        CONF_GROUP_GOAL_PERIOD, GoalPeriod.WEEK
                    )
                ),
                today,
            )
            if goal_amount
            else None
        )
        return GroupStats(
            today=today,
            members=infos,
            week_ranking=week,
            leaders=leaders(week, metric),
            streak=streak,
            best_streak=best,
            all_reached_today=all_reached_today(members, today),
            last_week=last_week,
            last_week_winners=winners.get(last_week, []),
            wins=wins,
            goal=goal,
        )

    def _info(self, entry: ConfigEntry) -> MemberInfo:
        person = entry.options.get(CONF_PERSON) or None
        info = person_info(self.hass, person)
        return MemberInfo(
            key=entry.entry_id,
            name=display_name(self.hass, entry),
            challenge=entry.title,
            unit=str(entry.options[CONF_UNIT]),
            icon=str(entry.options[CONF_ICON]),
            person=person,
            picture=(info or {}).get("picture"),
        )

    def ranking(self, period: RankingPeriod, metric: RankingMetric) -> list[Score]:
        """Return the ranking for another period or metric (for the card)."""
        return ranking(self.members(), metric, period, dt_util.now().date())

    @callback
    def async_add_event_listener(
        self, listener: GroupEventListener
    ) -> Callable[[], None]:
        """Call `listener` with the events of the group."""
        self._event_listeners.append(listener)

        @callback
        def remove() -> None:
            self._event_listeners.remove(listener)

        return remove

    def _fire(self, kind: str, data: dict[str, Any]) -> None:
        for listener in list(self._event_listeners):
            listener(kind, data)

    def _names(self, stats: GroupStats, keys: list[str]) -> list[str]:
        return [stats.members[key].name for key in keys if key in stats.members]

    @callback
    def async_member_changed(self) -> None:
        """Recalculate after a change of a member; fire the group events."""
        # None until the first refresh (typed as always set).
        old: GroupStats | None = self.data
        new = self.calculate()
        self.async_set_updated_data(new)
        if old is None:
            return
        if new.today != old.today:
            # A new day: no lead changes from the rollover; a new week has
            # a winner of the last one.
            if new.last_week != old.last_week and new.last_week_winners:
                self._fire(
                    EVENT_WEEK_WINNER,
                    {
                        "winners": self._names(new, new.last_week_winners),
                        "week": new.last_week.isoformat(),
                    },
                )
            return
        if set(new.members) != set(old.members):
            # A member was loaded or unloaded: no real change of the lead.
            self._sole_leader = new.leaders[0] if len(new.leaders) == 1 else None
            return
        if len(new.leaders) == 1 and new.leaders[0] != self._sole_leader:
            previous = self._sole_leader
            self._sole_leader = new.leaders[0]
            self._fire(
                EVENT_LEAD_CHANGE,
                {
                    "leader": new.members[new.leaders[0]].name,
                    "previous": new.members[previous].name
                    if previous in new.members
                    else None,
                },
            )
        if (
            new.goal is not None
            and old.goal is not None
            and old.goal.total < new.goal.goal <= new.goal.total
        ):
            self._fire(
                EVENT_GOAL_REACHED, {"total": new.goal.total, "goal": new.goal.goal}
            )


def ranking_rows(stats: GroupStats, scores: list[Score]) -> list[dict[str, Any]]:
    """Return a ranking in a JSON-serializable form."""
    rows = []
    for score in scores:
        info = stats.members.get(score.key)
        if info is None:
            continue
        rows.append(
            {
                "entry_id": score.key,
                "rank": score.rank,
                "name": info.name,
                "challenge": info.challenge,
                "icon": info.icon,
                "unit": info.unit,
                "person": info.person,
                "picture": info.picture,
                "amount": score.amount,
                "target": score.target,
                "percent": score.percent,
                "streak": score.streak,
            }
        )
    return rows


def group_status_response(coordinator: GroupCoordinator) -> dict[str, Any]:
    """Return the figures of a group, e.g. for get_status."""
    stats = coordinator.data
    goal = stats.goal
    return {
        "name": coordinator.config_entry.title,
        "kind": KIND_GROUP,
        "ranking_by": coordinator.metric.value,
        "unit": coordinator.unit,
        "ranking": ranking_rows(stats, stats.week_ranking),
        "leaders": [stats.members[key].name for key in stats.leaders],
        "streak": stats.streak,
        "best_streak": stats.best_streak,
        "all_reached_today": stats.all_reached_today,
        "last_week_winners": [
            stats.members[key].name
            for key in stats.last_week_winners
            if key in stats.members
        ],
        "wins": {
            stats.members[key].name: count
            for key, count in stats.wins.items()
            if key in stats.members
        },
        "goal": None
        if goal is None
        else {
            "total": goal.total,
            "goal": goal.goal,
            "progress": goal.progress,
            "remaining": goal.remaining,
        },
    }


def group_coordinator(entry: ConfigEntry) -> GroupCoordinator:
    """Return the coordinator of a group entry."""
    coordinator = entry.runtime_data
    if not isinstance(coordinator, GroupCoordinator):  # pragma: no cover
        msg = f"{entry.entry_id} is not a group"
        raise TypeError(msg)
    return coordinator
