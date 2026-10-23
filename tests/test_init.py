"""Tests for setup, storage and the day rollover."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any
from unittest.mock import patch

import pytest
from freezegun.api import FrozenDateTimeFactory
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_time_changed,
)

from custom_components.daily_challenge.const import DOMAIN, SAVE_DELAY
from custom_components.daily_challenge.coordinator import ChallengeStore

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


async def test_rollover_when_midnight_does_not_exist(
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
    hass_storage: dict[str, Any],
) -> None:
    """In Chile DST starts at midnight: the day begins at 01:00 and still rolls."""
    await hass.config.async_set_time_zone("America/Santiago")
    freezer.move_to("2026-09-05 22:00:00-04:00")
    hass_storage[STORE_KEY] = store_payload({}, {"2026-09-04": 20})
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Push-ups",
        entry_id="push_ups",
        options=make_options(start_date="2026-09-04"),
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await press(hass, "button.push_ups_add_10")

    # 23:59:59 is followed by 01:00:00 on Sep 6.
    freezer.move_to("2026-09-06 01:00:00-03:00")
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert dt_util.now().date().isoformat() == "2026-09-06"
    assert hass.states.get("number.push_ups_today").state == "0"
    assert hass.states.get("sensor.push_ups_total").state == "10"

    # The following midnight exists again and is scheduled as well.
    freezer.move_to("2026-09-07 00:00:00-03:00")
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert hass.states.get("sensor.push_ups_target_to_date").state == "80"


async def test_midnight_timer_stops_on_unload(
    hass: HomeAssistant,
    loaded_entry: MockConfigEntry,
    freezer: FrozenDateTimeFactory,
) -> None:
    """No timer is left behind after unloading."""
    assert await hass.config_entries.async_unload(loaded_entry.entry_id)
    await hass.async_block_till_done()
    freezer.move_to("2026-11-05 00:00:00+01:00")
    async_fire_time_changed(hass)
    await hass.async_block_till_done()


async def test_rename_updates_device_and_entity_names(
    hass: HomeAssistant,
    loaded_entry: MockConfigEntry,
    device_registry: dr.DeviceRegistry,
) -> None:
    """Renaming the challenge alone (no option change) renames the device."""
    hass.config_entries.async_update_entry(loaded_entry, title="Squats")
    await hass.async_block_till_done()

    device = device_registry.async_get_device_by_identifier(
        (DOMAIN, "push_ups"), "push_ups"
    )
    assert device.name == "Squats"
    assert (
        hass.states.get("sensor.push_ups_total").attributes["friendly_name"]
        == "Squats Total"
    )


async def test_option_change_reloads_once(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """Changing options reloads the entry exactly once."""
    with patch.object(hass.config_entries, "async_schedule_reload") as schedule_reload:
        hass.config_entries.async_update_entry(
            loaded_entry, options={**loaded_entry.options, "icon": "mdi:run"}
        )
        await hass.async_block_till_done()
    schedule_reload.assert_called_once_with("push_ups")


async def test_remove_after_failed_unload_uses_the_loaded_store(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """The loaded store is removed, which also cancels its pending delayed save.

    A second, fresh store would delete the file while the loaded one could
    still write it again afterwards.
    """
    await press(hass, "button.push_ups_add_5")
    loaded_store = loaded_entry.runtime_data.store
    with (
        patch.object(hass.config_entries, "async_unload_platforms", return_value=False),
        patch.object(ChallengeStore, "async_remove", autospec=True) as remove,
    ):
        assert await hass.config_entries.async_remove(loaded_entry.entry_id)
        await hass.async_block_till_done()
    remove.assert_called_once_with(loaded_store)
    # The failed unload kept the midnight timer; stop it for the test.
    loaded_entry.runtime_data._cancel_midnight()
