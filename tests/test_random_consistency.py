# ruff: noqa: S311  (deterministic test data, not cryptography)
"""Randomised consistency checks with fixed seeds (deterministic)."""

from __future__ import annotations

import math
import random
from datetime import date, timedelta

import pytest
from homeassistant.core import HomeAssistant

from custom_components.daily_challenge.calculations import (
    ChallengeSettings,
    DeficitMode,
    MilestoneType,
    StreakRule,
    calculate,
    reached_milestones,
    total_milestones,
)
from custom_components.daily_challenge.const import DOMAIN

from .common import MockConfigEntry
from .conftest import make_options

START = date(2026, 1, 5)  # a Monday
SOURCE = "sensor.odometer"


def random_case(
    rng: random.Random,
) -> tuple[dict[date, int], dict[date, int], ChallengeSettings, date]:
    """Return random days, targets, settings and today."""
    length = rng.randint(1, 120)
    today = START + timedelta(days=length - 1)
    targets = {START: rng.randint(1, 50)}
    for _ in range(rng.randint(0, 3)):
        targets[START + timedelta(days=rng.randint(0, length - 1))] = rng.randint(1, 50)
    days = {
        START + timedelta(days=i): rng.randint(1, 80)
        for i in range(length)
        if rng.random() < 0.8
    }
    end = None
    if rng.random() < 0.3:
        end = START + timedelta(days=rng.randint(1, length + 20))
    settings = ChallengeSettings(
        start_date=START,
        end_date=end,
        streak_rule=rng.choice(list(StreakRule)),
        deficit_mode=rng.choice(list(DeficitMode)),
    )
    return days, targets, settings, today


@pytest.mark.parametrize("seed", range(300))
def test_invariants(seed: int) -> None:
    """Figures that must always fit together."""
    rng = random.Random(seed)
    days, targets, settings, today = random_case(rng)
    stats = calculate(days, targets, settings, today)
    last = min(today, settings.end_date) if settings.end_date else today
    assert stats.total == sum(v for d, v in days.items() if START <= d <= last)
    assert stats.best_streak.length >= stats.current_streak
    assert stats.previous_best_streak <= stats.best_streak.length
    assert 0 <= stats.week_goal_days <= stats.week_days <= 7
    assert 0 <= stats.week_fulfilled_days <= stats.week_days
    assert (
        stats.this_week <= stats.this_month
        or today.month != (today - timedelta(days=today.weekday())).month
    )
    assert stats.this_year <= stats.total
    assert stats.best_day_before_today <= stats.best_day_value
    if stats.end_target is not None:
        assert stats.remaining == max(0, stats.end_target - stats.total)


@pytest.mark.parametrize("seed", range(100))
def test_total_milestones_fire_once_each(seed: int) -> None:
    """Adding to today one by one reports every total milestone exactly once."""
    rng = random.Random(seed)
    days, targets, settings, today = random_case(rng)
    settings = ChallengeSettings(
        START, None, settings.streak_rule, settings.deficit_mode
    )
    days.pop(today, None)
    old = calculate(days, targets, settings, today)
    first_total = old.total
    reported = []
    for value in range(1, rng.randint(1, 400)):
        new = calculate({**days, today: value}, targets, settings, today)
        reported += [
            v for kind, v in reached_milestones(old, new, {MilestoneType.TOTAL})
        ]
        old = new
    expected = [m for m in total_milestones(old.total) if m > first_total]
    assert reported == expected


@pytest.mark.parametrize("seed", range(100))
def test_best_day_and_record_streak_fire_at_most_once_per_day(seed: int) -> None:
    """Raising today's value never reports the same record twice."""
    rng = random.Random(seed)
    days, targets, settings, today = random_case(rng)
    settings = ChallengeSettings(
        START, None, settings.streak_rule, settings.deficit_mode
    )
    days.pop(today, None)
    old = calculate(days, targets, settings, today)
    kinds = []
    for value in range(1, 200):
        new = calculate({**days, today: value}, targets, settings, today)
        kinds += [kind for kind, _ in reached_milestones(old, new, set(MilestoneType))]
        old = new
    assert kinds.count(MilestoneType.BEST_DAY) <= 1
    assert kinds.count(MilestoneType.BEST_STREAK) <= 1


@pytest.mark.parametrize("seed", range(15))
async def test_counter_adds_exactly_the_rise(hass: HomeAssistant, seed: int) -> None:
    """A rising counter with random steps and glitches adds its whole rise."""
    rng = random.Random(seed)
    reading = rng.uniform(0, 5000)
    hass.states.async_set(SOURCE, f"{reading:.3f}")
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Push-ups",
        unique_id="0123456789abcdef",
        entry_id="push_ups",
        data={},
        options=make_options(source_entity=SOURCE, source_mode="counter"),
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    start = float(f"{reading:.3f}")
    for _ in range(rng.randint(5, 60)):
        roll = rng.random()
        if roll < 0.1:
            # A glitch: the device reports 0 or "unavailable" for a moment.
            for _ in range(rng.randint(1, 3)):
                hass.states.async_set(
                    SOURCE,
                    rng.choice(["0", "unavailable", "unknown"]),
                    {"n": rng.random()},
                )
                await hass.async_block_till_done()
        elif roll < 0.15:
            # A small correction downwards, ignored.
            hass.states.async_set(SOURCE, f"{reading * 0.97:.3f}")
            await hass.async_block_till_done()
        reading += rng.choice([0.0, rng.uniform(0, 3), rng.uniform(0, 400)])
        hass.states.async_set(SOURCE, f"{reading:.3f}")
        await hass.async_block_till_done()
    end = float(f"{reading:.3f}")
    total = int(hass.states.get("sensor.push_ups_total").state)
    assert total == math.floor(round(end - start, 6))
