"""Constants for the Daily Challenge integration."""

from __future__ import annotations

import logging
from enum import StrEnum
from typing import Final

DOMAIN: Final = "daily_challenge"
LOGGER = logging.getLogger(__package__)

STORAGE_VERSION: Final = 1
# 2: `source` with the last reading of a counter source sensor.
STORAGE_MINOR_VERSION: Final = 2
SAVE_DELAY: Final = 2

CONF_UNIT: Final = "unit"
CONF_DAILY_TARGET: Final = "daily_target"
CONF_START_DATE: Final = "start_date"
CONF_END_DATE: Final = "end_date"
CONF_STEPS: Final = "steps"
CONF_STREAK_RULE: Final = "streak_rule"
CONF_DEFICIT_MODE: Final = "deficit_mode"
CONF_SOURCE_ENTITY: Final = "source_entity"
CONF_SOURCE_MODE: Final = "source_mode"
CONF_MILESTONES: Final = "milestones"

# Collapsible sections of the config and options form.
SECTION_SOURCE: Final = "source"
SECTION_MILESTONES: Final = "milestone_settings"

# Domains that can feed a challenge automatically.
SOURCE_DOMAINS: Final = ["sensor", "number", "input_number", "counter"]
# A counter that drops by more than this share was reset.
COUNTER_RESET_SHARE: Final = 0.1


class SourceMode(StrEnum):
    """How the state of a source sensor is turned into daily values."""

    # The state is today's value, e.g. "steps today".
    DAILY = "daily"
    # The state keeps rising, e.g. an odometer; increases are added.
    COUNTER = "counter"


DEFAULT_ICON: Final = "mdi:trophy"
DEFAULT_DAILY_TARGET: Final = 20
DEFAULT_STEPS: Final = [1, 5, 10]
MAX_STEPS: Final = 3
MAX_DAY_VALUE: Final = 100000

# Unit suggestions per language; the first entry is the default.
UNIT_SUGGESTIONS: Final[dict[str, list[str]]] = {
    "en": ["repetitions", "minutes", "km", "pages", "glasses"],
    "de": ["Wiederholungen", "Minuten", "km", "Seiten", "Gläser"],
    "fr": ["répétitions", "minutes", "km", "pages", "verres"],
    "it": ["ripetizioni", "minuti", "km", "pagine", "bicchieri"],
}

ATTR_CONFIG_ENTRY_ID: Final = "config_entry_id"
ATTR_AMOUNT: Final = "amount"
ATTR_VALUE: Final = "value"
ATTR_DATE: Final = "date"
ATTR_START: Final = "start"
ATTR_END: Final = "end"

SERVICE_ADD: Final = "add"
SERVICE_SET: Final = "set"
SERVICE_GET_HISTORY: Final = "get_history"
