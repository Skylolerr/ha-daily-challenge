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
from homeassistant.data_entry_flow import section
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.selector import (
    DateSelector,
    EntitySelector,
    EntitySelectorConfig,
    IconSelector,
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    SelectOptionDict,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
    TextSelector,
    TextSelectorConfig,
    TextSelectorType,
)
from homeassistant.util import dt as dt_util

from .calculations import (
    DeficitMode,
    GoalPeriod,
    Interval,
    MilestoneType,
    RankingMetric,
    StreakRule,
)
from .const import (
    CONF_CREATED,
    CONF_DAILY_TARGET,
    CONF_DEFICIT_MODE,
    CONF_END_DATE,
    CONF_GROUP_GOAL,
    CONF_GROUP_GOAL_PERIOD,
    CONF_KIND,
    CONF_MEMBERS,
    CONF_MILESTONES,
    CONF_PERSON,
    CONF_RANKING,
    CONF_SOURCE_ENTITY,
    CONF_SOURCE_MODE,
    CONF_START_DATE,
    CONF_STEPS,
    CONF_STREAK_RULE,
    CONF_TARGET_INCREASE,
    CONF_TARGET_INCREASE_EVERY,
    CONF_TARGET_MAX,
    CONF_UNIT,
    DEFAULT_DAILY_TARGET,
    DEFAULT_ICON,
    DEFAULT_STEPS,
    DOMAIN,
    KIND_GROUP,
    MAX_DAY_VALUE,
    MAX_STEPS,
    MIN_MEMBERS,
    SECTION_GROUP_GOAL,
    SECTION_MILESTONES,
    SECTION_RISING,
    SECTION_SOURCE,
    SOURCE_DOMAINS,
    TEMPLATE_NAMES,
    TEMPLATE_UNITS,
    TEMPLATES,
    UNIT_SUGGESTIONS,
    SourceMode,
)
from .coordinator import ChallengeStore, DailyChallengeConfigEntry, rule_from_options
from .groups import is_group

DEFAULT_GROUP_ICON = "mdi:podium"


def _language(hass: HomeAssistant) -> str:
    """Return the system language if it is translated, else English."""
    language = (hass.config.language or "en").split("-")[0]
    return language if language in UNIT_SUGGESTIONS else "en"


def _unit_suggestions(hass: HomeAssistant) -> list[str]:
    """Return unit suggestions in the system language (fallback English)."""
    return UNIT_SUGGESTIONS[_language(hass)]


def _template_defaults(hass: HomeAssistant, key: str) -> dict[str, Any]:
    """Return the form values of a template in the system language."""
    template = TEMPLATES[key]
    language = _language(hass)
    return {
        CONF_NAME: TEMPLATE_NAMES[language][key],
        CONF_ICON: template.icon,
        CONF_UNIT: TEMPLATE_UNITS[language].get(template.unit, template.unit),
        CONF_DAILY_TARGET: template.daily_target,
        CONF_STEPS: list(template.steps),
    }


