import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DailyChallengeLeaderboardCard,
  LEADERBOARD_RETRY_MS,
  LEADERBOARD_TYPE,
} from "../src/leaderboard-card";
import {
  DailyChallengeLeaderboardCardEditor,
  LEADERBOARD_EDITOR_TYPE,
} from "../src/leaderboard-editor";
import type {
  ChallengeInfo,
  GroupInfo,
  GroupRanking,
  HassEntity,
  HomeAssistant,
  RankingRow,
} from "../src/types";

function challenge(id: string, name: string, person: string | null = null): ChallengeInfo {
  return {
    entry_id: id,
    name,
    icon: "mdi:arm-flex",
    unit: "repetitions",
    person,
    entities: { today: `number.${id}_today`, total: `sensor.${id}_total` },
  };
}

const ANNA = challenge("anna", "Anna's push-ups", "person.anna");
const TOM = challenge("tom", "Tom's push-ups", "person.tom");
const SOLO = challenge("solo", "Push-ups");
const OTHER = challenge("other", "Reading");

const FAMILY: GroupInfo = {
  entry_id: "family",
  name: "Family",
  icon: "mdi:account-group",
  members: ["anna", "tom", "solo"],
  ranking: "percent",
};
const PAIR: GroupInfo = { ...FAMILY, entry_id: "pair", name: "Pair", members: ["anna"] };

function row(id: string, rank: number, extra: Partial<RankingRow> = {}): RankingRow {
  return {
    entry_id: id,
    rank,
    name: id,
    challenge: id,
    icon: "mdi:arm-flex",
    unit: "repetitions",
    person: null,
    picture: null,
    amount: 0,
    target: 100,
    percent: 0,
    streak: 0,
    ...extra,
  };
}

function ranking(extra: Partial<GroupRanking> = {}): GroupRanking {
  return {
    name: "Family",
    icon: "mdi:account-group",
    metric: "percent",
    period: "week",
    unit: "repetitions",
    rows: [
      row("anna", 1, {
        name: "Anna",
        challenge: "Anna's push-ups",
        person: "person.anna",
        picture: "/api/image/anna.jpg",
        amount: 150,
        target: 140,
        percent: 107.1,
        streak: 5,
      }),
      row("tom", 2, {
        name: "Tom",
        challenge: "Tom's push-ups",
        person: "person.tom",
        amount: 70,
        target: 140,
        percent: 50,
        streak: 1,
      }),
      row("solo", 3, { name: "Push-ups", challenge: "Push-ups", amount: 35, percent: 25 }),
      row("late", 4, { name: "Late", amount: 7, percent: 5 }),
    ],
    streak: 2,
    best_streak: 9,
    all_reached_today: false,
    goal: { total: 255, goal: 1000, progress: 25.5, remaining: 745, period: "week" },
    ...extra,
  };
}

function entity(entity_id: string, state: string, attributes: HassEntity["attributes"] = {}) {
  return { entity_id, state, attributes };
}

type Answer = GroupRanking | { code: string; message: string } | Error;

function makeHass(
  answer: Answer | ((msg: Record<string, unknown>) => Answer) = ranking(),
  groups: GroupInfo[] = [FAMILY, PAIR],
): HomeAssistant {
  const callWS = vi.fn(async (msg: Record<string, unknown>) => {
    if (msg.type === "daily_challenge/list") {
      return { challenges: [ANNA, TOM, SOLO, OTHER], groups };
    }
    const result = typeof answer === "function" ? answer(msg) : answer;
    if (result instanceof Error || "code" in result) {
      throw result;
    }
    return result;
  });
  return {
    locale: { language: "en" },
    states: {
      "number.anna_today": entity("number.anna_today", "20"),
      "number.tom_today": entity("number.tom_today", "10"),
      "number.solo_today": entity("number.solo_today", "5"),
      "number.other_today": entity("number.other_today", "1"),
      "person.anna": entity("person.anna", "home", {
        friendly_name: "Anna",
        entity_picture: "/api/image/anna-live.jpg",
      }),
      "person.tom": entity("person.tom", "home", { friendly_name: "Tom Turbo" }),
    },
    entities: {},
    callWS: callWS as unknown as HomeAssistant["callWS"],
    callService: vi.fn().mockResolvedValue(undefined),
  };
}

