"""Device triggers: today's goal reached and milestones."""

from __future__ import annotations

import probatio as vol
from homeassistant.components.device_automation import DEVICE_TRIGGER_BASE_SCHEMA
from homeassistant.const import (
    CONF_DEVICE_ID,
    CONF_DOMAIN,
    CONF_PLATFORM,
    CONF_TYPE,
    STATE_OFF,
    STATE_ON,
    STATE_UNAVAILABLE,
    STATE_UNKNOWN,
)
from homeassistant.core import (
    CALLBACK_TYPE,
    Event,
    EventStateChangedData,
    HassJob,
    HomeAssistant,
    callback,
)
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.helpers.trigger import TriggerActionType, TriggerInfo
from homeassistant.helpers.typing import ConfigType

from .calculations import MilestoneType
from .const import DOMAIN

TRIGGER_GOAL_REACHED = "goal_reached"
TRIGGER_MILESTONE = "milestone"
KINDS = [kind.value for kind in MilestoneType]
TRIGGER_TYPES = [TRIGGER_GOAL_REACHED, TRIGGER_MILESTONE, *KINDS]

TRIGGER_SCHEMA = DEVICE_TRIGGER_BASE_SCHEMA.extend(
    {vol.Required(CONF_TYPE): vol.In(TRIGGER_TYPES)}
)


@callback
def _detach() -> None:
    """Nothing to detach (`async_noop` only exists from Home Assistant 2026.11)."""


def _entity(hass: HomeAssistant, device_id: str, key: str) -> er.RegistryEntry | None:
    """Return the entity of a challenge device by its unique ID, not its entity ID."""
    for entry in er.async_entries_for_device(er.async_get(hass), device_id):
        if (
            entry.platform == DOMAIN
            and entry.config_entry_id is not None
            and entry.unique_id == f"{entry.config_entry_id}_{key}"
        ):
            return entry
    return None


async def async_get_triggers(
    hass: HomeAssistant, device_id: str
) -> list[dict[str, str]]:
    """List the triggers of a challenge device."""
    base = {CONF_PLATFORM: "device", CONF_DOMAIN: DOMAIN, CONF_DEVICE_ID: device_id}
    triggers = []
    if _entity(hass, device_id, "goal_reached_today"):
        triggers.append({**base, CONF_TYPE: TRIGGER_GOAL_REACHED})
    if milestone := _entity(hass, device_id, "milestone"):
        triggers.append({**base, CONF_TYPE: TRIGGER_MILESTONE})
        enabled = (milestone.capabilities or {}).get("event_types", [])
        triggers.extend({**base, CONF_TYPE: kind} for kind in KINDS if kind in enabled)
    return triggers


async def async_attach_trigger(
    hass: HomeAssistant,
    config: ConfigType,
    action: TriggerActionType,
    trigger_info: TriggerInfo,
) -> CALLBACK_TYPE:
    """Attach a trigger."""
    trigger_type: str = config[CONF_TYPE]
    goal = trigger_type == TRIGGER_GOAL_REACHED
    device_id: str = config[CONF_DEVICE_ID]
    key = "goal_reached_today" if goal else "milestone"
    trigger_data = trigger_info["trigger_data"]
    job = HassJob(action)

    @callback
    def _state_changed(event: Event[EventStateChangedData]) -> None:
        old, new = event.data["old_state"], event.data["new_state"]
        if old is None or new is None:
            return
        kind: str | None = None
        value = None
        if goal:
            # Off to on only: coming back from "unavailable" is no new goal.
            if old.state != STATE_OFF or new.state != STATE_ON:
                return
        else:
            # Every milestone is a new state; a restart restores the last one.
            if (
                old.state == STATE_UNAVAILABLE
                or new.state in (STATE_UNAVAILABLE, STATE_UNKNOWN)
                or new.state == old.state
            ):
                return
            kind = new.attributes.get("event_type")
            if trigger_type not in (TRIGGER_MILESTONE, kind):
                return
            value = new.attributes.get("value")
        hass.async_run_hass_job(
            job,
            {
                "trigger": {
                    **trigger_data,
                    **config,
                    "entity_id": new.entity_id,
                    "from_state": old,
                    "to_state": new,
                    "kind": kind,
                    "value": value,
                    "description": f"{DOMAIN} {trigger_type} of {new.entity_id}",
                }
            },
            event.context,
        )

    watched: str | None = None
    unsub_state: CALLBACK_TYPE = _detach

    @callback
    def _watch() -> None:
        """Follow the current entity ID of the entity (it may change)."""
        nonlocal watched, unsub_state
        entity = _entity(hass, device_id, key)
        entity_id = entity.entity_id if entity else None
        if entity_id == watched:
            return
        unsub_state()
        unsub_state = _detach
        watched = entity_id
        if entity_id is not None:
            unsub_state = async_track_state_change_event(
                hass, [entity_id], _state_changed
            )

    @callback
    def _registry_updated(event: Event[er.EventEntityRegistryUpdatedData]) -> None:
        # E.g. milestones switched on again after the automation was set up.
        if event.data["entity_id"].split(".")[0] in ("binary_sensor", "event"):
            _watch()

    _watch()
    unsub_registry = hass.bus.async_listen(
        er.EVENT_ENTITY_REGISTRY_UPDATED, _registry_updated
    )

    @callback
    def _remove() -> None:
        unsub_registry()
        unsub_state()

    return _remove
