"""Tests for the pure calculation functions."""

from __future__ import annotations

from datetime import date, timedelta

import pytest

from custom_components.daily_challenge.calculations import (
    ChallengeSettings,
    ChallengeStatus,
    DeficitMode,
    StreakRule,
    build_history,
    calculate,
    fulfilled_days,
    target_on,
)

START = date(2026, 11, 2)  # a Monday


def d(offset: int) -> date:
    """Return the date `offset` days after START."""
    return START + timedelta(days=offset)


def settings(
    *,
    start: date = START,
    end: date | None = None,
    streak_rule: StreakRule = StreakRule.TARGET,
    deficit_mode: DeficitMode = DeficitMode.DISPLAY,
) -> ChallengeSettings:
    """Build challenge settings with sensible defaults."""
    return ChallengeSettings(
        start_date=start,
        end_date=end,
        streak_rule=streak_rule,
        deficit_mode=deficit_mode,
    )


TARGETS_20 = {START: 20}


# --- target_on -------------------------------------------------------------


def test_target_on_uses_last_entry_on_or_before_day() -> None:
    history = {d(0): 20, d(5): 25, d(10): 30}
    assert target_on(history, d(0)) == 20
    assert target_on(history, d(4)) == 20
    assert target_on(history, d(5)) == 25
    assert target_on(history, d(9)) == 25
    assert target_on(history, d(10)) == 30
    assert target_on(history, d(100)) == 30


def test_target_on_before_first_entry_falls_back_to_first_target() -> None:
    """A start date moved backwards uses the earliest known target."""
    assert target_on({d(5): 25, d(10): 30}, d(0)) == 25


def test_target_on_empty_history() -> None:
    assert target_on({}, d(0)) == 0


# --- empty history / status ------------------------------------------------


def test_empty_history_on_start_day() -> None:
    stats = calculate({}, TARGETS_20, settings(), today=START)
    assert stats.status is ChallengeStatus.ACTIVE
    assert stats.value_today == 0
    assert stats.total == 0
    assert stats.target_to_date == 20
    assert stats.delta == -20
    assert stats.deficit_until_yesterday == 0
    assert stats.target_today == 20
    assert stats.effective_target_today == 20
    assert stats.progress_today == 0
    assert stats.goal_reached_today is False
    assert stats.average_per_day == 0
    assert stats.best_day_value == 0
    assert stats.best_day_date is None
    assert stats.current_streak == 0
    assert stats.best_streak.length == 0
    assert stats.best_streak.start is None
    assert stats.best_streak.end is None
    assert stats.end_target is None
    assert stats.remaining is None
    assert (stats.this_week, stats.this_month, stats.this_year) == (0, 0, 0)


def test_not_started_yet() -> None:
    """A start date in the future yields neutral values."""
    stats = calculate({}, {d(3): 20}, settings(start=d(3)), today=d(0))
    assert stats.status is ChallengeStatus.NOT_STARTED
    assert stats.total == 0
    assert stats.target_to_date == 0
    assert stats.delta == 0
    assert stats.target_today is None
    assert stats.effective_target_today is None
    assert stats.progress_today is None
    assert stats.goal_reached_today is None
    assert stats.current_streak == 0
    assert stats.average_per_day == 0


# --- basic figures ---------------------------------------------------------


def test_totals_delta_average_and_best_day() -> None:
    days = {d(0): 20, d(1): 30, d(2): 10, d(3): 30}
    stats = calculate(days, TARGETS_20, settings(), today=d(3))
    assert stats.value_today == 30
    assert stats.total == 90
    assert stats.target_to_date == 80
    assert stats.delta == 10
    assert stats.average_per_day == 22.5
    # Ties keep the most recent day.
    assert stats.best_day_value == 30
    assert stats.best_day_date == d(3)


def test_average_is_rounded_to_one_decimal() -> None:
    days = {d(0): 10, d(1): 10, d(2): 1}
    stats = calculate(days, TARGETS_20, settings(), today=d(2))
    assert stats.average_per_day == 7.0
    stats = calculate({d(0): 10}, TARGETS_20, settings(), today=d(2))
    assert stats.average_per_day == 3.3


