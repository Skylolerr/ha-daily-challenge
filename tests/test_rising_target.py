"""Tests for the rising daily target (pure calculations)."""

from __future__ import annotations

from datetime import date

from custom_components.daily_challenge.calculations import (
    ChallengeSettings,
    DeficitMode,
    Interval,
    StreakRule,
    TargetRule,
    add_months,
    calculate,
    full_intervals,
    target_on,
)

START = date(2026, 1, 5)  # a Monday


def test_full_days_and_weeks() -> None:
    assert full_intervals(START, START, Interval.DAY) == 0
    assert full_intervals(START, date(2026, 1, 9), Interval.DAY) == 4
    assert full_intervals(START, date(2026, 1, 11), Interval.WEEK) == 0
    assert full_intervals(START, date(2026, 1, 12), Interval.WEEK) == 1
    assert full_intervals(START, date(2026, 2, 1), Interval.WEEK) == 3
    assert full_intervals(START, date(2026, 1, 1), Interval.WEEK) == 0


def test_full_months_clamp_to_month_end() -> None:
    assert add_months(date(2026, 1, 31), 1) == date(2026, 2, 28)
    assert add_months(date(2028, 1, 31), 1) == date(2028, 2, 29)
    assert add_months(date(2026, 11, 15), 3) == date(2027, 2, 15)
    anchor = date(2026, 1, 31)
    assert full_intervals(anchor, date(2026, 2, 27), Interval.MONTH) == 0
    assert full_intervals(anchor, date(2026, 2, 28), Interval.MONTH) == 1
    assert full_intervals(anchor, date(2026, 3, 30), Interval.MONTH) == 1
    assert full_intervals(anchor, date(2026, 3, 31), Interval.MONTH) == 2
    assert full_intervals(anchor, date(2027, 1, 31), Interval.MONTH) == 12


def test_target_rises_every_week_up_to_the_maximum() -> None:
    history = {START: TargetRule(20, increase=5, every=Interval.WEEK, maximum=32)}
    assert target_on(history, START) == 20
    assert target_on(history, date(2026, 1, 11)) == 20
    assert target_on(history, date(2026, 1, 12)) == 25
    assert target_on(history, date(2026, 1, 19)) == 30
    assert target_on(history, date(2026, 1, 26)) == 32
    assert target_on(history, date(2027, 1, 1)) == 32


def test_a_new_entry_restarts_the_rise_from_its_own_target() -> None:
    history = {
        START: TargetRule(20, increase=1, every=Interval.DAY),
        date(2026, 1, 10): TargetRule(10),
    }
    assert target_on(history, date(2026, 1, 9)) == 24
    assert target_on(history, date(2026, 1, 10)) == 10
    assert target_on(history, date(2026, 2, 1)) == 10


def test_plain_numbers_still_work() -> None:
    assert target_on({START: 20, date(2026, 2, 1): 30}, date(2026, 2, 3)) == 30


def test_days_before_the_first_entry_use_its_starting_target() -> None:
    history = {START: TargetRule(20, increase=2, every=Interval.DAY)}
    assert target_on(history, date(2026, 1, 1)) == 20


def test_totals_follow_the_rising_target() -> None:
    settings = ChallengeSettings(START, None, StreakRule.TARGET, DeficitMode.DISPLAY)
    history = {START: TargetRule(10, increase=1, every=Interval.DAY)}
    today = date(2026, 1, 7)
    days = {START: 10, date(2026, 1, 6): 11, today: 5}
    stats = calculate(days, history, settings, today)
    assert stats.target_today == 12
    assert stats.target_to_date == 10 + 11 + 12
    assert stats.current_streak == 2
