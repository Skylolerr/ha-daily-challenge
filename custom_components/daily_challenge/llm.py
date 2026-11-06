"""Tools for AI assistants (the Assist API)."""

from __future__ import annotations

from homeassistant.components.llm import LLMTools
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import intent
from homeassistant.helpers.llm import (
    LLM_API_ASSIST,
    IntentTool,
    LLMContext,
    Tool,
    ToolAnnotations,
)

from .const import DOMAIN
from .intent import INTENT_ADD, INTENT_SET, INTENT_STATUS, async_challenges

# Intent type to (title, annotations). Only the user's own data is touched.
LLM_INTENTS = {
    INTENT_ADD: (
        "Add to a daily challenge",
        ToolAnnotations(destructive=False, open_world=False),
    ),
    INTENT_SET: (
        "Set a daily challenge",
        ToolAnnotations(destructive=False, idempotent=True, open_world=False),
    ),
    INTENT_STATUS: (
        "Daily challenge status",
        ToolAnnotations(read_only=True, destructive=False, open_world=False),
    ),
}


@callback
def async_get_tools(
    hass: HomeAssistant, llm_context: LLMContext, api_id: str
) -> LLMTools | None:
    """Offer the intents while at least one challenge is exposed."""
    if api_id != LLM_API_ASSIST or not llm_context.assistant:
        return None
    challenges = async_challenges(hass, llm_context.assistant)
    if not challenges:
        return None
    tools: list[Tool] = [
        IntentTool(
            f"{DOMAIN}__{handler.intent_type}",
            handler,
            title=LLM_INTENTS[handler.intent_type][0],
            integration=DOMAIN,
            annotations=LLM_INTENTS[handler.intent_type][1],
        )
        for handler in intent.async_get(hass)
        if handler.intent_type in LLM_INTENTS
    ]
    names = ", ".join(f"{c.name} ({c.unit})" for c in challenges)
    prompt = (
        "Daily Challenge tracks amounts the user wants to reach every day. "
        f"The user's challenges are: {names}. Use the challenge name as it is."
    )
    return LLMTools(tools=tools, prompt=prompt)
