"""Tests that all translation files are complete and consistent."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

import pytest

INTEGRATION = Path(__file__).parent.parent / "custom_components" / "daily_challenge"
LANGUAGES = ["de", "en", "fr", "it"]
PLACEHOLDER = re.compile(r"\{\w+\}")


def load(path: Path) -> dict[str, Any]:
    """Load a JSON file."""
    return json.loads(path.read_text(encoding="utf-8"))


def flatten(data: dict[str, Any], prefix: str = "") -> dict[str, str]:
    """Flatten nested translations into dotted keys."""
    result: dict[str, str] = {}
    for key, value in data.items():
        if isinstance(value, dict):
            result |= flatten(value, f"{prefix}{key}.")
        else:
            result[f"{prefix}{key}"] = value
    return result


def test_all_languages_present() -> None:
    """EN, DE, FR and IT are shipped."""
    files = sorted(path.stem for path in (INTEGRATION / "translations").glob("*.json"))
    assert files == LANGUAGES


def test_english_matches_strings() -> None:
    """translations/en.json is identical to strings.json."""
    assert load(INTEGRATION / "translations" / "en.json") == load(
        INTEGRATION / "strings.json"
    )


@pytest.mark.parametrize("language", LANGUAGES)
def test_translation_complete(language: str) -> None:
    """Every language has every key with the same placeholders."""
    english = flatten(load(INTEGRATION / "strings.json"))
    translated = flatten(load(INTEGRATION / "translations" / f"{language}.json"))
    assert set(translated) == set(english)
    for key, text in english.items():
        assert translated[key].strip(), key
        assert sorted(PLACEHOLDER.findall(translated[key])) == sorted(
            PLACEHOLDER.findall(text)
        ), key
