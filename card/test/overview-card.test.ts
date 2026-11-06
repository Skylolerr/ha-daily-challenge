import { afterEach, describe, expect, it, vi } from "vitest";

import { DailyChallengeOverviewCard, OVERVIEW_TYPE } from "../src/overview-card";
import {
  DailyChallengeOverviewCardEditor,
  OVERVIEW_EDITOR_TYPE,
} from "../src/overview-editor";
import type { ChallengeInfo, HassEntity, HomeAssistant } from "../src/types";

function challenge(id: string, name: string, extra: Partial<ChallengeInfo> = {}) {
  return {
    entry_id: id,
    name,
    icon: "mdi:arm-flex",
    unit: "repetitions",
    entities: {
      today: `number.${id}_today`,
      today_target: `sensor.${id}_today_s_target`,
      current_streak: `sensor.${id}_current_streak`,
      goal_reached_today: `binary_sensor.${id}_goal_reached_today`,
      days_left: `sensor.${id}_days_left`,
      add_5: `button.${id}_add_5`,
      add_1: `button.${id}_add_1`,
      subtract: `button.${id}_subtract`,
    },
    ...extra,
  } satisfies ChallengeInfo;
}

const PUSH_UPS = challenge("push_ups", "Push-ups");
const SQUATS = challenge("squats", "Squats");

function entity(entity_id: string, state: string): HassEntity {
  return {
    entity_id,
    state,
    attributes: entity_id.startsWith("number.")
      ? { unit_of_measurement: "repetitions" }
      : {},
  };
}

function states(item: ChallengeInfo, overrides: Record<string, string> = {}) {
  const values: Record<string, string> = {
    today: "15",
    today_target: "20",
    current_streak: "3",
    goal_reached_today: "off",
    days_left: "unknown",
    add_1: "unknown",
    add_5: "unknown",
    subtract: "unknown",
    ...overrides,
  };
  return Object.fromEntries(
    Object.entries(values)
      .filter(([key]) => item.entities[key])
      .map(([key, state]) => [item.entities[key], entity(item.entities[key], state)]),
  );
}

function makeHass(
  challenges: ChallengeInfo[] = [PUSH_UPS, SQUATS],
  overrides: Record<string, Record<string, string>> = {},
): HomeAssistant {
  return {
    locale: { language: "en" },
    states: Object.assign(
      {},
      ...challenges.map((item) => states(item, overrides[item.entry_id])),
    ),
    entities: {},
    callWS: vi.fn().mockResolvedValue({ challenges }) as HomeAssistant["callWS"],
    callService: vi.fn().mockResolvedValue(undefined),
  };
}

async function settle(element: { updateComplete: Promise<boolean> }): Promise<void> {
  for (let i = 0; i < 3; i++) {
    await Promise.resolve();
    await element.updateComplete;
  }
}

