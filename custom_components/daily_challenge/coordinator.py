"""Challenge data: store, calculations and listeners."""

from __future__ import annotations

import math
from collections.abc import Callable
from datetime import date, datetime, timedelta
from typing import TYPE_CHECKING, Any, NotRequired, TypedDict

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import (
    Event,
    EventStateChangedData,
    HomeAssistant,
    State,
    callback,
)
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers.event import (
    async_track_point_in_utc_time,
    async_track_state_change_event,
)
from homeassistant.helpers.storage import Store
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator
from homeassistant.util import dt as dt_util

from .calculations import (
    ChallengeSettings,
    ChallengeStats,
    ChallengeStatus,
    DeficitMode,
    History,
    MilestoneType,
    StreakRule,
    build_history,
    calculate,
    reached_milestones,
)
from .const import (
    CONF_DAILY_TARGET,
    CONF_DEFICIT_MODE,
    CONF_END_DATE,
    CONF_MILESTONES,
    CONF_SOURCE_ENTITY,
    CONF_SOURCE_MODE,
    CONF_START_DATE,
    CONF_STREAK_RULE,
    COUNTER_RESET_SHARE,
    DOMAIN,
    LOGGER,
    MAX_DAY_VALUE,
    SAVE_DELAY,
    STORAGE_MINOR_VERSION,
    STORAGE_VERSION,
    SourceMode,
)

if TYPE_CHECKING:
    from collections.abc import Mapping

type DailyChallengeConfigEntry = ConfigEntry[ChallengeCoordinator]
type MilestoneListener = Callable[[list[tuple[MilestoneType, int]]], None]


class SourceData(TypedDict):
    """Last reading of a counter source sensor."""

    entity_id: str
    last: float
    # Fraction not yet added, e.g. 0.4 of 1.4 km.
    carry: float
    # The reading before a big drop; the next reading tells a reset from a
    # short glitch (e.g. 0 while a device restarts).
    reset_from: NotRequired[float]


class StoreData(TypedDict):
    """Persisted data of one challenge."""

    days: dict[str, int]
    target_history: dict[str, int]
    source: SourceData | None


def settings_from_options(options: Mapping[str, Any]) -> ChallengeSettings:
    """Build calculation settings from config entry options."""
    end_date = options.get(CONF_END_DATE)
    return ChallengeSettings(
        start_date=date.fromisoformat(options[CONF_START_DATE]),
        end_date=date.fromisoformat(end_date) if end_date else None,
        streak_rule=StreakRule(options[CONF_STREAK_RULE]),
        deficit_mode=DeficitMode(options[CONF_DEFICIT_MODE]),
    )


def milestones_from_options(options: Mapping[str, Any]) -> list[MilestoneType]:
    """Return the enabled milestone kinds in a fixed order (default: all)."""
    enabled = options.get(CONF_MILESTONES)
    if enabled is None:
        return list(MilestoneType)
    return [kind for kind in MilestoneType if kind.value in enabled]


class _VersionedStore(Store[StoreData]):
    """Store with the migrations of the challenge data."""

    async def _async_migrate_func(
        self, old_major_version: int, old_minor_version: int, old_data: Any
    ) -> StoreData:
        """Migrate older data; nothing is ever dropped."""
        data = dict(old_data)
        if old_major_version == 1 and old_minor_version < 2:
            data.setdefault("source", None)
        return StoreData(
            days=data.get("days", {}),
            target_history=data.get("target_history", {}),
            source=data.get("source"),
        )


