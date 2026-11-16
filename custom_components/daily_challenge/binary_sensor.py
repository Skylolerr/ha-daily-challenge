"""Binary sensor telling whether today's goal is reached."""

from __future__ import annotations

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .coordinator import ChallengeCoordinator, DailyChallengeConfigEntry
from .entity import DailyChallengeEntity, GroupEntity
from .groups import GroupCoordinator, group_coordinator, is_group

PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant,
    entry: DailyChallengeConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the binary sensor."""
    if is_group(entry):
        async_add_entities([AllReachedTodaySensor(group_coordinator(entry))])
        return
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


class AllReachedTodaySensor(GroupEntity, BinarySensorEntity):
    """On once every running member of a group reached today's goal."""

    _attr_translation_key = "all_reached_today"

    def __init__(self, coordinator: GroupCoordinator) -> None:
        """Initialize the binary sensor."""
        super().__init__(coordinator, "all_reached_today")

    @property
    def is_on(self) -> bool:
        """Return whether everybody reached today's goal."""
        return self.coordinator.data.all_reached_today
