"""Actions (services) of Daily Challenge."""

from __future__ import annotations

from datetime import date
from typing import Any

import probatio as vol
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import (
    HomeAssistant,
    ServiceCall,
    ServiceResponse,
    SupportsResponse,
    callback,
)
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv

from .const import (
    ATTR_AMOUNT,
    ATTR_CONFIG_ENTRY_ID,
    ATTR_DATE,
    ATTR_END,
    ATTR_START,
    ATTR_VALUE,
    DOMAIN,
    SERVICE_ADD,
    SERVICE_GET_HISTORY,
    SERVICE_SET,
)
from .coordinator import ChallengeCoordinator, DailyChallengeConfigEntry

ADD_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_CONFIG_ENTRY_ID): cv.string,
        vol.Required(ATTR_AMOUNT): vol.Coerce(int),
        vol.Optional(ATTR_DATE): cv.date,
    }
)
SET_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_CONFIG_ENTRY_ID): cv.string,
        vol.Required(ATTR_VALUE): vol.All(vol.Coerce(int), vol.Range(min=0)),
        vol.Optional(ATTR_DATE): cv.date,
    }
)
GET_HISTORY_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_CONFIG_ENTRY_ID): cv.string,
        vol.Optional(ATTR_START): cv.date,
        vol.Optional(ATTR_END): cv.date,
    }
)


def _get_coordinator(hass: HomeAssistant, entry_id: str) -> ChallengeCoordinator:
    """Return the coordinator of a loaded challenge or raise."""
    entry: DailyChallengeConfigEntry | None = hass.config_entries.async_get_entry(
        entry_id
    )
    if entry is None or entry.domain != DOMAIN:
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="entry_not_found",
            translation_placeholders={"entry_id": entry_id},
        )
    if entry.state is not ConfigEntryState.LOADED:
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="entry_not_loaded",
            translation_placeholders={"name": entry.title},
        )
    return entry.runtime_data


def history_response(
    coordinator: ChallengeCoordinator,
    start: date | None = None,
    end: date | None = None,
) -> dict[str, Any]:
    """Return the history of a challenge in a JSON-serializable form."""
    if start is not None and end is not None and start > end:
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="invalid_range",
            translation_placeholders={
                "start": start.isoformat(),
                "end": end.isoformat(),
            },
        )
    history = coordinator.history(start, end)
    return {
        "days": {day.isoformat(): value for day, value in history.days.items()},
        "targets": {day.isoformat(): value for day, value in history.targets.items()},
        "fulfilled": {
            day.isoformat(): value for day, value in history.fulfilled.items()
        },
    }


@callback
def async_setup_services(hass: HomeAssistant) -> None:
    """Register the actions."""

    async def async_add(call: ServiceCall) -> None:
        coordinator = _get_coordinator(hass, call.data[ATTR_CONFIG_ENTRY_ID])
        coordinator.async_add(call.data[ATTR_AMOUNT], call.data.get(ATTR_DATE))

    async def async_set(call: ServiceCall) -> None:
        coordinator = _get_coordinator(hass, call.data[ATTR_CONFIG_ENTRY_ID])
        coordinator.async_set_value(call.data[ATTR_VALUE], call.data.get(ATTR_DATE))

    async def async_get_history(call: ServiceCall) -> ServiceResponse:
        coordinator = _get_coordinator(hass, call.data[ATTR_CONFIG_ENTRY_ID])
        return history_response(
            coordinator, call.data.get(ATTR_START), call.data.get(ATTR_END)
        )

    hass.services.async_register(DOMAIN, SERVICE_ADD, async_add, schema=ADD_SCHEMA)
    hass.services.async_register(DOMAIN, SERVICE_SET, async_set, schema=SET_SCHEMA)
    hass.services.async_register(
        DOMAIN,
        SERVICE_GET_HISTORY,
        async_get_history,
        schema=GET_HISTORY_SCHEMA,
        supports_response=SupportsResponse.ONLY,
    )