def test_progress_and_goal_reached() -> None:
    stats = calculate({d(0): 15}, TARGETS_20, settings(), today=d(0))
    assert stats.progress_today == 75.0
    assert stats.goal_reached_today is False
    stats = calculate({d(0): 20}, TARGETS_20, settings(), today=d(0))
    assert stats.progress_today == 100.0
    assert stats.goal_reached_today is True


def test_progress_is_capped_at_999() -> None:
    stats = calculate({d(0): 1000}, TARGETS_20, settings(), today=d(0))
    assert stats.progress_today == 999


def test_values_outside_the_period_are_ignored() -> None:
    """Days before a (moved) start date are kept but not counted."""
    days = {d(0): 50, d(1): 50, d(2): 5}
    stats = calculate(days, {d(0): 20}, settings(start=d(2)), today=d(2))
    assert stats.total == 5
    assert stats.target_to_date == 20
    assert stats.best_day_value == 5
    assert stats.average_per_day == 5


def test_week_month_year_sums() -> None:
    """The week starts on Monday (ISO)."""
    start = date(2026, 10, 1)
    days = {
        date(2026, 10, 1): 1,
        date(2026, 10, 31): 2,  # Saturday of the previous week
        date(2026, 11, 2): 4,  # Monday
        date(2026, 11, 4): 8,  # Wednesday (today)
    }
    stats = calculate(days, {start: 20}, settings(start=start), today=date(2026, 11, 4))
    assert stats.this_week == 12
    assert stats.this_month == 12
    assert stats.this_year == 15


def test_year_sum_resets_on_new_year() -> None:
    start = date(2026, 12, 28)
    days = {date(2026, 12, 28): 5, date(2027, 1, 1): 7}
    stats = calculate(days, {start: 20}, settings(start=start), today=date(2027, 1, 1))
    # Same ISO week across the year boundary.
    assert stats.this_week == 12
    assert stats.this_month == 7
    assert stats.this_year == 7


# --- streaks: display mode -------------------------------------------------


def test_streak_rule_target_display_mode() -> None:
    days = {d(0): 20, d(1): 5, d(2): 20, d(3): 25, d(4): 20}
    stats = calculate(days, TARGETS_20, settings(), today=d(4))
    assert stats.current_streak == 3
    assert stats.best_streak.length == 3
    assert stats.best_streak.start == d(2)
    assert stats.best_streak.end == d(4)


def test_unfinished_today_does_not_break_streak() -> None:
    days = {d(0): 20, d(1): 20, d(2): 3}
    stats = calculate(days, TARGETS_20, settings(), today=d(2))
    assert stats.current_streak == 2
    stats = calculate({**days, d(2): 20}, TARGETS_20, settings(), today=d(2))
    assert stats.current_streak == 3


def test_missed_yesterday_breaks_streak_in_display_mode() -> None:
    days = {d(0): 20, d(1): 20, d(2): 0, d(3): 3}
    stats = calculate(days, TARGETS_20, settings(), today=d(3))
    assert stats.current_streak == 0
    assert stats.best_streak.length == 2
    assert stats.best_streak.start == d(0)
    assert stats.best_streak.end == d(1)


def test_best_streak_prefers_most_recent_on_tie() -> None:
    days = {d(0): 20, d(1): 20, d(3): 20, d(4): 20}
    stats = calculate(days, TARGETS_20, settings(), today=d(5))
    assert stats.current_streak == 2
    assert stats.best_streak.start == d(3)
    assert stats.best_streak.end == d(4)


def test_streak_rule_any() -> None:
    days = {d(0): 1, d(1): 3, d(2): 0, d(3): 2, d(4): 1}
    stats = calculate(
        days, TARGETS_20, settings(streak_rule=StreakRule.ANY), today=d(4)
    )
    assert stats.current_streak == 2
    assert stats.best_streak.length == 2
    assert stats.best_streak.end == d(4)
    # Goal reached still uses the target.
    assert stats.goal_reached_today is False


