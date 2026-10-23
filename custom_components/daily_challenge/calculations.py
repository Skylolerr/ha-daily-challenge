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

    # Catch-up: a missed day can be made up on the following day only, by
    # reaching both targets together. A surplus never covers later days.
    return [
        values[i] >= targets[i]
        or (
            i + 1 < len(period)
            and values[i] + values[i + 1] >= targets[i] + targets[i + 1]
        )
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

    week_start = today - timedelta(days=today.weekday())
    in_period = list(zip(period, values, strict=True))

    current = _current_streak(period, fulfilled, settings, status)
    best = _best_streak(period, fulfilled)
    # The current streak may bridge a still rescuable yesterday.
    if current.length >= best.length:
        best = current

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
        best_streak=best,
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
