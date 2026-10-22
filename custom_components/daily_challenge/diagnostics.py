"""Diagnostics support for Daily Challenge."""

from __future__ import annotations

from dataclasses import asdict
from datetime import date
from typing import Any

from homeassistant.core import HomeAssistant

from .coordinator import DailyChallengeConfigEntry


def _serialize(value: Any) -> Any:
    """Convert dates (also nested in dicts) to ISO strings."""
    if isinstance(value, dict):
        return {key: _serialize(item) for key, item in value.items()}
    if isinstance(value, date):
        return value.isoformat()
    return value


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant,
    entry: DailyChallengeConfigEntry,
) -> dict[str, Any]:
    """Return diagnostics for a challenge."""
    coordinator = entry.runtime_data
    days = sorted(coordinator.store.days)
    return {
        "options": dict(entry.options),
        "today": coordinator.today.isoformat(),
        "recorded_days": len(days),
        "first_date": days[0].isoformat() if days else None,
        "last_date": days[-1].isoformat() if days else None,
        "target_history": {
            day.isoformat(): target
            for day, target in sorted(coordinator.store.target_history.items())
        },
        "stats": _serialize(asdict(coordinator.data)),
    }
