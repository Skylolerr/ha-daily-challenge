"""Tests for the repair issues of a source sensor."""

from __future__ import annotations

from datetime import timedelta
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.components.repairs import DOMAIN as REPAIRS_DOMAIN
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED
from homeassistant.core import CoreState, HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import issue_registry as ir
from homeassistant.setup import async_setup_component

from custom_components.daily_challenge.const import DOMAIN

from .common import ClientSessionGenerator, MockConfigEntry, async_fire_time_changed
from .conftest import make_options

SOURCE = "sensor.steps_today"
MISSING = "source_missing_push_ups"
UNAVAILABLE = "source_unavailable_push_ups"


async def setup(hass: HomeAssistant, **overrides: Any) -> MockConfigEntry:
    """Set up the challenge with a daily source."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Push-ups",
        unique_id="0123456789abcdef",
        entry_id="push_ups",
        data={},
        options=make_options(source_entity=SOURCE, **overrides),
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


def issues(hass: HomeAssistant) -> set[str]:
    """Return the IDs of the open issues of the integration."""
    return {
        issue_id for (domain, issue_id) in ir.async_get(hass).issues if domain == DOMAIN
    }


async def test_missing_source(hass: HomeAssistant) -> None:
    """A source that does not exist gets an issue; it goes when it appears."""
    await setup(hass)
    assert issues(hass) == {MISSING}
    issue = ir.async_get(hass).async_get_issue(DOMAIN, MISSING)
    assert issue.translation_placeholders == {"name": "Push-ups", "entity_id": SOURCE}
    assert issue.is_fixable

    hass.states.async_set(SOURCE, "5")
    await hass.async_block_till_done()
    assert issues(hass) == set()


async def test_registered_but_not_loaded_source_is_not_missing(
    hass: HomeAssistant,
) -> None:
    """An entity in the registry without a state (e.g. disabled) is no issue."""
    er.async_get(hass).async_get_or_create(
        "sensor", "test", "steps", suggested_object_id="steps_today"
    )
    await setup(hass)
    assert issues(hass) == set()


async def test_removed_source(hass: HomeAssistant) -> None:
    """A source removed while running gets an issue."""
    hass.states.async_set(SOURCE, "5")
    await setup(hass)
    assert issues(hass) == set()
    hass.states.async_remove(SOURCE)
    await hass.async_block_till_done()
    assert issues(hass) == {MISSING}


async def test_unavailable_for_twelve_hours(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> None:
    """Twelve hours without a value create an issue; a value removes it."""
    hass.states.async_set(SOURCE, "5")
    await setup(hass)
    hass.states.async_set(SOURCE, "unavailable")
    await hass.async_block_till_done()
    freezer.tick(timedelta(hours=11))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert issues(hass) == set()
    hass.states.async_set(SOURCE, "unknown")
    freezer.tick(timedelta(hours=1, seconds=1))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert issues(hass) == {UNAVAILABLE}

    hass.states.async_set(SOURCE, "7")
    await hass.async_block_till_done()
    assert issues(hass) == set()


async def test_short_outage_is_no_issue(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> None:
    """A source that comes back in time never gets an issue."""
    hass.states.async_set(SOURCE, "unavailable")
    await setup(hass)
    freezer.tick(timedelta(hours=2))
    hass.states.async_set(SOURCE, "3")
    await hass.async_block_till_done()
    freezer.tick(timedelta(hours=12))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert issues(hass) == set()


async def test_checked_only_after_start(hass: HomeAssistant) -> None:
    """While Home Assistant starts, a missing source is not reported yet."""
    hass.set_state(CoreState.starting)
    await setup(hass)
    assert issues(hass) == set()
    hass.bus.async_fire(EVENT_HOMEASSISTANT_STARTED)
    await hass.async_block_till_done()
    assert issues(hass) == {MISSING}


async def test_unload_before_start_stops_waiting(hass: HomeAssistant) -> None:
    """An unloaded challenge does not check its source at start."""
    hass.set_state(CoreState.starting)
    entry = await setup(hass)
    await hass.config_entries.async_unload(entry.entry_id)
    hass.bus.async_fire(EVENT_HOMEASSISTANT_STARTED)
    await hass.async_block_till_done()
    assert issues(hass) == set()


async def test_issues_go_with_the_source_and_the_challenge(
    hass: HomeAssistant,
) -> None:
    """Switching the source off or removing the challenge clears its issues."""
    entry = await setup(hass)
    assert issues(hass) == {MISSING}
    hass.config_entries.async_update_entry(
        entry, options={**entry.options, "source_entity": None}
    )
    await hass.async_block_till_done()
    assert issues(hass) == set()

    hass.config_entries.async_update_entry(
        entry, options={**entry.options, "source_entity": SOURCE}
    )
    await hass.async_block_till_done()
    assert issues(hass) == {MISSING}
    await hass.config_entries.async_remove(entry.entry_id)
    await hass.async_block_till_done()
    assert issues(hass) == set()


async def start_fix(hass: HomeAssistant, client: Any, issue_id: str) -> dict[str, Any]:
    """Start the fix flow of an issue."""
    response = await client.post(
        "/api/repairs/issues/fix", json={"handler": DOMAIN, "issue_id": issue_id}
    )
    assert response.status == 200
    return await response.json()


async def configure(client: Any, flow_id: str, data: dict[str, Any]) -> dict[str, Any]:
    """Submit a step of a fix flow."""
    response = await client.post(f"/api/repairs/issues/fix/{flow_id}", json=data)
    assert response.status == 200
    return await response.json()


async def test_fix_with_another_source(
    hass: HomeAssistant, hass_client: ClientSessionGenerator
) -> None:
    """The fix flow sets another source and the challenge reloads."""
    assert await async_setup_component(hass, REPAIRS_DOMAIN, {})
    entry = await setup(hass)
    hass.states.async_set("sensor.steps_phone", "1234")
    client = await hass_client()
    flow = await start_fix(hass, client, MISSING)
    assert flow["step_id"] == "source"
    assert flow["description_placeholders"] == {"name": "Push-ups", "entity_id": SOURCE}

    # A challenge entity is refused.
    result = await configure(
        client, flow["flow_id"], {"source_entity": "number.push_ups_today"}
    )
    assert result["errors"] == {"base": "source_is_challenge"}

    result = await configure(
        client, flow["flow_id"], {"source_entity": "sensor.steps_phone"}
    )
    assert result["type"] == "create_entry"
    await hass.async_block_till_done()
    assert entry.options["source_entity"] == "sensor.steps_phone"
    assert issues(hass) == set()
    assert hass.states.get("number.push_ups_today").state == "1234"


async def test_fix_by_switching_counting_off(
    hass: HomeAssistant, hass_client: ClientSessionGenerator
) -> None:
    """An empty field switches automatic counting off."""
    assert await async_setup_component(hass, REPAIRS_DOMAIN, {})
    entry = await setup(hass)
    client = await hass_client()
    flow = await start_fix(hass, client, MISSING)
    result = await configure(client, flow["flow_id"], {})
    assert result["type"] == "create_entry"
    await hass.async_block_till_done()
    assert entry.options["source_entity"] is None
    assert issues(hass) == set()


async def test_fix_for_a_removed_challenge(
    hass: HomeAssistant, hass_client: ClientSessionGenerator
) -> None:
    """An issue of a challenge that is gone is closed by its flow."""
    assert await async_setup_component(hass, REPAIRS_DOMAIN, {})
    hass.states.async_set(SOURCE, "1")
    await setup(hass)  # the integration itself is loaded
    ir.async_create_issue(
        hass,
        DOMAIN,
        "source_missing_gone",
        is_fixable=True,
        severity=ir.IssueSeverity.WARNING,
        translation_key="source_missing",
        translation_placeholders={"name": "Gone", "entity_id": SOURCE},
        data={"entry_id": "gone"},
    )
    client = await hass_client()
    flow = await start_fix(hass, client, "source_missing_gone")
    assert flow["type"] == "abort"
    assert flow["reason"] == "entry_removed"
    assert issues(hass) == set()
