"""Tests for setup, storage and the day rollover."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

import pytest
from freezegun.api import FrozenDateTimeFactory
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_time_changed,
)

from custom_components.daily_challenge.const import DOMAIN, SAVE_DELAY

from .conftest import START, TODAY, make_options

STORE_KEY = f"{DOMAIN}.push_ups"


def stored(hass_storage: dict[str, Any]) -> dict[str, Any]:
    """Return the persisted data of the default challenge."""
    return hass_storage[STORE_KEY]["data"]


def store_payload(days: dict[str, int], targets: dict[str, int]) -> dict[str, Any]:
    """Return a raw store file content."""
    return {
        "version": 1,
        "minor_version": 1,
        "key": STORE_KEY,
        "data": {"days": days, "target_history": targets},
    }


async def press(hass: HomeAssistant, entity_id: str) -> None:
    """Press a button."""
    await hass.services.async_call(
        "button", "press", {"entity_id": entity_id}, blocking=True
    )


async def test_setup_and_unload(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """The entry loads, creates its entities and unloads cleanly."""
    assert loaded_entry.state is ConfigEntryState.LOADED
    assert hass.states.get("number.push_ups_today").state == "0"

    assert await hass.config_entries.async_unload(loaded_entry.entry_id)
    await hass.async_block_till_done()
    assert loaded_entry.state is ConfigEntryState.NOT_LOADED


async def test_initial_target_history(
    hass: HomeAssistant,
    loaded_entry: MockConfigEntry,
    hass_storage: dict[str, Any],
) -> None:
    """The first target history entry is the start date."""
    assert stored(hass_storage) == {"days": {}, "target_history": {START: 20}}


async def test_changes_are_saved_delayed_and_on_unload(
    hass: HomeAssistant,
    loaded_entry: MockConfigEntry,
    hass_storage: dict[str, Any],
    freezer: FrozenDateTimeFactory,
) -> None:
    """Quick clicks are bundled into one delayed save."""
    await press(hass, "button.push_ups_add_5")
    await press(hass, "button.push_ups_add_5")
    assert stored(hass_storage)["days"] == {}

    freezer.tick(timedelta(seconds=SAVE_DELAY + 1))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert stored(hass_storage)["days"] == {TODAY: 10}

    await press(hass, "button.push_ups_add_1")
    assert await hass.config_entries.async_unload(loaded_entry.entry_id)
    await hass.async_block_till_done()
    assert stored(hass_storage)["days"] == {TODAY: 11}


async def test_data_survives_reload(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """Values are kept across a reload of the entry."""
    await press(hass, "button.push_ups_add_10")
    assert await hass.config_entries.async_reload(loaded_entry.entry_id)
    await hass.async_block_till_done()
    assert hass.states.get("number.push_ups_today").state == "10"


async def test_remove_entry_deletes_store(
    hass: HomeAssistant,
    loaded_entry: MockConfigEntry,
    hass_storage: dict[str, Any],
) -> None:
    """Removing the challenge deletes its store file."""
    await press(hass, "button.push_ups_add_10")
    assert await hass.config_entries.async_remove(loaded_entry.entry_id)
    await hass.async_block_till_done()
    assert STORE_KEY not in hass_storage


async def test_restart_over_midnight(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    hass_storage: dict[str, Any],
    freezer: FrozenDateTimeFactory,
) -> None:
    """Setting up on a later day recalculates everything for the new date."""
    hass_storage[STORE_KEY] = store_payload(
        {"2026-11-02": 20, "2026-11-03": 20, TODAY: 20}, {START: 20}
    )
    freezer.move_to("2026-11-05 07:00:00+01:00")
    config_entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()

    assert hass.states.get("number.push_ups_today").state == "0"
    assert hass.states.get("sensor.push_ups_current_streak").state == "3"
    assert hass.states.get("sensor.push_ups_total").state == "60"
    assert hass.states.get("binary_sensor.push_ups_goal_reached_today").state == "off"


async def test_midnight_rollover(
    hass: HomeAssistant,
    loaded_entry: MockConfigEntry,
    freezer: FrozenDateTimeFactory,
) -> None:
    """At midnight a new day starts; nothing is reset or lost."""
    await press(hass, "button.push_ups_add_10")
    await press(hass, "button.push_ups_add_10")
    assert hass.states.get("binary_sensor.push_ups_goal_reached_today").state == "on"

    freezer.move_to("2026-11-04 23:59:59+01:00")
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert hass.states.get("number.push_ups_today").state == "20"

    freezer.move_to("2026-11-05 00:00:00+01:00")
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert hass.states.get("number.push_ups_today").state == "0"
    assert hass.states.get("binary_sensor.push_ups_goal_reached_today").state == "off"
    assert hass.states.get("sensor.push_ups_total").state == "20"
    assert hass.states.get("sensor.push_ups_current_streak").state == "1"


@pytest.mark.parametrize(
    ("before_midnight", "midnight", "next_midnight", "dst_day"),
    [
        (
            "2026-03-28 23:59:59+01:00",
            "2026-03-29 00:00:00+01:00",
            "2026-03-30 00:00:00+02:00",
            "2026-03-29",
        ),
        (
            "2026-10-24 23:59:59+02:00",
            "2026-10-25 00:00:00+02:00",
            "2026-10-26 00:00:00+01:00",
            "2026-10-25",
        ),
    ],
    ids=["spring_forward", "fall_back"],
)
async def test_rollover_around_dst_change(
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
    hass_storage: dict[str, Any],
    before_midnight: str,
    midnight: str,
    next_midnight: str,
    dst_day: str,
) -> None:
    """Days with 23 or 25 hours (Europe/Zurich) roll over exactly at midnight."""
    start = (datetime.fromisoformat(dst_day) - timedelta(days=2)).date().isoformat()
    freezer.move_to(before_midnight)
    hass_storage[STORE_KEY] = store_payload({}, {start: 20})
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Push-ups",
        entry_id="push_ups",
        options=make_options(start_date=start),
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await press(hass, "button.push_ups_add_10")
    await press(hass, "button.push_ups_add_10")

    freezer.move_to(midnight)
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert dt_util.now().date().isoformat() == dst_day
    assert hass.states.get("number.push_ups_today").state == "0"
    assert hass.states.get("sensor.push_ups_target_to_date").state == "60"

    # Record the DST day itself, then roll over into the following day.
    await press(hass, "button.push_ups_add_10")
    await press(hass, "button.push_ups_add_10")
    freezer.move_to(next_midnight)
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert hass.states.get("number.push_ups_today").state == "0"
    assert hass.states.get("sensor.push_ups_current_streak").state == "2"
    assert hass.states.get("sensor.push_ups_target_to_date").state == "80"
    assert hass.states.get("sensor.push_ups_total").state == "40"
