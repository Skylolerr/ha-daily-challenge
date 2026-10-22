"""Tests for diagnostics."""

from __future__ import annotations

from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.daily_challenge.diagnostics import (
    async_get_config_entry_diagnostics,
)

from .conftest import START, TODAY


async def test_diagnostics(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    """Diagnostics contain options, recorded days and current figures."""
    await hass.services.async_call(
        "daily_challenge",
        "set",
        {"config_entry_id": "push_ups", "value": 25, "date": START},
        blocking=True,
    )
    await hass.services.async_call(
        "daily_challenge",
        "set",
        {"config_entry_id": "push_ups", "value": 5},
        blocking=True,
    )
    result = await async_get_config_entry_diagnostics(hass, loaded_entry)

    assert result["options"] == dict(loaded_entry.options)
    assert result["today"] == TODAY
    assert result["recorded_days"] == 2
    assert result["first_date"] == START
    assert result["last_date"] == TODAY
    assert result["target_history"] == {START: 20}
    stats = result["stats"]
    assert stats["total"] == 30
    assert stats["status"] == "active"
    assert stats["best_day_date"] == START
    assert stats["best_streak"] == {"length": 1, "start": START, "end": START}


async def test_diagnostics_without_data(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """Diagnostics work for a challenge without recorded days."""
    result = await async_get_config_entry_diagnostics(hass, loaded_entry)
    assert result["recorded_days"] == 0
    assert result["first_date"] is None
    assert result["last_date"] is None