function rankingCalls(hass: HomeAssistant): Record<string, unknown>[] {
  return vi
    .mocked(hass.callWS)
    .mock.calls.map(([msg]) => msg as Record<string, unknown>)
    .filter((msg) => msg.type === "daily_challenge/ranking");
}

async function settle(element: { updateComplete: Promise<boolean> }): Promise<void> {
  for (let i = 0; i < 4; i++) {
    await Promise.resolve();
    await element.updateComplete;
  }
}

async function createCard(
  hass: HomeAssistant = makeHass(),
  config: Record<string, unknown> = {},
): Promise<DailyChallengeLeaderboardCard> {
  const card = document.createElement(LEADERBOARD_TYPE);
  card.setConfig({ type: `custom:${LEADERBOARD_TYPE}`, group: "family", ...config });
  card.hass = hass;
  document.body.appendChild(card);
  await settle(card);
  return card;
}

function root(card: HTMLElement): ShadowRoot {
  return card.shadowRoot as ShadowRoot;
}

function text(element: Element | null | undefined): string {
  return (element?.textContent ?? "").replace(/\s+/g, " ").trim();
}

function rows(card: HTMLElement): HTMLElement[] {
  return [...root(card).querySelectorAll<HTMLElement>(".row")];
}

function segments(card: HTMLElement, index: number): HTMLButtonElement[] {
  const group = root(card).querySelectorAll(".segments")[index];
  return [...group.querySelectorAll<HTMLButtonElement>("button")];
}

async function change(card: DailyChallengeLeaderboardCard, states: Record<string, HassEntity>) {
  card.hass = { ...card.hass!, states: { ...card.hass!.states, ...states } };
  await settle(card);
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.useRealTimers();
});

