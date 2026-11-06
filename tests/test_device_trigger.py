"""Tests for the device triggers."""

from __future__ import annotations

from typing import Any

import pytest
from homeassistant.components.device_automation import DeviceAutomationType
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.setup import async_setup_component

from custom_components.daily_challenge.const import DOMAIN

from .common import MockConfigEntry, async_capture_events, async_get_device_automations
from .test_init import press
from .test_milestone_event import SIX_DAYS, setup_challenge

EVENT = "challenge_device_trigger"


def device_id(hass: HomeAssistant) -> str:
    """Return the device of the default challenge."""
    entry = er.async_get(hass).async_get("number.push_ups_today")
    assert entry is not None
    assert entry.device_id is not None
    return entry.device_id


async def types(hass: HomeAssistant) -> list[str]:
    """Return the trigger types offered for the default challenge."""
    triggers = await async_get_device_automations(
        hass, DeviceAutomationType.TRIGGER, device_id(hass)
    )
    return [trigger["type"] for trigger in triggers if trigger["domain"] == DOMAIN]


async def automation(hass: HomeAssistant, trigger_type: str, device: str) -> list[Any]:
    """Set up an automation for a trigger type that fires a test event."""
    events = async_capture_events(hass, EVENT)
    assert await async_setup_component(
        hass,
        "automation",
        {
            "automation": [
                {
                    "triggers": [
                        {
                            "trigger": "device",
                            "domain": DOMAIN,
                            "device_id": device,
                            "type": trigger_type,
                        }
                    ],
                    "actions": [
                        {
                            "event": EVENT,
                            "event_data": {
                                "kind": "{{ trigger.kind }}",
                                "value": "{{ trigger.value }}",
                                "type": "{{ trigger.type }}",
                            },
                        }
                    ],
                }
            ]
        },
    )
    await hass.async_block_till_done()
    return events


async def test_offered_triggers(
    hass: HomeAssistant, hass_storage: dict[str, Any]
) -> None:
    """All kinds by default, only the enabled ones otherwise."""
    await setup_challenge(hass, hass_storage, {})
    assert await types(hass) == [
        "goal_reached",
        "milestone",
        "streak",
        "best_streak",
        "best_day",
        "total",
    ]


async def test_offered_triggers_with_some_milestones(
    hass: HomeAssistant, hass_storage: dict[str, Any]
) -> None:
    """Disabled kinds are not offered; without milestones only the goal is."""
    entry = await setup_challenge(hass, hass_storage, {}, milestones=["total"])
    assert await types(hass) == ["goal_reached", "milestone", "total"]
    hass.config_entries.async_update_entry(
        entry, options={**entry.options, "milestones": []}
    )
    await hass.async_block_till_done()
    assert await types(hass) == ["goal_reached"]


@pytest.mark.usefixtures("loaded_entry")
async def test_goal_reached(hass: HomeAssistant) -> None:
    """The goal trigger fires once when today's goal is reached."""
    events = await automation(hass, "goal_reached", device_id(hass))
    await press(hass, "button.push_ups_add_10")
    assert events == []
    await press(hass, "button.push_ups_add_10")
    await press(hass, "button.push_ups_add_10")
    await hass.async_block_till_done()
    assert [event.data for event in events] == [
        {"kind": None, "value": None, "type": "goal_reached"}
    ]

    # A removed state is no new goal either.
    hass.states.async_remove("binary_sensor.push_ups_goal_reached_today")
    await hass.async_block_till_done()
    assert len(events) == 1

    # A reload (unavailable and back to on) is no new goal.
    entry = hass.config_entries.async_entries(DOMAIN)[0]
    assert await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    assert len(events) == 1


