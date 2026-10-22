"""Tests for the WebSocket commands used by the card."""

from __future__ import annotations

from typing import Any

import pytest
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.typing import WebSocketGenerator

from custom_components.daily_challenge.const import DOMAIN

from .conftest import START, TODAY, make_options


async def send(
    hass_ws_client: WebSocketGenerator, hass: HomeAssistant, **msg: Any
) -> dict[str, Any]:
    """Send one command and return the response."""
    client = await hass_ws_client(hass)
    await client.send_json_auto_id(msg)
    return await client.receive_json()


@pytest.mark.usefixtures("loaded_entry")
async def test_list(hass: HomeAssistant, hass_ws_client: WebSocketGenerator) -> None:
    """All challenges are listed with their entity IDs."""
    MockConfigEntry(
        domain=DOMAIN,
        title="Squats",
        entry_id="squats",
        options=make_options(icon="mdi:human", unit="reps"),
    ).add_to_hass(hass)

    response = await send(hass_ws_client, hass, type="daily_challenge/list")
    assert response["success"]
    push_ups, squats = response["result"]["challenges"]
    assert push_ups["entry_id"] == "push_ups"
    assert push_ups["name"] == "Push-ups"
    assert push_ups["icon"] == "mdi:arm-flex"
    assert push_ups["unit"] == "repetitions"
    entities = push_ups["entities"]
    assert entities["today"] == "number.push_ups_today"
    assert entities["total"] == "sensor.push_ups_total"
    assert entities["add_5"] == "button.push_ups_add_5"
    assert entities["subtract"] == "button.push_ups_subtract"
    assert entities["goal_reached_today"] == "binary_sensor.push_ups_goal_reached_today"
    # 1 number, 4 buttons, 12 sensors (no end date), 1 binary sensor
    assert len(entities) == 18
    # Not set up yet, so no entities are registered.
    assert squats == {
        "entry_id": "squats",
        "name": "Squats",
        "icon": "mdi:human",
        "unit": "reps",
        "entities": {},
    }


@pytest.mark.usefixtures("loaded_entry")
async def test_history(hass: HomeAssistant, hass_ws_client: WebSocketGenerator) -> None:
    """The history has the same shape as the get_history action."""
    await hass.services.async_call(
        DOMAIN,
        "set",
        {"config_entry_id": "push_ups", "value": 20, "date": START},
        blocking=True,
    )
    response = await send(
        hass_ws_client, hass, type="daily_challenge/history", entry_id="push_ups"
    )
    assert response["success"]
    assert response["result"] == {
        "days": {START: 20},
        "targets": {START: 20, "2026-11-03": 20, TODAY: 20},
        "fulfilled": {START: True, "2026-11-03": False, TODAY: False},
    }

    response = await send(
        hass_ws_client,
        hass,
        type="daily_challenge/history",
        entry_id="push_ups",
        start=TODAY,
        end=TODAY,
    )
    assert response["result"]["targets"] == {TODAY: 20}


@pytest.mark.usefixtures("loaded_entry")
async def test_set_day(hass: HomeAssistant, hass_ws_client: WebSocketGenerator) -> None:
    """Past days can be edited; the entities follow."""
    response = await send(
        hass_ws_client,
        hass,
        type="daily_challenge/set_day",
        entry_id="push_ups",
        date="2026-11-03",
        value=12,
    )
    assert response["success"]
    assert response["result"] == {"date": "2026-11-03", "value": 12}
    assert hass.states.get("sensor.push_ups_total").state == "12"


@pytest.mark.usefixtures("loaded_entry")
@pytest.mark.parametrize(
    ("msg", "translation_key"),
    [
        (
            {"type": "daily_challenge/set_day", "date": "2026-11-05", "value": 1},
            "date_in_future",
        ),
        (
            {"type": "daily_challenge/set_day", "date": "2026-11-01", "value": 1},
            "date_before_start",
        ),
        (
            {
                "type": "daily_challenge/set_day",
                "entry_id": "unknown",
                "date": TODAY,
                "value": 1,
            },
            "entry_not_found",
        ),
        (
            {"type": "daily_challenge/history", "start": TODAY, "end": START},
            "invalid_range",
        ),
    ],
)
async def test_errors(
    hass: HomeAssistant,
    hass_ws_client: WebSocketGenerator,
    msg: dict[str, Any],
    translation_key: str,
) -> None:
    """Invalid requests return translated errors."""
    response = await send(hass_ws_client, hass, **{"entry_id": "push_ups", **msg})
    assert not response["success"]
    assert response["error"]["translation_domain"] == DOMAIN
    assert response["error"]["translation_key"] == translation_key


@pytest.mark.usefixtures("loaded_entry")
async def test_negative_value_is_rejected(
    hass: HomeAssistant, hass_ws_client: WebSocketGenerator
) -> None:
    """Values below 0 fail schema validation."""
    response = await send(
        hass_ws_client,
        hass,
        type="daily_challenge/set_day",
        entry_id="push_ups",
        date=TODAY,
        value=-1,
    )
    assert not response["success"]
    assert response["error"]["code"] == "invalid_format"
