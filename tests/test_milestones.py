"""Tests for the milestone calculations."""

from __future__ import annotations

from datetime import date, timedelta

import pytest

from custom_components.daily_challenge.calculations import (
    ChallengeSettings,
    ChallengeStats,
    DeficitMode,
    MilestoneType,
    StreakRule,
    calculate,
    is_streak_milestone,
    reached_milestones,
    total_milestones,
)

START = date(2026, 11, 2)
ALL = set(MilestoneType)
SETTINGS = ChallengeSettings(
    start_date=START,
    end_date=None,
    streak_rule=StreakRule.TARGET,
    deficit_mode=DeficitMode.DISPLAY,
)
TARGETS = {START: 10}


def d(offset: int) -> date:
    """Return the date `offset` days after START."""
    return START + timedelta(days=offset)


def stats(days: dict[date, int], today: date) -> ChallengeStats:
    """Calculate the figures for `days` as seen on `today`."""
    return calculate(days, TARGETS, SETTINGS, today)


def change(
    days: dict[date, int], today: date, value: int, enabled: set[MilestoneType] = ALL
) -> list[tuple[MilestoneType, int]]:
    """Return the milestones reached by setting today's value to `value`."""
    old = stats(days, today)
    new = stats({**days, today: value}, today)
    return reached_milestones(old, new, enabled)


@pytest.mark.parametrize(
    ("length", "expected"),
    [
        (1, False),
        (7, True),
        (8, False),
        (365, True),
        (1000, True),
        (1250, False),
        (1500, True),
        (2000, True),
    ],
)
def test_is_streak_milestone(length: int, *, expected: bool) -> None:
    """Fixed milestones up to 1000 days, then every 500 days."""
    assert is_streak_milestone(length) is expected


def test_total_milestones() -> None:
    """Totals follow 1, 2.5 and 5 times a power of ten from 100 on."""
    assert total_milestones(99) == []
    assert total_milestones(1000) == [100, 250, 500, 1000]
    assert total_milestones(30000) == [
        100,
        250,
        500,
        1000,
        2500,
        5000,
        10000,
        25000,
    ]


def test_streak_milestone_when_today_completes_seven_days() -> None:
    """Six fulfilled days plus today's goal make a seven-day streak."""
    days = {d(i): 10 for i in range(6)}
    assert change(days, d(6), 10) == [(MilestoneType.STREAK, 7)]


def test_no_streak_milestone_below_the_goal() -> None:
    """Today below its target does not extend the streak."""
    days = {d(i): 10 for i in range(6)}
    assert change(days, d(6), 9) == []


def test_best_streak_fires_once_per_series() -> None:
    """Beating an earlier run fires once; the first run never does."""
    days = {d(i): 10 for i in range(3)}  # first run: 3 days
    assert change(days, d(2), 10) == []  # unchanged value, nothing new
    # Second run after a missed day: 3 days, today makes it 4.
    days |= {d(4): 10, d(5): 10, d(6): 10}
    assert change(days, d(7), 10) == [(MilestoneType.BEST_STREAK, 4)]
    days[d(7)] = 10
    # The next day extends the new record but fires nothing.
    assert change(days, d(8), 10) == []


def test_first_series_is_no_record() -> None:
    """Without an earlier run there is no record to beat."""
    days = {d(0): 10, d(1): 10}
    assert change(days, d(2), 10) == []


def test_best_day_fires_once_per_day() -> None:
    """Beating the best other day fires once, raising it further does not."""
    days = {d(0): 30, d(1): 10}
    assert change(days, d(2), 35) == [(MilestoneType.BEST_DAY, 35)]
    days[d(2)] = 35
    assert change(days, d(2), 40) == []


def test_best_day_needs_an_earlier_day() -> None:
    """The very first day with a value is no record."""
    assert change({}, d(0), 5) == []


def test_total_reports_only_the_highest_milestone() -> None:
    """A big jump crosses several totals but reports only the highest."""
    days = {d(0): 90}
    assert change(days, d(1), 500, {MilestoneType.TOTAL}) == [
        (MilestoneType.TOTAL, 500)
    ]


def test_only_enabled_kinds_are_reported() -> None:
    """Disabled kinds are skipped."""
    days = {d(i): 10 for i in range(6)} | {d(0): 95}
    assert change(days, d(6), 10, {MilestoneType.STREAK}) == [(MilestoneType.STREAK, 7)]
    assert change(days, d(6), 10, set()) == []


def test_several_kinds_at_once() -> None:
    """One change can reach several kinds of milestones."""
    days = {d(i): 10 for i in range(6)} | {d(0): 40}
    assert change(days, d(6), 60) == [
        (MilestoneType.STREAK, 7),
        (MilestoneType.BEST_DAY, 60),
        (MilestoneType.TOTAL, 100),
    ]
