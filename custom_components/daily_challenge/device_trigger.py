"""Device triggers: goals and milestones of challenges, events of groups."""

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
# Groups: everybody reached today's goal, and the events of the group.
TRIGGER_ALL_REACHED = "all_reached"
TRIGGER_LEAD_CHANGE = "lead_change"
TRIGGER_WEEK_WINNER = "week_winner"
TRIGGER_GROUP_GOAL = "group_goal_reached"
# Device trigger type of a group event -> event type of the group entity.
GROUP_EVENT_TRIGGERS = {
    TRIGGER_LEAD_CHANGE: "lead_change",
    TRIGGER_WEEK_WINNER: "week_winner",
    TRIGGER_GROUP_GOAL: "goal_reached",
}
TRIGGER_TYPES = [
    TRIGGER_GOAL_REACHED,
    TRIGGER_MILESTONE,
    *KINDS,
    TRIGGER_ALL_REACHED,
    *GROUP_EVENT_TRIGGERS,
]
# Trigger type -> key of the entity it watches.
BINARY_TRIGGERS = {
    TRIGGER_GOAL_REACHED: "goal_reached_today",
    TRIGGER_ALL_REACHED: "all_reached_today",
}
# Attributes of an event entity that are no data of the event.
NOT_EVENT_DATA = {"event_type", "event_types", "friendly_name", "icon"}

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
    if _entity(hass, device_id, "all_reached_today"):
        triggers.append({**base, CONF_TYPE: TRIGGER_ALL_REACHED})
    if group := _entity(hass, device_id, "group"):
        enabled = (group.capabilities or {}).get("event_types", [])
        triggers.extend(
            {**base, CONF_TYPE: trigger}
            for trigger, kind in GROUP_EVENT_TRIGGERS.items()
            if kind in enabled
        )
    return triggers


async def async_attach_trigger(
    hass: HomeAssistant,
    config: ConfigType,
    action: TriggerActionType,
    trigger_info: TriggerInfo,
) -> CALLBACK_TYPE:
    """Attach a trigger."""
    trigger_type: str = config[CONF_TYPE]
    goal = trigger_type in BINARY_TRIGGERS
    device_id: str = config[CONF_DEVICE_ID]
    if goal:
        key = BINARY_TRIGGERS[trigger_type]
    elif trigger_type in GROUP_EVENT_TRIGGERS:
        key = "group"
    else:
        key = "milestone"
    # The event type this trigger wants (None: every milestone).
    wanted = (
        GROUP_EVENT_TRIGGERS.get(trigger_type, trigger_type)
        if trigger_type != TRIGGER_MILESTONE
        else None
    )
    trigger_data = trigger_info["trigger_data"]
    job = HassJob(action)

    @callback
    def _state_changed(event: Event[EventStateChangedData]) -> None:
        old, new = event.data["old_state"], event.data["new_state"]
        if old is None or new is None:
            return
        kind: str | None = None
        value = None
        data: dict[str, object] = {}
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
            if wanted is not None and kind != wanted:
                return
            value = new.attributes.get("value")
            data = {
                name: attr
                for name, attr in new.attributes.items()
                if name not in NOT_EVENT_DATA
            }
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
                    "data": data,
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
