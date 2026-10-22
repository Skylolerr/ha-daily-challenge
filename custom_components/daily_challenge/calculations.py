"""Pure calculation functions for Daily Challenge.

Everything in here is free of Home Assistant imports so it can be tested in
isolation. All functions take the raw data (`days`, `target_history`), the
challenge settings and the current local date (`today`).
"""

from __future__ import annotations

from bisect import bisect_right
from dataclasses import dataclass
from datetime import date, timedelta
from enum import StrEnum
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from collections.abc import Mapping

MAX_PROGRESS = 999.0


class StreakRule(StrEnum):
    """When a day counts towards the streak."""

    TARGET = "target"
    ANY = "any"


class DeficitMode(StrEnum):
    """How a deficit from previous days is handled."""

    DISPLAY = "display"
    CATCH_UP = "catch_up"


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
    deficit_until_yesterday: int
    progress_today: float | None
    goal_reached_today: bool | None
    total: int
    target_to_date: int
    delta: int
    end_target: int | None
    remaining: int | None
    average_per_day: float
    best_day_value: int
    best_day_date: date | None
    this_week: int
    this_month: int
    this_year: int
    current_streak: int
    best_streak: Streak


@dataclass(frozen=True, slots=True)
class History:
    """Per-day values, targets and fulfilment for a date range."""

    days: dict[date, int]
    targets: dict[date, int]
    fulfilled: dict[date, bool]


def target_on(target_history: Mapping[date, int], day: date) -> int:
    """Return the daily target valid on `day`.

    The target is the last entry with a start date on or before `day`. Days
    before the first entry use the first target (e.g. after the start date
    was moved backwards).
    """
    if not target_history:
        return 0
    keys = sorted(target_history)
    index = bisect_right(keys, day) - 1
    return target_history[keys[max(index, 0)]]


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
) -> list[bool]:
    """Return whether each day of `period` counts towards the streak."""
    if settings.streak_rule is StreakRule.ANY:
        return [value > 0 for value in values]
    if settings.deficit_mode is DeficitMode.DISPLAY:
        return [value >= target for value, target in zip(values, targets, strict=True)]

    # Catch-up: a day is fulfilled if there is no cumulative deficit at the
    # end of that day or at the end of the following day (if it exists yet).
    cumulative: list[int] = []
    running = 0
    for value, target in zip(values, targets, strict=True):
        running += target - value
        cumulative.append(running)
    return [
        cumulative[i] <= 0 or (i + 1 < len(period) and cumulative[i + 1] <= 0)
        for i in range(len(period))
    ]


def fulfilled_days(
    days: Mapping[date, int],
    target_history: Mapping[date, int],
    settings: ChallengeSettings,
    today: date,
) -> dict[date, bool]:
    """Return the streak fulfilment of every day in the period up to today."""
    period = _date_range(settings.start_date, _period_end(settings, today))
    values = [days.get(day, 0) for day in period]
    targets = [target_on(target_history, day) for day in period]
    return dict(zip(period, _fulfilled(period, values, targets, settings), strict=True))


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


def _current_streak(
    fulfilled: list[bool],
    settings: ChallengeSettings,
    status: ChallengeStatus,
) -> int:
    """Return the current streak, counting back from the end of the period.

    An unfinished today never breaks the streak. In catch-up mode with the
    target rule, a short yesterday can still be repaired today, so it neither
    counts nor breaks the streak while today is running.
    """
    if not fulfilled:
        return 0
    cursor = len(fulfilled) - 1
    if status is ChallengeStatus.ACTIVE and not fulfilled[cursor]:
        cursor -= 1
        rescuable = (
            settings.streak_rule is StreakRule.TARGET
            and settings.deficit_mode is DeficitMode.CATCH_UP
        )
        if rescuable and cursor >= 0 and not fulfilled[cursor]:
            cursor -= 1
    streak = 0
    while cursor >= 0 and fulfilled[cursor]:
        streak += 1
        cursor -= 1
    return streak


def calculate(
    days: Mapping[date, int],
    target_history: Mapping[date, int],
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
    fulfilled = _fulfilled(period, values, targets, settings)

    total = sum(values)
    target_to_date = sum(targets)

    active = status is ChallengeStatus.ACTIVE
    value_today = values[-1] if active else 0
    target_today: int | None = targets[-1] if active else None
    deficit_until_yesterday = (
        max(0, sum(targets[:-1]) - sum(values[:-1]))
        if active
        else max(0, target_to_date - total)
    )
    effective_target: int | None = None
    progress: float | None = None
    goal_reached: bool | None = None
    if target_today is not None:
        effective_target = target_today
        if settings.deficit_mode is DeficitMode.CATCH_UP:
            effective_target += deficit_until_yesterday
        goal_reached = value_today >= effective_target
        progress = (
            min(MAX_PROGRESS, round(value_today / effective_target * 100, 1))
            if effective_target > 0
            else MAX_PROGRESS
        )

    end_target: int | None = None
    remaining: int | None = None
    if settings.end_date is not None:
        end_target = sum(
            target_on(target_history, day)
            for day in _date_range(settings.start_date, settings.end_date)
        )
        remaining = max(0, end_target - total)

    best_day_value = 0
    best_day_date: date | None = None
    for day, value in zip(period, values, strict=True):
        if value > 0 and value >= best_day_value:
            best_day_value, best_day_date = value, day

    week_start = today - timedelta(days=today.weekday())
    in_period = list(zip(period, values, strict=True))

    return ChallengeStats(
        status=status,
        value_today=value_today,
        target_today=target_today,
        effective_target_today=effective_target,
        deficit_until_yesterday=deficit_until_yesterday,
        progress_today=progress,
        goal_reached_today=goal_reached,
        total=total,
        target_to_date=target_to_date,
        delta=total - target_to_date,
        end_target=end_target,
        remaining=remaining,
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
        current_streak=_current_streak(fulfilled, settings, status),
        best_streak=_best_streak(period, fulfilled),
    )


def build_history(  # noqa: PLR0913
    days: Mapping[date, int],
    target_history: Mapping[date, int],
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
    return History(
        days={day: days[day] for day in in_range if days.get(day, 0) > 0},
        targets={day: target_on(target_history, day) for day in in_range},
        fulfilled={day: fulfilled[day] for day in in_range},
    )
