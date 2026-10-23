"""Config and options flow for Daily Challenge."""

from __future__ import annotations

from datetime import date
from typing import Any
from uuid import uuid4

import probatio as vol
from homeassistant.config_entries import (
    ConfigEntryState,
    ConfigFlow,
    ConfigFlowResult,
    OptionsFlow,
)
from homeassistant.const import CONF_ICON, CONF_NAME
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.selector import (
    DateSelector,
    IconSelector,
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
    TextSelector,
    TextSelectorConfig,
    TextSelectorType,
)
from homeassistant.util import dt as dt_util

from .calculations import DeficitMode, StreakRule
from .const import (
    CONF_DAILY_TARGET,
    CONF_DEFICIT_MODE,
    CONF_END_DATE,
    CONF_START_DATE,
    CONF_STEPS,
    CONF_STREAK_RULE,
    CONF_UNIT,
    DEFAULT_DAILY_TARGET,
    DEFAULT_ICON,
    DEFAULT_STEPS,
    DOMAIN,
    MAX_DAY_VALUE,
    MAX_STEPS,
    UNIT_SUGGESTIONS,
)
from .coordinator import ChallengeStore, DailyChallengeConfigEntry


def _unit_suggestions(hass: HomeAssistant) -> list[str]:
    """Return unit suggestions in the system language (fallback English)."""
    language = (hass.config.language or "en").split("-")[0]
    return UNIT_SUGGESTIONS.get(language, UNIT_SUGGESTIONS["en"])


def _schema(hass: HomeAssistant, defaults: dict[str, Any]) -> vol.Schema:
    """Build the form schema shared by the config and options flow."""
    return vol.Schema(
        {
            vol.Required(CONF_NAME, default=defaults[CONF_NAME]): TextSelector(),
            vol.Required(CONF_ICON, default=defaults[CONF_ICON]): IconSelector(),
            vol.Required(CONF_UNIT, default=defaults[CONF_UNIT]): SelectSelector(
                SelectSelectorConfig(
                    options=_unit_suggestions(hass),
                    custom_value=True,
                    mode=SelectSelectorMode.DROPDOWN,
                )
            ),
            vol.Required(
                CONF_DAILY_TARGET, default=defaults[CONF_DAILY_TARGET]
            ): NumberSelector(
                NumberSelectorConfig(
                    min=1, max=MAX_DAY_VALUE, step=1, mode=NumberSelectorMode.BOX
                )
            ),
            vol.Required(
                CONF_START_DATE, default=defaults[CONF_START_DATE]
            ): DateSelector(),
            vol.Optional(
                CONF_END_DATE,
                description={"suggested_value": defaults.get(CONF_END_DATE)},
            ): DateSelector(),
            vol.Required(
                CONF_STEPS, default=[str(step) for step in defaults[CONF_STEPS]]
            ): TextSelector(
                TextSelectorConfig(type=TextSelectorType.NUMBER, multiple=True)
            ),
            vol.Required(
                CONF_STREAK_RULE, default=defaults[CONF_STREAK_RULE]
            ): SelectSelector(
                SelectSelectorConfig(
                    options=[rule.value for rule in StreakRule],
                    translation_key=CONF_STREAK_RULE,
                    mode=SelectSelectorMode.LIST,
                )
            ),
            vol.Required(
                CONF_DEFICIT_MODE, default=defaults[CONF_DEFICIT_MODE]
            ): SelectSelector(
                SelectSelectorConfig(
                    options=[mode.value for mode in DeficitMode],
                    translation_key=CONF_DEFICIT_MODE,
                    mode=SelectSelectorMode.LIST,
                )
            ),
        }
    )


def _parse_steps(raw: Any) -> list[int] | None:
    """Return the steps as integers, or None if they are not valid numbers."""
    values = raw if isinstance(raw, list) else [raw]
    steps: list[int] = []
    for value in values:
        if value is None or not str(value).strip():
            continue
        try:
            number = float(value)
        except TypeError, ValueError:
            return None
        if not number.is_integer() or not 0 < number <= MAX_DAY_VALUE:
            return None
        steps.append(int(number))
    if not 1 <= len(steps) <= MAX_STEPS:
        return None
    return steps


