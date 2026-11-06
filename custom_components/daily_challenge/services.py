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
    CONF_UNIT,
    DOMAIN,
    MAX_DAY_VALUE,
    SERVICE_ADD,
    SERVICE_GET_HISTORY,
    SERVICE_GET_STATUS,
    SERVICE_SET,
)
from .coordinator import ChallengeCoordinator, DailyChallengeConfigEntry


def whole_number(value: Any) -> int:
    """Accept whole numbers only; 2.5 is rejected instead of cut to 2."""
    if isinstance(value, bool):
        raise vol.Invalid("expected a whole number")
    try:
        number = float(value)
    except (TypeError, ValueError) as err:
        raise vol.Invalid("expected a whole number") from err
    if not number.is_integer():
        raise vol.Invalid("expected a whole number")
    return int(number)


DAY_VALUE = vol.All(whole_number, vol.Range(min=0, max=MAX_DAY_VALUE))

ADD_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_CONFIG_ENTRY_ID): cv.string,
        vol.Required(ATTR_AMOUNT): vol.All(
            whole_number, vol.Range(min=-MAX_DAY_VALUE, max=MAX_DAY_VALUE)
        ),
        vol.Optional(ATTR_DATE): cv.date,
    }
)
SET_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_CONFIG_ENTRY_ID): cv.string,
        vol.Required(ATTR_VALUE): DAY_VALUE,
        vol.Optional(ATTR_DATE): cv.date,
    }
)
GET_STATUS_SCHEMA = vol.Schema({vol.Required(ATTR_CONFIG_ENTRY_ID): cv.string})
GET_HISTORY_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_CONFIG_ENTRY_ID): cv.string,
        vol.Optional(ATTR_START): cv.date,
        vol.Optional(ATTR_END): cv.date,
    }
)


def get_coordinator(hass: HomeAssistant, entry_id: str) -> ChallengeCoordinator:
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
        "rescuable": [day.isoformat() for day in history.rescuable],
    }


def status_response(coordinator: ChallengeCoordinator) -> dict[str, Any]:
    """Return the current figures of a challenge, independent of entity IDs."""
    stats = coordinator.data
    entry = coordinator.config_entry
    return {
        "name": entry.title,
        "unit": entry.options[CONF_UNIT],
        "status": stats.status.value,
        # Today's value comes from a source sensor and cannot be added to.
        "today_from_source": coordinator.today_from_source,
        "today": stats.value_today,
        "target": stats.effective_target_today,
        "daily_target": stats.target_today,
        "goal_reached": stats.goal_reached_today,
        "progress": stats.progress_today,
        "current_streak": stats.current_streak,
        "best_streak": stats.best_streak.length,
        "total": stats.total,
        "this_week": stats.this_week,
        "week_target": stats.week_target,
        "week_fulfilled_days": stats.week_fulfilled_days,
        "week_goal_days": stats.week_goal_days,
        "week_days": stats.week_days,
        "this_month": stats.this_month,
        "this_year": stats.this_year,
        "remaining": stats.remaining,
        "days_left": stats.days_left,
    }


@callback
def async_setup_services(hass: HomeAssistant) -> None:
    """Register the actions."""

    async def async_add(call: ServiceCall) -> None:
        coordinator = get_coordinator(hass, call.data[ATTR_CONFIG_ENTRY_ID])
        coordinator.async_add(call.data[ATTR_AMOUNT], call.data.get(ATTR_DATE))

    async def async_set(call: ServiceCall) -> None:
        coordinator = get_coordinator(hass, call.data[ATTR_CONFIG_ENTRY_ID])
        coordinator.async_set_value(call.data[ATTR_VALUE], call.data.get(ATTR_DATE))

    async def async_get_history(call: ServiceCall) -> ServiceResponse:
        coordinator = get_coordinator(hass, call.data[ATTR_CONFIG_ENTRY_ID])
        return history_response(
            coordinator, call.data.get(ATTR_START), call.data.get(ATTR_END)
        )

    hass.services.async_register(DOMAIN, SERVICE_ADD, async_add, schema=ADD_SCHEMA)
    hass.services.async_register(DOMAIN, SERVICE_SET, async_set, schema=SET_SCHEMA)

    async def async_get_status(call: ServiceCall) -> ServiceResponse:
        return status_response(get_coordinator(hass, call.data[ATTR_CONFIG_ENTRY_ID]))

    hass.services.async_register(
        DOMAIN,
        SERVICE_GET_STATUS,
        async_get_status,
        schema=GET_STATUS_SCHEMA,
        supports_response=SupportsResponse.ONLY,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_GET_HISTORY,
        async_get_history,
        schema=GET_HISTORY_SCHEMA,
        supports_response=SupportsResponse.ONLY,
    )