def test_streak_rule_any_ignores_catch_up() -> None:
    days = {d(0): 1, d(1): 1, d(2): 1}
    stats = calculate(
        days,
        TARGETS_20,
        settings(streak_rule=StreakRule.ANY, deficit_mode=DeficitMode.CATCH_UP),
        today=d(2),
    )
    assert stats.current_streak == 3


# --- catch-up mode ---------------------------------------------------------


CATCH_UP = settings(deficit_mode=DeficitMode.CATCH_UP)


def test_catch_up_adds_deficit_to_todays_target() -> None:
    days = {d(0): 20, d(1): 10, d(2): 15}
    stats = calculate(days, TARGETS_20, CATCH_UP, today=d(3))
    assert stats.deficit_until_yesterday == 15
    assert stats.target_today == 20
    assert stats.effective_target_today == 35
    assert stats.goal_reached_today is False


def test_display_mode_keeps_plain_target_but_shows_deficit() -> None:
    days = {d(0): 20, d(1): 10}
    stats = calculate(days, TARGETS_20, settings(), today=d(2))
    assert stats.deficit_until_yesterday == 10
    assert stats.effective_target_today == 20
    assert stats.delta == -30


def test_catch_up_surplus_does_not_lower_todays_target() -> None:
    days = {d(0): 50}
    stats = calculate(days, TARGETS_20, CATCH_UP, today=d(1))
    assert stats.deficit_until_yesterday == 0
    assert stats.effective_target_today == 20
    assert stats.delta == 10


def test_catch_up_goal_reached_with_deficit() -> None:
    days = {d(0): 10, d(1): 30}
    stats = calculate(days, TARGETS_20, CATCH_UP, today=d(1))
    assert stats.effective_target_today == 30
    assert stats.progress_today == 100
    assert stats.goal_reached_today is True


def test_catch_up_day_repaired_on_following_day() -> None:
    """A missed day counts as fulfilled once the next day clears the deficit."""
    days = {d(0): 20, d(1): 5, d(2): 35, d(3): 20}
    stats = calculate(days, TARGETS_20, CATCH_UP, today=d(3))
    assert stats.current_streak == 4
    assert fulfilled_days(days, TARGETS_20, CATCH_UP, today=d(3)) == {
        d(0): True,
        d(1): True,
        d(2): True,
        d(3): True,
    }


def test_catch_up_day_not_repaired_within_following_day_breaks_streak() -> None:
    """Clearing the deficit two days later only rescues the later days."""
    days = {d(0): 20, d(1): 5, d(2): 20, d(3): 35}
    fulfilled = fulfilled_days(days, TARGETS_20, CATCH_UP, today=d(3))
    assert fulfilled == {d(0): True, d(1): False, d(2): True, d(3): True}
    stats = calculate(days, TARGETS_20, CATCH_UP, today=d(3))
    assert stats.current_streak == 2
    assert stats.best_streak.length == 2


def test_catch_up_yesterday_is_still_rescuable_today() -> None:
    """A short yesterday neither counts nor breaks the streak during today."""
    days = {d(0): 20, d(1): 20, d(2): 5, d(3): 10}
    stats = calculate(days, TARGETS_20, CATCH_UP, today=d(3))
    assert stats.effective_target_today == 35
    assert stats.current_streak == 2
    # Today clears the deficit: yesterday is repaired and today counts too.
    days[d(3)] = 35
    stats = calculate(days, TARGETS_20, CATCH_UP, today=d(3))
    assert stats.goal_reached_today is True
    assert stats.current_streak == 4


def test_catch_up_rescue_window_closes_at_midnight() -> None:
    days = {d(0): 20, d(1): 20, d(2): 5, d(3): 10}
    stats = calculate(days, TARGETS_20, CATCH_UP, today=d(4))
    assert stats.current_streak == 0
    assert stats.best_streak.length == 2


def test_catch_up_surplus_covers_a_later_day() -> None:
    """With a cumulative surplus there is no deficit, so the day is fulfilled."""
    days = {d(0): 40, d(2): 20}
    fulfilled = fulfilled_days(days, TARGETS_20, CATCH_UP, today=d(2))
    assert fulfilled == {d(0): True, d(1): True, d(2): True}