async def test_milestone_triggers(
    hass: HomeAssistant, hass_storage: dict[str, Any]
) -> None:
    """Kind triggers fire for their kind, the milestone trigger for all."""
    await setup_challenge(hass, hass_storage, SIX_DAYS)
    device = device_id(hass)
    streak = await automation(hass, "streak", device)
    await press(hass, "button.push_ups_add_10")
    await press(hass, "button.push_ups_add_10")
    await hass.async_block_till_done()
    assert [event.data for event in streak] == [
        {"kind": "streak", "value": 7, "type": "streak"}
    ]
    # The next press beats the best day: not a streak milestone.
    await press(hass, "button.push_ups_add_10")
    await hass.async_block_till_done()
    assert len(streak) == 1
    assert streak[-1].data["kind"] == "streak"


async def test_any_milestone_trigger(
    hass: HomeAssistant, hass_storage: dict[str, Any]
) -> None:
    """The milestone trigger fires for every kind, but not after a reload."""
    await setup_challenge(hass, hass_storage, SIX_DAYS)
    events = await automation(hass, "milestone", device_id(hass))
    for _ in range(3):
        await press(hass, "button.push_ups_add_10")
    await hass.async_block_till_done()
    assert [(e.data["kind"], e.data["value"]) for e in events] == [
        ("streak", 7),
        ("best_day", 30),
    ]
    entry = hass.config_entries.async_entries(DOMAIN)[0]
    assert await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    assert len(events) == 2


async def test_trigger_follows_the_entity_when_milestones_return(
    hass: HomeAssistant, hass_storage: dict[str, Any]
) -> None:
    """Set up while milestones were off, the trigger works once they are on."""
    entry = await setup_challenge(hass, hass_storage, SIX_DAYS, milestones=[])
    events = await automation(hass, "milestone", device_id(hass))
    hass.config_entries.async_update_entry(
        entry, options={**entry.options, "milestones": ["streak"]}
    )
    await hass.async_block_till_done()
    await press(hass, "button.push_ups_add_10")
    await press(hass, "button.push_ups_add_10")
    await hass.async_block_till_done()
    assert [e.data["kind"] for e in events] == ["streak"]


async def test_trigger_follows_a_renamed_entity(
    hass: HomeAssistant, hass_storage: dict[str, Any]
) -> None:
    """A new entity ID of the goal sensor keeps the trigger working."""
    await setup_challenge(hass, hass_storage, {})
    events = await automation(hass, "goal_reached", device_id(hass))
    er.async_get(hass).async_update_entity(
        "binary_sensor.push_ups_goal_reached_today", new_entity_id="binary_sensor.goal"
    )
    await hass.async_block_till_done()
    for _ in range(2):
        await press(hass, "button.push_ups_add_10")
    await hass.async_block_till_done()
    assert len(events) == 1


async def test_trigger_detaches_when_the_automation_is_off(
    hass: HomeAssistant, hass_storage: dict[str, Any]
) -> None:
    """A switched-off automation neither fires nor follows the registry."""
    await setup_challenge(hass, hass_storage, {})
    events = await automation(hass, "goal_reached", device_id(hass))
    await hass.services.async_call(
        "automation", "turn_off", {"entity_id": "all"}, blocking=True
    )
    # Unrelated registry changes are ignored as well.
    er.async_get(hass).async_get_or_create("light", "demo", "lamp")
    for _ in range(2):
        await press(hass, "button.push_ups_add_10")
    await hass.async_block_till_done()
    assert events == []


async def test_device_without_entities(hass: HomeAssistant) -> None:
    """A device without the entities offers and watches nothing."""
    entry = MockConfigEntry(domain=DOMAIN, entry_id="empty")
    entry.add_to_hass(hass)
    device = dr.async_get(hass).async_get_or_create(
        config_entry_id=entry.entry_id, identifiers={(DOMAIN, "empty")}
    )
    events = await automation(hass, "goal_reached", device.id)
    triggers = await async_get_device_automations(
        hass, DeviceAutomationType.TRIGGER, device.id
    )
    assert [t for t in triggers if t["domain"] == DOMAIN] == []
    assert events == []
