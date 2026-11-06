import { describe, expect, it } from "vitest";

import { buildHeatmap, cellOpacity, RANGE_WEEKS } from "../src/heatmap";
import type { ChallengeHistory } from "../src/types";

// 2026-11-04 is a Wednesday; the challenge started on Monday 2026-11-02.
const HISTORY: ChallengeHistory = {
  days: { "2026-11-02": 20, "2026-11-03": 5, "2026-11-04": 30 },
  targets: { "2026-11-02": 20, "2026-11-03": 20, "2026-11-04": 20 },
  fulfilled: { "2026-11-02": true, "2026-11-03": false, "2026-11-04": true },
  rescuable: ["2026-11-03"],
};

describe("buildHeatmap", () => {
  it("has the weeks of the range, Monday on top, up to the last day", () => {
    for (const [range, weeks] of Object.entries(RANGE_WEEKS)) {
      const layout = buildHeatmap(HISTORY, range as keyof typeof RANGE_WEEKS);
      expect(layout.weeks).toHaveLength(weeks);
      expect(layout.weeks.every((week) => week.length === 7)).toBe(true);
    }
    const last = buildHeatmap(HISTORY, "3months").weeks.at(-1) ?? [];
    expect(last.map((cell) => cell?.date ?? null)).toEqual([
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
      null,
      null,
      null,
      null,
    ]);
  });

  it("describes each day of the period", () => {
    const [monday, tuesday, wednesday] = buildHeatmap(HISTORY, "3months").weeks.at(-1) ?? [];
    expect(monday).toMatchObject({ inPeriod: true, fulfilled: true, ratio: 1, last: false });
    expect(tuesday).toMatchObject({ value: 5, ratio: 0.25, fulfilled: false, rescuable: true });
    expect(wednesday).toMatchObject({ value: 30, ratio: 1, last: true });
  });

  it("greys out days before the start", () => {
    const first = buildHeatmap(HISTORY, "3months").weeks[0][0];
    expect(first).toMatchObject({ date: "2026-08-10", inPeriod: false, fulfilled: false });
  });

  it("labels the first column and each new month", () => {
    const layout = buildHeatmap(HISTORY, "3months");
    expect(layout.months.map((month) => month.date)).toEqual([
      "2026-08-10",
      "2026-09-01",
      "2026-10-01",
      "2026-11-01",
    ]);
  });

  it("drops a month label that would overlap the next one", () => {
    // The first column starts on 2026-07-27, five days before August.
    const history: ChallengeHistory = {
      days: {},
      targets: { "2026-10-23": 20 },
      fulfilled: { "2026-10-23": false },
    };
    const layout = buildHeatmap(history, "3months");
    expect(layout.months[0].date).toBe("2026-08-01");
  });

  it("spaces the labels of a whole year wider", () => {
    const { months } = buildHeatmap(HISTORY, "year");
    const gaps = months.slice(1).map((month, index) => month.week - months[index].week);
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(7);
    expect(months.at(-1)?.date).toBe("2026-11-01");
  });

  it("is empty without days", () => {
    expect(buildHeatmap({ days: {}, targets: {}, fulfilled: {} }, "year")).toEqual({
      weeks: [],
      months: [],
    });
  });

  it("counts a value without a target as full", () => {
    const history: ChallengeHistory = {
      days: { "2026-11-04": 3 },
      targets: { "2026-11-04": 0 },
      fulfilled: { "2026-11-04": true },
    };
    const cell = buildHeatmap(history, "3months").weeks.at(-1)?.[2];
    expect(cell?.ratio).toBe(1);
  });
});

describe("cellOpacity", () => {
  it("grows with the value; fulfilled days stay stronger", () => {
    const [monday, tuesday] = buildHeatmap(HISTORY, "3months").weeks.at(-1) ?? [];
    expect(cellOpacity(monday!)).toBe(1);
    expect(cellOpacity(tuesday!)).toBeCloseTo(0.35);
    const outside = buildHeatmap(HISTORY, "3months").weeks[0][0]!;
    expect(cellOpacity(outside)).toBe(1);
  });
});
