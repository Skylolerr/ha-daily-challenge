"""Tests for automatic counting from a source sensor."""

from __future__ import annotations

from typing import Any

import pytest
from freezegun.api import FrozenDateTimeFactory
from homeassistant.const import STATE_UNAVAILABLE
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError

from custom_components.daily_challenge.const import DOMAIN, SAVE_DELAY

from .common import MockConfigEntry, WebSocketGenerator, async_fire_time_changed
from .conftest import START, TODAY, make_options
from .test_init import STORE_KEY, press

SOURCE = "sensor.steps"
TODAY_ENTITY = "number.push_ups_today"


async def setup_challenge(
    hass: HomeAssistant, mode: str, **overrides: Any
) -> MockConfigEntry:
    """Set up the default challenge fed by SOURCE."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Push-ups",
        unique_id="0123456789abcdef",
        entry_id="push_ups",
        data={},
        options=make_options(source_entity=SOURCE, source_mode=mode, **overrides),
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def set_source(hass: HomeAssistant, state: str) -> None:
    """Change the state of the source sensor."""
    hass.states.async_set(SOURCE, state)
    await hass.async_block_till_done()


def today_value(hass: HomeAssistant) -> str:
    """Return the state of today's number."""
    return hass.states.get(TODAY_ENTITY).state


def total(hass: HomeAssistant) -> str:
    """Return the total of the challenge."""
    return hass.states.get("sensor.push_ups_total").state


async def saved(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory, hass_storage: dict[str, Any]
) -> dict[str, Any]:
    """Let the delayed save run and return the stored data."""
    freezer.tick(SAVE_DELAY + 1)
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    return hass_storage[STORE_KEY]["data"]


async def test_daily_source_sets_today(hass: HomeAssistant) -> None:
    """A daily source sets today's value, rounded, from the start on."""
    hass.states.async_set(SOURCE, "1234.6")
    await setup_challenge(hass, "daily")
    assert total(hass) == "1235"

    await set_source(hass, "2000")
    assert total(hass) == "2000"
    # A lower value is taken as well: the source is the truth.
    await set_source(hass, "1500")
    assert total(hass) == "1500"


@pytest.mark.parametrize("state", [STATE_UNAVAILABLE, "unknown", "abc", "nan"])
async def test_daily_source_ignores_invalid_states(
    hass: HomeAssistant, state: str
) -> None:
    """States without a number keep the last value."""
    hass.states.async_set(SOURCE, "300")
    await setup_challenge(hass, "daily")
    await set_source(hass, state)
    assert total(hass) == "300"


@pytest.mark.parametrize(
    ("state", "expected"), [("2.5", "3"), ("0.5", "1"), ("2.49", "2")]
)
async def test_daily_source_rounds_half_up(
    hass: HomeAssistant, state: str, expected: str
) -> None:
    """Halves are rounded up, as people expect."""
    hass.states.async_set(SOURCE, state)
    await setup_challenge(hass, "daily")
    assert total(hass) == expected


async def test_counter_glitch_to_zero_is_not_a_reset(
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
    hass_storage: dict[str, Any],
) -> None:
    """A device that reports 0 for a moment does not add its whole reading."""
    hass.states.async_set(SOURCE, "12345")
    await setup_challenge(hass, "counter")
    await set_source(hass, "0")
    await set_source(hass, "12350")
    assert total(hass) == "5"
    data = await saved(hass, freezer, hass_storage)
    assert data["source"] == {"entity_id": SOURCE, "last": 12350.0, "carry": 0.0}
    # Back a little below the old reading: the higher one stays the base.
    await set_source(hass, "0")
    await set_source(hass, "12340")
    await set_source(hass, "12352")
    assert total(hass) == "7"


