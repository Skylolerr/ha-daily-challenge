"""Tests for the config and options flow."""

from __future__ import annotations

from typing import Any

import pytest
from homeassistant.config_entries import SOURCE_USER, ConfigFlowResult
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType, InvalidData

from custom_components.daily_challenge.const import DOMAIN

from .common import MockConfigEntry
from .conftest import START, TODAY, make_options
from .test_init import STORE_KEY, rule, store_payload

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


async def start_flow(hass: HomeAssistant) -> ConfigFlowResult:
    """Open the challenge form through the menu."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    assert result["type"] is FlowResultType.MENU
    return await hass.config_entries.flow.async_configure(
        result["flow_id"], {"next_step_id": "challenge"}
    )


async def test_create_challenge(hass: HomeAssistant) -> None:
    """A valid form creates a challenge with a generated unique ID."""
    result = await start_flow(hass)
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
    result = await start_flow(hass)
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
    result = await start_flow(hass)
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
    result = await start_flow(hass)
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
    result = await start_flow(hass)
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {**USER_INPUT, "steps": ["", " 3 ", "  "], "end_date": "2026-12-31"},
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["options"]["steps"] == [3]
    assert result["options"]["end_date"] == "2026-12-31"


async def test_cleared_icon_falls_back_to_default(hass: HomeAssistant) -> None:
    """A cleared icon picker stores the default icon instead of an empty one."""
    result = await start_flow(hass)
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {**USER_INPUT, "icon": " "}
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["options"]["icon"] == "mdi:trophy"
    await hass.async_block_till_done()
    assert hass.states.get("number.push_ups_today").attributes["icon"] == "mdi:trophy"


async def test_name_must_be_unique(
    hass: HomeAssistant, config_entry: MockConfigEntry
) -> None:
    """Names are compared case-insensitively."""
    config_entry.add_to_hass(hass)
    result = await start_flow(hass)
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
    assert hass_storage[STORE_KEY]["data"]["target_history"] == {
        START: rule(20),
        TODAY: rule(30),
    }
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
        "target_history": {START: rule(20), TODAY: rule(25)},
        "source": None,
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
    result = await start_flow(hass)
    # The target field itself refuses larger values.
    with pytest.raises(InvalidData):
        await hass.config_entries.flow.async_configure(
            result["flow_id"], {**USER_INPUT, "daily_target": 100001}
        )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {**USER_INPUT, "steps": ["100001"]}
    )
    assert result["errors"] == {"steps": "invalid_steps"}


async def test_source_and_milestone_sections(hass: HomeAssistant) -> None:
    """The collapsible sections are stored as flat options."""
    hass.states.async_set("sensor.steps", "0")
    result = await start_flow(hass)
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {
            **USER_INPUT,
            "source": {"source_entity": "sensor.steps", "source_mode": "counter"},
            "milestone_settings": {"milestones": ["total", "streak"]},
        },
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["options"] == make_options(
        icon="mdi:arm-flex",
        source_entity="sensor.steps",
        source_mode="counter",
        # Stored in a fixed order.
        milestones=["streak", "total"],
    )


async def test_source_must_not_be_a_challenge_entity(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    """A challenge cannot be fed by an entity of Daily Challenge."""
    result = await hass.config_entries.options.async_init(loaded_entry.entry_id)
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            **USER_INPUT,
            "source": {
                "source_entity": "sensor.push_ups_total",
                "source_mode": "daily",
            },
        },
    )
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"base": "source_is_challenge"}
    # The section with the wrong field is open, so the error makes sense.
    section_ = next(
        value for key, value in result["data_schema"].schema.items() if key == "source"
    )
    assert section_.options["collapsed"] is False


async def test_cleared_source_stays_cleared_after_an_error(
    hass: HomeAssistant, config_entry: MockConfigEntry
) -> None:
    """A removed source must not come back when the form is shown again."""
    config_entry.add_to_hass(hass)
    hass.config_entries.async_update_entry(
        config_entry,
        options={**config_entry.options, "source_entity": "sensor.steps"},
    )
    result = await hass.config_entries.options.async_init(config_entry.entry_id)
    source_section = next(
        value for key, value in result["data_schema"].schema.items() if key == "source"
    )
    key = next(k for k in source_section.schema.schema if k == "source_entity")
    assert key.description["suggested_value"] == "sensor.steps"
    assert source_section.options["collapsed"] is False

    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {**USER_INPUT, "steps": ["5", "1"], "source": {"source_mode": "daily"}},
    )
    assert result["errors"] == {"steps": "steps_not_ascending"}
    source_section = next(
        value for key, value in result["data_schema"].schema.items() if key == "source"
    )
    key = next(k for k in source_section.schema.schema if k == "source_entity")
    assert key.description["suggested_value"] is None


async def test_template_fills_in_the_form(hass: HomeAssistant) -> None:
    """A template prefills name, icon, unit, target and steps in the language."""
    hass.config.language = "de"
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    assert result["menu_options"] == ["challenge", "template", "group"]
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"next_step_id": "template"}
    )
    assert result["step_id"] == "template"
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"template": "steps"}
    )
    assert result["step_id"] == "challenge"
    defaults = {
        str(key): key.default()
        for key in result["data_schema"].schema
        if callable(key.default)
    }
    assert defaults["name"] == "Schritte"
    assert defaults["icon"] == "mdi:walk"
    assert defaults["unit"] == "Schritte"
    assert defaults["daily_target"] == 10000
    assert defaults["steps"] == ["500", "1000", "2000"]

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {
            **USER_INPUT,
            "name": "Schritte",
            "unit": "Schritte",
            "daily_target": 10000,
            "steps": ["500", "1000", "2000"],
        },
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "Schritte"


async def test_template_falls_back_to_english(hass: HomeAssistant) -> None:
    """An untranslated language gets the English template."""
    hass.config.language = "nl"
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"next_step_id": "template"}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"template": "water"}
    )
    defaults = {
        str(key): key.default()
        for key in result["data_schema"].schema
        if callable(key.default)
    }
    assert (defaults["name"], defaults["unit"]) == ("Water", "ml")


async def test_create_with_rising_target_and_person(hass: HomeAssistant) -> None:
    """The rising target and the person are stored in the options."""
    result = await start_flow(hass)
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {
            **USER_INPUT,
            "person": "person.anna",
            "rising_target": {
                "target_increase": 2,
                "target_increase_every": "day",
                "target_max": 24,
            },
        },
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    options = result["options"]
    assert options["person"] == "person.anna"
    assert (
        options["target_increase"],
        options["target_increase_every"],
        options["target_max"],
    ) == (2, "day", 24)
    await hass.async_block_till_done()
    # Started on Monday 2026-11-02, today is Wednesday: 20 + 2 x 2.
    assert hass.states.get("sensor.push_ups_today_s_target").state == "24"
    assert hass.states.get("sensor.push_ups_target_to_date").state == "66"


@pytest.mark.parametrize(
    ("rising", "error"),
    [
        ({"target_increase": 1.5}, {"target_increase": "invalid_increase"}),
        (
            {"target_increase": 1, "target_max": 10},
            {"target_max": "invalid_target_max"},
        ),
        (
            {"target_increase": 1, "target_max": 20.5},
            {"target_max": "invalid_target_max"},
        ),
    ],
)
async def test_rising_target_validation(
    hass: HomeAssistant, rising: dict[str, Any], error: dict[str, str]
) -> None:
    """Increase and maximum must be whole numbers; the maximum >= the target."""
    result = await start_flow(hass)
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {**USER_INPUT, "rising_target": rising}
    )
    assert result["errors"] == error


async def test_maximum_without_increase_is_dropped(hass: HomeAssistant) -> None:
    """A maximum without an increase has no meaning and is not stored."""
    result = await start_flow(hass)
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {**USER_INPUT, "rising_target": {"target_max": 50}}
    )
    assert result["options"]["target_max"] is None
    assert result["options"]["target_increase"] == 0


async def test_changed_rise_continues_from_todays_target(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    hass_storage: dict[str, Any],
) -> None:
    """A changed rise starts from the target valid today, without a jump."""
    config_entry.add_to_hass(hass)
    hass.config_entries.async_update_entry(
        config_entry,
        options={
            **config_entry.options,
            "target_increase": 5,
            "target_increase_every": "day",
        },
    )
    assert await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()
    assert hass.states.get("sensor.push_ups_today_s_target").state == "30"

    result = await hass.config_entries.options.async_init(config_entry.entry_id)
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            **USER_INPUT,
            "rising_target": {"target_increase": 1, "target_increase_every": "week"},
        },
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    assert hass_storage[STORE_KEY]["data"]["target_history"] == {
        START: {"target": 20, "increase": 5, "every": "day", "max": None},
        TODAY: {"target": 30, "increase": 1, "every": "week", "max": None},
    }
    assert hass.states.get("sensor.push_ups_today_s_target").state == "30"
    # 20 + 25 + 30: past days keep their target.
    assert hass.states.get("sensor.push_ups_target_to_date").state == "75"


async def test_unchanged_rule_writes_no_entry(
    hass: HomeAssistant,
    loaded_entry: MockConfigEntry,
    hass_storage: dict[str, Any],
) -> None:
    """Changing the interval of a switched-off rise records nothing."""
    result = await hass.config_entries.options.async_init(loaded_entry.entry_id)
    await hass.config_entries.options.async_configure(
        result["flow_id"],
        {**USER_INPUT, "rising_target": {"target_increase_every": "month"}},
    )
    await hass.async_block_till_done()
    assert hass_storage[STORE_KEY]["data"]["target_history"] == {START: rule(20)}


async def test_old_target_numbers_are_migrated(
    hass: HomeAssistant,
    config_entry: MockConfigEntry,
    hass_storage: dict[str, Any],
) -> None:
    """Plain stored targets become rules without a rise; nothing is lost."""
    hass_storage[STORE_KEY] = store_payload({START: 30}, {START: 20, "2026-11-03": 25})
    config_entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()
    assert hass.states.get("sensor.push_ups_target_to_date").state == "70"
    await hass.config_entries.async_unload(config_entry.entry_id)
    assert hass_storage[STORE_KEY]["minor_version"] == 3
    assert hass_storage[STORE_KEY]["data"]["target_history"] == {
        START: rule(20),
        "2026-11-03": rule(25),
    }
