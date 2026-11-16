"""WebSocket commands used by the card."""

from __future__ import annotations

from typing import Any

import probatio as vol
from homeassistant.components.websocket_api import async_register_command
from homeassistant.components.websocket_api.connection import ActiveConnection
from homeassistant.components.websocket_api.decorators import websocket_command
from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import CONF_ICON
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import entity_registry as er

from .calculations import RankingMetric, RankingPeriod
from .const import (
    ATTR_DATE,
    ATTR_END,
    ATTR_START,
    ATTR_VALUE,
    CONF_GROUP_GOAL_PERIOD,
    CONF_MEMBERS,
    CONF_PERSON,
    CONF_RANKING,
    CONF_SOURCE_ENTITY,
    CONF_SOURCE_MODE,
    CONF_UNIT,
    DOMAIN,
    SourceMode,
)
from .groups import group_coordinator, is_group, ranking_rows
from .services import DAY_VALUE, get_coordinator, history_response

ATTR_ENTRY_ID = "entry_id"


@callback
def async_setup_websocket(hass: HomeAssistant) -> None:
    """Register the WebSocket commands."""
    async_register_command(hass, websocket_list)
    async_register_command(hass, websocket_history)
    async_register_command(hass, websocket_set_day)
    async_register_command(hass, websocket_ranking)


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
    groups = []
    for entry in hass.config_entries.async_entries(DOMAIN):
        if is_group(entry):
            groups.append(
                {
                    "entry_id": entry.entry_id,
                    "name": entry.title,
                    "icon": entry.options[CONF_ICON],
                    "members": list(entry.options.get(CONF_MEMBERS, [])),
                    "ranking": entry.options.get(CONF_RANKING, RankingMetric.PERCENT),
                }
            )
            continue
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
                # Entity ID of the person; the card reads name and picture.
                "person": entry.options.get(CONF_PERSON) or None,
                # A daily source sets today's value; the card offers no input.
                "today_from_source": bool(entry.options.get(CONF_SOURCE_ENTITY))
                and entry.options.get(CONF_SOURCE_MODE, SourceMode.DAILY)
                == SourceMode.DAILY,
                "entities": dict(sorted(entities.items())),
            }
        )
    connection.send_result(msg["id"], {"challenges": challenges, "groups": groups})


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
        vol.Required(ATTR_VALUE): DAY_VALUE,
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


@websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/ranking",
        vol.Required(ATTR_ENTRY_ID): str,
        vol.Optional("period", default=RankingPeriod.WEEK.value): vol.In(
            [period.value for period in RankingPeriod]
        ),
        vol.Optional("metric"): vol.In([metric.value for metric in RankingMetric]),
    }
)
@callback
def websocket_ranking(
    hass: HomeAssistant,
    connection: ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return the ranking of a group for a period and a metric."""
    entry = hass.config_entries.async_get_entry(msg[ATTR_ENTRY_ID])
    if not is_group(entry) or entry is None:
        connection.send_error(msg["id"], "not_found", "No such group")
        return
    if entry.state is not ConfigEntryState.LOADED:
        connection.send_error(msg["id"], "not_loaded", f"{entry.title} is not loaded")
        return
    coordinator = group_coordinator(entry)
    metric = RankingMetric(msg.get("metric") or coordinator.metric)
    stats = coordinator.data
    goal = stats.goal
    connection.send_result(
        msg["id"],
        {
            "name": entry.title,
            "icon": entry.options[CONF_ICON],
            "metric": metric.value,
            "period": msg["period"],
            "unit": coordinator.unit,
            "rows": ranking_rows(
                stats, coordinator.ranking(RankingPeriod(msg["period"]), metric)
            ),
            "streak": stats.streak,
            "best_streak": stats.best_streak,
            "all_reached_today": stats.all_reached_today,
            "goal": None
            if goal is None
            else {
                "total": goal.total,
                "goal": goal.goal,
                "progress": goal.progress,
                "remaining": goal.remaining,
                "period": entry.options.get(CONF_GROUP_GOAL_PERIOD, "week"),
            },
        },
    )
