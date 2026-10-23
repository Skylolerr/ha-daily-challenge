import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CARD_TYPE,
  DailyChallengeCard,
  LONG_PRESS_MS,
} from "../src/daily-challenge-card";
import type { ChallengeInfo, HassEntity, HomeAssistant } from "../src/types";

const ENTITIES: Record<string, string> = {
  today: "number.push_ups_today",
  today_target: "sensor.push_ups_today_s_target",
  total: "sensor.push_ups_total",
  current_streak: "sensor.push_ups_current_streak",
  best_streak: "sensor.push_ups_best_streak",
  goal_reached_today: "binary_sensor.push_ups_goal_reached_today",
  add_1: "button.push_ups_add_1",
  add_10: "button.push_ups_add_10",
  add_5: "button.push_ups_add_5",
  subtract: "button.push_ups_subtract",
};

const CHALLENGE: ChallengeInfo = {
  entry_id: "push_ups",
  name: "Push-ups",
  icon: "mdi:arm-flex",
  unit: "repetitions",
  entities: ENTITIES,
};

function entity(entity_id: string, state: string): HassEntity {
  return {
    entity_id,
    state,
    attributes: entity_id.startsWith("number.")
      ? { unit_of_measurement: "repetitions" }
      : {},
  };
}

function makeStates(overrides: Record<string, string> = {}) {
  const states: Record<string, string> = {
    today: "15",
    today_target: "20",
    total: "60",
    current_streak: "3",
    best_streak: "7",
    goal_reached_today: "off",
    add_1: "unknown",
    add_5: "unknown",
    add_10: "unknown",
    subtract: "unknown",
    ...overrides,
  };
  return Object.fromEntries(
    Object.entries(states).map(([key, state]) => [
      ENTITIES[key],
      entity(ENTITIES[key], state),
    ]),
  );
}

const HISTORY = {
  days: { "2026-11-02": 20 },
  targets: { "2026-11-02": 20 },
  fulfilled: { "2026-11-02": true },
};

function mockWS(challenges: ChallengeInfo[]): HomeAssistant["callWS"] {
  return vi.fn(async (msg: { type: string }) =>
    msg.type === "daily_challenge/list" ? { challenges } : HISTORY,
  ) as unknown as HomeAssistant["callWS"];
}

function calls(hass: HomeAssistant, type: string): number {
  return vi
    .mocked(hass.callWS)
    .mock.calls.filter(([msg]) => msg.type === type).length;
}

function makeHass(
  overrides: Record<string, string> = {},
  challenges: ChallengeInfo[] = [CHALLENGE],
): HomeAssistant {
  return {
    locale: { language: "en" },
    states: makeStates(overrides),
    entities: {},
    callWS: mockWS(challenges),
    callService: vi.fn().mockResolvedValue(undefined),
  };
}

async function settle(card: DailyChallengeCard): Promise<void> {
  // Let the challenge lookup resolve and the card re-render.
  for (let i = 0; i < 3; i++) {
    await Promise.resolve();
    await card.updateComplete;
  }
}

async function createCard(
  hass: HomeAssistant = makeHass(),
  entityId = ENTITIES.today,
): Promise<DailyChallengeCard> {
  const card = document.createElement(CARD_TYPE);
  card.setConfig({ type: `custom:${CARD_TYPE}`, entity: entityId });
  card.hass = hass;
  document.body.appendChild(card);
  await settle(card);
  return card;
}

function root(card: DailyChallengeCard): ShadowRoot {
  return card.shadowRoot as ShadowRoot;
}

function text(element: Element | ShadowRoot | null | undefined): string {
  return (element?.textContent ?? "").replace(/\s+/g, " ").trim();
}

function buttons(card: DailyChallengeCard): HTMLButtonElement[] {
  return [...root(card).querySelectorAll("button")];
}

function ringOffset(card: DailyChallengeCard): number {
  return Number(
    root(card).querySelector(".progress")?.getAttribute("stroke-dashoffset"),
  );
}