class ChallengeStore:
    """Thin wrapper around the per-challenge store file."""

    def __init__(self, hass: HomeAssistant, entry_id: str) -> None:
        """Initialize the store."""
        self._store = _VersionedStore(
            hass,
            STORAGE_VERSION,
            f"{DOMAIN}.{entry_id}",
            minor_version=STORAGE_MINOR_VERSION,
        )
        self.days: dict[date, int] = {}
        self.target_history: dict[date, int] = {}
        self.source: SourceData | None = None

    async def async_load(self) -> None:
        """Load and parse the stored data."""
        data = await self._store.async_load() or StoreData(
            days={}, target_history={}, source=None
        )
        self.days = {
            date.fromisoformat(day): value
            for day, value in data["days"].items()
            if value > 0
        }
        self.target_history = {
            date.fromisoformat(day): target
            for day, target in data["target_history"].items()
        }
        self.source = data.get("source")

    def _data_to_save(self) -> StoreData:
        return StoreData(
            days={day.isoformat(): value for day, value in sorted(self.days.items())},
            target_history={
                day.isoformat(): target
                for day, target in sorted(self.target_history.items())
            },
            source=self.source,
        )

    @callback
    def async_delay_save(self) -> None:
        """Save after a short delay so quick clicks are bundled."""
        self._store.async_delay_save(self._data_to_save, SAVE_DELAY)

    async def async_save(self) -> None:
        """Save immediately."""
        await self._store.async_save(self._data_to_save())

    async def async_remove(self) -> None:
        """Delete the store file."""
        await self._store.async_remove()

    def set_target(self, day: date, target: int) -> None:
        """Record a daily target valid from `day` on."""
        self.target_history[day] = target


def _reading(state: State | None) -> float | None:
    """Return the numeric state of a source, or None if it has none."""
    if state is None or state.state in (STATE_UNKNOWN, STATE_UNAVAILABLE):
        return None
    try:
        value = float(state.state)
    except ValueError:
        return None
    return value if math.isfinite(value) else None


