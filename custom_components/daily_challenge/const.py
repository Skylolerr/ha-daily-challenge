"""Constants for the Daily Challenge integration."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from enum import StrEnum
from typing import Final

DOMAIN: Final = "daily_challenge"
LOGGER = logging.getLogger(__package__)

STORAGE_VERSION: Final = 1
# 2: `source` with the last reading of a counter source sensor.
# 3: entries of `target_history` are objects with an optional rising target.
STORAGE_MINOR_VERSION: Final = 3
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
CONF_PERSON: Final = "person"
CONF_TARGET_INCREASE: Final = "target_increase"
CONF_TARGET_INCREASE_EVERY: Final = "target_increase_every"
CONF_TARGET_MAX: Final = "target_max"

# Groups: a config entry with data {"kind": "group"} ranks challenges.
CONF_KIND: Final = "kind"
KIND_GROUP: Final = "group"
CONF_MEMBERS: Final = "members"
CONF_RANKING: Final = "ranking"
CONF_GROUP_GOAL: Final = "group_goal"
CONF_GROUP_GOAL_PERIOD: Final = "group_goal_period"
# The day the group was created; week winners count from its week on.
CONF_CREATED: Final = "created"
SECTION_GROUP_GOAL: Final = "goal_settings"
MIN_MEMBERS: Final = 2

# Collapsible sections of the config and options form.
SECTION_SOURCE: Final = "source"
SECTION_MILESTONES: Final = "milestone_settings"
SECTION_RISING: Final = "rising_target"

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


@dataclass(frozen=True, slots=True)
class ChallengeTemplate:
    """Prefilled values for a new challenge."""

    icon: str
    daily_target: int
    steps: tuple[int, ...]
    unit: str  # key of TEMPLATE_UNITS


TEMPLATES: Final[dict[str, ChallengeTemplate]] = {
    "push_ups": ChallengeTemplate("mdi:arm-flex", 20, (1, 5, 10), "repetitions"),
    "squats": ChallengeTemplate("mdi:human-handsdown", 30, (5, 10, 20), "repetitions"),
    "steps": ChallengeTemplate("mdi:walk", 10000, (500, 1000, 2000), "steps"),
    "water": ChallengeTemplate("mdi:cup-water", 2000, (250, 330, 500), "ml"),
    "reading": ChallengeTemplate("mdi:book-open-variant", 30, (5, 10, 15), "minutes"),
    "meditation": ChallengeTemplate("mdi:meditation", 10, (1, 5, 10), "minutes"),
    "running": ChallengeTemplate("mdi:run", 3, (1, 2, 5), "km"),
    "cycling": ChallengeTemplate("mdi:bike", 10, (5, 10, 20), "km"),
}

# Units and names of the templates per language (fallback English).
TEMPLATE_UNITS: Final[dict[str, dict[str, str]]] = {
    "en": {"repetitions": "repetitions", "steps": "steps", "minutes": "minutes"},
    "de": {"repetitions": "Wiederholungen", "steps": "Schritte", "minutes": "Minuten"},
    "fr": {"repetitions": "répétitions", "steps": "pas", "minutes": "minutes"},
    "it": {"repetitions": "ripetizioni", "steps": "passi", "minutes": "minuti"},
}
TEMPLATE_NAMES: Final[dict[str, dict[str, str]]] = {
    "en": {
        "push_ups": "Push-ups",
        "squats": "Squats",
        "steps": "Steps",
        "water": "Water",
        "reading": "Reading",
        "meditation": "Meditation",
        "running": "Running",
        "cycling": "Cycling",
    },
    "de": {
        "push_ups": "Liegestütze",
        "squats": "Kniebeugen",
        "steps": "Schritte",
        "water": "Wasser",
        "reading": "Lesen",
        "meditation": "Meditation",
        "running": "Laufen",
        "cycling": "Radfahren",
    },
    "fr": {
        "push_ups": "Pompes",
        "squats": "Squats",
        "steps": "Pas",
        "water": "Eau",
        "reading": "Lecture",
        "meditation": "Méditation",
        "running": "Course à pied",
        "cycling": "Vélo",
    },
    "it": {
        "push_ups": "Flessioni",
        "squats": "Squat",
        "steps": "Passi",
        "water": "Acqua",
        "reading": "Lettura",
        "meditation": "Meditazione",
        "running": "Corsa",
        "cycling": "Bici",
    },
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
SERVICE_GET_STATUS: Final = "get_status"
