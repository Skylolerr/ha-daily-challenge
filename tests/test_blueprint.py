"""Tests for the reminder blueprint."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.components.automation.config import AUTOMATION_BLUEPRINT_SCHEMA
from homeassistant.components.blueprint.models import Blueprint, BlueprintInputs
from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component
from homeassistant.util.yaml import load_yaml_dict
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_capture_events,
    async_fire_time_changed,
)

from .test_init import press

BLUEPRINT = (
    Path(__file__).parent.parent
    / "blueprints"
    / "automation"
    / "daily_challenge"
    / "reminder.yaml"
)
GOAL = "binary_sensor.push_ups_goal_reached_today"
EVENT = "challenge_reminder"


def automation_config(inputs: dict[str, Any]) -> dict[str, Any]:
    """Return the automation the blueprint creates for `inputs`."""
    blueprint = Blueprint(
        load_yaml_dict(BLUEPRINT),
        expected_domain="automation",
        schema=AUTOMATION_BLUEPRINT_SCHEMA,
    )
    blueprint_inputs = BlueprintInputs(
        blueprint, {"use_blueprint": {"path": "reminder.yaml", "input": inputs}}
    )
    blueprint_inputs.validate()
    return {
        "id": "reminder",
        "alias": "Reminder",
        **blueprint_inputs.async_substitute(),
    }


async def setup_reminder(hass: HomeAssistant) -> list[Any]:
    """Set up the reminder with an action that fires a test event."""
    config = automation_config(
        {
            "goal_entity": GOAL,
            "notify_action": [
                {
                    "event": EVENT,
                    "event_data": {
                        "challenge": "{{ challenge }}",
                        "done": "{{ done }}",
                        "target": "{{ target }}",
                        "remaining": "{{ remaining }}",
                        "unit": "{{ unit }}",
                    },
                }
            ],
        }
    )
    events = async_capture_events(hass, EVENT)
    assert await async_setup_component(hass, "automation", {"automation": [config]})
    await hass.async_block_till_done()
    return events


async def stop_reminder(hass: HomeAssistant) -> None:
    """Turn the automation off so its time trigger does not outlive the test."""
    await hass.services.async_call(
        "automation", "turn_off", {"entity_id": "all"}, blocking=True
    )


async def at_reminder_time(hass: HomeAssistant, freezer: FrozenDateTimeFactory) -> None:
    """Move to the default reminder time (20:00 local)."""
    freezer.move_to("2026-11-04 20:00:00+01:00")
    async_fire_time_changed(hass)
    await hass.async_block_till_done()


def test_blueprint_is_valid() -> None:
    """The blueprint passes HA's schema and has sensible defaults."""
    config = automation_config({"goal_entity": GOAL})
    assert config["triggers"] == [{"trigger": "time", "at": "20:00:00"}]
    assert config["actions"][0]["action"] == "persistent_notification.create"


async def test_reminds_when_goal_is_open(
    hass: HomeAssistant,
    loaded_entry: MockConfigEntry,
    freezer: FrozenDateTimeFactory,
) -> None:
    """At the reminder time the open amount is passed to the action."""
    await press(hass, "button.push_ups_add_5")
    events = await setup_reminder(hass)

    await at_reminder_time(hass, freezer)
    assert len(events) == 1
    assert events[0].data == {
        "challenge": "Push-ups",
        "done": 5,
        "target": 20,
        "remaining": 15,
        "unit": "repetitions",
    }
    await stop_reminder(hass)


async def test_no_reminder_when_goal_is_reached(
    hass: HomeAssistant,
    loaded_entry: MockConfigEntry,
    freezer: FrozenDateTimeFactory,
) -> None:
    """Nothing happens once today's goal is reached."""
    await press(hass, "button.push_ups_add_10")
    await press(hass, "button.push_ups_add_10")
    events = await setup_reminder(hass)

    await at_reminder_time(hass, freezer)
    assert events == []
    await stop_reminder(hass)
