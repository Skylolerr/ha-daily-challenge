"""Tests for the milestone event entity."""

from __future__ import annotations

from typing import Any

from homeassistant.const import STATE_UNKNOWN
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

from custom_components.daily_challenge.const import DOMAIN

from .common import MockConfigEntry, async_capture_events
from .conftest import make_options
from .test_init import STORE_KEY, press, store_payload

EVENT = "event.push_ups_milestone"
# Six fulfilled days before TODAY (2026-11-04), target 20.
SIX_DAYS = {f"2026-10-{day}": 20 for day in range(29, 32)} | {
    "2026-11-01": 20,
    "2026-11-02": 20,
    "2026-11-03": 20,
}


async def setup_challenge(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    days: dict[str, int],
    **overrides: Any,
) -> MockConfigEntry:
    """Set up the default challenge, started on 2026-10-29, with `days`."""
    hass_storage[STORE_KEY] = store_payload(days, {"2026-10-29": 20})
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Push-ups",
        unique_id="0123456789abcdef",
        entry_id="push_ups",
        data={},
        options=make_options(start_date="2026-10-29", **overrides),
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def test_event_types_and_no_event_on_setup(
    hass: HomeAssistant, hass_storage: dict[str, Any]
) -> None:
    """The entity lists the enabled kinds; loading the data fires nothing."""
    await setup_challenge(hass, hass_storage, SIX_DAYS | {"2026-11-04": 20})
    state = hass.states.get(EVENT)
    assert state.state == STATE_UNKNOWN
    assert state.attributes["event_types"] == [
        "streak",
        "best_streak",
        "best_day",
        "total",
    ]


async def test_streak_milestone_fires(
    hass: HomeAssistant, hass_storage: dict[str, Any]
) -> None:
    """Reaching today's goal after six days fires the 7-day milestone."""
    await setup_challenge(hass, hass_storage, SIX_DAYS, milestones=["streak"])
    changes = async_capture_events(hass, "state_changed")
    await press(hass, "button.push_ups_add_10")
    assert hass.states.get(EVENT).state == STATE_UNKNOWN
    await press(hass, "button.push_ups_add_10")
    state = hass.states.get(EVENT)
    assert state.attributes["event_type"] == "streak"
    assert state.attributes["value"] == 7
    assert len([c for c in changes if c.data["entity_id"] == EVENT]) == 1


async def test_several_milestones_fire_one_after_another(
    hass: HomeAssistant, hass_storage: dict[str, Any]
) -> None:
    """One change can fire several kinds; each is its own event."""
    await setup_challenge(hass, hass_storage, SIX_DAYS)
    changes = async_capture_events(hass, "state_changed")
    for _ in range(3):
        await press(hass, "button.push_ups_add_10")
    fired = [
        (
            c.data["new_state"].attributes["event_type"],
            c.data["new_state"].attributes["value"],
        )
        for c in changes
        if c.data["entity_id"] == EVENT
    ]
    # 120 before today: 20 more is 7 days, 30 beats the best day of 20.
    assert fired == [("streak", 7), ("best_day", 30)]


async def test_total_milestone(
    hass: HomeAssistant, hass_storage: dict[str, Any]
) -> None:
    """The total crossing 250 fires a total milestone."""
    await setup_challenge(hass, hass_storage, {"2026-10-29": 245}, milestones=["total"])
    await press(hass, "button.push_ups_add_5")
    state = hass.states.get(EVENT)
    assert state.attributes["event_type"] == "total"
    assert state.attributes["value"] == 250


async def test_no_milestones_no_entity(
    hass: HomeAssistant, hass_storage: dict[str, Any]
) -> None:
    """Without milestones the entity is not created and an old one is removed."""
    registry = er.async_get(hass)
    registry.async_get_or_create(
        "event", DOMAIN, "push_ups_milestone", suggested_object_id="push_ups_milestone"
    )
    await setup_challenge(hass, hass_storage, {}, milestones=[])
    assert hass.states.get(EVENT) is None
    assert registry.async_get_entity_id("event", DOMAIN, "push_ups_milestone") is None
    # Pressing buttons still works without a listener.
    await press(hass, "button.push_ups_add_10")
    assert hass.states.get("sensor.push_ups_total").state == "10"


async def test_older_entries_get_all_milestones(
    hass: HomeAssistant, hass_storage: dict[str, Any]
) -> None:
    """Entries without the option behave as if all kinds were selected."""
    hass_storage[STORE_KEY] = store_payload({}, {"2026-11-02": 20})
    options = make_options()
    del options["milestones"]
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Push-ups",
        unique_id="0123456789abcdef",
        entry_id="push_ups",
        data={},
        options=options,
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert len(hass.states.get(EVENT).attributes["event_types"]) == 4