const CIRCUMFERENCE = 2 * Math.PI * 52;

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("setup", () => {
  it("is registered as a custom element", () => {
    expect(customElements.get(CARD_TYPE)).toBe(DailyChallengeCard);
  });

  it("requires an entity", () => {
    const card = document.createElement(CARD_TYPE);
    expect(() =>
      card.setConfig({ type: `custom:${CARD_TYPE}`, entity: "" }),
    ).toThrow(/entity/);
  });

  it("renders nothing without hass", async () => {
    const card = document.createElement(CARD_TYPE);
    card.setConfig({ type: `custom:${CARD_TYPE}`, entity: ENTITIES.today });
    document.body.appendChild(card);
    await card.updateComplete;
    expect(text(root(card))).toBe("");
  });

  it("shows an empty card while loading", async () => {
    const hass = makeHass();
    hass.callWS = vi.fn(() => new Promise(() => {})) as HomeAssistant["callWS"];
    const card = await createCard(hass);
    expect(root(card).querySelector("ha-card")).not.toBeNull();
    expect(text(root(card))).toBe("");
  });

  it("finds the challenge from any of its entities", async () => {
    const hass = makeHass();
    const card = await createCard(hass, ENTITIES.total);
    expect(hass.callWS).toHaveBeenCalledWith({ type: "daily_challenge/list" });
    expect(text(root(card).querySelector(".name"))).toBe("Push-ups");
  });

  it("warns about unknown entities", async () => {
    const card = await createCard(makeHass(), "number.unknown");
    expect(text(root(card))).toBe("Entity not found: number.unknown");
  });

  it("warns about entities outside a challenge", async () => {
    const hass = makeHass();
    hass.states["light.kitchen"] = entity("light.kitchen", "on");
    const card = await createCard(hass, "light.kitchen");
    expect(text(root(card))).toBe(
      "light.kitchen does not belong to a Daily Challenge.",
    );
  });

  it("treats a failed lookup like an unknown challenge", async () => {
    const hass = makeHass();
    hass.callWS = vi.fn().mockRejectedValue(new Error("boom")) as HomeAssistant["callWS"];
    const card = await createCard(hass);
    expect(text(root(card))).toMatch(/does not belong/);
  });

  it("looks the challenge up again when the entity registry changes", async () => {
    const hass = makeHass();
    const card = await createCard(hass);
    expect(buttons(card)).toHaveLength(4);

    const withoutTen = { ...ENTITIES };
    delete withoutTen.add_10;
    const updated: HomeAssistant = {
      ...hass,
      entities: {},
      callWS: mockWS([{ ...CHALLENGE, entities: withoutTen }]),
    };
    card.hass = updated;
    await settle(card);
    expect(calls(updated, "daily_challenge/list")).toBe(1);
    expect(buttons(card).map((b) => text(b))).toEqual(["−1", "+1", "+5"]);

    // Same registry, new states: no new lookup.
    card.hass = { ...updated, states: makeStates({ today: "16" }) };
    await settle(card);
    expect(calls(updated, "daily_challenge/list")).toBe(1);
  });

  it("starts a new lookup when the entity changes", async () => {
    const hass = makeHass();
    const card = await createCard(hass);
    card.setConfig({ type: `custom:${CARD_TYPE}`, entity: ENTITIES.total });
    card.hass = { ...hass };
    await settle(card);
    expect(calls(hass, "daily_challenge/list")).toBe(2);
  });
});

