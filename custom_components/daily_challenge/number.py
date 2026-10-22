"""Number entity for today's value."""

from __future__ import annotations

from homeassistant.components.number import NumberEntity, NumberMode
from homeassistant.const import CONF_ICON
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .const import MAX_DAY_VALUE
from .coordinator import ChallengeCoordinator, DailyChallengeConfigEntry
from .entity import DailyChallengeEntity

PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant,
    entry: DailyChallengeConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the number entity."""
    async_add_entities([TodayNumber(entry.runtime_data)])


class TodayNumber(DailyChallengeEntity, NumberEntity):
    """Today's value, directly settable."""

    _attr_translation_key = "today"
    _attr_native_min_value = 0
    _attr_native_max_value = MAX_DAY_VALUE
    _attr_native_step = 1
    _attr_mode = NumberMode.BOX

    def __init__(self, coordinator: ChallengeCoordinator) -> None:
        """Initialize the entity."""
        super().__init__(coordinator, "today")
        self._attr_native_unit_of_measurement = self.challenge_unit
        # The main entity shows the icon chosen for the challenge.
        self._attr_icon = coordinator.config_entry.options[CONF_ICON]

    @property
    def native_value(self) -> int:
        """Return today's value."""
        return self.coordinator.data.value_today

    async def async_set_native_value(self, value: float) -> None:
        """Set today's value."""
        self.coordinator.async_set_value(int(value))
