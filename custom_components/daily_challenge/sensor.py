"""Sensors with the derived figures of a challenge."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from homeassistant.components.sensor import (
    SensorEntity,
    SensorEntityDescription,
    SensorStateClass,
)
from homeassistant.const import PERCENTAGE, EntityCategory, Platform, UnitOfTime
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .const import CONF_END_DATE, DOMAIN
from .coordinator import ChallengeCoordinator, DailyChallengeConfigEntry
from .entity import DailyChallengeEntity, GroupEntity
from .groups import GroupCoordinator, GroupStats, group_coordinator, is_group

if TYPE_CHECKING:
    from homeassistant.helpers.typing import StateType

    from .calculations import ChallengeStats

PARALLEL_UPDATES = 0


@dataclass(frozen=True, kw_only=True)
class ChallengeSensorDescription(SensorEntityDescription):
    """Describes a challenge sensor."""

    value_fn: Callable[[ChallengeStats], StateType]
    attrs_fn: Callable[[ChallengeStats], dict[str, Any]] | None = None
    uses_challenge_unit: bool = True
    # Appended to the challenge unit, e.g. "/d" for amounts per day.
    unit_suffix: str = ""
    requires_end_date: bool = False


def _iso(value: Any) -> str | None:
    return value.isoformat() if value is not None else None


SENSORS: tuple[ChallengeSensorDescription, ...] = (
    ChallengeSensorDescription(
        key="today_target",
        translation_key="today_target",
        value_fn=lambda s: s.effective_target_today,
        attrs_fn=lambda s: {
            "daily_target": s.target_today,
            "deficit": s.deficit_yesterday,
        },
    ),
    ChallengeSensorDescription(
        key="progress",
        translation_key="progress",
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
        uses_challenge_unit=False,
        value_fn=lambda s: s.progress_today,
    ),
    ChallengeSensorDescription(
        key="total",
        translation_key="total",
        state_class=SensorStateClass.TOTAL,
        value_fn=lambda s: s.total,
    ),
    ChallengeSensorDescription(
        key="current_streak",
        translation_key="current_streak",
        native_unit_of_measurement=UnitOfTime.DAYS,
        state_class=SensorStateClass.MEASUREMENT,
        uses_challenge_unit=False,
        value_fn=lambda s: s.current_streak,
    ),
    ChallengeSensorDescription(
        key="best_streak",
        translation_key="best_streak",
        native_unit_of_measurement=UnitOfTime.DAYS,
        uses_challenge_unit=False,
        value_fn=lambda s: s.best_streak.length,
        attrs_fn=lambda s: {
            "start": _iso(s.best_streak.start),
            "end": _iso(s.best_streak.end),
        },
    ),
    ChallengeSensorDescription(
        key="target_to_date",
        translation_key="target_to_date",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda s: s.target_to_date,
    ),
    ChallengeSensorDescription(
        key="delta",
        translation_key="delta",
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda s: s.delta,
    ),
    ChallengeSensorDescription(
        key="remaining",
        translation_key="remaining",
        requires_end_date=True,
        value_fn=lambda s: s.remaining,
    ),
    ChallengeSensorDescription(
        key="days_left",
        translation_key="days_left",
        native_unit_of_measurement=UnitOfTime.DAYS,
        uses_challenge_unit=False,
        requires_end_date=True,
        value_fn=lambda s: s.days_left,
    ),
    ChallengeSensorDescription(
        key="required_per_day",
        translation_key="required_per_day",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        unit_suffix=f"/{UnitOfTime.DAYS}",
        requires_end_date=True,
        value_fn=lambda s: s.required_per_day,
    ),
    ChallengeSensorDescription(
        key="average",
        translation_key="average",
        entity_category=EntityCategory.DIAGNOSTIC,
        suggested_display_precision=1,
        unit_suffix=f"/{UnitOfTime.DAYS}",
        value_fn=lambda s: s.average_per_day,
    ),
    ChallengeSensorDescription(
        key="best_day",
        translation_key="best_day",
        value_fn=lambda s: s.best_day_value,
        attrs_fn=lambda s: {"date": _iso(s.best_day_date)},
    ),
    ChallengeSensorDescription(
        key="this_week",
        translation_key="this_week",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda s: s.this_week,
    ),
    ChallengeSensorDescription(
        key="this_month",
        translation_key="this_month",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda s: s.this_month,
    ),
    ChallengeSensorDescription(
        key="this_year",
        translation_key="this_year",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda s: s.this_year,
    ),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: DailyChallengeConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the sensors."""
    if is_group(entry):
        _async_setup_group(hass, group_coordinator(entry), async_add_entities)
        return
    has_end_date = bool(entry.options.get(CONF_END_DATE))
    if not has_end_date:
        # The end date was removed: drop the now meaningless sensors.
        registry = er.async_get(hass)
        for description in SENSORS:
            if description.requires_end_date and (
                entity_id := registry.async_get_entity_id(
                    Platform.SENSOR, DOMAIN, f"{entry.entry_id}_{description.key}"
                )
            ):
                registry.async_remove(entity_id)

    async_add_entities(
        ChallengeSensor(entry.runtime_data, description)
        for description in SENSORS
        if has_end_date or not description.requires_end_date
    )


