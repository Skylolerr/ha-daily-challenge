"""Intents to update and read challenges by voice or chat."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, ClassVar

import probatio as vol
from homeassistant.components.homeassistant.exposed_entities import async_should_expose
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import intent

from .const import CONF_UNIT, DOMAIN, MAX_DAY_VALUE
from .coordinator import ChallengeCoordinator, DailyChallengeConfigEntry
from .services import DAY_VALUE, whole_number

INTENT_ADD = "DailyChallengeAdd"
INTENT_SET = "DailyChallengeSet"
INTENT_STATUS = "DailyChallengeStatus"

SLOT_CHALLENGE = "challenge"
SLOT_AMOUNT = "amount"
SLOT_VALUE = "value"


@dataclass(frozen=True, slots=True)
class Challenge:
    """A loaded challenge as seen by an assistant."""

    name: str
    unit: str
    coordinator: ChallengeCoordinator


@callback
def async_challenges(hass: HomeAssistant, assistant: str | None) -> list[Challenge]:
    """Return the loaded challenges whose `today` number the assistant may use.

    Without an assistant (e.g. an automation) every loaded challenge counts.
    """
    registry = er.async_get(hass)
    challenges = []
    entry: DailyChallengeConfigEntry
    for entry in hass.config_entries.async_loaded_entries(DOMAIN):
        entity_id = registry.async_get_entity_id(
            Platform.NUMBER, DOMAIN, f"{entry.entry_id}_today"
        )
        if assistant is not None and (
            entity_id is None or not async_should_expose(hass, assistant, entity_id)
        ):
            continue
        challenges.append(
            Challenge(entry.title, str(entry.options[CONF_UNIT]), entry.runtime_data)
        )
    return challenges


async def async_setup_intents(hass: HomeAssistant) -> None:
    """Register the intents.

    This module is an `intent` platform: the intent integration calls this
    once it is set up (conversation and every assistant depend on it).
    """
    intent.async_register(hass, AddIntentHandler())
    intent.async_register(hass, SetIntentHandler())
    intent.async_register(hass, StatusIntentHandler())


class _ChallengeIntentHandler(intent.IntentHandler):
    """Find the challenge named in the intent and answer with its status."""

    _schema: ClassVar[dict[Any, Any]] = {}

    @property
    def slot_schema(self) -> dict[Any, Any]:
        """Return the slot schema."""
        return {vol.Optional(SLOT_CHALLENGE): intent.non_empty_string, **self._schema}

    def _challenge(self, intent_obj: intent.Intent) -> Challenge:
        slots = self.async_validate_slots(intent_obj.slots)
        challenges = async_challenges(intent_obj.hass, intent_obj.assistant)
        name = slots.get(SLOT_CHALLENGE, {}).get("value")
        if name is None:
            if len(challenges) == 1:
                return challenges[0]
            names = ", ".join(challenge.name for challenge in challenges)
            raise intent.IntentHandleError(
                f"Name the challenge, one of: {names}" if names else "No challenges"
            )
        wanted = str(name).strip().casefold()
        for challenge in challenges:
            if challenge.name.casefold() == wanted:
                return challenge
        raise intent.IntentHandleError(f"No challenge named {name}")

    @staticmethod
    def _respond(
        intent_obj: intent.Intent, challenge: Challenge, prefix: str = ""
    ) -> intent.IntentResponse:
        stats = challenge.coordinator.data
        target = stats.effective_target_today
        slots = {
            "challenge": challenge.name,
            "unit": challenge.unit,
            "today": stats.value_today,
            "target": target,
            "goal_reached": stats.goal_reached_today,
            "streak": stats.current_streak,
            "total": stats.total,
        }
        if target is None:
            speech = f"{challenge.name} is not running today."
        else:
            days = "day" if stats.current_streak == 1 else "days"
            speech = (
                f"{challenge.name}: {stats.value_today} of {target} "
                f"{challenge.unit} today, streak {stats.current_streak} {days}."
            )
        response = intent_obj.create_response()
        response.async_set_speech(f"{prefix}{speech}")
        response.async_set_speech_slots(slots)
        return response


class AddIntentHandler(_ChallengeIntentHandler):
    """Add an amount to today's value."""

    intent_type = INTENT_ADD
    description = (
        "Adds an amount to today's value of a Daily Challenge, for example "
        "push-ups just done. Negative amounts subtract."
    )
    _schema: ClassVar[dict[Any, Any]] = {
        vol.Required(SLOT_AMOUNT): vol.All(
            whole_number, vol.Range(min=-MAX_DAY_VALUE, max=MAX_DAY_VALUE)
        )
    }

    async def async_handle(self, intent_obj: intent.Intent) -> intent.IntentResponse:
        """Handle the intent."""
        challenge = self._challenge(intent_obj)
        amount = self.async_validate_slots(intent_obj.slots)[SLOT_AMOUNT]["value"]
        try:
            challenge.coordinator.async_add(amount)
        except HomeAssistantError as err:
            raise intent.IntentHandleError(str(err)) from err
        return self._respond(intent_obj, challenge, f"Added {amount}. ")


class SetIntentHandler(_ChallengeIntentHandler):
    """Set today's value."""

    intent_type = INTENT_SET
    description = "Sets today's value of a Daily Challenge to an amount."
    _schema: ClassVar[dict[Any, Any]] = {vol.Required(SLOT_VALUE): DAY_VALUE}

    async def async_handle(self, intent_obj: intent.Intent) -> intent.IntentResponse:
        """Handle the intent."""
        challenge = self._challenge(intent_obj)
        value = self.async_validate_slots(intent_obj.slots)[SLOT_VALUE]["value"]
        try:
            challenge.coordinator.async_set_value(value)
        except HomeAssistantError as err:
            raise intent.IntentHandleError(str(err)) from err
        return self._respond(intent_obj, challenge, f"Set to {value}. ")


class StatusIntentHandler(_ChallengeIntentHandler):
    """Tell today's progress."""

    intent_type = INTENT_STATUS
    description = (
        "Returns today's value, today's target and the current streak of a "
        "Daily Challenge."
    )

    async def async_handle(self, intent_obj: intent.Intent) -> intent.IntentResponse:
        """Handle the intent."""
        return self._respond(intent_obj, self._challenge(intent_obj))
