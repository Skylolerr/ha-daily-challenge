"""Buttons to add or subtract a step."""

from __future__ import annotations

from homeassistant.components.button import ButtonEntity
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.util import slugify

from .const import CONF_STEPS, DOMAIN
from .coordinator import ChallengeCoordinator, DailyChallengeConfigEntry
from .entity import DailyChallengeEntity

PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant,
    entry: DailyChallengeConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up one add button per step plus a subtract button."""
    coordinator = entry.runtime_data
    steps: list[int] = entry.options[CONF_STEPS]

    # Remove buttons of steps that no longer exist.
    wanted = {f"{entry.entry_id}_add_{step}" for step in steps}
    registry = er.async_get(hass)
    for registry_entry in er.async_entries_for_config_entry(registry, entry.entry_id):
        if (
            registry_entry.domain == Platform.BUTTON
            and registry_entry.platform == DOMAIN
            and registry_entry.unique_id.startswith(f"{entry.entry_id}_add_")
            and registry_entry.unique_id not in wanted
        ):
            registry.async_remove(registry_entry.entity_id)

    async_add_entities(
        [
            *(AddButton(coordinator, step) for step in steps),
            SubtractButton(coordinator, min(steps)),
        ]
    )


def _suggested_entity_id(coordinator: ChallengeCoordinator, key: str) -> str:
    """Return a readable entity ID; names like "+1" would make poor IDs."""
    return f"{Platform.BUTTON}.{slugify(coordinator.config_entry.title)}_{key}"


class AddButton(DailyChallengeEntity, ButtonEntity):
    """Add a fixed amount to today's value."""

    _attr_translation_key = "add"
    _only_while_active = True

    def __init__(self, coordinator: ChallengeCoordinator, step: int) -> None:
        """Initialize the button."""
        super().__init__(coordinator, f"add_{step}")
        self.entity_id = _suggested_entity_id(coordinator, f"add_{step}")
        self._step = step
        self._attr_translation_placeholders = {"amount": str(step)}

    async def async_press(self) -> None:
        """Add the step to today's value."""
        self.coordinator.async_add(self._step)


class SubtractButton(DailyChallengeEntity, ButtonEntity):
    """Subtract the smallest step from today's value, never below 0."""

    _attr_translation_key = "subtract"
    _only_while_active = True

    def __init__(self, coordinator: ChallengeCoordinator, step: int) -> None:
        """Initialize the button."""
        super().__init__(coordinator, "subtract")
        self.entity_id = _suggested_entity_id(coordinator, "subtract")
        self._step = step
        self._attr_translation_placeholders = {"amount": str(step)}

    async def async_press(self) -> None:
        """Subtract the step from today's value."""
        self.coordinator.async_add(-self._step)
