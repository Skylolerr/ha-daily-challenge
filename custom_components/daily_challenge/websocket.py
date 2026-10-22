"""WebSocket commands used by the card."""

from __future__ import annotations

from typing import Any

import probatio as vol
from homeassistant.components.websocket_api import async_register_command
from homeassistant.components.websocket_api.connection import ActiveConnection
from homeassistant.components.websocket_api.decorators import websocket_command
from homeassistant.const import CONF_ICON
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import entity_registry as er

from .const import ATTR_DATE, ATTR_END, ATTR_START, ATTR_VALUE, CONF_UNIT, DOMAIN
from .services import get_coordinator, history_response

ATTR_ENTRY_ID = "entry_id"


@callback
def async_setup_websocket(hass: HomeAssistant) -> None:
    """Register the WebSocket commands."""
    async_register_command(hass, websocket_list)
    async_register_command(hass, websocket_history)
    async_register_command(hass, websocket_set_day)


@websocket_command({vol.Required("type"): f"{DOMAIN}/list"})
@callback
def websocket_list(
    hass: HomeAssistant,
    connection: ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """List all challenges with their entity IDs."""
    registry = er.async_get(hass)
    challenges = []
    for entry in hass.config_entries.async_entries(DOMAIN):
        prefix = f"{entry.entry_id}_"
        entities = {
            reg_entry.unique_id.removeprefix(prefix): reg_entry.entity_id
            for reg_entry in er.async_entries_for_config_entry(registry, entry.entry_id)
            if reg_entry.unique_id.startswith(prefix)
        }
        challenges.append(
            {
                "entry_id": entry.entry_id,
                "name": entry.title,
                "icon": entry.options[CONF_ICON],
                "unit": entry.options[CONF_UNIT],
                "entities": dict(sorted(entities.items())),
            }
        )
    connection.send_result(msg["id"], {"challenges": challenges})


@websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/history",
        vol.Required(ATTR_ENTRY_ID): str,
        vol.Optional(ATTR_START): cv.date,
        vol.Optional(ATTR_END): cv.date,
    }
)
@callback
def websocket_history(
    hass: HomeAssistant,
    connection: ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return the history of a challenge, like the get_history action."""
    coordinator = get_coordinator(hass, msg[ATTR_ENTRY_ID])
    connection.send_result(
        msg["id"],
        history_response(coordinator, msg.get(ATTR_START), msg.get(ATTR_END)),
    )


@websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/set_day",
        vol.Required(ATTR_ENTRY_ID): str,
        vol.Required(ATTR_DATE): cv.date,
        vol.Required(ATTR_VALUE): vol.All(vol.Coerce(int), vol.Range(min=0)),
    }
)
@callback
def websocket_set_day(
    hass: HomeAssistant,
    connection: ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Set the value of a (past) day, with the same validation as the action."""
    coordinator = get_coordinator(hass, msg[ATTR_ENTRY_ID])
    coordinator.async_set_value(msg[ATTR_VALUE], msg[ATTR_DATE])
    connection.send_result(
        msg["id"],
        {"date": msg[ATTR_DATE].isoformat(), "value": msg[ATTR_VALUE]},
    )