describe("view", () => {
  it("shows icon, name and streaks in the header", async () => {
    const card = await createCard();
    const icon = root(card).querySelector("ha-icon") as HTMLElement & {
      icon?: string;
    };
    expect(icon.icon).toBe("mdi:arm-flex");
    expect(text(root(card).querySelector(".name"))).toBe("Push-ups");
    expect(text(root(card).querySelector(".streak"))).toBe("🔥 3 · Best 7");
  });

  it("shows today's value against the effective target", async () => {
    const card = await createCard();
    expect(text(root(card).querySelector(".value"))).toBe("15 / 20 repetitions");
    expect(ringOffset(card)).toBeCloseTo(CIRCUMFERENCE * 0.25);
    expect(root(card).querySelector(".progress.reached")).toBeNull();
  });

  it("fills the ring in the success colour once the goal is reached", async () => {
    const card = await createCard(
      makeHass({ today: "25", goal_reached_today: "on" }),
    );
    expect(ringOffset(card)).toBe(0);
    expect(root(card).querySelector(".progress.reached")).not.toBeNull();
  });

  it("caps the ring at a full circle", async () => {
    const card = await createCard(makeHass({ today: "30" }));
    expect(ringOffset(card)).toBe(0);
  });

  it("handles an inactive challenge", async () => {
    const card = await createCard(
      makeHass({ today_target: "unknown", goal_reached_today: "unknown" }),
    );
    expect(text(root(card).querySelector(".value"))).toBe("15 / – repetitions");
    expect(ringOffset(card)).toBeCloseTo(CIRCUMFERENCE);
    expect(buttons(card).every((button) => button.disabled)).toBe(true);
  });

  it("shows placeholders for missing states", async () => {
    const hass = makeHass();
    delete hass.states[ENTITIES.current_streak];
    delete hass.states[ENTITIES.best_streak];
    const card = await createCard(hass);
    expect(text(root(card).querySelector(".streak"))).toBe("🔥 – · Best –");
  });
});

describe("buttons", () => {
  it("shows minus and one plus button per step, sorted", async () => {
    const card = await createCard();
    expect(buttons(card).map((b) => text(b))).toEqual(["−1", "+1", "+5", "+10"]);
  });

  it("presses the matching button entity", async () => {
    const hass = makeHass();
    const card = await createCard(hass);
    buttons(card)[2].click();
    buttons(card)[0].click();
    expect(hass.callService).toHaveBeenNthCalledWith(1, "button", "press", {
      entity_id: "button.push_ups_add_5",
    });
    expect(hass.callService).toHaveBeenNthCalledWith(2, "button", "press", {
      entity_id: "button.push_ups_subtract",
    });
  });

  it("reports failed calls as notification", async () => {
    const hass = makeHass();
    hass.callService = vi.fn().mockRejectedValue(new Error("Date is after the end"));
    const card = await createCard(hass);
    const notifications: string[] = [];
    document.body.addEventListener("hass-notification", (ev) =>
      notifications.push((ev as CustomEvent).detail.message),
    );
    buttons(card)[1].click();
    await settle(card);
    expect(notifications).toEqual(["Date is after the end"]);
  });

  it("omits the minus button without steps", async () => {
    const card = await createCard(
      makeHass({}, [{ ...CHALLENGE, entities: { today: ENTITIES.today, subtract: ENTITIES.subtract } }]),
    );
    expect(buttons(card)).toEqual([]);
  });
});

describe("direct input", () => {
  function value(card: DailyChallengeCard): HTMLElement {
    return root(card).querySelector(".value") as HTMLElement;
  }

  function input(card: DailyChallengeCard): HTMLInputElement | null {
    return root(card).querySelector("input");
  }

  async function longPress(card: DailyChallengeCard): Promise<void> {
    vi.useFakeTimers();
    value(card).dispatchEvent(new Event("pointerdown"));
    vi.advanceTimersByTime(LONG_PRESS_MS);
    value(card)?.dispatchEvent(new Event("pointerup"));
    vi.useRealTimers();
    await settle(card);
  }

  async function submit(card: DailyChallengeCard, newValue: string, key = "Enter") {
    const field = input(card) as HTMLInputElement;
    field.value = newValue;
    field.dispatchEvent(new KeyboardEvent("keydown", { key }));
    await settle(card);
  }

  it("opens an input on long press and sets the value", async () => {
    const hass = makeHass();
    const card = await createCard(hass);
    await longPress(card);
    expect(input(card)?.value).toBe("15");

    await submit(card, "30");
    expect(input(card)).toBeNull();
    expect(hass.callService).toHaveBeenCalledWith("number", "set_value", {
      entity_id: ENTITIES.today,
      value: 30,
    });
  });

  it("ignores short presses", async () => {
    const card = await createCard();
    vi.useFakeTimers();
    value(card).dispatchEvent(new Event("pointerdown"));
    vi.advanceTimersByTime(LONG_PRESS_MS / 2);
    value(card).dispatchEvent(new Event("pointerup"));
    vi.advanceTimersByTime(LONG_PRESS_MS);
    vi.useRealTimers();
    await settle(card);
    expect(input(card)).toBeNull();
  });

  it("opens with the keyboard", async () => {
    const card = await createCard();
    value(card).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    await settle(card);
    expect(input(card)).not.toBeNull();
  });

  it("ignores other keys on the value", async () => {
    const card = await createCard();
    value(card).dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    await settle(card);
    expect(input(card)).toBeNull();
  });

  it("cancels with Escape", async () => {
    const hass = makeHass();
    const card = await createCard(hass);
    await longPress(card);
    await submit(card, "30", "Escape");
    expect(input(card)).toBeNull();
    expect(hass.callService).not.toHaveBeenCalled();
  });

  it("commits on blur only once", async () => {
    const hass = makeHass();
    const card = await createCard(hass);
    await longPress(card);
    const field = input(card) as HTMLInputElement;
    field.value = "21";
    field.dispatchEvent(new FocusEvent("blur"));
    field.dispatchEvent(new FocusEvent("blur"));
    await settle(card);
    expect(hass.callService).toHaveBeenCalledTimes(1);
  });

  it.each(["", "-3", "2.5", "15", "abc"])(
    "does not set invalid or unchanged value %j",
    async (newValue) => {
      const hass = makeHass();
      const card = await createCard(hass);
      await longPress(card);
      await submit(card, newValue);
      expect(hass.callService).not.toHaveBeenCalled();
    },
  );

  it("does not open while today's value is unavailable", async () => {
    const card = await createCard(makeHass({ today: "unavailable" }));
    await longPress(card);
    expect(input(card)).toBeNull();
  });
});