async def test_reading_on_the_last_day_after_midnight(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> None:
    """A reading right after the end, before the day rollover ran, is ignored."""
    hass.states.async_set(SOURCE, "100")
    await setup_challenge(hass, "counter", end_date="2026-11-04")
    await set_source(hass, "110")
    assert total(hass) == "10"
    # Midnight has passed, but its timer has not run yet.
    freezer.move_to("2026-11-05 00:00:01+01:00")
    await set_source(hass, "120")
    assert total(hass) == "10"


async def test_daily_source_is_capped(hass: HomeAssistant) -> None:
    """Values are kept within 0 and the maximum."""
    hass.states.async_set(SOURCE, "-5")
    await setup_challenge(hass, "daily")
    assert total(hass) == "0"
    await set_source(hass, "999999")
    assert total(hass) == "100000"


async def test_daily_source_blocks_manual_changes_of_today(
    hass: HomeAssistant, hass_ws_client: WebSocketGenerator
) -> None:
    """Buttons are unavailable; the number and actions reject today only."""
    hass.states.async_set(SOURCE, "10")
    entry = await setup_challenge(hass, "daily")
    # Today's value stays visible.
    assert today_value(hass) == "10"
    with pytest.raises(ServiceValidationError) as err:
        await hass.services.async_call(
            "number",
            "set_value",
            {"entity_id": TODAY_ENTITY, "value": 3},
            blocking=True,
        )
    assert err.value.translation_key == "today_from_source"
    assert hass.states.get("button.push_ups_add_5").state == STATE_UNAVAILABLE
    assert hass.states.get("button.push_ups_subtract").state == STATE_UNAVAILABLE

    with pytest.raises(ServiceValidationError) as err:
        await hass.services.async_call(
            DOMAIN,
            "add",
            {"config_entry_id": entry.entry_id, "amount": 5},
            blocking=True,
        )
    assert err.value.translation_key == "today_from_source"
    assert err.value.translation_placeholders["entity_id"] == SOURCE

    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": "daily_challenge/list"})
    response = await client.receive_json()
    assert response["result"]["challenges"][0]["today_from_source"] is True

    # Past days stay editable.
    await hass.services.async_call(
        DOMAIN,
        "set",
        {"config_entry_id": entry.entry_id, "value": 7, "date": START},
        blocking=True,
    )
    assert total(hass) == "17"


async def test_daily_source_only_while_running(hass: HomeAssistant) -> None:
    """Before the start nothing is counted."""
    hass.states.async_set(SOURCE, "10")
    await setup_challenge(hass, "daily", start_date="2026-12-01")
    assert total(hass) == "0"


async def test_counter_adds_increases_with_carry(
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
    hass_storage: dict[str, Any],
) -> None:
    """Increases are added; fractions are carried over to the next one."""
    hass.states.async_set(SOURCE, "100")
    await setup_challenge(hass, "counter")
    # The first reading is only the starting point.
    assert total(hass) == "0"
    assert today_value(hass) == "0"

    await set_source(hass, "100.4")
    await set_source(hass, "100.8")
    assert total(hass) == "0"
    await set_source(hass, "101.2")
    assert total(hass) == "1"
    data = await saved(hass, freezer, hass_storage)
    assert data["source"] == {"entity_id": SOURCE, "last": 101.2, "carry": 0.2}

    # A small drop is ignored and keeps the higher reading.
    await set_source(hass, "101.0")
    await set_source(hass, "102.0")
    assert total(hass) == "2"

    # A big drop waits for the next reading: still low, so the counter was
    # reset and counts from 0.
    await set_source(hass, "5.0")
    assert total(hass) == "2"
    await set_source(hass, "6.0")
    assert total(hass) == "8"


async def test_counter_keeps_buttons(hass: HomeAssistant) -> None:
    """Manual entries still work with a counter source."""
    hass.states.async_set(SOURCE, "50")
    await setup_challenge(hass, "counter")
    await press(hass, "button.push_ups_add_5")
    await set_source(hass, "53")
    assert total(hass) == "8"


async def test_counter_resumes_after_restart(
    hass: HomeAssistant, hass_storage: dict[str, Any]
) -> None:
    """What was added while Home Assistant was off counts on the next start."""
    hass_storage[STORE_KEY] = {
        "version": 1,
        "minor_version": 2,
        "key": STORE_KEY,
        "data": {
            "days": {},
            "target_history": {START: 20},
            "source": {"entity_id": SOURCE, "last": 100.0, "carry": 0.5},
        },
    }
    hass.states.async_set(SOURCE, "110")
    await setup_challenge(hass, "counter")
    assert total(hass) == "10"


async def test_counter_starts_afresh_for_another_entity(
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
    hass_storage: dict[str, Any],
) -> None:
    """A stored reading of another entity is not used."""
    hass_storage[STORE_KEY] = {
        "version": 1,
        "minor_version": 2,
        "key": STORE_KEY,
        "data": {
            "days": {},
            "target_history": {START: 20},
            "source": {"entity_id": "sensor.old", "last": 5.0, "carry": 0.0},
        },
    }
    hass.states.async_set(SOURCE, "110")
    await setup_challenge(hass, "counter")
    assert total(hass) == "0"
    data = await saved(hass, freezer, hass_storage)
    assert data["source"] == {"entity_id": SOURCE, "last": 110.0, "carry": 0.0}


async def test_daily_mode_drops_a_stored_counter_reading(
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
    hass_storage: dict[str, Any],
) -> None:
    """Switching to a daily source forgets the counter."""
    hass_storage[STORE_KEY] = {
        "version": 1,
        "minor_version": 2,
        "key": STORE_KEY,
        "data": {
            "days": {},
            "target_history": {START: 20},
            "source": {"entity_id": SOURCE, "last": 5.0, "carry": 0.0},
        },
    }
    hass.states.async_set(SOURCE, "12")
    await setup_challenge(hass, "daily")
    data = await saved(hass, freezer, hass_storage)
    assert data["source"] is None
    assert data["days"] == {TODAY: 12}


async def test_counter_only_while_running(
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
    hass_storage: dict[str, Any],
) -> None:
    """After the end the reading moves on, but nothing is added."""
    hass.states.async_set(SOURCE, "100")
    await setup_challenge(
        hass, "counter", start_date="2026-10-01", end_date="2026-11-01"
    )
    await set_source(hass, "150")
    assert total(hass) == "0"
    data = await saved(hass, freezer, hass_storage)
    assert data["source"] == {"entity_id": SOURCE, "last": 150.0, "carry": 0.0}


async def test_counter_without_increase_keeps_the_carry(
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
    hass_storage: dict[str, Any],
) -> None:
    """The same reading again adds nothing and keeps the fraction."""
    hass.states.async_set(SOURCE, "10")
    await setup_challenge(hass, "counter")
    await set_source(hass, "10.5")
    hass.states.async_set(SOURCE, "10.5", {"changed": True})
    await hass.async_block_till_done()
    data = await saved(hass, freezer, hass_storage)
    assert data["source"]["carry"] == 0.5
    assert total(hass) == "0"


async def test_old_store_is_migrated(
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
    hass_storage: dict[str, Any],
) -> None:
    """A store of minor version 1 keeps all data and gets an empty source."""
    hass_storage[STORE_KEY] = {
        "version": 1,
        "minor_version": 1,
        "key": STORE_KEY,
        "data": {"days": {START: 15}, "target_history": {START: 20}},
    }
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Push-ups",
        unique_id="0123456789abcdef",
        entry_id="push_ups",
        data={},
        options=make_options(),
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await press(hass, "button.push_ups_add_5")
    data = await saved(hass, freezer, hass_storage)
    assert hass_storage[STORE_KEY]["minor_version"] == 2
    assert data == {
        "days": {START: 15, TODAY: 5},
        "target_history": {START: 20},
        "source": None,
    }


async def test_counter_glitch_with_several_zero_readings(hass: HomeAssistant) -> None:
    """Several 0 readings in a row are still a glitch until the counter rises."""
    hass.states.async_set(SOURCE, "12345")
    await setup_challenge(hass, "counter")
    await set_source(hass, "0")
    hass.states.async_set(SOURCE, "0", {"again": True})
    await hass.async_block_till_done()
    await set_source(hass, "0.0")
    await set_source(hass, "12350")
    assert total(hass) == "5"


async def test_counter_real_reset_counts_from_zero(hass: HomeAssistant) -> None:
    """After a real reset the counter rises from 0 and every rise counts."""
    hass.states.async_set(SOURCE, "500")
    await setup_challenge(hass, "counter")
    await set_source(hass, "0")
    await set_source(hass, "0")
    await set_source(hass, "3")
    await set_source(hass, "10")
    assert total(hass) == "10"
