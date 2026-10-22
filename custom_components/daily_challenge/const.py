"""Constants for the Daily Challenge integration."""

from __future__ import annotations

import logging
from typing import Final

DOMAIN: Final = "daily_challenge"
LOGGER = logging.getLogger(__package__)

STORAGE_VERSION: Final = 1
SAVE_DELAY: Final = 2

CONF_UNIT: Final = "unit"
CONF_DAILY_TARGET: Final = "daily_target"
CONF_START_DATE: Final = "start_date"
CONF_END_DATE: Final = "end_date"
CONF_STEPS: Final = "steps"
CONF_STREAK_RULE: Final = "streak_rule"
CONF_DEFICIT_MODE: Final = "deficit_mode"

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