def _schema(
    hass: HomeAssistant, defaults: dict[str, Any], *, open_source: bool = False
) -> vol.Schema:
    """Build the form schema shared by the config and options flow."""
    return vol.Schema(
        {
            vol.Required(CONF_NAME, default=defaults[CONF_NAME]): TextSelector(),
            vol.Required(CONF_ICON, default=defaults[CONF_ICON]): IconSelector(),
            vol.Optional(
                CONF_PERSON,
                description={"suggested_value": defaults.get(CONF_PERSON)},
            ): EntitySelector(EntitySelectorConfig(domain="person")),
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
            # Sections default to {} so their fields fall back to the defaults.
            vol.Required(SECTION_RISING, default={}): section(
                vol.Schema(
                    {
                        vol.Required(
                            CONF_TARGET_INCREASE,
                            default=defaults.get(CONF_TARGET_INCREASE, 0),
                        ): NumberSelector(
                            NumberSelectorConfig(
                                min=0,
                                max=MAX_DAY_VALUE,
                                step=1,
                                mode=NumberSelectorMode.BOX,
                            )
                        ),
                        vol.Required(
                            CONF_TARGET_INCREASE_EVERY,
                            default=defaults.get(
                                CONF_TARGET_INCREASE_EVERY, Interval.WEEK.value
                            ),
                        ): SelectSelector(
                            SelectSelectorConfig(
                                options=[every.value for every in Interval],
                                translation_key=CONF_TARGET_INCREASE_EVERY,
                                mode=SelectSelectorMode.LIST,
                            )
                        ),
                        vol.Optional(
                            CONF_TARGET_MAX,
                            description={
                                "suggested_value": defaults.get(CONF_TARGET_MAX)
                            },
                        ): NumberSelector(
                            NumberSelectorConfig(
                                min=1,
                                max=MAX_DAY_VALUE,
                                step=1,
                                mode=NumberSelectorMode.BOX,
                            )
                        ),
                    }
                ),
                {"collapsed": not defaults.get(CONF_TARGET_INCREASE)},
            ),
            vol.Required(SECTION_SOURCE, default={}): section(
                vol.Schema(
                    {
                        vol.Optional(
                            CONF_SOURCE_ENTITY,
                            description={
                                "suggested_value": defaults.get(CONF_SOURCE_ENTITY)
                            },
                        ): EntitySelector(EntitySelectorConfig(domain=SOURCE_DOMAINS)),
                        vol.Required(
                            CONF_SOURCE_MODE,
                            default=defaults.get(CONF_SOURCE_MODE, SourceMode.DAILY),
                        ): SelectSelector(
                            SelectSelectorConfig(
                                options=[mode.value for mode in SourceMode],
                                translation_key=CONF_SOURCE_MODE,
                                mode=SelectSelectorMode.LIST,
                            )
                        ),
                    }
                ),
                {"collapsed": not (open_source or defaults.get(CONF_SOURCE_ENTITY))},
            ),
            vol.Required(SECTION_MILESTONES, default={}): section(
                vol.Schema(
                    {
                        vol.Required(
                            CONF_MILESTONES,
                            default=defaults.get(
                                CONF_MILESTONES, [kind.value for kind in MilestoneType]
                            ),
                        ): SelectSelector(
                            SelectSelectorConfig(
                                options=[kind.value for kind in MilestoneType],
                                translation_key=CONF_MILESTONES,
                                multiple=True,
                                mode=SelectSelectorMode.LIST,
                            )
                        ),
                    }
                ),
                {"collapsed": True},
            ),
        }
    )


def _suggested(user_input: dict[str, Any]) -> dict[str, Any]:
    """Return the entered values for a form shown again after an error.

    Cleared optional fields are missing from the input; they are set to None
    so the form does not fall back to the old value.
    """
    return {
        CONF_END_DATE: None,
        CONF_PERSON: None,
        **user_input,
        SECTION_SOURCE: {
            CONF_SOURCE_ENTITY: None,
            **user_input.get(SECTION_SOURCE, {}),
        },
        SECTION_RISING: {
            CONF_TARGET_MAX: None,
            **user_input.get(SECTION_RISING, {}),
        },
    }


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

    source: dict[str, Any] = user_input.get(SECTION_SOURCE, {})
    source_entity = source.get(CONF_SOURCE_ENTITY) or None
    if source_entity is not None:
        registry_entry = er.async_get(hass).async_get(source_entity)
        if registry_entry is not None and registry_entry.platform == DOMAIN:
            errors["base"] = "source_is_challenge"
    rising: dict[str, Any] = user_input.get(SECTION_RISING, {})
    increase = float(rising.get(CONF_TARGET_INCREASE) or 0)
    maximum_raw = rising.get(CONF_TARGET_MAX)
    maximum = float(maximum_raw) if maximum_raw not in (None, "") else None
    if not increase.is_integer() or not 0 <= increase <= MAX_DAY_VALUE:
        errors[CONF_TARGET_INCREASE] = "invalid_increase"
    elif maximum is not None and (
        not maximum.is_integer() or not daily_target <= maximum <= MAX_DAY_VALUE
    ):
        errors[CONF_TARGET_MAX] = "invalid_target_max"

    milestones = user_input.get(SECTION_MILESTONES, {}).get(
        CONF_MILESTONES, [kind.value for kind in MilestoneType]
    )

    options = {
        CONF_NAME: name,
        # A cleared icon picker sends an empty string.
        CONF_ICON: str(user_input[CONF_ICON]).strip() or DEFAULT_ICON,
        CONF_PERSON: user_input.get(CONF_PERSON) or None,
        CONF_UNIT: unit,
        CONF_DAILY_TARGET: int(daily_target),
        CONF_START_DATE: start_date.isoformat(),
        CONF_END_DATE: end_date.isoformat() if end_date else None,
        CONF_STEPS: steps,
        CONF_STREAK_RULE: user_input[CONF_STREAK_RULE],
        CONF_DEFICIT_MODE: user_input[CONF_DEFICIT_MODE],
        CONF_SOURCE_ENTITY: source_entity,
        CONF_SOURCE_MODE: source.get(CONF_SOURCE_MODE, SourceMode.DAILY.value),
        CONF_MILESTONES: [kind.value for kind in MilestoneType if kind in milestones],
        CONF_TARGET_INCREASE: int(increase) if increase.is_integer() else 0,
        CONF_TARGET_INCREASE_EVERY: rising.get(
            CONF_TARGET_INCREASE_EVERY, Interval.WEEK.value
        ),
        CONF_TARGET_MAX: int(maximum) if maximum is not None and increase else None,
    }
    return errors, options


