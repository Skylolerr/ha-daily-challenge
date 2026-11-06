"""Tests for the milestone, voice, button and weekly blueprints."""

from __future__ import annotations

from datetime import timedelta
from pathlib import Path
from typing import Any

import pytest
from freezegun.api import FrozenDateTimeFactory
from homeassistant.components.automation.config import AUTOMATION_BLUEPRINT_SCHEMA
from homeassistant.components.blueprint.models import Blueprint, BlueprintInputs
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.setup import async_setup_component
from homeassistant.util.yaml import load_yaml_dict

from .common import MockConfigEntry, async_capture_events, async_fire_time_changed
from .conftest import make_options
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


async def setup_automation(
    hass: HomeAssistant, name: str, inputs: dict[str, Any]
) -> None:
    """Set up one automation from a blueprint."""
    config = automation_config(name, inputs)
    assert await async_setup_component(hass, "automation", {"automation": [config]})
    await hass.async_block_till_done()


FEEDBACK = [
    {
        "event": EVENT,
        "event_data": {
            "challenge": "{{ challenge }}",
            "amount": "{{ amount }}",
            "done": "{{ done }}",
            "target": "{{ target }}",
            "unit": "{{ unit }}",
        },
    }
]


@pytest.mark.usefixtures("loaded_entry")
async def test_button_blueprint(hass: HomeAssistant) -> None:
    """Each trigger adds the amount; the feedback gets the new figures."""
    await setup_automation(
        hass,
        "button.yaml",
        {
            "add_trigger": [{"trigger": "event", "event_type": "test_press"}],
            "today_entity": "number.push_ups_today",
            "amount": 5,
            "feedback_action": FEEDBACK,
        },
    )
    events = async_capture_events(hass, EVENT)
    hass.bus.async_fire("test_press")
    hass.bus.async_fire("test_press")
    await hass.async_block_till_done()
    assert hass.states.get("number.push_ups_today").state == "10"
    assert events[-1].data == {
        "challenge": "Push-ups",
        "amount": 5,
        "done": 10,
        "target": 20,
        "unit": "repetitions",
    }


@pytest.mark.usefixtures("loaded_entry")
async def test_button_blueprint_without_feedback(hass: HomeAssistant) -> None:
    """The default adds 1 and does nothing else."""
    await setup_automation(
        hass,
        "button.yaml",
        {
            "add_trigger": [{"trigger": "event", "event_type": "test_press"}],
            "today_entity": "number.push_ups_today",
        },
    )
    hass.bus.async_fire("test_press")
    await hass.async_block_till_done()
    assert hass.states.get("number.push_ups_today").state == "1"


async def setup_weekly(hass: HomeAssistant, weekday: str) -> list[Any]:
    """Set up the weekly summary for today at 12:30 with a test event."""
    await setup_automation(
        hass,
        "weekly.yaml",
        {
            "today_entity": "number.push_ups_today",
            "weekday": weekday,
            "summary_time": "12:30:00",
            "notify_action": [
                {
                    "event": EVENT,
                    "event_data": {
                        "message": "{{ message }}",
                        "fulfilled": "{{ fulfilled }}",
                        "days": "{{ days }}",
                    },
                }
            ],
        },
    )
    return async_capture_events(hass, EVENT)


async def run_until_half_past(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> None:
    """Move from 12:00 to 12:31 and let the time trigger fire."""
    freezer.tick(timedelta(minutes=31))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()


@pytest.mark.usefixtures("loaded_entry")
async def test_weekly_blueprint(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> None:
    """On the chosen day the week is summed up."""
    for day in ("2026-11-02", "2026-11-03"):
        await hass.services.async_call(
            "daily_challenge",
            "set",
            {"config_entry_id": "push_ups", "value": 20, "date": day},
            blocking=True,
        )
    events = await setup_weekly(hass, "wed")
    await run_until_half_past(hass, freezer)
    assert [event.data for event in events] == [
        {
            "message": "This week: 40 of 60 repetitions, goal reached on 2 of 3 days. "
            "Streak: 2 days.",
            "fulfilled": 2,
            "days": 3,
        }
    ]
    await hass.services.async_call(
        "automation", "turn_off", {"entity_id": "all"}, blocking=True
    )


@pytest.mark.usefixtures("loaded_entry")
async def test_weekly_blueprint_other_day(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> None:
    """On other days nothing is sent."""
    events = await setup_weekly(hass, "sun")
    await run_until_half_past(hass, freezer)
    assert events == []
    await hass.services.async_call(
        "automation", "turn_off", {"entity_id": "all"}, blocking=True
    )


async def test_weekly_blueprint_not_running(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory, hass_storage: dict[str, Any]
) -> None:
    """Before the start nothing is sent."""
    entry = MockConfigEntry(
        domain="daily_challenge",
        title="Push-ups",
        unique_id="push_ups",
        entry_id="push_ups",
        data={},
        options=make_options(start_date="2026-12-01"),
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    events = await setup_weekly(hass, "wed")
    await run_until_half_past(hass, freezer)
    assert events == []
    await hass.services.async_call(
        "automation", "turn_off", {"entity_id": "all"}, blocking=True
    )


async def test_button_blueprint_skips_challenges_it_cannot_add_to(
    hass: HomeAssistant,
) -> None:
    """With a daily source the press does nothing instead of failing."""
    hass.states.async_set("sensor.steps", "7")
    entry = MockConfigEntry(
        domain="daily_challenge",
        title="Push-ups",
        unique_id="push_ups",
        entry_id="push_ups",
        data={},
        options=make_options(source_entity="sensor.steps"),
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await setup_automation(
        hass,
        "button.yaml",
        {
            "add_trigger": [{"trigger": "event", "event_type": "test_press"}],
            "today_entity": "number.push_ups_today",
            "feedback_action": FEEDBACK,
        },
    )
    events = async_capture_events(hass, EVENT)
    hass.bus.async_fire("test_press")
    await hass.async_block_till_done()
    assert hass.states.get("number.push_ups_today").state == "7"
    assert events == []
    state = hass.states.get("automation.button_yaml")
    assert state.attributes.get("last_triggered") is not None


@pytest.mark.usefixtures("loaded_entry")
async def test_button_blueprint_uses_the_device_name(hass: HomeAssistant) -> None:
    """A device renamed by the user shows its new name."""
    entity = er.async_get(hass).async_get("number.push_ups_today")
    assert entity is not None
    assert entity.device_id is not None
    dr.async_get(hass).async_update_device(entity.device_id, name_by_user="Liegestütze")
    await setup_automation(
        hass,
        "button.yaml",
        {
            "add_trigger": [{"trigger": "event", "event_type": "test_press"}],
            "today_entity": "number.push_ups_today",
            "feedback_action": FEEDBACK,
        },
    )
    events = async_capture_events(hass, EVENT)
    hass.bus.async_fire("test_press")
    await hass.async_block_till_done()
    assert events[0].data["challenge"] == "Liegestütze"