describe("leaderboard card", () => {
  it("is registered and offered in the card picker", () => {
    expect(customElements.get(LEADERBOARD_TYPE)).toBe(DailyChallengeLeaderboardCard);
    const picker = (window as unknown as { customCards: { type: string; name: string }[] })
      .customCards;
    expect(picker.find((card) => card.type === LEADERBOARD_TYPE)?.name).toBe(
      "Daily Challenge leaderboard",
    );
    expect(DailyChallengeLeaderboardCard.getConfigElement().tagName.toLowerCase()).toBe(
      LEADERBOARD_EDITOR_TYPE,
    );
  });

  it("offers the first group as stub config", async () => {
    expect(await DailyChallengeLeaderboardCard.getStubConfig(makeHass())).toEqual({
      type: `custom:${LEADERBOARD_TYPE}`,
      group: "family",
    });
    expect(await DailyChallengeLeaderboardCard.getStubConfig(makeHass(ranking(), []))).toEqual({
      type: `custom:${LEADERBOARD_TYPE}`,
      group: "",
    });
    const failing = makeHass();
    failing.callWS = vi.fn().mockRejectedValue(new Error("x")) as HomeAssistant["callWS"];
    expect((await DailyChallengeLeaderboardCard.getStubConfig(failing)).group).toBe("");
    expect((await DailyChallengeLeaderboardCard.getStubConfig()).group).toBe("");
  });

  it("checks the config", () => {
    const card = document.createElement(LEADERBOARD_TYPE);
    expect(() => card.setConfig({ type: "x", group: "" })).toThrow(
      "Please choose a Daily Challenge group.",
    );
    expect(() =>
      card.setConfig({ type: "x", group: "g", period: "year" as never }),
    ).toThrow("period must be one of: today, week, month, total.");
    expect(() =>
      card.setConfig({ type: "x", group: "g", ranking: "speed" as never }),
    ).toThrow("ranking must be one of: percent, amount, streak.");
  });

  it("renders nothing without hass and shows loading until the ranking is there", async () => {
    const bare = document.createElement(LEADERBOARD_TYPE);
    bare.setConfig({ type: "x", group: "family" });
    document.body.appendChild(bare);
    await bare.updateComplete;
    expect(root(bare).querySelector("ha-card")).toBeNull();

    const hass = makeHass();
    hass.callWS = vi.fn(() => new Promise(() => {})) as unknown as HomeAssistant["callWS"];
    const card = await createCard(hass);
    // The list never answers: the card waits, without a header yet.
    expect(text(root(card).querySelector(".message"))).toBe("Loading…");
    expect(root(card).querySelector(".header")).toBeNull();
    expect(rankingCalls(hass)).toEqual([]);
  });

  it("shows loading while the ranking is on its way", async () => {
    const hass = makeHass();
    const list = hass.callWS;
    hass.callWS = vi.fn((msg: { type: string }) =>
      msg.type === "daily_challenge/list" ? list(msg) : new Promise(() => {}),
    ) as unknown as HomeAssistant["callWS"];
    const card = await createCard(hass);
    expect(text(root(card).querySelector(".message"))).toBe("Loading…");
    expect(text(root(card).querySelector(".title"))).toBe("Family");
  });

  it("asks for the ranking of the configured group and period", async () => {
    const hass = makeHass();
    await createCard(hass);
    expect(rankingCalls(hass)).toEqual([
      { type: "daily_challenge/ranking", entry_id: "family", period: "week" },
    ]);
    const other = makeHass();
    await createCard(other, { period: "month", ranking: "streak" });
    expect(rankingCalls(other)).toEqual([
      { type: "daily_challenge/ranking", entry_id: "family", period: "month", metric: "streak" },
    ]);
  });

  it("shows rank, avatar, name, value and bar per member", async () => {
    const card = await createCard();
    expect(text(root(card).querySelector(".title"))).toBe("Family");
    const shown = rows(card);
    expect(shown.map((item) => text(item.querySelector(".rank")))).toEqual(["1", "2", "3", "4"]);
    expect(shown.map((item) => item.querySelector(".rank")?.className)).toEqual([
      "rank medal-1",
      "rank medal-2",
      "rank medal-3",
      "rank ",
    ]);
    expect(shown[0].querySelector(".rank")?.getAttribute("aria-label")).toBe("Rank 1");
    expect(shown.map((item) => text(item.querySelector(".name")))).toEqual([
      "Anna",
      "Tom",
      "Push-ups",
      "Late",
    ]);
    expect(shown.map((item) => text(item.querySelector(".value")))).toEqual([
      "107.1%",
      "50%",
      "25%",
      "5%",
    ]);
    // The challenge is named when the row shows a person.
    expect(text(shown[0].querySelector(".challenge"))).toBe("Anna's push-ups");
    expect(shown[2].querySelector(".challenge")).toBeNull();
    // Bars are capped at the own target.
    const fills = shown.map((item) => item.querySelector<HTMLElement>(".fill")!);
    expect(fills.map((fill) => fill.style.width)).toEqual(["100%", "50%", "25%", "5%"]);
    expect(fills[0].classList.contains("reached")).toBe(true);
    expect(fills[1].classList.contains("reached")).toBe(false);
  });

  it("shows the person's live picture, else initials, else the challenge icon", async () => {
    const card = await createCard();
    const [anna, tom, solo] = rows(card);
    expect(anna.querySelector(".avatar img")?.getAttribute("src")).toBe(
      "/api/image/anna-live.jpg",
    );
    expect(text(tom.querySelector(".avatar"))).toBe("TT");
    expect(solo.querySelector(".avatar.icon-avatar ha-icon")).not.toBeNull();
    expect(solo.querySelector(".avatar[role='img']")).toBeNull();
  });

  it("uses the picture of the ranking when the person has no state", async () => {
    const hass = makeHass();
    delete hass.states["person.anna"];
    const card = await createCard(hass);
    expect(rows(card)[0].querySelector(".avatar img")?.getAttribute("src")).toBe(
      "/api/image/anna.jpg",
    );
    expect(rows(card)[0].querySelector(".avatar")?.getAttribute("aria-label")).toBe("Anna");
  });

  it("formats amounts with the unit and streaks in days", async () => {
    const amounts = await createCard(makeHass(ranking({ metric: "amount" })));
    expect(rows(amounts).map((item) => text(item.querySelector(".value")))).toEqual([
      "150 repetitions",
      "70 repetitions",
      "35 repetitions",
      "7 repetitions",
    ]);
    const streaks = await createCard(makeHass(ranking({ metric: "streak" })));
    expect(rows(streaks).map((item) => text(item.querySelector(".value")))).toEqual([
      "5 days",
      "1 day",
      "0 days",
      "0 days",
    ]);
  });

  it("speaks the user's language", async () => {
    const hass = makeHass(ranking({ metric: "streak" }));
    hass.locale = { language: "de" };
    const card = await createCard(hass);
    expect(text(rows(card)[0].querySelector(".value"))).toBe("5 Tage");
    expect(segments(card, 0).map((button) => text(button))).toEqual([
      "Heute",
      "Woche",
      "Monat",
      "Gesamt",
    ]);
    expect(text(root(card).querySelector(".group-streak .label"))).toBe("Gruppen-Streak");
  });

  it("selects period and metric in the card and loads the ranking again", async () => {
    const hass = makeHass((msg) =>
      ranking({
        period: msg.period as GroupRanking["period"],
        metric: (msg.metric as GroupRanking["metric"]) ?? "percent",
      }),
    );
    const card = await createCard(hass);
    const periods = segments(card, 0);
    const metrics = segments(card, 1);
    expect(root(card).querySelectorAll(".segments")[0].getAttribute("aria-label")).toBe("Period");
    expect(root(card).querySelectorAll(".segments")[1].getAttribute("aria-label")).toBe(
      "Ranking by",
    );
    expect(periods.map((button) => button.getAttribute("aria-pressed"))).toEqual([
      "false",
      "true",
      "false",
      "false",
    ]);
    expect(metrics.map((button) => button.getAttribute("aria-pressed"))).toEqual([
      "true",
      "false",
      "false",
    ]);

    periods[2].click();
    await settle(card);
    metrics[1].click();
    await settle(card);
    expect(rankingCalls(hass).slice(1)).toEqual([
      { type: "daily_challenge/ranking", entry_id: "family", period: "month" },
      { type: "daily_challenge/ranking", entry_id: "family", period: "month", metric: "amount" },
    ]);
    expect(segments(card, 0)[2].getAttribute("aria-pressed")).toBe("true");
    expect(segments(card, 1)[1].getAttribute("aria-pressed")).toBe("true");
    expect(text(rows(card)[0].querySelector(".value"))).toBe("150 repetitions");
    expect(card.ranking?.period).toBe("month");
  });

  it("keeps the shown ranking while another one loads", async () => {
    let release: (() => void) | undefined;
    const hass = makeHass();
    const answer = hass.callWS;
    hass.callWS = vi.fn((msg: { type: string; period?: string }) =>
      msg.type === "daily_challenge/ranking" && msg.period === "today"
        ? new Promise((resolve) => {
            release = () => resolve(ranking({ period: "today" }));
          })
        : answer(msg),
    ) as unknown as HomeAssistant["callWS"];
    const card = await createCard(hass);
    segments(card, 0)[0].click();
    await settle(card);
    expect(rows(card)).toHaveLength(4);
    expect(root(card).querySelector(".rows")?.getAttribute("aria-busy")).toBe("true");
    release?.();
    await settle(card);
    expect(root(card).querySelector(".rows")?.getAttribute("aria-busy")).toBe("false");
  });

  it("drops answers that are overtaken by a newer choice", async () => {
    const pending: Record<string, (value: GroupRanking) => void> = {};
    const hass = makeHass();
    const answer = hass.callWS;
    hass.callWS = vi.fn((msg: { type: string; period?: string }) =>
      msg.type === "daily_challenge/ranking" && msg.period !== "week"
        ? new Promise((resolve) => {
            pending[msg.period!] = resolve;
          })
        : answer(msg),
    ) as unknown as HomeAssistant["callWS"];
    const card = await createCard(hass);
    segments(card, 0)[0].click();
    await settle(card);
    segments(card, 0)[3].click();
    await settle(card);
    pending.total(ranking({ period: "total", name: "Total" }));
    await settle(card);
    pending.today(ranking({ period: "today", name: "Today" }));
    await settle(card);
    expect(card.ranking?.period).toBe("total");
  });

  it("reloads when a member's today value changes, not for other entities", async () => {
    const hass = makeHass();
    const card = await createCard(hass);
    const renders = vi.spyOn(card as unknown as { render: () => unknown }, "render");
    await change(card, {
      "number.other_today": entity("number.other_today", "2"),
      "sensor.anna_total": entity("sensor.anna_total", "99"),
    });
    expect(renders).not.toHaveBeenCalled();
    expect(rankingCalls(hass)).toHaveLength(1);

    await change(card, { "number.tom_today": entity("number.tom_today", "11") });
    expect(rankingCalls(hass)).toHaveLength(2);
    expect(renders).toHaveBeenCalled();
  });

  it("renders again when a member's person changes", async () => {
    const card = await createCard();
    await change(card, {
      "person.tom": entity("person.tom", "home", {
        friendly_name: "Tom",
        entity_picture: "/api/image/tom.jpg",
      }),
    });
    expect(rows(card)[1].querySelector(".avatar img")?.getAttribute("src")).toBe(
      "/api/image/tom.jpg",
    );
  });

  it("looks the group up again when the registry changes", async () => {
    const hass = makeHass();
    const card = await createCard(hass);
    const lists = () =>
      vi.mocked(hass.callWS).mock.calls.filter(([msg]) => msg.type === "daily_challenge/list")
        .length;
    expect(lists()).toBe(1);
    card.hass = { ...hass, entities: {} };
    await settle(card);
    expect(lists()).toBe(2);
  });

  it("opens the member's details", async () => {
    const card = await createCard();
    const opened: string[] = [];
    card.addEventListener("hass-more-info", (ev) =>
      opened.push((ev as CustomEvent).detail.entityId),
    );
    rows(card)[0].click();
    rows(card)[1].dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    rows(card)[2].dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    rows(card)[2].dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    // Not a member in the list: nothing to open.
    rows(card)[3].click();
    expect(opened).toEqual(["number.anna_today", "number.tom_today", "number.solo_today"]);
    expect(rows(card)[0].getAttribute("tabindex")).toBe("0");
    expect(rows(card)[0].getAttribute("role")).toBe("button");
  });

  it("shows the shared goal and the group streak", async () => {
    const card = await createCard();
    const goal = root(card).querySelector(".goal");
    expect(text(goal?.querySelector(".label"))).toBe("Shared goal this week");
    expect(text(goal?.querySelector(".value"))).toBe("255 / 1,000 repetitions");
    expect(text(goal?.querySelector(".note"))).toBe("745 repetitions to go");
    const bar = goal?.querySelector(".bar");
    expect(bar?.getAttribute("role")).toBe("progressbar");
    expect(bar?.getAttribute("aria-valuenow")).toBe("25.5");
    expect(goal?.querySelector<HTMLElement>(".fill")?.style.width).toBe("25.5%");
    const streak = root(card).querySelector(".group-streak");
    expect(text(streak?.querySelector(".streak"))).toBe("🔥 2 · Best 9");
    expect(streak?.querySelector(".all-reached")).toBeNull();
    expect(card.getCardSize()).toBe(8);
  });

  it("shows a reached goal and when everyone reached today's goal", async () => {
    const card = await createCard(
      makeHass(
        ranking({
          all_reached_today: true,
          unit: null,
          goal: { total: 31, goal: 30, progress: 103.3, remaining: 0, period: "month" },
        }),
      ),
    );
    const goal = root(card).querySelector(".goal");
    expect(text(goal?.querySelector(".label"))).toBe("Shared goal this month");
    expect(text(goal?.querySelector(".value"))).toBe("31 / 30");
    expect(text(goal?.querySelector(".note"))).toBe("Goal reached ✓");
    expect(goal?.querySelector<HTMLElement>(".fill")?.style.width).toBe("100%");
    expect(text(root(card).querySelector(".all-reached"))).toBe(
      "Everyone reached today's goal ✓",
    );
  });

  it("hides the goal when not wanted or not set", async () => {
    const hidden = await createCard(makeHass(), { show_goal: false });
    expect(root(hidden).querySelector(".goal")).toBeNull();
    expect(root(hidden).querySelector(".group-streak")).not.toBeNull();
    expect(hidden.getCardSize()).toBe(7);
    const none = await createCard(makeHass(ranking({ goal: null })));
    expect(root(none).querySelector(".goal")).toBeNull();
  });

  it("uses the configured title", async () => {
    const card = await createCard(makeHass(), { title: "Our week" });
    expect(text(root(card).querySelector(".title"))).toBe("Our week");
  });

  it("tells when no member is loaded", async () => {
    const card = await createCard(makeHass(ranking({ rows: [] })));
    expect(text(root(card).querySelector(".rows .message"))).toBe(
      "No challenge of the group is loaded.",
    );
  });

  it("tells when the group does not exist or is not loaded", async () => {
    const missing = await createCard(
      makeHass({ code: "not_found", message: "No such group" }, []),
      { group: "gone" },
    );
    expect(text(root(missing).querySelector(".warning"))).toBe(
      "Daily Challenge group not found.",
    );
    expect(root(missing).querySelector(".rows")).toBeNull();

    const unloaded = await createCard(
      makeHass({ code: "not_loaded", message: "Family is not loaded" }),
    );
    expect(text(root(unloaded).querySelector(".warning"))).toBe(
      "The group is not loaded right now.",
    );
    expect(text(root(unloaded).querySelector(".title"))).toBe("Family");
  });

  it("tries again later after a failure and recovers", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    let answer: Answer = { code: "not_loaded", message: "not loaded" };
    const hass = makeHass(() => answer);
    const card = await createCard(hass);
    expect(root(card).querySelector(".warning")).not.toBeNull();
    // No new attempt before the retry time.
    await change(card, { "sensor.power": entity("sensor.power", "1") });
    expect(rankingCalls(hass)).toHaveLength(1);

    answer = ranking();
    vi.setSystemTime(Date.now() + LEADERBOARD_RETRY_MS);
    await change(card, { "sensor.power": entity("sensor.power", "2") });
    expect(rankingCalls(hass)).toHaveLength(2);
    expect(root(card).querySelector(".warning")).toBeNull();
    expect(rows(card)).toHaveLength(4);
  });

  it("keeps the ranking on a connection error", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    let answer: Answer = ranking();
    const hass = makeHass(() => answer);
    const card = await createCard(hass);
    answer = new Error("connection lost");
    await change(card, { "number.anna_today": entity("number.anna_today", "21") });
    expect(rankingCalls(hass)).toHaveLength(2);
    expect(rows(card)).toHaveLength(4);
    expect(root(card).querySelector(".warning")).toBeNull();
  });

  it("retries a failed lookup of the group", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const hass = makeHass();
    const working = hass.callWS;
    hass.callWS = vi.fn().mockRejectedValue(new Error("starting")) as HomeAssistant["callWS"];
    const card = await createCard(hass);
    expect(rows(card)).toEqual([]);
    card.hass = { ...hass, callWS: working };
    await settle(card);
    expect(rows(card)).toEqual([]);
    vi.setSystemTime(Date.now() + LEADERBOARD_RETRY_MS);
    card.hass = { ...card.hass, states: { ...card.hass.states } };
    await settle(card);
    expect(rows(card)).toHaveLength(4);
  });

  it("starts over for another group or a new start in the config", async () => {
    const hass = makeHass((msg) => ranking({ name: String(msg.entry_id) }));
    const card = await createCard(hass);
    segments(card, 0)[0].click();
    await settle(card);
    card.setConfig({ type: "x", group: "pair" });
    await settle(card);
    expect(rankingCalls(hass).at(-1)).toEqual({
      type: "daily_challenge/ranking",
      entry_id: "pair",
      period: "week",
    });
    expect(text(root(card).querySelector(".title"))).toBe("pair");

    card.setConfig({ type: "x", group: "pair", period: "total", ranking: "amount" });
    await settle(card);
    expect(rankingCalls(hass).at(-1)).toEqual({
      type: "daily_challenge/ranking",
      entry_id: "pair",
      period: "total",
      metric: "amount",
    });
  });

  it("guesses its size and offers grid options", () => {
    const card = document.createElement(LEADERBOARD_TYPE);
    card.setConfig({ type: "x", group: "family" });
    expect(card.getCardSize()).toBe(6);
    expect(card.getGridOptions()).toEqual({ columns: 6, min_columns: 4, rows: "auto" });
  });
});

