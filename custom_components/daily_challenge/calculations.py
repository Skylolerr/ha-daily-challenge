"""Pure calculation functions for Daily Challenge.

Everything in here is free of Home Assistant imports so it can be tested in
isolation. All functions take the raw data (`days`, `target_history`), the
challenge settings and the current local date (`today`).
"""

from __future__ import annotations

from bisect import bisect_right
from dataclasses import dataclass, field
from datetime import date, timedelta
from enum import StrEnum
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from collections.abc import Mapping

MAX_PROGRESS = 999.0

# Streak lengths that count as milestones; after the last one every 500 days.
STREAK_MILESTONES = (7, 14, 30, 50, 100, 150, 200, 250, 300, 365, 500, 750, 1000)
STREAK_MILESTONE_INTERVAL = 500
# Total milestones follow 1, 2.5 and 5 times a power of ten, from 100 on.
TOTAL_MILESTONE_START = 100


class StreakRule(StrEnum):
    """When a day counts towards the streak."""

    TARGET = "target"
    ANY = "any"


class DeficitMode(StrEnum):
    """How a deficit from previous days is handled."""

    DISPLAY = "display"
    CATCH_UP = "catch_up"


class MilestoneType(StrEnum):
    """Kinds of milestones a challenge can reach."""

    STREAK = "streak"
    BEST_STREAK = "best_streak"
    BEST_DAY = "best_day"
    TOTAL = "total"


class ChallengeStatus(StrEnum):
    """Lifecycle state of a challenge relative to today."""

    NOT_STARTED = "not_started"
    ACTIVE = "active"
    ENDED = "ended"


@dataclass(frozen=True, slots=True)
class ChallengeSettings:
    """The options relevant for calculations."""

    start_date: date
    end_date: date | None
    streak_rule: StreakRule
    deficit_mode: DeficitMode


@dataclass(frozen=True, slots=True)
class Streak:
    """A run of consecutive fulfilled days."""

    length: int = 0
    start: date | None = None
    end: date | None = None


@dataclass(frozen=True, slots=True)
class ChallengeStats:
    """All derived figures of a challenge for one day."""

    status: ChallengeStatus
    value_today: int
    target_today: int | None
    effective_target_today: int | None
    # Yesterday's shortfall against its own target (the catch-up amount).
    deficit_yesterday: int
    progress_today: float | None
    goal_reached_today: bool | None
    total: int
    target_to_date: int
    delta: int
    end_target: int | None
    remaining: int | None
    days_left: int | None
    required_per_day: float | None
    average_per_day: float
    best_day_value: int
    best_day_date: date | None
    this_week: int
    this_month: int
    this_year: int
    current_streak: int
    best_streak: Streak
    # Records to beat: the best run before the current one and the best
    # value of a day other than today.
    previous_best_streak: int = 0
    best_day_before_today: int = 0
    # This week (Monday to today) within the period.
    week_target: int = 0
    week_fulfilled_days: int = 0
    # Days of this week that reached their own target (not the streak rule).
    week_goal_days: int = 0
    week_days: int = 0


@dataclass(frozen=True, slots=True)
class History:
    """Per-day values, targets and fulfilment for a date range."""

    days: dict[date, int]
    targets: dict[date, int]
    fulfilled: dict[date, bool]
    # Unfulfilled days that can still be made up today (catch-up: yesterday).
    rescuable: list[date] = field(default_factory=list)


class Interval(StrEnum):
    """How often a rising target grows."""

    DAY = "day"
    WEEK = "week"
    MONTH = "month"


@dataclass(frozen=True, slots=True)
class TargetRule:
    """A daily target valid from a date on, optionally rising over time."""

    target: int
    increase: int = 0
    every: Interval = Interval.WEEK
    maximum: int | None = None

    def on(self, valid_from: date, day: date) -> int:
        """Return the target on `day` for a rule that starts on `valid_from`."""
        if self.increase <= 0 or day <= valid_from:
            return self.target
        value = self.target + self.increase * full_intervals(
            valid_from, day, self.every
        )
        return min(value, self.maximum) if self.maximum is not None else value


type TargetHistory = Mapping[date, TargetRule | int]


