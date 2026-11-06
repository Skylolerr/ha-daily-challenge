"""Tests for the intents and the tools for AI assistants."""

from __future__ import annotations

from typing import Any

import pytest
from homeassistant.components.homeassistant.exposed_entities import (
    async_expose_entity,
)
from homeassistant.core import Context, HomeAssistant
from homeassistant.helpers import intent, llm
from homeassistant.setup import async_setup_component

from custom_components.daily_challenge.const import DOMAIN
from custom_components.daily_challenge.intent import (
    INTENT_ADD,
    INTENT_SET,
    INTENT_STATUS,
)
from custom_components.daily_challenge.llm import async_get_tools

from .common import MockConfigEntry
from .conftest import make_options

ASSISTANT = "conversation"
TODAY = "number.push_ups_today"


@pytest.fixture(autouse=True)
async def setup_homeassistant(hass: HomeAssistant) -> None:
    """Set up exposure handling."""
    assert await async_setup_component(hass, "homeassistant", {})


async def handle(
    hass: HomeAssistant,
    intent_type: str,
    slots: dict[str, Any],
    assistant: str | None = None,
) -> intent.IntentResponse:
    """Handle an intent with plain slot values."""
    return await intent.async_handle(
        hass,
        "test",
        intent_type,
        {key: {"value": value} for key, value in slots.items()},
        assistant=assistant,
    )


async def add_squats(hass: HomeAssistant) -> None:
    """Set up a second challenge."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Squats",
        unique_id="squats",
        entry_id="squats",
        data={},
        options=make_options(unit="reps", daily_target=10),
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()


@pytest.mark.usefixtures("loaded_entry")
async def test_add_with_a_single_challenge(hass: HomeAssistant) -> None:
    """With one challenge the name can be left out."""
    response = await handle(hass, INTENT_ADD, {"amount": 15})
    assert response.response_type is intent.IntentResponseType.ACTION_DONE
    assert response.speech["plain"]["speech"] == (
        "Added 15. Push-ups: 15 of 20 repetitions today, streak 0 days."
    )
    assert response.speech_slots["today"] == 15
    assert response.speech_slots["goal_reached"] is False
    assert hass.states.get(TODAY).state == "15"


@pytest.mark.usefixtures("loaded_entry")
async def test_set_and_status_by_name(hass: HomeAssistant) -> None:
    """The name is matched without regard to case."""
    await add_squats(hass)
    await handle(hass, INTENT_SET, {"challenge": "push-UPS", "value": 20})
    response = await handle(hass, INTENT_STATUS, {"challenge": "Push-ups"})
    assert response.speech["plain"]["speech"].endswith("streak 1 day.")
    assert response.speech_slots == {
        "challenge": "Push-ups",
        "unit": "repetitions",
        "today": 20,
        "target": 20,
        "goal_reached": True,
        "streak": 1,
        "total": 20,
    }
    assert hass.states.get("number.squats_today").state == "0"


@pytest.mark.usefixtures("loaded_entry")
async def test_name_needed_with_several_challenges(hass: HomeAssistant) -> None:
    """Without a name and several challenges the intent asks for one."""
    await add_squats(hass)
    with pytest.raises(intent.IntentHandleError, match="Push-ups, Squats"):
        await handle(hass, INTENT_STATUS, {})
    with pytest.raises(intent.IntentHandleError, match="No challenge named Lunges"):
        await handle(hass, INTENT_STATUS, {"challenge": "Lunges"})


async def test_no_challenges(hass: HomeAssistant) -> None:
    """Without challenges there is nothing to do."""
    assert await async_setup_component(hass, DOMAIN, {})
    with pytest.raises(intent.IntentHandleError, match="No challenges"):
        await handle(hass, INTENT_STATUS, {})


@pytest.mark.usefixtures("loaded_entry")
async def test_only_exposed_challenges_for_assistants(hass: HomeAssistant) -> None:
    """An assistant only sees challenges whose today number is exposed."""
    with pytest.raises(intent.IntentHandleError, match="No challenges"):
        await handle(hass, INTENT_STATUS, {}, assistant=ASSISTANT)
    async_expose_entity(hass, ASSISTANT, TODAY, should_expose=True)
    response = await handle(hass, INTENT_STATUS, {}, assistant=ASSISTANT)
    assert response.speech_slots["challenge"] == "Push-ups"


@pytest.mark.usefixtures("loaded_entry")
async def test_invalid_amount_is_rejected(hass: HomeAssistant) -> None:
    """Fractions are not accepted as amounts."""
    with pytest.raises(intent.InvalidSlotInfo):
        await handle(hass, INTENT_ADD, {"amount": 2.5})


async def test_errors_of_the_challenge_are_passed_on(hass: HomeAssistant) -> None:
    """A challenge fed by a daily source rejects changes of today."""
    hass.states.async_set("sensor.steps", "10")
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Push-ups",
        unique_id="push_ups",
        entry_id="push_ups",
        data={},
        options=make_options(source_entity="sensor.steps"),
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    with pytest.raises(intent.IntentHandleError):
        await handle(hass, INTENT_ADD, {"amount": 1})
    with pytest.raises(intent.IntentHandleError):
        await handle(hass, INTENT_SET, {"value": 1})


async def test_not_running_today(hass: HomeAssistant) -> None:
    """Before the start the answer says so."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Push-ups",
        unique_id="push_ups",
        entry_id="push_ups",
        data={},
        options=make_options(start_date="2026-12-01"),
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    response = await handle(hass, INTENT_STATUS, {})
    assert response.speech["plain"]["speech"] == "Push-ups is not running today."


