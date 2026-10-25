"""Tests for the entities of a challenge."""

from __future__ import annotations

from typing import Any

import pytest
from freezegun.api import FrozenDateTimeFactory
from homeassistant.const import ATTR_UNIT_OF_MEASUREMENT, STATE_UNKNOWN, EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.daily_challenge.const import DOMAIN

from .conftest import START, make_options
from .test_init import STORE_KEY, press, store_payload


@pytest.fixture
def history(hass_storage: dict[str, Any]) -> None:
    """Store some history: Nov 2 and 3 fulfilled, 15 today."""
    hass_storage[STORE_KEY] = store_payload(
        {"2026-11-02": 20, "2026-11-03": 25, "2026-11-04": 15}, {START: 20}
    )


def state(hass: HomeAssistant, entity_id: str) -> str:
    """Return the state of an entity."""
    entity_state = hass.states.get(entity_id)
    assert entity_state is not None, entity_id
    return entity_state.state


@pytest.mark.usefixtures("history")
async def test_sensor_states(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """All figures are exposed with the configured unit."""
    expected = {
        "number.push_ups_today": "15",
        "sensor.push_ups_today_s_target": "20",
        "sensor.push_ups_progress": "75.0",
        "sensor.push_ups_total": "60",
        "sensor.push_ups_current_streak": "2",
        "sensor.push_ups_best_streak": "2",
        "sensor.push_ups_target_to_date": "60",
        "sensor.push_ups_ahead_behind": "0",
        "sensor.push_ups_daily_average": "20.0",
        "sensor.push_ups_best_day": "25",
        "sensor.push_ups_this_week": "60",
        "sensor.push_ups_this_month": "60",
        "sensor.push_ups_this_year": "60",
        "binary_sensor.push_ups_goal_reached_today": "off",
    }
    assert {entity_id: state(hass, entity_id) for entity_id in expected} == expected
    assert hass.states.get("sensor.push_ups_remaining") is None

    total = hass.states.get("sensor.push_ups_total")
    assert total.attributes[ATTR_UNIT_OF_MEASUREMENT] == "repetitions"
    assert total.attributes["state_class"] == "total"
    average = hass.states.get("sensor.push_ups_daily_average").attributes
    assert average[ATTR_UNIT_OF_MEASUREMENT] == "repetitions/d"
    assert (
        hass.states.get("sensor.push_ups_progress").attributes[ATTR_UNIT_OF_MEASUREMENT]
        == "%"
    )
    best_streak = hass.states.get("sensor.push_ups_best_streak").attributes
    assert best_streak["start"] == "2026-11-02"
    assert best_streak["end"] == "2026-11-03"
    assert best_streak[ATTR_UNIT_OF_MEASUREMENT] == "d"
    assert (
        hass.states.get("sensor.push_ups_best_day").attributes["date"] == "2026-11-03"
    )
    target = hass.states.get("sensor.push_ups_today_s_target").attributes
    assert target["daily_target"] == 20
    assert target["deficit"] == 0
    assert hass.states.get("number.push_ups_today").attributes["icon"] == "mdi:arm-flex"


async def test_device_and_entity_registry(
    hass: HomeAssistant,
    loaded_entry: MockConfigEntry,
    device_registry: dr.DeviceRegistry,
    entity_registry: er.EntityRegistry,
) -> None:
    """One service device per challenge; diagnostic sensors are categorized."""
    device = device_registry.async_get_device_by_identifier(
        (DOMAIN, "push_ups"), "push_ups"
    )
    assert device is not None
    assert device.name == "Push-ups"
    assert device.entry_type is dr.DeviceEntryType.SERVICE

    entries = er.async_entries_for_config_entry(entity_registry, "push_ups")
    assert all(entry.device_id == device.id for entry in entries)
    diagnostic = {
        entry.unique_id
        for entry in entries
        if entry.entity_category is EntityCategory.DIAGNOSTIC
    }
    assert diagnostic == {
        f"push_ups_{key}"
        for key in ("target_to_date", "average", "this_week", "this_month", "this_year")
    }
    assert {entry.entity_id for entry in entries if entry.domain == "button"} == {
        "button.push_ups_add_1",
        "button.push_ups_add_5",
        "button.push_ups_add_10",
        "button.push_ups_subtract",
    }


async def test_button_names(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    """Buttons are named after their amount."""
    assert (
        hass.states.get("button.push_ups_add_5").attributes["friendly_name"]
        == "Push-ups +5"
    )
    assert (
        hass.states.get("button.push_ups_subtract").attributes["friendly_name"]
        == "Push-ups −1"  # noqa: RUF001
    )


async def test_buttons(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    """Add buttons add their step; subtract never goes below 0."""
    await press(hass, "button.push_ups_add_10")
    await press(hass, "button.push_ups_add_5")
    assert state(hass, "number.push_ups_today") == "15"
    await press(hass, "button.push_ups_subtract")
    assert state(hass, "number.push_ups_today") == "14"

    await hass.services.async_call(
        "number",
        "set_value",
        {"entity_id": "number.push_ups_today", "value": 0},
        blocking=True,
    )
    await press(hass, "button.push_ups_subtract")
    assert state(hass, "number.push_ups_today") == "0"


async def test_set_number(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    """Setting the number sets today's value and updates the sensors."""
    await hass.services.async_call(
        "number",
        "set_value",
        {"entity_id": "number.push_ups_today", "value": 25},
        blocking=True,
    )
    assert state(hass, "number.push_ups_today") == "25"
    assert state(hass, "sensor.push_ups_progress") == "125.0"
    assert state(hass, "binary_sensor.push_ups_goal_reached_today") == "on"


async def test_set_number_rejects_fractions(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """A fraction is rejected instead of being cut to a whole number."""
    with pytest.raises(ServiceValidationError) as err:
        await hass.services.async_call(
            "number",
            "set_value",
            {"entity_id": "number.push_ups_today", "value": 12.5},
            blocking=True,
        )
    assert err.value.translation_key == "not_whole_number"
    assert err.value.translation_placeholders == {"value": "12.5"}
    assert state(hass, "number.push_ups_today") =="0"


@pytest.mark.parametrize(
    "options", [make_options(deficit_mode="catch_up")], ids=["catch_up"]
)
async def test_catch_up_target(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    hass_storage: dict[str, Any],
) -> None:
    """In catch-up mode the deficit is part of today's target."""
    hass_storage[STORE_KEY] = store_payload(
        {"2026-11-02": 20, "2026-11-03": 10}, {START: 20}
    )
    config_entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()
    target = hass.states.get("sensor.push_ups_today_s_target")
    assert target.state == "30"
    assert target.attributes["daily_target"] == 20
    assert target.attributes["deficit"] == 10


@pytest.mark.parametrize(
    "options", [make_options(end_date="2026-11-11")], ids=["end_date"]
)
async def test_remaining_sensor_follows_end_date(
    hass: HomeAssistant,
    loaded_entry: MockConfigEntry,
    entity_registry: er.EntityRegistry,
) -> None:
    """The end-date sensors exist only while an end date is set."""
    assert state(hass, "sensor.push_ups_remaining") == "200"
    # Nov 4 to Nov 11, today included; 200 still to do before today.
    assert state(hass, "sensor.push_ups_days_left") == "8"
    required = hass.states.get("sensor.push_ups_required_per_day")
    assert required.state == "25.0"
    assert required.attributes[ATTR_UNIT_OF_MEASUREMENT] == "repetitions/d"
    assert required.attributes["state_class"] == "measurement"
    assert (
        hass.states.get("sensor.push_ups_days_left").attributes[
            ATTR_UNIT_OF_MEASUREMENT
        ]
        == "d"
    )

    hass.config_entries.async_update_entry(
        loaded_entry, options={**loaded_entry.options, "end_date": None}
    )
    assert await hass.config_entries.async_reload(loaded_entry.entry_id)
    await hass.async_block_till_done()
    for key in ("remaining", "days_left", "required_per_day"):
        assert entity_registry.async_get(f"sensor.push_ups_{key}") is None
        assert hass.states.get(f"sensor.push_ups_{key}") is None


async def test_changed_steps_remove_orphaned_buttons(
    hass: HomeAssistant,
    loaded_entry: MockConfigEntry,
    entity_registry: er.EntityRegistry,
) -> None:
    """Buttons of removed steps are deleted from the entity registry."""
    hass.config_entries.async_update_entry(
        loaded_entry, options={**loaded_entry.options, "steps": [2, 5]}
    )
    assert await hass.config_entries.async_reload(loaded_entry.entry_id)
    await hass.async_block_till_done()

    buttons = {
        entry.entity_id
        for entry in er.async_entries_for_config_entry(entity_registry, "push_ups")
        if entry.domain == "button"
    }
    assert buttons == {
        "button.push_ups_add_2",
        "button.push_ups_add_5",
        "button.push_ups_subtract",
    }
    await press(hass, "button.push_ups_subtract")
    await press(hass, "button.push_ups_add_5")
    await press(hass, "button.push_ups_subtract")
    assert state(hass, "number.push_ups_today") == "3"


@pytest.mark.parametrize(
    "options", [make_options(end_date="2026-11-03")], ids=["ended"]
)
@pytest.mark.usefixtures("history")
async def test_ended_challenge(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """After the end date no values are accepted for new days."""
    assert state(hass, "binary_sensor.push_ups_goal_reached_today") == STATE_UNKNOWN
    assert state(hass, "sensor.push_ups_today_s_target") == STATE_UNKNOWN
    assert state(hass, "sensor.push_ups_progress") == STATE_UNKNOWN
    assert state(hass, "sensor.push_ups_total") == "45"
    assert state(hass, "sensor.push_ups_remaining") == "0"

    with pytest.raises(ServiceValidationError) as err:
        await press(hass, "button.push_ups_add_1")
    assert err.value.translation_key == "date_after_end"


async def test_start_in_future_after_time_travel(
    hass: HomeAssistant,
    loaded_entry: MockConfigEntry,
    freezer: FrozenDateTimeFactory,
) -> None:
    """A challenge whose start lies ahead accepts no values yet."""
    hass.config_entries.async_update_entry(
        loaded_entry, options={**loaded_entry.options, "start_date": "2026-11-10"}
    )
    assert await hass.config_entries.async_reload(loaded_entry.entry_id)
    await hass.async_block_till_done()
    assert state(hass, "sensor.push_ups_today_s_target") == STATE_UNKNOWN
    with pytest.raises(ServiceValidationError) as err:
        await press(hass, "button.push_ups_add_1")
    assert err.value.translation_key == "date_before_start"
