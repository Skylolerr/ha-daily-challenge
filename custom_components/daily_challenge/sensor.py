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
from .entity import DailyChallengeEntity

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
            "deficit": s.deficit_until_yesterday,
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