def test_display_mode_fulfilled_days() -> None:
    days = {d(0): 40, d(2): 20}
    fulfilled = fulfilled_days(days, TARGETS_20, settings(), today=d(2))
    assert fulfilled == {d(0): True, d(1): False, d(2): True}


# --- target changes --------------------------------------------------------


def test_target_change_keeps_past_targets() -> None:
    """A higher target from day 2 on does not affect earlier days."""
    history = {d(0): 20, d(2): 30}
    days = {d(0): 20, d(1): 20, d(2): 25}
    stats = calculate(days, history, settings(), today=d(2))
    assert stats.target_to_date == 70
    assert stats.total == 65
    assert stats.delta == -5
    assert stats.target_today == 30
    assert stats.current_streak == 2
    assert stats.goal_reached_today is False


def test_target_change_in_catch_up_mode() -> None:
    history = {d(0): 20, d(1): 10}
    days = {d(0): 15, d(1): 10}
    stats = calculate(
        days, history, settings(deficit_mode=DeficitMode.CATCH_UP), today=d(2)
    )
    assert stats.deficit_until_yesterday == 5
    assert stats.effective_target_today == 15


# --- end date --------------------------------------------------------------


def test_end_date_remaining() -> None:
    history = {d(0): 20, d(5): 30}
    end = d(9)
    days = {d(0): 20, d(1): 25}
    stats = calculate(days, history, settings(end=end), today=d(1))
    # 5 days at 20 + 5 days at 30
    assert stats.end_target == 250
    assert stats.remaining == 205
    assert stats.status is ChallengeStatus.ACTIVE


def test_remaining_never_negative() -> None:
    stats = calculate({d(0): 100}, TARGETS_20, settings(end=d(1)), today=d(0))
    assert stats.end_target == 40
    assert stats.remaining == 0


def test_after_end_date() -> None:
    days = {d(0): 20, d(1): 20, d(2): 20, d(5): 99}
    stats = calculate(days, TARGETS_20, settings(end=d(2)), today=d(5))
    assert stats.status is ChallengeStatus.ENDED
    assert stats.value_today == 0
    assert stats.total == 60
    assert stats.target_to_date == 60
    assert stats.delta == 0
    assert stats.remaining == 0
    assert stats.target_today is None
    assert stats.effective_target_today is None
    assert stats.progress_today is None
    assert stats.goal_reached_today is None
    assert stats.current_streak == 3
    assert stats.best_streak.end == d(2)
    assert stats.average_per_day == 20
    assert stats.best_day_value == 20


def test_last_day_is_final_in_catch_up_mode() -> None:
    """The end date has no following day to repair it."""
    days = {d(0): 20, d(1): 5}
    fulfilled = fulfilled_days(
        days,
        TARGETS_20,
        settings(end=d(1), deficit_mode=DeficitMode.CATCH_UP),
        today=d(2),
    )
    assert fulfilled == {d(0): True, d(1): False}


def test_end_date_is_today() -> None:
    stats = calculate({d(0): 20, d(1): 20}, TARGETS_20, settings(end=d(1)), today=d(1))
    assert stats.status is ChallengeStatus.ACTIVE
    assert stats.goal_reached_today is True
    assert stats.current_streak == 2


# --- days left and required average --------------------------------------


def test_no_end_date_has_no_days_left() -> None:
    stats = calculate({d(0): 20}, TARGETS_20, settings(), today=d(0))
    assert stats.days_left is None
    assert stats.required_per_day is None


def test_required_per_day_until_the_end() -> None:
    """The average still needed per day, today included, from the end goal."""
    days = {d(0): 20, d(1): 25, d(2): 5}
    stats = calculate(days, TARGETS_20, settings(end=d(9)), today=d(2))
    assert stats.days_left == 8
    # 200 - 45 done before today, spread over 8 days
    assert stats.required_per_day == 19.4


