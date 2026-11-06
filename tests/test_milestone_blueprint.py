"""Tests for the milestone and voice blueprints."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from homeassistant.components.automation.config import AUTOMATION_BLUEPRINT_SCHEMA
from homeassistant.components.blueprint.models import Blueprint, BlueprintInputs
from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component
from homeassistant.util.yaml import load_yaml_dict

from .common import async_capture_events
from .test_init import press
from .test_milestone_event import SIX_DAYS, setup_challenge

BLUEPRINTS = (
    Path(__file__).parent.parent / "blueprints" / "automation" / "daily_challenge"
)
EVENT = "challenge_milestone"


def automation_config(name: str, inputs: dict[str, Any]) -> dict[str, Any]:
    """Return the automation a blueprint creates for `inputs`."""
    blueprint = Blueprint(
        load_yaml_dict(BLUEPRINTS / name),
        expected_domain="automation",
        schema=AUTOMATION_BLUEPRINT_SCHEMA,
    )
    blueprint_inputs = BlueprintInputs(
        blueprint, {"use_blueprint": {"path": name, "input": inputs}}
    )
    blueprint_inputs.validate()
    return {"id": name, "alias": name, **blueprint_inputs.async_substitute()}


async def test_milestone_blueprint(
    hass: HomeAssistant, hass_storage: dict[str, Any]
) -> None:
    """Each milestone runs the action with a ready-made message."""
    await setup_challenge(hass, hass_storage, SIX_DAYS)
    config = automation_config(
        "milestone.yaml",
        {
            "milestone_entity": "event.push_ups_milestone",
            "notify_action": [
                {
                    "event": EVENT,
                    "event_data": {
                        "challenge": "{{ challenge }}",
                        "kind": "{{ kind }}",
                        "value": "{{ value }}",
                        "unit": "{{ unit }}",
                        "message": "{{ message }}",
                    },
                }
            ],
        },
    )
    events = async_capture_events(hass, EVENT)
    assert await async_setup_component(hass, "automation", {"automation": [config]})
    await hass.async_block_till_done()

    for _ in range(3):
        await press(hass, "button.push_ups_add_10")
    await hass.async_block_till_done()
    assert [event.data for event in events] == [
        {
            "challenge": "Push-ups",
            "kind": "streak",
            "value": 7,
            "unit": "repetitions",
            "message": "7 days in a row!",
        },
        {
            "challenge": "Push-ups",
            "kind": "best_day",
            "value": 30,
            "unit": "repetitions",
            "message": "New best day: 30 repetitions!",
        },
    ]

    # Reloading the challenge (unavailable and back) fires nothing.
    entry = hass.config_entries.async_entries("daily_challenge")[0]
    assert await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    assert len(events) == 2


def test_voice_blueprint_is_valid() -> None:
    """The voice blueprint validates with its defaults."""
    config = automation_config("voice.yaml", {})
    commands = [trigger["command"] for trigger in config["triggers"]]
    assert commands[0] == [
        "add {amount} to {challenge}",
        "log {amount} for {challenge}",
    ]
    assert "{challenge} status" in commands[1]
