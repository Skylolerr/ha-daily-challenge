"""Edge cases across midnight, restarts and option changes."""

from __future__ import annotations

from datetime import timedelta
from typing import Any
from unittest.mock import patch

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError

from custom_components.daily_challenge.const import DOMAIN

from .common import MockConfigEntry, async_fire_time_changed
from .conftest import make_options
from .test_init import STORE_KEY, store_payload
from .test_milestone_event import setup_challenge

SOURCE = "sensor.steps"


async def setup_source(hass: HomeAssistant, mode: str) -> MockConfigEntry:
    """Set up the default challenge fed by SOURCE."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Push-ups",
        unique_id="0123456789abcdef",
        entry_id="push_ups",
        data={},
        options=make_options(source_entity=SOURCE, source_mode=mode),
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def next_day(hass: HomeAssistant, freezer: FrozenDateTimeFactory) -> None:
    """Move to 00:01 of the next day and let the day rollover run."""
    freezer.move_to("2026-11-05 00:01:00+01:00")
    async_fire_time_changed(hass)
    await hass.async_block_till_done()


def today_value(hass: HomeAssistant) -> str:
    """Return today's value."""
    return hass.states.get("number.push_ups_today").state


async def test_daily_source_ignores_yesterdays_reading_after_midnight(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> None:
    """A step counter that resets a few minutes after midnight.

    Until it resets, it still shows yesterday's steps. An attribute update in
    that time must not copy them into the new day.
    """
    hass.states.async_set(SOURCE, "5000")
    await setup_source(hass, "daily")
    assert today_value(hass) == "5000"

    await next_day(hass, freezer)
    assert today_value(hass) == "0"
    # Same state, new attributes: the state machine reports a change.
    hass.states.async_set(SOURCE, "5000", {"battery": 80})
    await hass.async_block_till_done()
    assert today_value(hass) == "0"

    # The reset and the first steps of the new day are taken.
    hass.states.async_set(SOURCE, "0")
    hass.states.async_set(SOURCE, "120")
    await hass.async_block_till_done()
    assert today_value(hass) == "120"


async def test_daily_source_restored_after_a_restart_over_midnight(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> None:
    """A source that restores yesterday's amount with a new time stamp."""
    hass.states.async_set(SOURCE, "30")
    entry = await setup_source(hass, "daily")
    assert today_value(hass) == "30"
    assert await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()

    # Home Assistant was off over midnight; the source restores "30".
    freezer.move_to("2026-11-05 08:00:00+01:00")
    hass.states.async_remove(SOURCE)
    hass.states.async_set(SOURCE, "30")
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert today_value(hass) == "0"
    assert hass.states.get("sensor.push_ups_total").state == "30"

    # Real steps of the new day are taken.
    hass.states.async_set(SOURCE, "0")
    hass.states.async_set(SOURCE, "45")
    await hass.async_block_till_done()
    assert today_value(hass) == "45"


async def test_no_reading_after_unload(
    hass: HomeAssistant, hass_storage: dict[str, Any]
) -> None:
    """Unloading stops the source before the final save."""
    hass.states.async_set(SOURCE, "100")
    entry = await setup_source(hass, "counter")
    assert await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()
    saved = hass_storage[STORE_KEY]["data"]["source"]
    hass.states.async_set(SOURCE, "200")
    await hass.async_block_till_done()
    assert hass_storage[STORE_KEY]["data"]["source"] == saved
    assert saved["last"] == 100.0


async def test_restored_event_type_of_a_disabled_kind(
    hass: HomeAssistant, hass_storage: dict[str, Any]
) -> None:
    """Switching off the kind of the last milestone keeps the entity working."""
    entry = await setup_challenge(hass, hass_storage, {"2026-10-29": 95})
    await hass.services.async_call(
        "button", "press", {"entity_id": "button.push_ups_add_5"}, blocking=True
    )
    assert (
        hass.states.get("event.push_ups_milestone").attributes["event_type"] == "total"
    )
    hass.config_entries.async_update_entry(
        entry, options={**entry.options, "milestones": ["streak"]}
    )
    await hass.async_block_till_done()
    state = hass.states.get("event.push_ups_milestone")
    assert state is not None
    assert state.attributes["event_types"] == ["streak"]


async def test_counter_source_across_midnight(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory, hass_storage: dict[str, Any]
) -> None:
    """Increases after midnight count for the new day."""
    hass.states.async_set(SOURCE, "100")
    await setup_source(hass, "counter")
    hass.states.async_set(SOURCE, "110")
    await hass.async_block_till_done()
    await next_day(hass, freezer)
    hass.states.async_set(SOURCE, "115")
    await hass.async_block_till_done()
    assert today_value(hass) == "5"
    assert hass.states.get("sensor.push_ups_total").state == "15"


async def test_old_store_without_target_history_key(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory, hass_storage: dict[str, Any]
) -> None:
    """A store written by v0.1 keeps its days through the migration."""
    hass_storage[STORE_KEY] = store_payload({"2026-11-02": 30, "2026-11-03": 0}, {})
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
    assert hass.states.get("sensor.push_ups_total").state == "30"
    freezer.tick(timedelta(seconds=5))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert hass_storage[STORE_KEY]["data"]["days"] == {"2026-11-02": 30}


async def test_rejected_reading_does_not_break_the_listener(
    hass: HomeAssistant,
) -> None:
    """If a reading cannot be recorded, it is skipped and the next one counts."""
    hass.states.async_set(SOURCE, "10")
    entry = await setup_source(hass, "daily")
    coordinator = entry.runtime_data
    original = coordinator.async_set_value
    with patch.object(
        coordinator,
        "async_set_value",
        side_effect=ServiceValidationError(
            translation_domain=DOMAIN, translation_key="x"
        ),
    ):
        hass.states.async_set(SOURCE, "20")
        await hass.async_block_till_done()
    assert today_value(hass) == "10"
    assert coordinator.async_set_value == original
    hass.states.async_set(SOURCE, "30")
    await hass.async_block_till_done()
    assert today_value(hass) == "30"
