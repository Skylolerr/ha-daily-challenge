"""Tests for the group calculations (pure functions)."""

from __future__ import annotations

from datetime import date, timedelta

from custom_components.daily_challenge.calculations import (
    ChallengeSettings,
    DeficitMode,
    GoalPeriod,
    Member,
    RankingMetric,
    RankingPeriod,
    Score,
    StreakRule,
    all_reached_today,
    goal_progress,
    group_streak,
    leaders,
    member_score,
    period_start,
    rank,
    ranking,
    week_winners,
)

MONDAY = date(2026, 11, 2)
TODAY = date(2026, 11, 4)  # Wednesday


def d(offset: int) -> date:
    """Return the date `offset` days after Monday 2026-11-02."""
    return MONDAY + timedelta(days=offset)


def member(
    key: str,
    days: dict[date, int],
    target: int = 10,
    start: date = date(2026, 10, 1),
    end: date | None = None,
) -> Member:
    """Return a member with a fixed daily target."""
    return Member(
        key,
        days,
        {start: target},
        ChallengeSettings(start, end, StreakRule.TARGET, DeficitMode.DISPLAY),
    )


def test_period_start() -> None:
    assert period_start(RankingPeriod.TODAY, TODAY) == TODAY
    assert period_start(RankingPeriod.WEEK, TODAY) == MONDAY
    assert period_start(RankingPeriod.MONTH, TODAY) == date(2026, 11, 1)
    assert period_start(RankingPeriod.TOTAL, TODAY) is None
    assert period_start(GoalPeriod.YEAR, TODAY) == date(2026, 1, 1)
    assert period_start(GoalPeriod.WEEK, TODAY) == MONDAY


def test_member_score_for_the_week() -> None:
    anna = member("anna", {d(0): 10, d(1): 10, d(2): 4, d(-1): 50})
    score = member_score(anna, RankingPeriod.WEEK, TODAY)
    assert (score.amount, score.target, score.percent, score.streak) == (
        24,
        30,
        80.0,
        3,
    )


def test_member_score_only_within_the_challenge() -> None:
    late = member("late", {d(2): 5}, start=d(2))
    score = member_score(late, RankingPeriod.WEEK, TODAY)
    assert (score.amount, score.target) == (5, 10)
    future = member("future", {}, start=d(5))
    assert member_score(future, RankingPeriod.WEEK, TODAY).target == 0
    assert member_score(future, RankingPeriod.WEEK, TODAY).percent == 0.0


def test_percent_makes_different_targets_fair() -> None:
    kid = member("kid", {TODAY: 10}, target=10)
    adult = member("adult", {TODAY: 20}, target=30)
    by_percent = ranking(
        [kid, adult], RankingMetric.PERCENT, RankingPeriod.TODAY, TODAY
    )
    assert [s.key for s in by_percent] == ["kid", "adult"]
    by_amount = ranking([kid, adult], RankingMetric.AMOUNT, RankingPeriod.TODAY, TODAY)
    assert [s.key for s in by_amount] == ["adult", "kid"]


def test_ties_share_a_rank() -> None:
    scores = [
        Score("a", 5, 10, 50.0, 1),
        Score("b", 8, 10, 80.0, 1),
        Score("c", 8, 10, 80.0, 2),
        Score("d", 0, 10, 0.0, 0),
    ]
    ranked = rank(scores, RankingMetric.AMOUNT)
    assert [(s.key, s.rank) for s in ranked] == [
        ("b", 1),
        ("c", 1),
        ("a", 3),
        ("d", 4),
    ]
    assert leaders(ranked, RankingMetric.AMOUNT) == ["b", "c"]
    ranked = rank(scores, RankingMetric.STREAK)
    assert ranked[0].key == "c"


def test_nobody_leads_with_nothing_done() -> None:
    scores = [Score("a", 0, 10, 0.0, 0), Score("b", 0, 10, 0.0, 0)]
    assert leaders(rank(scores, RankingMetric.PERCENT), RankingMetric.PERCENT) == []


def test_group_streak_needs_everybody() -> None:
    anna = member("anna", {d(0): 10, d(1): 10, d(2): 10, d(-1): 10})
    tom = member("tom", {d(0): 10, d(1): 10, d(-1): 5, d(-2): 10})
    # Sunday Tom missed; Monday and Tuesday both did it; today Tom is open.
    assert group_streak([anna, tom], TODAY) == (2, 2)
    tom_done = member("tom", {**tom.days, d(2): 10})
    assert group_streak([anna, tom_done], TODAY) == (3, 3)


def test_group_streak_with_a_member_that_starts_later() -> None:
    anna = member("anna", {d(-1): 10, d(0): 10, d(1): 10}, start=d(-1))
    tom = member("tom", {d(1): 10}, start=d(1))
    # Before Tuesday only Anna runs; from Tuesday both.
    assert group_streak([anna, tom], TODAY) == (3, 3)


def test_group_streak_edge_cases() -> None:
    assert group_streak([], TODAY) == (0, 0)
    assert group_streak([member("a", {}, start=d(5))], TODAY) == (0, 0)


def test_all_reached_today() -> None:
    anna = member("anna", {TODAY: 10})
    tom = member("tom", {TODAY: 9})
    assert all_reached_today([anna], TODAY)
    assert not all_reached_today([anna, tom], TODAY)
    ended = member("ended", {}, end=d(-1))
    assert all_reached_today([anna, ended], TODAY)
    assert not all_reached_today([ended], TODAY)


def test_week_winners() -> None:
    # Two finished weeks since Monday 2026-10-19.
    anna = member("anna", {date(2026, 10, 20): 30, date(2026, 10, 27): 5})
    tom = member("tom", {date(2026, 10, 21): 10, date(2026, 10, 28): 5})
    winners = week_winners([anna, tom], RankingMetric.AMOUNT, date(2026, 10, 22), TODAY)
    assert winners == {
        date(2026, 10, 19): ["anna"],
        date(2026, 10, 26): ["anna", "tom"],
    }
    # The running week never counts; a week nobody did anything is left out.
    nobody = week_winners([member("x", {})], RankingMetric.AMOUNT, MONDAY, TODAY)
    assert nobody == {}
    quiet = week_winners(
        [member("x", {})], RankingMetric.PERCENT, date(2026, 10, 19), TODAY
    )
    assert quiet == {}


def test_week_winner_by_streak_at_the_end_of_the_week() -> None:
    anna = member("anna", {date(2026, 10, 30): 10, date(2026, 10, 31): 10, d(-1): 10})
    tom = member("tom", {d(-1): 10})
    winners = week_winners([anna, tom], RankingMetric.STREAK, d(-7), TODAY)
    assert winners == {date(2026, 10, 26): ["anna"]}


def test_goal_progress() -> None:
    anna = member("anna", {d(0): 100, date(2026, 10, 30): 50})
    tom = member("tom", {d(1): 150})
    week = goal_progress([anna, tom], 500, GoalPeriod.WEEK, TODAY)
    assert (week.total, week.goal, week.progress, week.remaining) == (
        250,
        500,
        50.0,
        250,
    )
    month = goal_progress([anna, tom], 200, GoalPeriod.MONTH, TODAY)
    assert (month.total, month.remaining) == (250, 0)
    assert month.progress == 125.0
    year = goal_progress([anna, tom], 300, GoalPeriod.YEAR, TODAY)
    assert year.total == 300
    assert goal_progress([anna], 0, GoalPeriod.WEEK, TODAY).progress == 0.0
