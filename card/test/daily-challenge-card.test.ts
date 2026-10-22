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

function makeHass(
  overrides: Record<string, string> = {},
  challenges: ChallengeInfo[] = [CHALLENGE],
): HomeAssistant {
  return {
    locale: { language: "en" },
    states: makeStates(overrides),
    entities: {},
    callWS: vi.fn().mockResolvedValue({ challenges }) as HomeAssistant["callWS"],
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
      callWS: vi.fn().mockResolvedValue({
        challenges: [{ ...CHALLENGE, entities: withoutTen }],
      }) as HomeAssistant["callWS"],
    };
    card.hass = updated;
    await settle(card);
    expect(updated.callWS).toHaveBeenCalledTimes(1);
    expect(buttons(card).map((b) => text(b))).toEqual(["−1", "+1", "+5"]);

    // Same registry, new states: no new lookup.
    card.hass = { ...updated, states: makeStates({ today: "16" }) };
    await settle(card);
    expect(updated.callWS).toHaveBeenCalledTimes(1);
  });

  it("starts a new lookup when the entity changes", async () => {
    const hass = makeHass();
    const card = await createCard(hass);
    card.setConfig({ type: `custom:${CARD_TYPE}`, entity: ENTITIES.total });
    card.hass = { ...hass };
    await settle(card);
    expect(hass.callWS).toHaveBeenCalledTimes(2);
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
