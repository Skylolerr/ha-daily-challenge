"""Event entity for reached milestones."""

from __future__ import annotations

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
from .entity import DailyChallengeEntity

PARALLEL_UPDATES = 0
KEY = "milestone"


async def async_setup_entry(
    hass: HomeAssistant,
    entry: DailyChallengeConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the milestone event, unless no milestones are wanted."""
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
