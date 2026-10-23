"""Challenge data: store, calculations and listeners."""

from __future__ import annotations

from collections.abc import Callable
from datetime import date, datetime, timedelta
from typing import TYPE_CHECKING, Any, TypedDict

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers.event import async_track_point_in_utc_time
from homeassistant.helpers.storage import Store
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator
from homeassistant.util import dt as dt_util

from .calculations import (
    ChallengeSettings,
    ChallengeStats,
    DeficitMode,
    History,
    StreakRule,
    build_history,
    calculate,
)
from .const import (
    CONF_DAILY_TARGET,
    CONF_DEFICIT_MODE,
    CONF_END_DATE,
    CONF_START_DATE,
    CONF_STREAK_RULE,
    DOMAIN,
    LOGGER,
    MAX_DAY_VALUE,
    SAVE_DELAY,
    STORAGE_VERSION,
)

if TYPE_CHECKING:
    from collections.abc import Mapping

type DailyChallengeConfigEntry = ConfigEntry[ChallengeCoordinator]


class StoreData(TypedDict):
    """Persisted data of one challenge."""

    days: dict[str, int]
    target_history: dict[str, int]


def settings_from_options(options: Mapping[str, Any]) -> ChallengeSettings:
    """Build calculation settings from config entry options."""
    end_date = options.get(CONF_END_DATE)
    return ChallengeSettings(
        start_date=date.fromisoformat(options[CONF_START_DATE]),
        end_date=date.fromisoformat(end_date) if end_date else None,
        streak_rule=StreakRule(options[CONF_STREAK_RULE]),
        deficit_mode=DeficitMode(options[CONF_DEFICIT_MODE]),
    )


class ChallengeStore:
    """Thin wrapper around the per-challenge store file."""

    def __init__(self, hass: HomeAssistant, entry_id: str) -> None:
        """Initialize the store."""
        self._store: Store[StoreData] = Store(
            hass, STORAGE_VERSION, f"{DOMAIN}.{entry_id}"
        )
        self.days: dict[date, int] = {}
        self.target_history: dict[date, int] = {}

    async def async_load(self) -> None:
        """Load and parse the stored data."""
        data = await self._store.async_load() or StoreData(days={}, target_history={})
        self.days = {
            date.fromisoformat(day): value
            for day, value in data["days"].items()
            if value > 0
        }
        self.target_history = {
            date.fromisoformat(day): target
            for day, target in data["target_history"].items()
        }

    def _data_to_save(self) -> StoreData:
        return StoreData(
            days={day.isoformat(): value for day, value in sorted(self.days.items())},
            target_history={
                day.isoformat(): target
                for day, target in sorted(self.target_history.items())
            },
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

    @property
    def today(self) -> date:
        """Return the current local date in the Home Assistant time zone."""
        return dt_util.now().date()

    @property
    def settings(self) -> ChallengeSettings:
        """Return the calculation settings of this challenge."""
        return settings_from_options(self.config_entry.options)

    async def _async_setup(self) -> None:
        """Load the stored data before the first calculation."""
        await self.store.async_load()
        if not self.store.target_history:
            self.store.set_target(
                self.settings.start_date,
                int(self.config_entry.options[CONF_DAILY_TARGET]),
            )
            await self.store.async_save()
        self._schedule_midnight()
        self.config_entry.async_on_unload(self._cancel_midnight)

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
        return calculate(
            self.store.days, self.store.target_history, self.settings, self.today
        )

    @callback
    def _async_midnight(self, _now: datetime) -> None:
        """Start a new day: nothing is reset, only a new date key is read."""
        self._schedule_midnight()
        self.async_set_updated_data(self._calculate())

    def _validate_day(self, day: date) -> None:
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
    def async_set_value(self, value: int, day: date | None = None) -> None:
        """Set the value of a day; 0 removes the entry."""
        day = day or self.today
        self._validate_day(day)
        value = min(value, MAX_DAY_VALUE)
        if value > 0:
            self.store.days[day] = value
        else:
            self.store.days.pop(day, None)
        self.store.async_delay_save()
        self.async_set_updated_data(self._calculate())

    @callback
    def async_add(self, amount: int, day: date | None = None) -> None:
        """Add `amount` (may be negative) to a day; kept within 0 and the maximum."""
        day = day or self.today
        self.async_set_value(max(0, self.value_on(day) + amount), day)

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