def llm_context() -> llm.LLMContext:
    """Return the context of a conversation with Assist."""
    return llm.LLMContext(
        platform="test",
        context=Context(),
        language="en",
        assistant=ASSISTANT,
        device_id=None,
    )


@pytest.mark.usefixtures("loaded_entry")
async def test_llm_tools(hass: HomeAssistant) -> None:
    """AI assistants get the tools once a challenge is exposed."""
    assert await async_setup_component(hass, "llm", {})
    api = await llm.async_get_api(hass, llm.LLM_API_ASSIST, llm_context())
    assert not [tool for tool in api.tools if tool.name.startswith(DOMAIN)]

    async_expose_entity(hass, ASSISTANT, TODAY, should_expose=True)
    api = await llm.async_get_api(hass, llm.LLM_API_ASSIST, llm_context())
    names = sorted(tool.name for tool in api.tools if tool.name.startswith(DOMAIN))
    assert names == [
        f"{DOMAIN}__{INTENT_ADD}",
        f"{DOMAIN}__{INTENT_SET}",
        f"{DOMAIN}__{INTENT_STATUS}",
    ]
    assert "Push-ups (repetitions)" in api.api_prompt

    # Called directly: the API's dispatcher needs the conversation integration.
    tool = next(t for t in api.tools if t.name == f"{DOMAIN}__{INTENT_ADD}")
    result = await tool.async_call(
        hass,
        llm.ToolInput(
            tool_name=tool.name, tool_args={"challenge": "Push-ups", "amount": 5}
        ),
        llm_context(),
    )
    assert result.data["speech_slots"]["today"] == 5
    assert hass.states.get(TODAY).state == "5"


@pytest.mark.usefixtures("loaded_entry")
async def test_llm_tools_only_for_assist(hass: HomeAssistant) -> None:
    """Other APIs and contexts without an assistant get no tools."""
    async_expose_entity(hass, ASSISTANT, TODAY, should_expose=True)
    assert async_get_tools(hass, llm_context(), "other") is None
    context = llm_context()
    context.assistant = ""
    assert async_get_tools(hass, context, llm.LLM_API_ASSIST) is None