def add_months(day: date, months: int) -> date:
    """Return `day` moved by `months`, clamped to the end of the month."""
    month_index = day.month - 1 + months
    year, month = day.year + month_index // 12, month_index % 12 + 1
    next_month = date(year + month // 12, month % 12 + 1, 1)
    last_day = (next_month - timedelta(days=1)).day
    return date(year, month, min(day.day, last_day))


def full_intervals(anchor: date, day: date, every: Interval) -> int:
    """Return the number of full intervals from `anchor` up to `day`."""
    if day <= anchor:
        return 0
    if every is Interval.DAY:
        return (day - anchor).days
    if every is Interval.WEEK:
        return (day - anchor).days // 7
    months = (day.year - anchor.year) * 12 + day.month - anchor.month
    while months > 0 and add_months(anchor, months) > day:
        months -= 1
    return months


def target_on(target_history: TargetHistory, day: date) -> int:
    """Return the daily target valid on `day`.

    The target comes from the last entry with a start date on or before
    `day`; a rising entry grows from its own start date. Days before the
    first entry use the first target (e.g. after the start date was moved
    backwards).
    """
    if not target_history:
        return 0
    keys = sorted(target_history)
    key = keys[max(bisect_right(keys, day) - 1, 0)]
    rule = target_history[key]
    if isinstance(rule, int):
        return rule
    return rule.on(key, day)


def _date_range(first: date, last: date) -> list[date]:
    """Return all dates from `first` to `last`, both inclusive."""
    return [first + timedelta(days=i) for i in range((last - first).days + 1)]


def _period_end(settings: ChallengeSettings, today: date) -> date:
    """Return the last day of the period that can contain values."""
    if settings.end_date is not None and settings.end_date < today:
        return settings.end_date
    return today


def _status(settings: ChallengeSettings, today: date) -> ChallengeStatus:
    if today < settings.start_date:
        return ChallengeStatus.NOT_STARTED
    if settings.end_date is not None and today > settings.end_date:
        return ChallengeStatus.ENDED
    return ChallengeStatus.ACTIVE


def _fulfilled(
    period: list[date],
    values: list[int],
    targets: list[int],
    settings: ChallengeSettings,
    status: ChallengeStatus,
) -> list[bool]:
    """Return whether each day of `period` counts towards the streak."""
    if settings.streak_rule is StreakRule.ANY:
        return [value > 0 for value in values]
    if settings.deficit_mode is DeficitMode.DISPLAY:
        return [value >= target for value, target in zip(values, targets, strict=True)]

    # Catch-up: a missed day can be made up on the following day only, by
    # reaching both targets together. A surplus never covers later days.
    fulfilled = [
        values[i] >= targets[i]
        or (
            i + 1 < len(period)
            and values[i] + values[i + 1] >= targets[i] + targets[i + 1]
        )
        for i in range(len(period))
    ]
    # While today runs it only counts once yesterday's deficit is made up too,
    # i.e. with the effective target. Yesterday is fulfilled exactly then.
    if status is ChallengeStatus.ACTIVE and len(period) >= 2:
        fulfilled[-1] = fulfilled[-1] and fulfilled[-2]
    return fulfilled


def fulfilled_days(
    days: Mapping[date, int],
    target_history: TargetHistory,
    settings: ChallengeSettings,
    today: date,
) -> dict[date, bool]:
    """Return the streak fulfilment of every day in the period up to today."""
    period = _date_range(settings.start_date, _period_end(settings, today))
    values = [days.get(day, 0) for day in period]
    targets = [target_on(target_history, day) for day in period]
    status = _status(settings, today)
    fulfilled = _fulfilled(period, values, targets, settings, status)
    return dict(zip(period, fulfilled, strict=True))


def _best_streak(period: list[date], fulfilled: list[bool]) -> Streak:
    """Return the longest run; ties keep the most recent one."""
    best = Streak()
    run_start: int | None = None
    for i, ok in enumerate(fulfilled):
        if not ok:
            run_start = None
            continue
        if run_start is None:
            run_start = i
        length = i - run_start + 1
        if length >= best.length:
            best = Streak(length, period[run_start], period[i])
    return best


def _best_streak_before(
    period: list[date], fulfilled: list[bool], first_day: date | None
) -> int:
    """Return the longest run that ended before `first_day` (None: all)."""
    if first_day is None:
        return _best_streak(period, fulfilled).length
    cut = period.index(first_day)
    return _best_streak(period[:cut], fulfilled[:cut]).length


def _current_streak(
    period: list[date],
    fulfilled: list[bool],
    settings: ChallengeSettings,
    status: ChallengeStatus,
) -> Streak:
    """Return the current streak, counting back from the end of the period.

    An unfinished today never breaks the streak. In catch-up mode with the
    target rule, a short yesterday can still be made up today, so it neither
    counts nor breaks the streak while today is running.
    """
    if not fulfilled:
        return Streak()
    last = len(fulfilled) - 1
    active = status is ChallengeStatus.ACTIVE
    rescuable = (
        settings.streak_rule is StreakRule.TARGET
        and settings.deficit_mode is DeficitMode.CATCH_UP
    )
    skip = last - 1 if active and rescuable and last >= 1 else None
    cursor = last - 1 if active and not fulfilled[last] else last
    length = 0
    start = end = None
    while cursor >= 0:
        if cursor == skip and not fulfilled[cursor]:
            cursor -= 1
            continue
        if not fulfilled[cursor]:
            break
        length += 1
        end = end or period[cursor]
        start = period[cursor]
        cursor -= 1
    return Streak(length, start, end)


def calculate(
    days: Mapping[date, int],
    target_history: TargetHistory,
    settings: ChallengeSettings,
    today: date,
) -> ChallengeStats:
    """Calculate all figures of a challenge as seen on `today`."""
    status = _status(settings, today)
    period = (
        []
        if status is ChallengeStatus.NOT_STARTED
        else _date_range(settings.start_date, _period_end(settings, today))
    )
    values = [days.get(day, 0) for day in period]
    targets = [target_on(target_history, day) for day in period]
    fulfilled = _fulfilled(period, values, targets, settings, status)

    total = sum(values)
    target_to_date = sum(targets)

    active = status is ChallengeStatus.ACTIVE
    value_today = values[-1] if active else 0
    target_today: int | None = targets[-1] if active else None
    deficit_yesterday = (
        max(0, targets[-2] - values[-2]) if active and len(period) >= 2 else 0
    )
    effective_target: int | None = None
    progress: float | None = None
    goal_reached: bool | None = None
    if target_today is not None:
        effective_target = target_today
        if settings.deficit_mode is DeficitMode.CATCH_UP:
            effective_target += deficit_yesterday
        goal_reached = value_today >= effective_target
        progress = (
            min(MAX_PROGRESS, round(value_today / effective_target * 100, 1))
            if effective_target > 0
            else MAX_PROGRESS
        )

    end_target: int | None = None
    remaining: int | None = None
    days_left: int | None = None
    required_per_day: float | None = None
    if settings.end_date is not None:
        end_target = sum(
            target_on(target_history, day)
            for day in _date_range(settings.start_date, settings.end_date)
        )
        remaining = max(0, end_target - total)
        # Days still to go, today included; what is left spread over them.
        first_open_day = max(today, settings.start_date)
        days_left = max(0, (settings.end_date - first_open_day).days + 1)
        if days_left:
            required_per_day = round(remaining / days_left, 1)

    best_day_value = 0
    best_day_date: date | None = None
    for day, value in zip(period, values, strict=True):
        if value > 0 and value >= best_day_value:
            best_day_value, best_day_date = value, day

    best_day_before_today = max(
        (value for day, value in zip(period, values, strict=True) if day != today),
        default=0,
    )

    week_start = today - timedelta(days=today.weekday())
    in_period = list(zip(period, values, strict=True))
    current = _current_streak(period, fulfilled, settings, status)
    in_week = [i for i, day in enumerate(period) if week_start <= day <= today]

    return ChallengeStats(
        status=status,
        value_today=value_today,
        target_today=target_today,
        effective_target_today=effective_target,
        deficit_yesterday=deficit_yesterday,
        progress_today=progress,
        goal_reached_today=goal_reached,
        total=total,
        target_to_date=target_to_date,
        delta=total - target_to_date,
        end_target=end_target,
        remaining=remaining,
        days_left=days_left,
        required_per_day=required_per_day,
        average_per_day=round(total / len(period), 1) if period else 0.0,
        best_day_value=best_day_value,
        best_day_date=best_day_date,
        this_week=sum(v for day, v in in_period if week_start <= day <= today),
        this_month=sum(
            v
            for day, v in in_period
            if (day.year, day.month) == (today.year, today.month)
        ),
        this_year=sum(v for day, v in in_period if day.year == today.year),
        current_streak=current.length,
        best_streak=_best_streak(period, fulfilled),
        previous_best_streak=_best_streak_before(period, fulfilled, current.start),
        best_day_before_today=best_day_before_today,
        week_target=sum(targets[i] for i in in_week),
        week_fulfilled_days=sum(1 for i in in_week if fulfilled[i]),
        week_goal_days=sum(1 for i in in_week if values[i] >= targets[i]),
        week_days=len(in_week),
    )


def is_streak_milestone(length: int) -> bool:
    """Return whether a streak of `length` days is a milestone."""
    if length in STREAK_MILESTONES:
        return True
    last = STREAK_MILESTONES[-1]
    return length > last and (length - last) % STREAK_MILESTONE_INTERVAL == 0


def total_milestones(up_to: int) -> list[int]:
    """Return all total milestones up to and including `up_to`, ascending."""
    result: list[int] = []
    power = TOTAL_MILESTONE_START
    while power <= up_to:
        result.extend(m for m in (power, power * 5 // 2, power * 5) if m <= up_to)
        power *= 10
    return result


def reached_milestones(
    old: ChallengeStats,
    new: ChallengeStats,
    enabled: set[MilestoneType],
) -> list[tuple[MilestoneType, int]]:
    """Return the milestones crossed by going from `old` to `new`.

    Only the highest crossed milestone of each kind is returned, so a big
    jump does not fire a burst of events. Callers only pass changes of
    today's value.
    """
    reached: list[tuple[MilestoneType, int]] = []
    if MilestoneType.STREAK in enabled:
        crossed = [
            length
            for length in range(old.current_streak + 1, new.current_streak + 1)
            if is_streak_milestone(length)
        ]
        if crossed:
            reached.append((MilestoneType.STREAK, crossed[-1]))
    record = old.previous_best_streak
    if (
        MilestoneType.BEST_STREAK in enabled
        and record > 0
        and old.current_streak <= record < new.current_streak
    ):
        reached.append((MilestoneType.BEST_STREAK, new.current_streak))
    best_day = old.best_day_before_today
    if (
        MilestoneType.BEST_DAY in enabled
        and best_day > 0
        and old.value_today <= best_day < new.value_today
    ):
        reached.append((MilestoneType.BEST_DAY, new.value_today))
    if MilestoneType.TOTAL in enabled:
        crossed = [m for m in total_milestones(new.total) if m > old.total]
        if crossed:
            reached.append((MilestoneType.TOTAL, crossed[-1]))
    return reached


def build_history(  # noqa: PLR0913
    days: Mapping[date, int],
    target_history: TargetHistory,
    settings: ChallengeSettings,
    today: date,
    *,
    start: date | None = None,
    end: date | None = None,
) -> History:
    """Return values, targets and fulfilment for a range within the period."""
    fulfilled = fulfilled_days(days, target_history, settings, today)
    first = max(start or settings.start_date, settings.start_date)
    last = min(end or today, _period_end(settings, today))
    in_range = [day for day in fulfilled if first <= day <= last]
    yesterday = today - timedelta(days=1)
    rescuable = (
        settings.streak_rule is StreakRule.TARGET
        and settings.deficit_mode is DeficitMode.CATCH_UP
        and _status(settings, today) is ChallengeStatus.ACTIVE
        and yesterday in in_range
        and not fulfilled[yesterday]
    )
    return History(
        days={day: days[day] for day in in_range if days.get(day, 0) > 0},
        targets={day: target_on(target_history, day) for day in in_range},
        fulfilled={day: fulfilled[day] for day in in_range},
        rescuable=[yesterday] if rescuable else [],
    )


# --- Groups ------------------------------------------------------------------


class RankingMetric(StrEnum):
    """What a group ranks its members by."""

    PERCENT = "percent"
    AMOUNT = "amount"
    STREAK = "streak"


class RankingPeriod(StrEnum):
    """The period a ranking covers."""

    TODAY = "today"
    WEEK = "week"
    MONTH = "month"
    TOTAL = "total"


class GoalPeriod(StrEnum):
    """The period of a group's shared goal."""

    WEEK = "week"
    MONTH = "month"
    YEAR = "year"


@dataclass(frozen=True, slots=True)
class Member:
    """The data of one challenge in a group."""

    key: str
    days: Mapping[date, int]
    target_history: TargetHistory
    settings: ChallengeSettings


@dataclass(frozen=True, slots=True)
class Score:
    """How a member did in a period."""

    key: str
    amount: int
    target: int
    percent: float
    streak: int
    rank: int = 0

    def value(self, metric: RankingMetric) -> float:
        """Return the figure the ranking sorts by."""
        if metric is RankingMetric.PERCENT:
            return self.percent
        if metric is RankingMetric.AMOUNT:
            return self.amount
        return self.streak


def period_start(period: RankingPeriod | GoalPeriod, today: date) -> date | None:
    """Return the first day of a period that ends today (None: no limit)."""
    if period == RankingPeriod.TODAY:
        return today
    if period == RankingPeriod.WEEK:
        return today - timedelta(days=today.weekday())
    if period == RankingPeriod.MONTH:
        return today.replace(day=1)
    if period == GoalPeriod.YEAR:
        return today.replace(month=1, day=1)
    return None


def _member_days(member: Member, first: date | None, last: date) -> list[date]:
    """Return the days of a member's period between `first` and `last`."""
    begin = max(first or member.settings.start_date, member.settings.start_date)
    end = min(last, _period_end(member.settings, last))
    return _date_range(begin, end) if begin <= end else []


def member_score(
    member: Member, period: RankingPeriod, today: date, *, as_of: date | None = None
) -> Score:
    """Return a member's figures for the period that ends on `as_of` (today)."""
    last = as_of or today
    days = _member_days(member, period_start(period, last), last)
    amount = sum(member.days.get(day, 0) for day in days)
    target = sum(target_on(member.target_history, day) for day in days)
    percent = round(amount / target * 100, 1) if target > 0 else 0.0
    streak = calculate(member.days, member.target_history, member.settings, last)
    return Score(member.key, amount, target, percent, streak.current_streak)


def rank(scores: list[Score], metric: RankingMetric) -> list[Score]:
    """Sort scores best first; equal values share a rank (1, 1, 3)."""
    ordered = sorted(scores, key=lambda score: -score.value(metric))
    ranked: list[Score] = []
    for index, score in enumerate(ordered):
        same = ranked and ranked[-1].value(metric) == score.value(metric)
        position = ranked[-1].rank if same else index + 1
        ranked.append(
            Score(
                score.key,
                score.amount,
                score.target,
                score.percent,
                score.streak,
                position,
            )
        )
    return ranked


def leaders(ranked: list[Score], metric: RankingMetric) -> list[str]:
    """Return the keys in first place; nobody leads with nothing done."""
    return [s.key for s in ranked if s.rank == 1 and s.value(metric) > 0]


def ranking(
    members: list[Member],
    metric: RankingMetric,
    period: RankingPeriod,
    today: date,
) -> list[Score]:
    """Return the ranking of a group for a period that ends today."""
    return rank([member_score(m, period, today) for m in members], metric)


def group_streak(members: list[Member], today: date) -> tuple[int, int]:
    """Return the current and the best group streak.

    A day counts when every member whose challenge runs on it fulfilled it
    (by the member's own rule). An unfinished today never breaks the streak.
    """
    if not members:
        return 0, 0
    fulfilled = [
        fulfilled_days(m.days, m.target_history, m.settings, today) for m in members
    ]
    first = min(m.settings.start_date for m in members)
    if first > today:
        return 0, 0
    days = _date_range(first, today)
    all_done = []
    for day in days:
        running = [f[day] for f in fulfilled if day in f]
        all_done.append(bool(running) and all(running))
    best = run = 0
    for ok in all_done:
        run = run + 1 if ok else 0
        best = max(best, run)
    current = 0
    cursor = len(days) - 1
    if not all_done[cursor]:
        cursor -= 1  # today is still open
    while cursor >= 0 and all_done[cursor]:
        current += 1
        cursor -= 1
    return current, best


def all_reached_today(members: list[Member], today: date) -> bool:
    """Return whether every running member reached today's goal."""
    stats = [calculate(m.days, m.target_history, m.settings, today) for m in members]
    running = [s.goal_reached_today for s in stats if s.goal_reached_today is not None]
    return bool(running) and all(running)


def week_winners(
    members: list[Member], metric: RankingMetric, since: date, today: date
) -> dict[date, list[str]]:
    """Return the leaders of every finished week since the week of `since`.

    The key is the Monday of the week. Weeks without a leader are left out.
    """
    monday = since - timedelta(days=since.weekday())
    this_monday = today - timedelta(days=today.weekday())
    winners: dict[date, list[str]] = {}
    while monday < this_monday:
        sunday = monday + timedelta(days=6)
        scores = [
            member_score(m, RankingPeriod.WEEK, today, as_of=sunday) for m in members
        ]
        if keys := leaders(rank(scores, metric), metric):
            winners[monday] = keys
        monday += timedelta(days=7)
    return winners


@dataclass(frozen=True, slots=True)
class GoalProgress:
    """The shared goal of a group in its current period."""

    total: int
    goal: int
    progress: float
    remaining: int


def goal_progress(
    members: list[Member], goal: int, period: GoalPeriod, today: date
) -> GoalProgress:
    """Return how far the group got with its shared goal."""
    first = period_start(period, today)
    total = sum(
        member.days.get(day, 0)
        for member in members
        for day in _member_days(member, first, today)
    )
    progress = min(MAX_PROGRESS, round(total / goal * 100, 1)) if goal > 0 else 0.0
    return GoalProgress(total, goal, progress, max(0, goal - total))
