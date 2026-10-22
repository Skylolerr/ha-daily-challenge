"""Fixtures for Daily Challenge tests."""

from __future__ import annotations

from typing import Any

import pytest
from freezegun.api import FrozenDateTimeFactory
from homeassistant.components.lovelace import LovelaceData
from homeassistant.components.lovelace.const import LOVELACE_DATA, MODE_STORAGE
from homeassistant.components.lovelace.dashboard import LovelaceStorage
from homeassistant.components.lovelace.resources import ResourceStorageCollection
from homeassistant.const import CONF_ICON
from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.daily_challenge.const import (
    CONF_DAILY_TARGET,
    CONF_DEFICIT_MODE,
    CONF_END_DATE,
    CONF_START_DATE,
    CONF_STEPS,
    CONF_STREAK_RULE,
    CONF_UNIT,
    DOMAIN,
)

TIME_ZONE = "Europe/Zurich"
# A Wednesday, around noon local time.
NOW = "2026-11-04 12:00:00+01:00"
TODAY = "2026-11-04"
START = "2026-11-02"


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(
    enable_custom_integrations: None,
) -> None:
    """Enable loading of custom integrations in all tests."""


@pytest.fixture(autouse=True)
async def setup_environment(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> None:
    """Use the Swiss time zone, a fixed time and a minimal frontend.

    The real frontend needs the `home-assistant-frontend` package, so it is
    marked as loaded and Lovelace gets an empty resource collection in storage
    mode. HTTP is set up for real (the test plugin never binds a port).
    """
    await hass.config.async_set_time_zone(TIME_ZONE)
    freezer.move_to(NOW)
    hass.config.components.add("frontend")
    assert await async_setup_component(hass, "http", {})
    hass.data[LOVELACE_DATA] = LovelaceData(
        resource_mode=MODE_STORAGE,
        dashboards={},
        resources=ResourceStorageCollection(hass, LovelaceStorage(hass, None)),
        yaml_dashboards={},
    )


def make_options(**overrides: Any) -> dict[str, Any]:
    """Return config entry options with sensible defaults."""
    return {
        CONF_ICON: "mdi:arm-flex",
        CONF_UNIT: "repetitions",
        CONF_DAILY_TARGET: 20,
        CONF_START_DATE: START,
        CONF_END_DATE: None,
        CONF_STEPS: [1, 5, 10],
        CONF_STREAK_RULE: "target",
        CONF_DEFICIT_MODE: "display",
    } | overrides


@pytest.fixture
def options() -> dict[str, Any]:
    """Return the options of the default challenge."""
    return make_options()


@pytest.fixture
def config_entry(options: dict[str, Any]) -> MockConfigEntry:
    """Return the config entry of a challenge."""
    return MockConfigEntry(
        domain=DOMAIN,
        title="Push-ups",
        unique_id="0123456789abcdef",
        entry_id="push_ups",
        data={},
        options=options,
    )


@pytest.fixture
async def loaded_entry(
    hass: HomeAssistant, config_entry: MockConfigEntry
) -> MockConfigEntry:
    """Set up the challenge and return its entry."""
    config_entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()
    return config_entry
