"""Binary sensor telling whether today's goal is reached."""

from __future__ import annotations

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .coordinator import ChallengeCoordinator, DailyChallengeConfigEntry
from .entity import DailyChallengeEntity

PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant,
    entry: DailyChallengeConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the binary sensor."""
    async_add_entities([GoalReachedTodaySensor(entry.runtime_data)])


class GoalReachedTodaySensor(DailyChallengeEntity, BinarySensorEntity):
    """On once today's effective target is reached."""

    _attr_translation_key = "goal_reached_today"

    def __init__(self, coordinator: ChallengeCoordinator) -> None:
        """Initialize the binary sensor."""
        super().__init__(coordinator, "goal_reached_today")

    @property
    def is_on(self) -> bool | None:
        """Return whether today's goal is reached."""
        return self.coordinator.data.goal_reached_today
