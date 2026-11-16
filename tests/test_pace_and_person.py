"""Tests for the pace reminder blueprint and persons assigned to challenges."""

from __future__ import annotations

from collections.abc import AsyncGenerator
from typing import Any

import pytest
from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.setup import async_setup_component

from custom_components.daily_challenge.const import DOMAIN
from custom_components.daily_challenge.people import (
    notify_services,
    person_info,
    persons_of_user,
)

from .common import MockConfigEntry, async_capture_events, async_fire_time_changed
from .conftest import make_options
from .test_milestone_blueprint import automation_config

EVENT = "challenge_pace"
PERSON = "person.anna"


@pytest.fixture(autouse=True)
async def stop_automations(hass: HomeAssistant) -> AsyncGenerator[None]:
    """Turn the automations off at the end, so no time trigger lingers."""
    yield
    if hass.services.has_service("automation", "turn_off"):
        await hass.services.async_call(
            "automation", "turn_off", {"entity_id": "all"}, blocking=True
        )


def add_person(hass: HomeAssistant, trackers: list[str] | None = None) -> None:
    """Create Anna with a phone."""
    hass.states.async_set(
        PERSON,
        "home",
        {
            "friendly_name": "Anna",
            "user_id": "user-anna",
            "entity_picture": "/api/image/anna.jpg",
            "device_trackers": trackers or ["device_tracker.pixel"],
        },
    )


def add_notify_service(hass: HomeAssistant, name: str) -> list[ServiceCall]:
    """Register a fake mobile app notify service and return its calls."""
    calls: list[ServiceCall] = []

    async def handle(call: ServiceCall) -> None:
        calls.append(call)

    hass.services.async_register("notify", name, handle)
    return calls


async def setup(hass: HomeAssistant, **overrides: Any) -> MockConfigEntry:
    """Set up the push-up challenge."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Push-ups",
        unique_id="0123456789abcdef",
        entry_id="push_ups",
        data={},
        options=make_options(**overrides),
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def status(hass: HomeAssistant) -> dict[str, Any]:
    """Return the response of get_status."""
    return await hass.services.async_call(
        DOMAIN,
        "get_status",
        {"config_entry_id": "push_ups"},
        blocking=True,
        return_response=True,
    )


async def set_today(hass: HomeAssistant, value: int) -> None:
    """Set today's value."""
    await hass.services.async_call(
        DOMAIN, "set", {"config_entry_id": "push_ups", "value": value}, blocking=True
    )


def pace_automation(**inputs: Any) -> dict[str, Any]:
    """Return a pace reminder that fires an event."""
    return automation_config(
        "pace.yaml",
        {
            "today_entity": "number.push_ups_today",
            "notify_action": [
                {
                    "event": EVENT,
                    "event_data": {
                        "challenge": "{{ challenge }}",
                        "done": "{{ done }}",
                        "target": "{{ target }}",
                        "expected": "{{ expected }}",
                        "remaining": "{{ remaining }}",
                        "message": "{{ message }}",
                    },
                }
            ],
            **inputs,
        },
    )


async def at(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory, local_time: str
) -> None:
    """Move to a local time today and let the time triggers run."""
    freezer.move_to(f"2026-11-04 {local_time}+01:00")
    async_fire_time_changed(hass)
    await hass.async_block_till_done()


async def test_person_in_status_and_notify_services(hass: HomeAssistant) -> None:
    """get_status names the person and finds the phone's notify service."""
    add_person(hass)
    add_notify_service(hass, "mobile_app_pixel")
    await setup(hass, person=PERSON)
    result = await status(hass)
    assert result["person"] == PERSON
    assert result["person_name"] == "Anna"
    assert result["notify_services"] == ["mobile_app_pixel"]


async def test_status_without_person(hass: HomeAssistant) -> None:
    """Without a person there is no name and no phone."""
    await setup(hass)
    result = await status(hass)
    assert (result["person"], result["person_name"], result["notify_services"]) == (
        None,
        None,
        [],
    )


async def test_notify_service_follows_the_device_name(hass: HomeAssistant) -> None:
    """The mobile app names its service after the device of the tracker."""
    device_entry = MockConfigEntry(domain="mobile_app")
    device_entry.add_to_hass(hass)
    device = dr.async_get(hass).async_get_or_create(
        config_entry_id=device_entry.entry_id,
        identifiers={("mobile_app", "phone-1")},
        name="Annas Pixel 9",
    )
    tracker = er.async_get(hass).async_get_or_create(
        "device_tracker",
        "mobile_app",
        "phone-1",
        device_id=device.id,
        suggested_object_id="tracker_1",
    )
    add_person(hass, [tracker.entity_id, "device_tracker.unknown"])
    add_notify_service(hass, "mobile_app_annas_pixel_9")
    assert notify_services(hass, PERSON) == ["mobile_app_annas_pixel_9"]
    assert notify_services(hass, "person.nobody") == []
    assert notify_services(hass, None) == []