class ChallengeSensor(DailyChallengeEntity, SensorEntity):
    """A figure derived from the challenge data."""

    entity_description: ChallengeSensorDescription

    def __init__(
        self,
        coordinator: ChallengeCoordinator,
        description: ChallengeSensorDescription,
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, description.key)
        self.entity_description = description
        if description.uses_challenge_unit:
            self._attr_native_unit_of_measurement = (
                self.challenge_unit + description.unit_suffix
            )

    @property
    def native_value(self) -> StateType:
        """Return the current value."""
        return self.entity_description.value_fn(self.coordinator.data)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        """Return additional attributes."""
        if self.entity_description.attrs_fn is None:
            return None
        return self.entity_description.attrs_fn(self.coordinator.data)


@dataclass(frozen=True, kw_only=True)
class GroupSensorDescription(SensorEntityDescription):
    """Describes a sensor of a group."""

    value_fn: Callable[[GroupStats], StateType]
    attrs_fn: Callable[[GroupStats], dict[str, Any]] | None = None
    # Only with a shared goal.
    requires_goal: bool = False
    # Amounts of all members together, in their shared unit.
    uses_group_unit: bool = False


def _names(stats: GroupStats, keys: list[str]) -> str | None:
    names = [stats.members[key].name for key in keys if key in stats.members]
    return ", ".join(names) if names else None


def _ranking(stats: GroupStats) -> dict[str, Any]:
    return {
        "ranking": [
            {
                "rank": score.rank,
                "name": stats.members[score.key].name,
                "amount": score.amount,
                "target": score.target,
                "percent": score.percent,
                "streak": score.streak,
            }
            for score in stats.week_ranking
            if score.key in stats.members
        ]
    }


def _winners(stats: GroupStats) -> dict[str, Any]:
    return {
        "week": stats.last_week.isoformat(),
        "wins": {
            stats.members[key].name: count
            for key, count in stats.wins.items()
            if key in stats.members
        },
    }


GROUP_SENSORS: tuple[GroupSensorDescription, ...] = (
    GroupSensorDescription(
        key="leader",
        translation_key="leader",
        value_fn=lambda s: _names(s, s.leaders),
        attrs_fn=_ranking,
    ),
    GroupSensorDescription(
        key="group_streak",
        translation_key="group_streak",
        native_unit_of_measurement=UnitOfTime.DAYS,
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda s: s.streak,
        attrs_fn=lambda s: {"best": s.best_streak},
    ),
    GroupSensorDescription(
        key="last_week_winner",
        translation_key="last_week_winner",
        value_fn=lambda s: _names(s, s.last_week_winners),
        attrs_fn=_winners,
    ),
    GroupSensorDescription(
        key="group_total",
        translation_key="group_total",
        requires_goal=True,
        uses_group_unit=True,
        value_fn=lambda s: s.goal.total if s.goal else None,
    ),
    GroupSensorDescription(
        key="group_goal_progress",
        translation_key="group_goal_progress",
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
        requires_goal=True,
        value_fn=lambda s: s.goal.progress if s.goal else None,
    ),
    GroupSensorDescription(
        key="group_goal_remaining",
        translation_key="group_goal_remaining",
        requires_goal=True,
        uses_group_unit=True,
        value_fn=lambda s: s.goal.remaining if s.goal else None,
    ),
)


def _async_setup_group(
    hass: HomeAssistant,
    coordinator: GroupCoordinator,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the sensors of a group; drop goal sensors without a goal."""
    has_goal = coordinator.data.goal is not None
    entry_id = coordinator.config_entry.entry_id
    if not has_goal:
        registry = er.async_get(hass)
        for description in GROUP_SENSORS:
            if description.requires_goal and (
                entity_id := registry.async_get_entity_id(
                    Platform.SENSOR, DOMAIN, f"{entry_id}_{description.key}"
                )
            ):
                registry.async_remove(entity_id)
    async_add_entities(
        GroupSensor(coordinator, description)
        for description in GROUP_SENSORS
        if has_goal or not description.requires_goal
    )


class GroupSensor(GroupEntity, SensorEntity):
    """A figure of a group."""

    entity_description: GroupSensorDescription

    def __init__(
        self, coordinator: GroupCoordinator, description: GroupSensorDescription
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, description.key)
        self.entity_description = description
        if description.uses_group_unit:
            self._attr_native_unit_of_measurement = coordinator.unit

    @property
    def native_value(self) -> StateType:
        """Return the current value."""
        return self.entity_description.value_fn(self.coordinator.data)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        """Return additional attributes."""
        if self.entity_description.attrs_fn is None:
            return None
        return self.entity_description.attrs_fn(self.coordinator.data)