def _challenge_options(hass: HomeAssistant) -> list[SelectOptionDict]:
    """Return the challenges that can be members of a group."""
    return [
        SelectOptionDict(value=entry.entry_id, label=entry.title)
        for entry in hass.config_entries.async_entries(DOMAIN)
        if not is_group(entry)
    ]


def _group_schema(hass: HomeAssistant, defaults: dict[str, Any]) -> vol.Schema:
    """Build the form of a group."""
    return vol.Schema(
        {
            vol.Required(CONF_NAME, default=defaults[CONF_NAME]): TextSelector(),
            vol.Required(CONF_ICON, default=defaults[CONF_ICON]): IconSelector(),
            vol.Required(
                CONF_MEMBERS, default=defaults.get(CONF_MEMBERS, [])
            ): SelectSelector(
                SelectSelectorConfig(
                    options=_challenge_options(hass),
                    multiple=True,
                    mode=SelectSelectorMode.LIST,
                )
            ),
            vol.Required(
                CONF_RANKING,
                default=defaults.get(CONF_RANKING, RankingMetric.PERCENT.value),
            ): SelectSelector(
                SelectSelectorConfig(
                    options=[metric.value for metric in RankingMetric],
                    translation_key=CONF_RANKING,
                    mode=SelectSelectorMode.LIST,
                )
            ),
            vol.Required(SECTION_GROUP_GOAL, default={}): section(
                vol.Schema(
                    {
                        vol.Optional(
                            CONF_GROUP_GOAL,
                            description={
                                "suggested_value": defaults.get(CONF_GROUP_GOAL)
                            },
                        ): NumberSelector(
                            NumberSelectorConfig(
                                min=1,
                                max=MAX_DAY_VALUE * 1000,
                                step=1,
                                mode=NumberSelectorMode.BOX,
                            )
                        ),
                        vol.Required(
                            CONF_GROUP_GOAL_PERIOD,
                            default=defaults.get(
                                CONF_GROUP_GOAL_PERIOD, GoalPeriod.WEEK.value
                            ),
                        ): SelectSelector(
                            SelectSelectorConfig(
                                options=[period.value for period in GoalPeriod],
                                translation_key=CONF_GROUP_GOAL_PERIOD,
                                mode=SelectSelectorMode.LIST,
                            )
                        ),
                    }
                ),
                {"collapsed": not defaults.get(CONF_GROUP_GOAL)},
            ),
        }
    )


def _validate_group(
    hass: HomeAssistant, user_input: dict[str, Any], entry_id: str | None
) -> tuple[dict[str, str], dict[str, Any]]:
    """Validate the form of a group."""
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
    known = {option["value"] for option in _challenge_options(hass)}
    members = [m for m in user_input.get(CONF_MEMBERS, []) if m in known]
    if len(members) < MIN_MEMBERS:
        errors[CONF_MEMBERS] = "too_few_members"
    goal_input: dict[str, Any] = user_input.get(SECTION_GROUP_GOAL, {})
    goal_raw = goal_input.get(CONF_GROUP_GOAL)
    goal = float(goal_raw) if goal_raw not in (None, "") else None
    if goal is not None:
        if not goal.is_integer() or goal <= 0:
            errors[CONF_GROUP_GOAL] = "invalid_group_goal"
        units = {
            str(entry.options.get(CONF_UNIT))
            for member in members
            if (entry := hass.config_entries.async_get_entry(member)) is not None
        }
        if len(units) > 1:
            errors["base"] = "units_differ"
    options = {
        CONF_NAME: name,
        CONF_ICON: str(user_input[CONF_ICON]).strip() or DEFAULT_GROUP_ICON,
        CONF_MEMBERS: members,
        CONF_RANKING: user_input.get(CONF_RANKING, RankingMetric.PERCENT.value),
        CONF_GROUP_GOAL: int(goal) if goal is not None and goal.is_integer() else None,
        CONF_GROUP_GOAL_PERIOD: goal_input.get(
            CONF_GROUP_GOAL_PERIOD, GoalPeriod.WEEK.value
        ),
    }
    return errors, options