def test_person_info_and_users(hass: HomeAssistant) -> None:
    """Name, picture and user of a person; persons of a user."""
    add_person(hass)
    assert person_info(hass, PERSON) == {
        "entity_id": PERSON,
        "name": "Anna",
        "picture": "/api/image/anna.jpg",
        "user_id": "user-anna",
    }
    assert person_info(hass, None) is None
    assert person_info(hass, "person.gone")["name"] is None
    assert persons_of_user(hass, "user-anna") == {PERSON}
    assert persons_of_user(hass, "other") == set()
    assert persons_of_user(hass, None) == set()


async def test_pace_reminder_only_when_behind(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> None:
    """A reminder comes when more than the tolerance behind, then pauses."""
    await setup(hass)
    events = async_capture_events(hass, EVENT)
    assert await async_setup_component(
        hass, "automation", {"automation": [pace_automation()]}
    )
    await hass.async_block_till_done()

    # 08:00 to 21:00: at 12:00 about 4/13 of 20 = 7 should be done.
    await set_today(hass, 6)
    await at(hass, freezer, "12:00:00")
    assert events == []  # 6 is within 25 % of 7

    await set_today(hass, 5)
    await at(hass, freezer, "13:00:00")
    assert [event.data for event in events] == [
        {
            "challenge": "Push-ups",
            "done": 5,
            "target": 20,
            "expected": 8,
            "remaining": 15,
            "message": "5 of 20 repetitions so far; about 8 would be on track."
            " Still 15 repetitions to go today.",
        }
    ]
    # Paused for 3 hours.
    await at(hass, freezer, "14:00:00")
    await at(hass, freezer, "15:00:00")
    assert len(events) == 1
    await at(hass, freezer, "16:00:01")
    await at(hass, freezer, "17:00:00")
    assert len(events) == 2


async def test_pace_reminder_quiet_when_reached_or_outside_window(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> None:
    """No reminder once the goal is reached, or outside the window."""
    await setup(hass)
    events = async_capture_events(hass, EVENT)
    assert await async_setup_component(
        hass, "automation", {"automation": [pace_automation()]}
    )
    await hass.async_block_till_done()
    await at(hass, freezer, "07:00:00")
    await at(hass, freezer, "22:00:00")
    assert events == []
    freezer.move_to("2026-11-04 12:00:00+01:00")
    await set_today(hass, 20)
    await at(hass, freezer, "20:00:00")
    assert events == []


async def test_pace_reminder_not_running(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> None:
    """A challenge that has not started gets no reminder."""
    await setup(hass, start_date="2026-11-04", end_date="2026-11-04")
    freezer.move_to("2026-11-05 08:30:00+01:00")
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    events = async_capture_events(hass, EVENT)
    assert await async_setup_component(
        hass, "automation", {"automation": [pace_automation()]}
    )
    await hass.async_block_till_done()
    freezer.move_to("2026-11-05 13:00:00+01:00")
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert events == []


@pytest.mark.parametrize("notify_person", [True, False])
async def test_pace_reminder_to_the_persons_phone(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory, notify_person: bool
) -> None:
    """With the option on, the message also goes to the person's phones."""
    add_person(hass)
    calls = add_notify_service(hass, "mobile_app_pixel")
    await setup(hass, person=PERSON)
    assert await async_setup_component(
        hass,
        "automation",
        {"automation": [pace_automation(notify_person=notify_person)]},
    )
    await hass.async_block_till_done()
    await at(hass, freezer, "13:00:00")
    assert len(calls) == (1 if notify_person else 0)
    if notify_person:
        assert calls[0].data["title"] == "Push-ups"
        assert calls[0].data["message"].startswith("0 of 20 repetitions")


@pytest.mark.parametrize(
    ("blueprint", "inputs"),
    [
        ("reminder.yaml", {"goal_entity": "binary_sensor.push_ups_goal_reached_today"}),
        ("weekly.yaml", {"today_entity": "number.push_ups_today", "weekday": "wed"}),
    ],
)
async def test_other_blueprints_send_to_the_person(
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
    blueprint: str,
    inputs: dict[str, Any],
) -> None:
    """Reminder and weekly summary reach the person's phone too."""
    add_person(hass)
    calls = add_notify_service(hass, "mobile_app_pixel")
    await setup(hass, person=PERSON)
    config = automation_config(
        blueprint, {**inputs, "notify_person": True, "notify_action": []}
    )
    assert await async_setup_component(hass, "automation", {"automation": [config]})
    await hass.async_block_till_done()
    await at(hass, freezer, "20:00:00")
    assert len(calls) == 1
    assert calls[0].data["title"] == "Push-ups"