def _validate(
    hass: HomeAssistant, user_input: dict[str, Any], entry_id: str | None
) -> tuple[dict[str, str], dict[str, Any]]:
    """Validate user input and return errors and the resulting options."""
    errors: dict[str, str] = {}
    name = str(user_input[CONF_NAME]).strip()
    if not name:
        errors[CONF_NAME] = "name_required"
    elif any(
        entry.title.casefold() == name.casefold()
        for entry in hass.config_entries.async_entries(DOMAIN)
        if entry.entry_id != entry_id
    ):
        errors[CONF_NAME] = "name_exists"

    unit = str(user_input[CONF_UNIT]).strip()
    if not unit:
        errors[CONF_UNIT] = "unit_required"

    daily_target = float(user_input[CONF_DAILY_TARGET])
    if not daily_target.is_integer() or not 0 < daily_target <= MAX_DAY_VALUE:
        errors[CONF_DAILY_TARGET] = "invalid_target"

    start_date = date.fromisoformat(user_input[CONF_START_DATE])
    if start_date > dt_util.now().date():
        errors[CONF_START_DATE] = "start_in_future"

    end_raw = user_input.get(CONF_END_DATE)
    end_date = date.fromisoformat(end_raw) if end_raw else None
    if end_date is not None and end_date <= start_date:
        errors[CONF_END_DATE] = "end_before_start"

    steps = _parse_steps(user_input[CONF_STEPS])
    if steps is None:
        errors[CONF_STEPS] = "invalid_steps"
    elif steps != sorted(set(steps)):
        errors[CONF_STEPS] = "steps_not_ascending"

    options = {
        CONF_NAME: name,
        # A cleared icon picker sends an empty string.
        CONF_ICON: str(user_input[CONF_ICON]).strip() or DEFAULT_ICON,
        CONF_UNIT: unit,
        CONF_DAILY_TARGET: int(daily_target),
        CONF_START_DATE: start_date.isoformat(),
        CONF_END_DATE: end_date.isoformat() if end_date else None,
        CONF_STEPS: steps,
        CONF_STREAK_RULE: user_input[CONF_STREAK_RULE],
        CONF_DEFICIT_MODE: user_input[CONF_DEFICIT_MODE],
    }
    return errors, options


class DailyChallengeConfigFlow(ConfigFlow, domain=DOMAIN):
    """Create a new challenge."""

    VERSION = 1
    MINOR_VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle the initial step."""
        errors: dict[str, str] = {}
        if user_input is not None:
            errors, options = _validate(self.hass, user_input, None)
            if not errors:
                await self.async_set_unique_id(uuid4().hex)
                name = options.pop(CONF_NAME)
                return self.async_create_entry(title=name, data={}, options=options)

        defaults: dict[str, Any] = {
            CONF_NAME: "",
            CONF_ICON: DEFAULT_ICON,
            CONF_UNIT: _unit_suggestions(self.hass)[0],
            CONF_DAILY_TARGET: DEFAULT_DAILY_TARGET,
            CONF_START_DATE: dt_util.now().date().isoformat(),
            CONF_STEPS: DEFAULT_STEPS,
            CONF_STREAK_RULE: StreakRule.TARGET.value,
            CONF_DEFICIT_MODE: DeficitMode.DISPLAY.value,
        }
        schema = _schema(self.hass, defaults)
        if user_input is not None:
            schema = self.add_suggested_values_to_schema(
                schema, {CONF_END_DATE: None, **user_input}
            )
        return self.async_show_form(step_id="user", data_schema=schema, errors=errors)

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: DailyChallengeConfigEntry,
    ) -> DailyChallengeOptionsFlow:
        """Return the options flow."""
        return DailyChallengeOptionsFlow()


class DailyChallengeOptionsFlow(OptionsFlow):
    """Change an existing challenge; the entry reloads afterwards."""

    config_entry: DailyChallengeConfigEntry

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle the options form."""
        entry = self.config_entry
        errors: dict[str, str] = {}
        if user_input is not None:
            errors, options = _validate(self.hass, user_input, entry.entry_id)
            if not errors:
                name = options.pop(CONF_NAME)
                if options[CONF_DAILY_TARGET] != entry.options[CONF_DAILY_TARGET]:
                    await self._async_record_target_change(options[CONF_DAILY_TARGET])
                # Title and options in one update, so the entry reloads once.
                self.hass.config_entries.async_update_entry(
                    entry, title=name, options=options
                )
                return self.async_create_entry(data=options)

        schema = _schema(self.hass, {CONF_NAME: entry.title, **entry.options})
        if user_input is not None:
            schema = self.add_suggested_values_to_schema(
                schema, {CONF_END_DATE: None, **user_input}
            )
        return self.async_show_form(step_id="init", data_schema=schema, errors=errors)

    async def _async_record_target_change(self, target: int) -> None:
        """Store a new daily target that is valid from today on."""
        entry = self.config_entry
        if entry.state is ConfigEntryState.LOADED:
            store = entry.runtime_data.store
        else:
            store = ChallengeStore(self.hass, entry.entry_id)
            await store.async_load()
        if not store.target_history:
            store.set_target(
                date.fromisoformat(entry.options[CONF_START_DATE]),
                entry.options[CONF_DAILY_TARGET],
            )
        store.set_target(dt_util.now().date(), target)
        await store.async_save()
