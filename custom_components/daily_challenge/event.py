"""Event entity for reached milestones."""

from __future__ import annotations

from typing import Any

from homeassistant.components.event import EventEntity
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .calculations import MilestoneType
from .const import DOMAIN
from .coordinator import (
    ChallengeCoordinator,
    DailyChallengeConfigEntry,
    milestones_from_options,
)
from .entity import DailyChallengeEntity, GroupEntity
from .groups import (
    EVENT_GOAL_REACHED,
    GROUP_EVENTS,
    GroupCoordinator,
    group_coordinator,
    is_group,
)

PARALLEL_UPDATES = 0
KEY = "milestone"


async def async_setup_entry(
    hass: HomeAssistant,
    entry: DailyChallengeConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the milestone event, unless no milestones are wanted."""
    if is_group(entry):
        async_add_entities([GroupEvent(group_coordinator(entry))])
        return
    kinds = milestones_from_options(entry.options)
    if not kinds:
        registry = er.async_get(hass)
        if entity_id := registry.async_get_entity_id(
            Platform.EVENT, DOMAIN, f"{entry.entry_id}_{KEY}"
        ):
            registry.async_remove(entity_id)
        return
    async_add_entities([MilestoneEvent(entry.runtime_data, kinds)])


class MilestoneEvent(DailyChallengeEntity, EventEntity):
    """Fires when the challenge reaches a milestone."""

    _attr_translation_key = KEY

    def __init__(
        self, coordinator: ChallengeCoordinator, kinds: list[MilestoneType]
    ) -> None:
        """Initialize the event entity."""
        super().__init__(coordinator, KEY)
        self._attr_event_types = [kind.value for kind in kinds]

    async def async_added_to_hass(self) -> None:
        """Listen for milestones of the challenge."""
        await super().async_added_to_hass()
        self.async_on_remove(
            self.coordinator.async_add_milestone_listener(self._async_reached)
        )

    @callback
    def _async_reached(self, reached: list[tuple[MilestoneType, int]]) -> None:
        for kind, value in reached:
            self._trigger_event(kind.value, {"value": value})
            self.async_write_ha_state()


class GroupEvent(GroupEntity, EventEntity):
    """Fires on a new leader, a week winner and a reached shared goal."""

    _attr_translation_key = "group"

    def __init__(self, coordinator: GroupCoordinator) -> None:
        """Initialize the event entity."""
        super().__init__(coordinator, "group")
        has_goal = coordinator.data.goal is not None
        self._attr_event_types = [
            kind for kind in GROUP_EVENTS if has_goal or kind != EVENT_GOAL_REACHED
        ]

    async def async_added_to_hass(self) -> None:
        """Listen for the events of the group."""
        await super().async_added_to_hass()
        self.async_on_remove(
            self.coordinator.async_add_event_listener(self._async_event)
        )

    @callback
    def _async_event(self, kind: str, data: dict[str, Any]) -> None:
        if kind in self._attr_event_types:
            self._trigger_event(kind, data)
            self.async_write_ha_state()