describe("leaderboard editor", () => {
  interface HaForm extends HTMLElement {
    data: Record<string, unknown>;
    schema: { name: string; required?: boolean; selector: Record<string, any> }[];
    computeLabel: (schema: { name: string }) => string;
  }

  async function createEditor(
    config: Record<string, unknown> = { group: "family" },
    hass: HomeAssistant = makeHass(),
  ) {
    const editor = document.createElement(LEADERBOARD_EDITOR_TYPE);
    editor.setConfig({ type: `custom:${LEADERBOARD_TYPE}`, ...config } as never);
    editor.hass = hass;
    document.body.appendChild(editor);
    await settle(editor);
    return editor;
  }

  function form(editor: DailyChallengeLeaderboardCardEditor): HaForm {
    return editor.shadowRoot?.querySelector("ha-form") as HaForm;
  }

  function send(editor: DailyChallengeLeaderboardCardEditor, value: Record<string, unknown>) {
    form(editor).dispatchEvent(new CustomEvent("value-changed", { detail: { value } }));
  }

  it("offers the groups and shows the config with labels", async () => {
    const editor = await createEditor({ group: "family", ranking: "streak" });
    const schema = form(editor).schema;
    expect(schema.map((item) => item.name)).toEqual([
      "group",
      "title",
      "period",
      "ranking",
      "show_goal",
    ]);
    expect(schema[0].required).toBe(true);
    expect(schema[0].selector.select.options).toEqual([
      { value: "family", label: "Family" },
      { value: "pair", label: "Pair" },
    ]);
    expect(schema[2].selector.select.options.map((o: { label: string }) => o.label)).toEqual([
      "Today",
      "Week",
      "Month",
      "Total",
    ]);
    expect(schema[3].selector.select.options.map((o: { value: string }) => o.value)).toEqual([
      "percent",
      "amount",
      "streak",
    ]);
    expect(form(editor).data).toEqual({
      group: "family",
      title: "",
      period: "week",
      ranking: "streak",
      show_goal: true,
    });
    expect(form(editor).computeLabel({ name: "group" })).toBe("Group");
    expect(form(editor).computeLabel({ name: "ranking" })).toBe(
      "Ranking by (empty: as in the group)",
    );
    expect(form(editor).computeLabel({ name: "show_goal" })).toBe("Show shared goal");
  });

  it("writes only what differs from the defaults and keeps the rest", async () => {
    const editor = await createEditor({ group: "", grid_options: { columns: 6 } });
    expect(form(editor).data.group).toBeUndefined();
    const changes: unknown[] = [];
    editor.addEventListener("config-changed", (ev) =>
      changes.push((ev as CustomEvent).detail.config),
    );
    const type = `custom:${LEADERBOARD_TYPE}`;
    send(editor, { group: "pair", title: " Us ", period: "month", ranking: "amount", show_goal: false });
    send(editor, { group: "pair", title: " Us ", period: "month", ranking: "amount", show_goal: false });
    send(editor, { group: "pair", title: "", period: "week", show_goal: true });
    send(editor, { group: "pair", period: "bogus", ranking: "bogus" });
    expect(changes).toEqual([
      {
        type,
        group: "pair",
        grid_options: { columns: 6 },
        title: "Us",
        period: "month",
        ranking: "amount",
        show_goal: false,
      },
      { type, group: "pair", grid_options: { columns: 6 } },
    ]);
  });

  it("says when there is no group", async () => {
    const editor = await createEditor({ group: "" }, makeHass(ranking(), []));
    expect(text(editor.shadowRoot?.querySelector("p"))).toBe(
      "No Daily Challenge group set up yet.",
    );
    const failing = makeHass();
    failing.callWS = vi.fn().mockRejectedValue(new Error("x")) as HomeAssistant["callWS"];
    const broken = await createEditor({ group: "" }, failing);
    expect(text(broken.shadowRoot?.querySelector("p"))).toBe(
      "No Daily Challenge group set up yet.",
    );
  });

  it("renders nothing without hass", async () => {
    const editor = document.createElement(LEADERBOARD_EDITOR_TYPE);
    editor.setConfig({ type: "x", group: "family" });
    document.body.appendChild(editor);
    await editor.updateComplete;
    expect(editor.shadowRoot?.querySelector("ha-form")).toBeNull();
  });
});