class DailyChallengeConfigFlow(ConfigFlow, domain=DOMAIN):
    """Create a new challenge."""

    VERSION = 1
    MINOR_VERSION = 1

    def __init__(self) -> None:
        """Initialize the flow."""
        self._template: dict[str, Any] = {}

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Ask what to create."""
        return self.async_show_menu(
            step_id="user", menu_options=["challenge", "template", "group"]
        )

    async def async_step_group(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Group challenges into a ranking."""
        if len(_challenge_options(self.hass)) < MIN_MEMBERS:
            return self.async_abort(reason="not_enough_challenges")
        errors: dict[str, str] = {}
        if user_input is not None:
            errors, options = _validate_group(self.hass, user_input, None)
            if not errors:
                await self.async_set_unique_id(uuid4().hex)
                name = options.pop(CONF_NAME)
                options[CONF_CREATED] = dt_util.now().date().isoformat()
                return self.async_create_entry(
                    title=name, data={CONF_KIND: KIND_GROUP}, options=options
                )
        schema = _group_schema(
            self.hass, {CONF_NAME: "", CONF_ICON: DEFAULT_GROUP_ICON}
        )
        if user_input is not None:
            schema = self.add_suggested_values_to_schema(schema, user_input)
        return self.async_show_form(step_id="group", data_schema=schema, errors=errors)

    async def async_step_template(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Pick a template that fills in the challenge form."""
        if user_input is not None:
            self._template = _template_defaults(self.hass, user_input["template"])
            return await self.async_step_challenge()
        schema = vol.Schema(
            {
                vol.Required("template"): SelectSelector(
                    SelectSelectorConfig(
                        options=list(TEMPLATES),
                        translation_key="template",
                        mode=SelectSelectorMode.LIST,
                    )
                )
            }
        )
        return self.async_show_form(step_id="template", data_schema=schema)

    async def async_step_challenge(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Enter the settings of a new challenge."""
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
            **self._template,
        }
        schema = _schema(
            self.hass, defaults, open_source=errors.get("base") == "source_is_challenge"
        )
        if user_input is not None:
            schema = self.add_suggested_values_to_schema(schema, _suggested(user_input))
        return self.async_show_form(
            step_id="challenge", data_schema=schema, errors=errors
        )

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: DailyChallengeConfigEntry,
    ) -> OptionsFlow:
        """Return the options flow of a challenge or a group."""
        if is_group(config_entry):
            return GroupOptionsFlow()
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
                await self._async_record_target_change(options)
                # Title and options in one update, so the entry reloads once.
                self.hass.config_entries.async_update_entry(
                    entry, title=name, options=options
                )
                return self.async_create_entry(data=options)

        schema = _schema(
            self.hass,
            {CONF_NAME: entry.title, **entry.options},
            open_source=errors.get("base") == "source_is_challenge",
        )
        if user_input is not None:
            schema = self.add_suggested_values_to_schema(schema, _suggested(user_input))
        return self.async_show_form(step_id="init", data_schema=schema, errors=errors)

    async def _async_record_target_change(self, options: dict[str, Any]) -> None:
        """Store a changed daily target or rise that is valid from today on.

        Past targets never change. A changed rise alone continues from the
        target valid today, so the target does not jump.
        """
        entry = self.config_entry
        old_rule = rule_from_options(entry.options)
        new_rule = rule_from_options(options)
        if new_rule == old_rule:
            return
        if entry.state is ConfigEntryState.LOADED:
            store = entry.runtime_data.store
        else:
            store = ChallengeStore(self.hass, entry.entry_id)
            await store.async_load()
        if not store.target_history:
            store.set_target(
                date.fromisoformat(entry.options[CONF_START_DATE]), old_rule
            )
        today = dt_util.now().date()
        if new_rule.target == old_rule.target:
            new_rule = rule_from_options(options, store.target_on(today))
        store.set_target(today, new_rule)
        await store.async_save()


class GroupOptionsFlow(OptionsFlow):
    """Change a group; the entry reloads afterwards."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Show the form of a group (its own step, with its own texts)."""
        return await self.async_step_group()

    async def async_step_group(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle the options form of a group."""
        entry = self.config_entry
        errors: dict[str, str] = {}
        if user_input is not None:
            errors, options = _validate_group(self.hass, user_input, entry.entry_id)
            if not errors:
                name = options.pop(CONF_NAME)
                options[CONF_CREATED] = entry.options.get(
                    CONF_CREATED, dt_util.now().date().isoformat()
                )
                self.hass.config_entries.async_update_entry(
                    entry, title=name, options=options
                )
                return self.async_create_entry(data=options)
        schema = _group_schema(self.hass, {CONF_NAME: entry.title, **entry.options})
        if user_input is not None:
            schema = self.add_suggested_values_to_schema(schema, user_input)
        return self.async_show_form(step_id="group", data_schema=schema, errors=errors)
