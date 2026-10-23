"""Tests for the config and options flow."""

from __future__ import annotations

from typing import Any

import pytest
from homeassistant.config_entries import SOURCE_USER
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType, InvalidData
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.daily_challenge.const import DOMAIN

from .conftest import START, TODAY, make_options
from .test_init import STORE_KEY, store_payload

USER_INPUT: dict[str, Any] = {
    "name": "Push-ups",
    "icon": "mdi:arm-flex",
    "unit": "repetitions",
    "daily_target": 20,
    "start_date": START,
    "steps": ["1", "5", "10"],
    "streak_rule": "target",
    "deficit_mode": "display",
}


async def test_create_challenge(hass: HomeAssistant) -> None:
    """A valid form creates a challenge with a generated unique ID."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {}

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {**USER_INPUT, "name": "  Push-ups  ", "daily_target": 20.0}
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "Push-ups"
    assert result["data"] == {}
    assert result["options"] == make_options(icon="mdi:arm-flex")
    entry = result["result"]
    assert len(entry.unique_id) == 32
    await hass.async_block_till_done()
    assert hass.states.get("number.push_ups_today") is not None


async def test_defaults(hass: HomeAssistant) -> None:
    """The form suggests today's date and the default target and steps."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    defaults = {
        str(key): key.default()
        for key in result["data_schema"].schema
        if callable(key.default)
    }
    assert defaults["start_date"] == TODAY
    assert defaults["daily_target"] == 20
    assert defaults["steps"] == ["1", "5", "10"]
    assert defaults["icon"] == "mdi:trophy"
    assert defaults["unit"] == "repetitions"
    assert defaults["streak_rule"] == "target"
    assert defaults["deficit_mode"] == "display"


async def test_unit_suggestions_follow_language(hass: HomeAssistant) -> None:
    """German installations get German unit suggestions."""
    hass.config.language = "de"
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    unit_key = next(k for k in result["data_schema"].schema if str(k) == "unit")
    assert unit_key.default() == "Wiederholungen"


@pytest.mark.parametrize(
    ("user_input", "errors"),
    [
        ({"name": "  "}, {"name": "name_required"}),
        ({"unit": " "}, {"unit": "unit_required"}),
        ({"daily_target": 1.5}, {"daily_target": "invalid_target"}),
        ({"start_date": "2026-11-05"}, {"start_date": "start_in_future"}),
        ({"end_date": START}, {"end_date": "end_before_start"}),
        ({"steps": ["1", "2", "3", "4"]}, {"steps": "invalid_steps"}),
        ({"steps": []}, {"steps": "invalid_steps"}),
        ({"steps": ["0"]}, {"steps": "invalid_steps"}),
        ({"steps": ["2.5"]}, {"steps": "invalid_steps"}),
        ({"steps": ["abc"]}, {"steps": "invalid_steps"}),
        ({"steps": ["5", "1"]}, {"steps": "steps_not_ascending"}),
        ({"steps": ["5", "5"]}, {"steps": "steps_not_ascending"}),
    ],
)
async def test_validation_errors(
    hass: HomeAssistant, user_input: dict[str, Any], errors: dict[str, str]
) -> None:
    """Invalid input shows errors and keeps the entered values."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {**USER_INPUT, **user_input}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == errors

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], USER_INPUT
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY


async def test_steps_accept_blank_fields_and_single_value(hass: HomeAssistant) -> None:
    """Empty step fields are ignored."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {**USER_INPUT, "steps": ["", "3", ""], "end_date": "2026-12-31"},
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["options"]["steps"] == [3]
    assert result["options"]["end_date"] == "2026-12-31"


async def test_name_must_be_unique(
    hass: HomeAssistant, config_entry: MockConfigEntry
) -> None:
    """Names are compared case-insensitively."""
    config_entry.add_to_hass(hass)
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {**USER_INPUT, "name": "PUSH-UPS"}
    )
    assert result["errors"] == {"name": "name_exists"}


async def test_options_flow(
    hass: HomeAssistant,
    loaded_entry: MockConfigEntry,
    hass_storage: dict[str, Any],
) -> None:
    """Options can be changed; a new target applies from today on."""
    result = await hass.config_entries.options.async_init(loaded_entry.entry_id)
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "init"

    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {**USER_INPUT, "name": "Pushups", "daily_target": 30, "steps": ["2"]},
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()

    assert loaded_entry.title == "Pushups"
    assert loaded_entry.options["daily_target"] == 30
    assert loaded_entry.options["steps"] == [2]
    assert hass_storage[STORE_KEY]["data"]["target_history"] == {START: 20, TODAY: 30}
    # Reloaded with the new target: 20 + 20 + 30
    assert hass.states.get("sensor.push_ups_target_to_date").state == "70"
    assert hass.states.get("sensor.push_ups_today_s_target").state == "30"


async def test_options_flow_keeps_own_name_and_validates(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """The challenge may keep its name; other names must stay unique."""
    MockConfigEntry(domain=DOMAIN, title="Squats", options=make_options()).add_to_hass(
        hass
    )
    result = await hass.config_entries.options.async_init(loaded_entry.entry_id)
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {**USER_INPUT, "name": "squats"}
    )
    assert result["errors"] == {"name": "name_exists"}

    result = await hass.config_entries.options.async_configure(
        result["flow_id"], USER_INPUT
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert loaded_entry.title == "Push-ups"


async def test_options_flow_target_change_while_not_loaded(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    hass_storage: dict[str, Any],
) -> None:
    """A target change is recorded even if the entry is not loaded."""
    hass_storage[STORE_KEY] = store_payload({"2026-11-02": 5}, {})
    config_entry.add_to_hass(hass)
    result = await hass.config_entries.options.async_init(config_entry.entry_id)
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {**USER_INPUT, "daily_target": 25}
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert hass_storage[STORE_KEY]["data"] == {
        "days": {"2026-11-02": 5},
        "target_history": {START: 20, TODAY: 25},
    }


async def test_cleared_end_date_stays_cleared_after_an_error(
    hass: HomeAssistant, config_entry: MockConfigEntry
) -> None:
    """A removed end date must not come back when the form is shown again."""
    config_entry.add_to_hass(hass)
    hass.config_entries.async_update_entry(
        config_entry, options={**config_entry.options, "end_date": "2026-12-31"}
    )
    result = await hass.config_entries.options.async_init(config_entry.entry_id)
    # The cleared optional field is missing from the input.
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {**USER_INPUT, "steps": ["5", "1"]}
    )
    assert result["errors"] == {"steps": "steps_not_ascending"}
    end_key = next(k for k in result["data_schema"].schema if str(k) == "end_date")
    assert end_key.description["suggested_value"] is None


async def test_upper_limits(hass: HomeAssistant) -> None:
    """Targets and steps stay within the maximum day value."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    # The target field itself refuses larger values.
    with pytest.raises(InvalidData):
        await hass.config_entries.flow.async_configure(
            result["flow_id"], {**USER_INPUT, "daily_target": 100001}
        )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {**USER_INPUT, "steps": ["100001"]}
    )
    assert result["errors"] == {"steps": "invalid_steps"}