async function createCard(
  hass: HomeAssistant = makeHass(),
  config: Record<string, unknown> = {},
): Promise<DailyChallengeOverviewCard> {
  const card = document.createElement(OVERVIEW_TYPE);
  card.setConfig({ type: `custom:${OVERVIEW_TYPE}`, ...config });
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

function rows(card: DailyChallengeOverviewCard): HTMLElement[] {
  return [...root(card).querySelectorAll<HTMLElement>(".row")];
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("overview card", () => {
  it("is registered and offered in the card picker", () => {
    expect(customElements.get(OVERVIEW_TYPE)).toBe(DailyChallengeOverviewCard);
    const picker = (window as unknown as { customCards: { type: string }[] }).customCards;
    expect(picker.some((card) => card.type === OVERVIEW_TYPE)).toBe(true);
    expect(DailyChallengeOverviewCard.getStubConfig()).toEqual({
      type: `custom:${OVERVIEW_TYPE}`,
    });
  });

  it("rejects entities that are not a list", () => {
    const card = document.createElement(OVERVIEW_TYPE);
    expect(() =>
      card.setConfig({ type: "x", entities: "number.a" as unknown as string[] }),
    ).toThrow("entities must be a list");
  });

  it("shows one row per challenge with figures, bar and streak", async () => {
    const card = await createCard(makeHass(undefined, { squats: { goal_reached_today: "on", today: "20" } }), {
      title: "My challenges",
    });
    expect(text(root(card).querySelector(".card-header"))).toBe("My challenges");
    expect(
      rows(card).map(
        (row) => `${text(row.querySelector(".name"))}: ${text(row.querySelector(".figures"))}`,
      ),
    ).toEqual(["Push-ups: 15 / 20 repetitions", "Squats: 20 / 20 repetitions"]);
    const fills = [...root(card).querySelectorAll<HTMLElement>(".fill")];
    expect(fills[0].style.width).toBe("75%");
    expect(fills[1].classList.contains("reached")).toBe(true);
    expect(text(rows(card)[0].querySelector(".streak"))).toBe("🔥 3");
    expect(card.getCardSize()).toBe(3);
  });

  it("shows only the chosen challenges in the chosen order", async () => {
    const card = await createCard(makeHass(), {
      entities: ["number.squats_today", "number.unknown_today"],
    });
    expect(rows(card).map((row) => text(row.querySelector(".name")))).toEqual(["Squats"]);
  });

  it("presses the smallest step without opening the dialog", async () => {
    const hass = makeHass();
    const card = await createCard(hass);
    const opened: string[] = [];
    card.addEventListener("hass-more-info", (ev) =>
      opened.push((ev as CustomEvent).detail.entityId),
    );
    const button = rows(card)[0].querySelector("button") as HTMLButtonElement;
    expect(text(button)).toBe("+1");
    button.click();
    expect(hass.callService).toHaveBeenCalledWith("button", "press", {
      entity_id: "button.push_ups_add_1",
    });
    expect(opened).toEqual([]);

    rows(card)[1].click();
    rows(card)[1].dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(opened).toEqual(["number.squats_today", "number.squats_today"]);
  });

  it("reports a failed press", async () => {
    const hass = makeHass();
    hass.callService = vi.fn().mockRejectedValue(new Error("Not running"));
    const card = await createCard(hass);
    const messages: string[] = [];
    card.addEventListener("hass-notification", (ev) =>
      messages.push((ev as CustomEvent).detail.message),
    );
    (rows(card)[0].querySelector("button") as HTMLButtonElement).click();
    await settle(card);
    expect(messages).toEqual(["Not running"]);
  });

  it("hides the button when it cannot be used or is not wanted", async () => {
    const fed = challenge("steps", "Steps", { today_from_source: true });
    const card = await createCard(
      makeHass([PUSH_UPS, SQUATS, fed], {
        push_ups: { add_1: "unavailable", add_5: "unavailable" },
        squats: { days_left: "0" },
      }),
    );
    expect(rows(card).map((row) => row.querySelector("button"))).toEqual([
      null,
      null,
      null,
    ]);
    expect(text(rows(card)[1].querySelector(".figures"))).toBe("Finished");

    const waiting = await createCard(
      makeHass([PUSH_UPS], { push_ups: { today_target: "unavailable" } }),
    );
    expect(rows(waiting)[0].querySelector("button")?.disabled).toBe(true);

    const hidden = await createCard(makeHass([PUSH_UPS]), { show_buttons: false });
    expect(rows(hidden)[0].querySelector("button")).toBeNull();
  });

  it("says when the chosen challenges are gone", async () => {
    const card = await createCard(makeHass(), { entities: ["number.removed_today"] });
    expect(text(root(card).querySelector(".empty"))).toBe(
      "None of the chosen challenges exists any more.",
    );
  });

  it("reports the message of a plain error object", async () => {
    const hass = makeHass();
    hass.callService = vi.fn().mockRejectedValue({ code: "x", message: "Not running" });
    const card = await createCard(hass);
    const messages: string[] = [];
    card.addEventListener("hass-notification", (ev) =>
      messages.push((ev as CustomEvent).detail.message),
    );
    (rows(card)[0].querySelector("button") as HTMLButtonElement).click();
    await settle(card);
    expect(messages).toEqual(["Not running"]);
  });

  it("guesses its size before loading and offers grid options", () => {
    const card = document.createElement(OVERVIEW_TYPE);
    card.setConfig({ type: "x", entities: ["number.a", "number.b"] });
    expect(card.getCardSize()).toBe(2);
    expect(card.getGridOptions()).toEqual({ columns: 6, min_columns: 4, rows: "auto" });
  });

  it("tells when there are no challenges and retries a failed lookup", async () => {
    const empty = await createCard(makeHass([]));
    expect(text(root(empty).querySelector(".empty"))).toBe(
      "No Daily Challenge set up yet.",
    );

    const hass = makeHass();
    hass.callWS = vi.fn().mockRejectedValue(new Error("starting")) as HomeAssistant["callWS"];
    const card = await createCard(hass);
    expect(rows(card)).toEqual([]);
    expect(root(card).querySelector("ha-card")).not.toBeNull();
  });

  it("renders nothing without hass", async () => {
    const card = document.createElement(OVERVIEW_TYPE);
    card.setConfig({ type: "x" });
    document.body.appendChild(card);
    await card.updateComplete;
    expect(root(card).querySelector("ha-card")).toBeNull();
  });
});

describe("overview editor", () => {
  interface HaForm extends HTMLElement {
    data: Record<string, unknown>;
    computeLabel: (schema: { name: string }) => string;
  }

  async function createEditor(config: Record<string, unknown>) {
    const editor = document.createElement(OVERVIEW_EDITOR_TYPE);
    editor.setConfig({ type: `custom:${OVERVIEW_TYPE}`, ...config });
    editor.hass = makeHass();
    document.body.appendChild(editor);
    await settle(editor);
    return editor;
  }

  function form(editor: DailyChallengeOverviewCardEditor): HaForm {
    return editor.shadowRoot?.querySelector("ha-form") as HaForm;
  }

  it("is offered by the card", () => {
    expect(DailyChallengeOverviewCard.getConfigElement().tagName.toLowerCase()).toBe(
      OVERVIEW_EDITOR_TYPE,
    );
  });

  it("shows the config with labels", async () => {
    const editor = await createEditor({ title: "Mine", show_buttons: false });
    expect(form(editor).data).toEqual({
      title: "Mine",
      entities: [],
      show_buttons: false,
    });
    expect(form(editor).computeLabel({ name: "entities" })).toBe(
      "Challenges (empty: all)",
    );
  });

  it("keeps other parts of the card config", async () => {
    const editor = await createEditor({ grid_options: { columns: 6 } });
    const changes: Record<string, unknown>[] = [];
    editor.addEventListener("config-changed", (ev) =>
      changes.push((ev as CustomEvent).detail.config),
    );
    form(editor).dispatchEvent(
      new CustomEvent("value-changed", {
        detail: { value: { title: "Mine", entities: [], show_buttons: true } },
      }),
    );
    expect(changes).toEqual([
      { type: `custom:${OVERVIEW_TYPE}`, grid_options: { columns: 6 }, title: "Mine" },
    ]);
  });

  it("writes only what differs from the defaults", async () => {
    const editor = await createEditor({});
    const changes: unknown[] = [];
    editor.addEventListener("config-changed", (ev) =>
      changes.push((ev as CustomEvent).detail.config),
    );
    const send = (value: Record<string, unknown>) =>
      form(editor).dispatchEvent(new CustomEvent("value-changed", { detail: { value } }));
    send({ title: " Mine ", entities: ["number.squats_today"], show_buttons: false });
    send({ title: " Mine ", entities: ["number.squats_today"], show_buttons: false });
    send({ title: "", entities: [], show_buttons: true });
    expect(changes).toEqual([
      {
        type: `custom:${OVERVIEW_TYPE}`,
        title: "Mine",
        entities: ["number.squats_today"],
        show_buttons: false,
      },
      { type: `custom:${OVERVIEW_TYPE}` },
    ]);
  });
});
