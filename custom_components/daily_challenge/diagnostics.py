"""Diagnostics support for Daily Challenge."""

from __future__ import annotations

from dataclasses import asdict
from datetime import date
from typing import Any

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant

from .coordinator import ChallengeCoordinator, DailyChallengeConfigEntry, rule_to_data
from .groups import group_coordinator, group_status_response, is_group


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
    coordinator: ChallengeCoordinator | None = getattr(entry, "runtime_data", None)
    if entry.state is not ConfigEntryState.LOADED or coordinator is None:
        # Disabled or failed to set up: there is no data to show.
        return {"options": dict(entry.options), "state": entry.state.value}
    if is_group(entry):
        return {
            "options": dict(entry.options),
            "group": group_status_response(group_coordinator(entry)),
        }
    days = sorted(coordinator.store.days)
    return {
        "options": dict(entry.options),
        "today": coordinator.today.isoformat(),
        "recorded_days": len(days),
        "first_date": days[0].isoformat() if days else None,
        "last_date": days[-1].isoformat() if days else None,
        "target_history": {
            day.isoformat(): rule_to_data(rule)
            for day, rule in sorted(coordinator.store.target_history.items())
        },
        "stats": _serialize(asdict(coordinator.data)),
    }
