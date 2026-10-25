"""Tests for the actions."""

from __future__ import annotations

from typing import Any

import probatio
import pytest
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.daily_challenge.const import DOMAIN

from .conftest import START, TODAY


async def call(hass: HomeAssistant, service: str, **data: Any) -> dict[str, Any] | None:
    """Call an action of the integration for the default challenge."""
    data.setdefault("config_entry_id", "push_ups")
    return await hass.services.async_call(
        DOMAIN,
        service,
        data,
        blocking=True,
        return_response=service == "get_history",
    )


def today_value(hass: HomeAssistant) -> str:
    """Return today's value of the default challenge."""
    return hass.states.get("number.push_ups_today").state


@pytest.mark.usefixtures("loaded_entry")
async def test_add(hass: HomeAssistant) -> None:
    """Amounts are added to today or a given day and never drop below 0."""
    await call(hass, "add", amount=7)
    assert today_value(hass) == "7"
    await call(hass, "add", amount=-10)
    assert today_value(hass) == "0"

    await call(hass, "add", amount=20, date="2026-11-03")
    await call(hass, "add", amount=5, date="2026-11-03")
    assert hass.states.get("sensor.push_ups_total").state == "25"


@pytest.mark.usefixtures("loaded_entry")
async def test_set(hass: HomeAssistant) -> None:
    """Values are set; 0 removes the day."""
    await call(hass, "set", value=12)
    assert today_value(hass) == "12"
    await call(hass, "set", value=30, date=START)
    response = await call(hass, "get_history")
    assert response["days"] == {START: 30, TODAY: 12}

    await call(hass, "set", value=0, date=START)
    response = await call(hass, "get_history")
    assert response["days"] == {TODAY: 12}


@pytest.mark.usefixtures("loaded_entry")
async def test_get_history(hass: HomeAssistant) -> None:
    """The history contains values, targets and fulfilment."""
    await call(hass, "set", value=20, date=START)
    await call(hass, "set", value=5, date="2026-11-03")

    response = await call(hass, "get_history")
    assert response == {
        "days": {START: 20, "2026-11-03": 5},
        "targets": {START: 20, "2026-11-03": 20, TODAY: 20},
        "fulfilled": {START: True, "2026-11-03": False, TODAY: False},
    }

    response = await call(hass, "get_history", start="2026-11-03", end="2026-11-03")
    assert response == {
        "days": {"2026-11-03": 5},
        "targets": {"2026-11-03": 20},
        "fulfilled": {"2026-11-03": False},
    }


@pytest.mark.usefixtures("loaded_entry")
@pytest.mark.parametrize(
    ("service", "data", "translation_key"),
    [
        ("add", {"amount": 1, "date": "2026-11-05"}, "date_in_future"),
        ("set", {"value": 1, "date": "2026-11-01"}, "date_before_start"),
        ("add", {"amount": 1, "config_entry_id": "unknown"}, "entry_not_found"),
        (
            "get_history",
            {"start": "2026-11-04", "end": "2026-11-02"},
            "invalid_range",
        ),
    ],
)
async def test_validation_errors(
    hass: HomeAssistant,
    service: str,
    data: dict[str, Any],
    translation_key: str,
) -> None:
    """Invalid calls raise translated validation errors."""
    with pytest.raises(ServiceValidationError) as err:
        await call(hass, service, **data)
    assert err.value.translation_domain == DOMAIN
    assert err.value.translation_key == translation_key


async def test_date_after_end(
    hass: HomeAssistant, config_entry: MockConfigEntry
) -> None:
    """Days after the end date are rejected."""
    config_entry.add_to_hass(hass)
    hass.config_entries.async_update_entry(
        config_entry, options={**config_entry.options, "end_date": "2026-11-03"}
    )
    assert await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()
    with pytest.raises(ServiceValidationError) as err:
        await call(hass, "set", value=1)
    assert err.value.translation_key == "date_after_end"
    # Past days stay editable.
    await call(hass, "set", value=1, date="2026-11-03")


async def test_entry_not_loaded(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """Unloaded challenges cannot be changed."""
    assert await hass.config_entries.async_unload(loaded_entry.entry_id)
    with pytest.raises(ServiceValidationError) as err:
        await call(hass, "add", amount=1)
    assert err.value.translation_key == "entry_not_loaded"


async def test_wrong_domain(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    """Config entries of other integrations are rejected."""
    other = MockConfigEntry(domain="other", entry_id="other")
    other.add_to_hass(hass)
    with pytest.raises(ServiceValidationError) as err:
        await call(hass, "add", amount=1, config_entry_id="other")
    assert err.value.translation_key == "entry_not_found"


@pytest.mark.usefixtures("loaded_entry")
async def test_negative_value_is_rejected(hass: HomeAssistant) -> None:
    """The set action only accepts values >= 0."""
    with pytest.raises(probatio.Invalid):
        await call(hass, "set", value=-1)


@pytest.mark.usefixtures("loaded_entry")
@pytest.mark.parametrize(
    ("service", "data"),
    [
        ("set", {"value": 100001}),
        ("set", {"value": 2.5}),
        ("add", {"amount": 2.5}),
        ("add", {"amount": "abc"}),
        ("add", {"amount": 100001}),
        ("set", {"value": True}),
        ("add", {"amount": False}),
    ],
)
async def test_invalid_numbers_are_rejected(
    hass: HomeAssistant, service: str, data: dict[str, Any]
) -> None:
    """Values must be whole numbers within the limits; nothing is cut off."""
    with pytest.raises(probatio.Invalid):
        await call(hass, service, **data)


@pytest.mark.usefixtures("loaded_entry")
async def test_add_stops_at_the_maximum(hass: HomeAssistant) -> None:
    """Adding never goes beyond the maximum day value."""
    await call(hass, "set", value=99995)
    await call(hass, "add", amount=10)
    assert today_value(hass) == "100000"
    await call(hass, "add", amount="3.0")
    assert today_value(hass) == "100000"