class ChallengeCoordinator(DataUpdateCoordinator[ChallengeStats]):
    """Holds the data of one challenge and pushes updates to its entities."""

    config_entry: DailyChallengeConfigEntry

    def __init__(self, hass: HomeAssistant, entry: DailyChallengeConfigEntry) -> None:
        """Initialize the coordinator."""
        super().__init__(
            hass,
            LOGGER,
            config_entry=entry,
            name=f"{DOMAIN} {entry.title}",
            update_interval=None,
        )
        self.store = ChallengeStore(hass, entry.entry_id)
        self._unsub_midnight: Callable[[], None] | None = None
        self._unsub_source: Callable[[], None] | None = None
        self._milestone_listeners: list[MilestoneListener] = []
        # The day the figures in `data` were calculated for.
        self._calculated_for: date | None = None

    @property
    def today(self) -> date:
        """Return the current local date in the Home Assistant time zone."""
        return dt_util.now().date()

    @property
    def settings(self) -> ChallengeSettings:
        """Return the calculation settings of this challenge."""
        return settings_from_options(self.config_entry.options)

    @property
    def source_entity(self) -> str | None:
        """Return the entity that feeds this challenge, if any."""
        return self.config_entry.options.get(CONF_SOURCE_ENTITY) or None

    @property
    def source_mode(self) -> SourceMode:
        """Return how the source sensor is read."""
        return SourceMode(
            self.config_entry.options.get(CONF_SOURCE_MODE, SourceMode.DAILY)
        )

    @property
    def today_from_source(self) -> bool:
        """Return whether a source sensor sets today's value by itself."""
        return self.source_entity is not None and self.source_mode is SourceMode.DAILY

    async def _async_setup(self) -> None:
        """Load the stored data before the first calculation."""
        await self.store.async_load()
        if not self.store.target_history:
            self.store.set_target(
                self.settings.start_date,
                int(self.config_entry.options[CONF_DAILY_TARGET]),
            )
            await self.store.async_save()
        if self.store.source is not None and (
            self.source_mode is not SourceMode.COUNTER
            or self.store.source["entity_id"] != self.source_entity
        ):
            # Another source or mode: a later counter starts afresh.
            self.store.source = None
            self.store.async_delay_save()
        self._schedule_midnight()
        self.config_entry.async_on_unload(self._cancel_midnight)

    @callback
    def async_start_source(self) -> None:
        """Follow the source sensor; called once the entities are set up."""
        if (entity_id := self.source_entity) is None:
            return
        self._unsub_source = async_track_state_change_event(
            self.hass, [entity_id], self._async_source_changed
        )
        self.config_entry.async_on_unload(self.async_stop_source)
        self._async_source_state(self.hass.states.get(entity_id))

    @callback
    def async_stop_source(self) -> None:
        """Stop following the source sensor (before the final save on unload)."""
        if self._unsub_source is not None:
            self._unsub_source()
            self._unsub_source = None

    @callback
    def _async_source_changed(self, event: Event[EventStateChangedData]) -> None:
        self._async_source_state(event.data["new_state"])

    @callback
    def _async_source_state(self, state: State | None) -> None:
        """Turn a new reading of the source sensor into today's value."""
        reading = _reading(state)
        if state is None or reading is None:
            return
        # The figures are recalculated at midnight; a reading that arrives
        # just before that recalculation must not use yesterday's status.
        if self.data is None or self._calculated_for != self.today:
            self.async_set_updated_data(self._calculate())
        active = self.data.status is ChallengeStatus.ACTIVE
        try:
            if self.source_mode is SourceMode.DAILY:
                self._async_daily_reading(state, reading, active=active)
            else:
                self._async_counter_reading(state.entity_id, reading, active=active)
        except ServiceValidationError as err:
            # E.g. the day just ended; nothing to count, nothing to break.
            LOGGER.debug("Reading of %s not counted: %s", state.entity_id, err)

    @callback
    def _async_daily_reading(
        self, state: State, reading: float, *, active: bool
    ) -> None:
        """Take the reading of a daily source as today's value."""
        today = self.today
        # A daily counter may still show yesterday's amount after midnight
        # until it resets; only a reading that changed today is today's.
        if dt_util.as_local(state.last_changed).date() != today:
            return
        # Rounded half up (Python's round() would make 2.5 → 2).
        value = max(0, min(MAX_DAY_VALUE, math.floor(reading + 0.5)))
        # After a restart, a source may restore yesterday's amount with a new
        # time stamp: an untouched new day does not take yesterday's value.
        yesterday = self.value_on(today - timedelta(days=1))
        if self.value_on(today) == 0 and value > 0 and value == yesterday:
            return
        if active and value != self.value_on(today):
            self.async_set_value(value, from_source=True)

    @callback
    def _async_counter_reading(
        self, entity_id: str, reading: float, *, active: bool
    ) -> None:
        """Add the increase of a counter since its last reading."""
        source = self.store.source
        current = SourceData(entity_id=entity_id, last=reading, carry=0.0)
        self.store.source = current
        if source is None:
            # First reading: only the starting point, nothing to add.
            self.store.async_delay_save()
            return
        last = source["last"]
        reset_from = source.get("reset_from")
        if reset_from is not None:
            # The reading after a big drop decides what the drop was.
            if reading >= reset_from * (1 - COUNTER_RESET_SHARE):
                # Back near the old reading: a glitch, only the rise counts.
                increase = max(0.0, reading - reset_from)
                current["last"] = max(reading, reset_from)
            elif reading <= last:
                # Still low and not rising (e.g. 0 again): wait longer.
                current["reset_from"] = reset_from
                current["carry"] = source["carry"]
                self.store.async_delay_save()
                return
            else:
                # Rising from the low reading: a real reset, it counts from 0.
                increase = max(0.0, reading)
        elif reading >= last:
            increase = reading - last
        elif reading < last * (1 - COUNTER_RESET_SHARE):
            # A reset or a glitch; wait for the next reading to tell.
            current["reset_from"] = last
            current["carry"] = source["carry"]
            self.store.async_delay_save()
            return
        else:
            # A small drop, e.g. a correction: keep the higher reading.
            self.store.source = source
            return
        if not active:
            self.store.async_delay_save()
            return
        amount = round(increase + source["carry"], 6)
        whole = math.floor(amount)
        current["carry"] = round(amount - whole, 6)
        if whole > 0:
            self.async_add(whole, from_source=True)
        else:
            self.store.async_delay_save()

    def _schedule_midnight(self) -> None:
        """Wake up at the start of the next local day.

        A fixed point in time instead of a "00:00:00" pattern: on days where
        daylight saving time starts at midnight, 00:00 does not exist and a
        time pattern would skip the whole day.
        """
        start_of_tomorrow = dt_util.start_of_local_day(self.today + timedelta(days=1))
        self._unsub_midnight = async_track_point_in_utc_time(
            self.hass, self._async_midnight, dt_util.as_utc(start_of_tomorrow)
        )

    @callback
    def _cancel_midnight(self) -> None:
        if self._unsub_midnight is not None:
            self._unsub_midnight()
            self._unsub_midnight = None

    async def _async_update_data(self) -> ChallengeStats:
        """Recalculate all figures for the current date."""
        return self._calculate()

    def _calculate(self) -> ChallengeStats:
        today = self.today
        self._calculated_for = today
        return calculate(
            self.store.days, self.store.target_history, self.settings, today
        )

    @callback
    def _async_midnight(self, _now: datetime) -> None:
        """Start a new day: nothing is reset, only a new date key is read."""
        self._schedule_midnight()
        self.async_set_updated_data(self._calculate())

    def _validate_day(self, day: date, *, from_source: bool) -> None:
        """Raise if values cannot be recorded for `day`."""
        settings = self.settings
        placeholders = {
            "date": day.isoformat(),
            "start_date": settings.start_date.isoformat(),
            "end_date": settings.end_date.isoformat() if settings.end_date else "",
        }
        if day > self.today:
            key = "date_in_future"
        elif day < settings.start_date:
            key = "date_before_start"
        elif settings.end_date is not None and day > settings.end_date:
            key = "date_after_end"
        elif day == self.today and self.today_from_source and not from_source:
            key = "today_from_source"
            placeholders["entity_id"] = self.source_entity or ""
        else:
            return
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key=key,
            translation_placeholders=placeholders,
        )

    def value_on(self, day: date) -> int:
        """Return the recorded value of `day`."""
        return self.store.days.get(day, 0)

    @callback
    def async_add_milestone_listener(
        self, listener: MilestoneListener
    ) -> Callable[[], None]:
        """Call `listener` with the milestones reached by a change of today."""
        self._milestone_listeners.append(listener)

        @callback
        def remove() -> None:
            self._milestone_listeners.remove(listener)

        return remove

    @callback
    def async_set_value(
        self, value: int, day: date | None = None, *, from_source: bool = False
    ) -> None:
        """Set the value of a day; 0 removes the entry."""
        day = day or self.today
        self._validate_day(day, from_source=from_source)
        value = min(value, MAX_DAY_VALUE)
        old = self.data
        if value > 0:
            self.store.days[day] = value
        else:
            self.store.days.pop(day, None)
        self.store.async_delay_save()
        new = self._calculate()
        self.async_set_updated_data(new)
        if day == self.today and old is not None and self._milestone_listeners:
            enabled = set(milestones_from_options(self.config_entry.options))
            if reached := reached_milestones(old, new, enabled):
                for listener in list(self._milestone_listeners):
                    listener(reached)

    @callback
    def async_add(
        self, amount: int, day: date | None = None, *, from_source: bool = False
    ) -> None:
        """Add `amount` (may be negative) to a day; kept within 0 and the maximum."""
        day = day or self.today
        self.async_set_value(
            max(0, self.value_on(day) + amount), day, from_source=from_source
        )

    def history(self, start: date | None = None, end: date | None = None) -> History:
        """Return values, targets and fulfilment for a date range."""
        return build_history(
            self.store.days,
            self.store.target_history,
            self.settings,
            self.today,
            start=start,
            end=end,
        )