describe("summary", () => {
  const SUMMARY_ENTITIES = {
    ...ENTITIES,
    target_to_date: "sensor.push_ups_target_to_date",
    delta: "sensor.push_ups_ahead_behind",
    remaining: "sensor.push_ups_remaining",
  };
  const SUMMARY_CHALLENGE = { ...CHALLENGE, entities: SUMMARY_ENTITIES };

  function summaryHass(
    states: Record<string, string>,
    targetAttributes: Record<string, unknown> = { daily_target: 20, deficit: 0 },
    language = "en",
  ): HomeAssistant {
    const hass = makeHass({}, [SUMMARY_CHALLENGE]);
    hass.locale = { language };
    for (const [key, state] of Object.entries(states)) {
      const id = SUMMARY_ENTITIES[key as keyof typeof SUMMARY_ENTITIES];
      hass.states[id] = entity(id, state);
    }
    hass.states[ENTITIES.today_target].attributes = {
      ...hass.states[ENTITIES.today_target].attributes,
      ...targetAttributes,
    };
    return hass;
  }

  function summary(card: DailyChallengeCard): string {
    return text(root(card).querySelector(".summary"));
  }

  it("shows actual vs. target with the lead", async () => {
    const card = await createCard(
      summaryHass({ total: "1240", target_to_date: "1200", delta: "40" }),
    );
    expect(summary(card)).toBe("Actual 1,240 / Target 1,200 · +40");
    expect(root(card).querySelector(".delta.ahead")).not.toBeNull();
  });

  it("marks a deficit", async () => {
    const card = await createCard(
      summaryHass({ total: "60", target_to_date: "72", delta: "-12" }),
    );
    expect(summary(card)).toBe("Actual 60 / Target 72 · −12");
    expect(root(card).querySelector(".delta.behind")).not.toBeNull();
  });

  it("shows ±0 when on track", async () => {
    const card = await createCard(
      summaryHass({ total: "60", target_to_date: "60", delta: "0" }),
    );
    expect(summary(card)).toBe("Actual 60 / Target 60 · ±0");
  });

  it("speaks the user's language and formats numbers", async () => {
    const card = await createCard(
      summaryHass(
        { total: "1240", target_to_date: "1200", delta: "40", remaining: "3100" },
        { daily_target: 20, deficit: 10 },
        "de-CH",
      ),
    );
    // The Swiss group separator is an apostrophe (exact glyph depends on CLDR).
    const swiss = new Intl.NumberFormat("de-CH");
    expect(text(root(card).querySelector(".target-vs-actual"))).toBe(
      `Ist ${swiss.format(1240)} / Soll ${swiss.format(1200)} · +40`,
    );
    expect(swiss.format(1240)).toMatch(/^1['’]240$/);
    expect(text(root(card).querySelector(".remaining"))).toBe(
      `Noch ${swiss.format(3100)} bis zum Ziel`,
    );
    expect(text(root(card).querySelector(".streak"))).toBe("🔥 3 · Rekord 7");
  });

  it("shows what is left with an end date", async () => {
    const card = await createCard(
      summaryHass({
        total: "60",
        target_to_date: "60",
        delta: "0",
        remaining: "3100",
      }),
    );
    expect(text(root(card).querySelector(".remaining"))).toBe(
      "3,100 left to goal",
    );
  });

  it("omits the line without figures", async () => {
    const card = await createCard();
    expect(summary(card)).toBe("");
  });

  it("shows the target without delta when the delta is unavailable", async () => {
    const card = await createCard(
      summaryHass({ total: "60", target_to_date: "60", delta: "unavailable" }),
    );
    expect(summary(card)).toBe("Actual 60 / Target 60");
  });

  it("marks the deficit in today's target in catch-up mode", async () => {
    const card = await createCard(
      summaryHass({ today_target: "30" }, { daily_target: 20, deficit: 10 }),
    );
    expect(text(root(card).querySelector(".catch-up"))).toBe(
      "Today: 20 + 10 deficit",
    );
    expect(text(root(card).querySelector(".target"))).toBe("/ 30");
  });

  it("does not mark a deficit that only is displayed", async () => {
    const card = await createCard(
      summaryHass({ today_target: "20" }, { daily_target: 20, deficit: 10 }),
    );
    expect(root(card).querySelector(".catch-up")).toBeNull();
  });
});

describe("history", () => {
  it("loads the history and reloads it when the total changes", async () => {
    const hass = makeHass();
    const card = await createCard(hass);
    expect(calls(hass, "daily_challenge/history")).toBe(1);
    expect(hass.callWS).toHaveBeenCalledWith({
      type: "daily_challenge/history",
      entry_id: "push_ups",
    });
    expect(card.history).toEqual(HISTORY);

    card.hass = { ...hass, states: makeStates({ today: "16" }) };
    await settle(card);
    expect(calls(hass, "daily_challenge/history")).toBe(1);

    card.hass = { ...hass, states: makeStates({ total: "61" }) };
    await settle(card);
    expect(calls(hass, "daily_challenge/history")).toBe(2);
  });

  it("keeps the last history when loading fails", async () => {
    const hass = makeHass();
    const card = await createCard(hass);
    const failing = vi.fn(async (msg: { type: string }) => {
      if (msg.type === "daily_challenge/history") {
        throw new Error("offline");
      }
      return { challenges: [CHALLENGE] };
    }) as unknown as HomeAssistant["callWS"];
    card.hass = { ...hass, callWS: failing, states: makeStates({ total: "61" }) };
    await settle(card);
    expect(card.history).toEqual(HISTORY);
  });
});

describe("card picker", () => {
  it("registers the card with a preview", () => {
    const cards = (window as unknown as { customCards: { type: string }[] })
      .customCards;
    expect(cards.filter((card) => card.type === CARD_TYPE)).toEqual([
      expect.objectContaining({ name: "Daily Challenge", preview: true }),
    ]);
  });

  it("suggests the first challenge as stub config", () => {
    const hass = makeHass();
    hass.entities = {
      "light.kitchen": { entity_id: "light.kitchen", platform: "hue" },
      "sensor.push_ups_total": {
        entity_id: "sensor.push_ups_total",
        platform: "daily_challenge",
        translation_key: "total",
      },
      "number.push_ups_today": {
        entity_id: "number.push_ups_today",
        platform: "daily_challenge",
        translation_key: "today",
      },
    };
    expect(DailyChallengeCard.getStubConfig(hass)).toEqual({
      type: `custom:${CARD_TYPE}`,
      entity: "number.push_ups_today",
    });
    expect(DailyChallengeCard.getStubConfig(undefined).entity).toBe("");
  });

  it("provides the visual editor", () => {
    expect(DailyChallengeCard.getConfigElement().tagName.toLowerCase()).toBe(
      "daily-challenge-card-editor",
    );
  });
});
