"""The Daily Challenge integration."""

from __future__ import annotations

from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from .const import DOMAIN
from .coordinator import (
    ChallengeCoordinator,
    ChallengeStore,
    DailyChallengeConfigEntry,
)
from .frontend import (
    async_register_card,
    async_register_static_path,
    async_unregister_card,
)
from .services import async_setup_services
from .websocket import async_setup_websocket

PLATFORMS: list[Platform] = [
    Platform.BINARY_SENSOR,
    Platform.BUTTON,
    Platform.NUMBER,
    Platform.SENSOR,
]

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up actions, WebSocket commands and the card (once per start)."""
    async_setup_services(hass)
    async_setup_websocket(hass)
    await async_register_static_path(hass)
    await async_register_card(hass)
    return True


def _other_entries(
    hass: HomeAssistant,
    entry: DailyChallengeConfigEntry,
    *,
    include_disabled: bool,
) -> list[DailyChallengeConfigEntry]:
    return [
        other
        for other in hass.config_entries.async_entries(
            DOMAIN, include_disabled=include_disabled
        )
        if other.entry_id != entry.entry_id
    ]


async def async_setup_entry(
    hass: HomeAssistant, entry: DailyChallengeConfigEntry
) -> bool:
    """Set up a challenge from a config entry."""
    if not _other_entries(hass, entry, include_disabled=False):
        # The first challenge after the last one was removed: the card
        # resource was deleted with it and has to come back.
        await async_register_card(hass)
    coordinator = ChallengeCoordinator(hass, entry)
    await coordinator.async_config_entry_first_refresh()
    entry.runtime_data = coordinator
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(entry.add_update_listener(_async_entry_updated))
    return True


async def _async_entry_updated(
    hass: HomeAssistant, entry: DailyChallengeConfigEntry
) -> None:
    """Reload after changed options or a new name ("Rename" in the UI too)."""
    hass.config_entries.async_schedule_reload(entry.entry_id)


async def async_unload_entry(
    hass: HomeAssistant, entry: DailyChallengeConfigEntry
) -> bool:
    """Unload a challenge and write pending changes immediately."""
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        await entry.runtime_data.store.async_save()
    return unloaded


async def async_remove_entry(
    hass: HomeAssistant, entry: DailyChallengeConfigEntry
) -> None:
    """Delete the store file; drop the card with the last challenge."""
    # Use the loaded store if there is one, so a pending delayed save is
    # cancelled and cannot write the file again after it was deleted.
    coordinator: ChallengeCoordinator | None = getattr(entry, "runtime_data", None)
    store = coordinator.store if coordinator else ChallengeStore(hass, entry.entry_id)
    await store.async_remove()
    if not _other_entries(hass, entry, include_disabled=True):
        await async_unregister_card(hass)