def test_required_per_day_ignores_todays_progress() -> None:
    """The figure stays stable during the day; today's amount counts tomorrow."""
    days = {d(0): 20, d(1): 25, d(2): 50}
    stats = calculate(days, TARGETS_20, settings(end=d(9)), today=d(2))
    assert stats.required_per_day == 19.4
    tomorrow = calculate(days, TARGETS_20, settings(end=d(9)), today=d(3))
    assert tomorrow.days_left == 7
    assert tomorrow.required_per_day == 15.0


def test_required_per_day_follows_target_changes() -> None:
    history = {d(0): 20, d(5): 30}
    stats = calculate({}, history, settings(end=d(9)), today=d(0))
    assert stats.days_left == 10
    assert stats.required_per_day == 25.0


def test_required_per_day_on_the_last_day() -> None:
    days = {d(0): 20}
    stats = calculate(days, TARGETS_20, settings(end=d(1)), today=d(1))
    assert stats.days_left == 1
    assert stats.required_per_day == 20.0


def test_required_per_day_once_the_goal_is_reached() -> None:
    days = {d(0): 100}
    stats = calculate(days, TARGETS_20, settings(end=d(3)), today=d(1))
    assert stats.days_left == 3
    assert stats.required_per_day == 0.0


def test_days_left_before_the_start() -> None:
    stats = calculate({}, {d(3): 20}, settings(start=d(3), end=d(12)), today=d(0))
    assert stats.days_left == 10
    assert stats.required_per_day == 20.0


def test_days_left_after_the_end() -> None:
    stats = calculate({d(0): 20}, TARGETS_20, settings(end=d(1)), today=d(3))
    assert stats.days_left == 0
    assert stats.required_per_day is None


# --- midnight and daylight saving time ------------------------------------


def test_midnight_starts_a_new_day_without_reset() -> None:
    """The rollover only reads a new date key; stored values stay untouched."""
    days = {d(0): 20, d(1): 20}
    before = calculate(days, TARGETS_20, settings(), today=d(1))
    after = calculate(days, TARGETS_20, settings(), today=d(2))
    assert before.value_today == 20
    assert before.goal_reached_today is True
    assert before.current_streak == 2
    assert after.value_today == 0
    assert after.goal_reached_today is False
    assert after.current_streak == 2
    assert after.total == 40
    assert after.target_to_date == 60
    assert days == {d(0): 20, d(1): 20}


@pytest.mark.parametrize(
    "dst_day",
    [date(2026, 3, 29), date(2026, 10, 25)],
    ids=["spring_forward", "fall_back"],
)
def test_dst_changeover_days_count_as_single_days(dst_day: date) -> None:
    """Days spanning a DST change (Europe/Zurich) are counted by date, not hours."""
    start = dst_day - timedelta(days=2)
    days = {start + timedelta(days=i): 20 for i in range(5)}
    today = dst_day + timedelta(days=2)
    stats = calculate(days, {start: 20}, settings(start=start), today=today)
    assert stats.target_to_date == 100
    assert stats.total == 100
    assert stats.average_per_day == 20
    assert stats.current_streak == 5


# --- history ---------------------------------------------------------------


def test_build_history_default_range() -> None:
    history = {d(0): 20, d(2): 30}
    days = {d(0): 20, d(2): 10}
    result = build_history(days, history, settings(), today=d(2))
    assert result.days == {d(0): 20, d(2): 10}
    assert result.targets == {d(0): 20, d(1): 20, d(2): 30}
    assert result.fulfilled == {d(0): True, d(1): False, d(2): False}


def test_build_history_custom_range_is_clamped_to_period() -> None:
    days = {d(0): 20, d(1): 20, d(2): 20, d(3): 20}
    result = build_history(
        days,
        TARGETS_20,
        settings(start=d(1)),
        today=d(3),
        start=d(-5),
        end=d(2),
    )
    assert result.days == {d(1): 20, d(2): 20}
    assert set(result.targets) == {d(1), d(2)}
    assert set(result.fulfilled) == {d(1), d(2)}


def test_build_history_empty_range() -> None:
    result = build_history({}, TARGETS_20, settings(), today=d(3), start=d(10))
    assert result.days == {}
    assert result.targets == {}
    assert result.fulfilled == {}
