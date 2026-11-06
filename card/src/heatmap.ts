// Layout of the heatmap: weeks as columns, Monday on top.

import type { ChallengeHistory } from "./types";

export const HEATMAP_RANGES = ["year", "6months", "3months"] as const;
export type HeatmapRange = (typeof HEATMAP_RANGES)[number];

/** Number of week columns per range. */
export const RANGE_WEEKS: Record<HeatmapRange, number> = {
  year: 53,
  "6months": 26,
  "3months": 13,
};

const DAY_MS = 24 * 60 * 60 * 1000;

export interface HeatmapCell {
  /** ISO date. */
  date: string;
  /** Inside the runtime of the challenge (start up to today or the end). */
  inPeriod: boolean;
  value: number;
  target: number;
  fulfilled: boolean;
  /** Unfulfilled, but can still be made up today (catch-up). */
  rescuable: boolean;
  /** The last day of the history: today, or the end date of a finished one. */
  last: boolean;
  /** value / target, 0 … 1. */
  ratio: number;
}

export interface HeatmapLayout {
  /** Columns of 7 cells (Monday first); days after the last one are null. */
  weeks: (HeatmapCell | null)[][];
  /** Week columns where a new month starts, with the ISO date of that day. */
  months: { week: number; date: string }[];
}

/** Days since 1970-01-01 of an ISO date, independent of the browser's zone. */
function dayNumber(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number);
  return Math.round(Date.UTC(year, month - 1, day) / DAY_MS);
}

function isoDate(dayNo: number): string {
  return new Date(dayNo * DAY_MS).toISOString().slice(0, 10);
}

/** The ISO date `days` days after `iso` (negative: before). */
export function addDays(iso: string, days: number): string {
  return isoDate(dayNumber(iso) + days);
}

/** Monday = 0 … Sunday = 6. */
function weekday(dayNo: number): number {
  // 1970-01-01 was a Thursday.
  return (dayNo + 3) % 7;
}

/** Build the grid for `range`, ending with the week of the last day. */
export function buildHeatmap(
  history: ChallengeHistory,
  range: HeatmapRange,
): HeatmapLayout {
  const dates = Object.keys(history.targets).sort();
  if (dates.length === 0) {
    return { weeks: [], months: [] };
  }
  const lastDay = dayNumber(dates[dates.length - 1]);
  const firstInPeriod = dayNumber(dates[0]);
  const weeks = RANGE_WEEKS[range];
  const firstDay = lastDay - weekday(lastDay) - (weeks - 1) * 7;
  const rescuable = new Set(history.rescuable ?? []);

  const columns: (HeatmapCell | null)[][] = [];
  const months: { week: number; date: string }[] = [];
  for (let week = 0; week < weeks; week++) {
    const column: (HeatmapCell | null)[] = [];
    for (let row = 0; row < 7; row++) {
      const dayNo = firstDay + week * 7 + row;
      if (dayNo > lastDay) {
        column.push(null);
        continue;
      }
      const date = isoDate(dayNo);
      // The first of a month starts a new month label.
      if (date.endsWith("-01") || (week === 0 && row === 0)) {
        months.push({ week, date });
      }
      const inPeriod = dayNo >= firstInPeriod && date in history.targets;
      const value = history.days[date] ?? 0;
      const target = history.targets[date] ?? 0;
      column.push({
        date,
        inPeriod,
        value,
        target,
        fulfilled: inPeriod && history.fulfilled[date] === true,
        rescuable: inPeriod && rescuable.has(date),
        last: dayNo === lastDay,
        ratio: target > 0 ? Math.min(1, value / target) : value > 0 ? 1 : 0,
      });
    }
    columns.push(column);
  }
  // Labels too close to the next one would overlap: keep the later one. A
  // whole year in a card is narrow, so it shows about every other month.
  const minGap = Math.max(3, Math.round(weeks / 8));
  const spaced: { week: number; date: string }[] = [];
  for (const month of [...months].reverse()) {
    const next = spaced[0];
    if (!next || next.week - month.week >= minGap) {
      spaced.unshift(month);
    }
  }
  return { weeks: columns, months: spaced };
}

/** Opacity of a cell: stronger the closer the value is to the target. */
export function cellOpacity(cell: HeatmapCell): number {
  if (!cell.inPeriod || cell.value === 0) {
    return 1;
  }
  return cell.fulfilled ? 0.45 + 0.55 * cell.ratio : 0.2 + 0.6 * cell.ratio;
}
