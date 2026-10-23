import { afterEach, describe, expect, it, vi } from "vitest";

import { DailyChallengeCardEditor, EDITOR_TYPE } from "../src/editor";
import type { ChallengeInfo, HomeAssistant } from "../src/types";

const PUSH_UPS: ChallengeInfo = {
  entry_id: "push_ups",
  name: "Push-ups",
  icon: "mdi:arm-flex",
  unit: "repetitions",
  entities: {
    today: "number.push_ups_today",
    total: "sensor.push_ups_total",
  },
};
const SQUATS: ChallengeInfo = {
  entry_id: "squats",
  name: "Squats",
  icon: "mdi:human",
  unit: "reps",
  entities: { today: "number.squats_today" },
};

interface HaForm extends HTMLElement {
  data: Record<string, unknown>;
  schema: { name: string; selector: { select: { options: unknown[] } } }[];
  computeLabel: (schema: { name: string }) => string;
}

function makeHass(challenges: ChallengeInfo[] | Error): HomeAssistant {
  return {
    locale: { language: "en" },
    states: {},
    callWS: (challenges instanceof Error
      ? vi.fn().mockRejectedValue(challenges)
      : vi.fn().mockResolvedValue({ challenges })) as HomeAssistant["callWS"],
    callService: vi.fn(),
  };
}

async function createEditor(
  hass: HomeAssistant,
  entity = "sensor.push_ups_total",
): Promise<DailyChallengeCardEditor> {
  const editor = document.createElement(EDITOR_TYPE);
  editor.setConfig({ type: "custom:daily-challenge-card", entity });
  editor.hass = hass;
  document.body.appendChild(editor);
  for (let i = 0; i < 3; i++) {
    await Promise.resolve();
    await editor.updateComplete;
  }
  return editor;
}

function form(editor: DailyChallengeCardEditor): HaForm {
  return editor.shadowRoot?.querySelector("ha-form") as HaForm;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("editor", () => {
  it("offers all challenges and selects the configured one", async () => {
    const hass = makeHass([PUSH_UPS, SQUATS]);
    const editor = await createEditor(hass);
    expect(hass.callWS).toHaveBeenCalledWith({ type: "daily_challenge/list" });
    expect(form(editor).schema[0].selector.select.options).toEqual([
      { value: "push_ups", label: "Push-ups" },
      { value: "squats", label: "Squats" },
    ]);
    expect(form(editor).data).toEqual({
      challenge: "push_ups",
      show_streak: true,
      show_target_vs_actual: true,
      show_remaining: true,
      show_required_average: true,
      show_catch_up: true,
      show_buttons: true,
    });
    expect(form(editor).computeLabel({ name: "challenge" })).toBe("Challenge");
    expect(form(editor).computeLabel({ name: "show_required_average" })).toBe(
      "Show required average per day",
    );
    expect(form(editor).schema.map((field) => field.name)).toEqual([
      "challenge",
      "show_streak",
      "show_target_vs_actual",
      "show_remaining",
      "show_required_average",
      "show_catch_up",
      "show_buttons",
    ]);
  });

  it("writes only hidden parts into the config", async () => {
    const editor = await createEditor(makeHass([PUSH_UPS]), "number.push_ups_today");
    const changes: unknown[] = [];
    editor.addEventListener("config-changed", (ev) =>
      changes.push((ev as CustomEvent).detail.config),
    );
    const change = (value: Record<string, unknown>) =>
      form(editor).dispatchEvent(
        new CustomEvent("value-changed", { detail: { value } }),
      );

    change({ ...form(editor).data, show_required_average: false });
    change({ ...form(editor).data, show_required_average: true });
    expect(changes).toEqual([
      {
        type: "custom:daily-challenge-card",
        entity: "number.push_ups_today",
        show_required_average: false,
      },
      { type: "custom:daily-challenge-card", entity: "number.push_ups_today" },
    ]);
  });

  it("shows hidden parts as switched off and keeps them on a challenge switch", async () => {
    const hass = makeHass([PUSH_UPS, SQUATS]);
    const editor = document.createElement(EDITOR_TYPE);
    editor.setConfig({
      type: "custom:daily-challenge-card",
      entity: "number.push_ups_today",
      show_buttons: false,
    });
    editor.hass = hass;
    document.body.appendChild(editor);
    for (let i = 0; i < 3; i++) {
      await Promise.resolve();
      await editor.updateComplete;
    }
    expect(form(editor).data.show_buttons).toBe(false);
    expect(form(editor).data.show_streak).toBe(true);

    const changes: unknown[] = [];
    editor.addEventListener("config-changed", (ev) =>
      changes.push((ev as CustomEvent).detail.config),
    );
    form(editor).dispatchEvent(
      new CustomEvent("value-changed", {
        detail: { value: { ...form(editor).data, challenge: "squats" } },
      }),
    );
    expect(changes).toEqual([
      {
        type: "custom:daily-challenge-card",
        entity: "number.squats_today",
        show_buttons: false,
      },
    ]);
  });

  it("switches the challenge via its today entity", async () => {
    const editor = await createEditor(makeHass([PUSH_UPS, SQUATS]));
    const changes: unknown[] = [];
    editor.addEventListener("config-changed", (ev) =>
      changes.push((ev as CustomEvent).detail.config),
    );
    form(editor).dispatchEvent(
      new CustomEvent("value-changed", { detail: { value: { challenge: "squats" } } }),
    );
    expect(changes).toEqual([
      { type: "custom:daily-challenge-card", entity: "number.squats_today" },
    ]);
  });

  it("ignores selecting the current or an unknown challenge", async () => {
    const editor = await createEditor(
      makeHass([PUSH_UPS]),
      "number.push_ups_today",
    );
    const changes: unknown[] = [];
    editor.addEventListener("config-changed", (ev) => changes.push(ev));
    for (const challenge of ["push_ups", "gone", undefined]) {
      form(editor).dispatchEvent(
        new CustomEvent("value-changed", { detail: { value: { challenge } } }),
      );
    }
    expect(changes).toEqual([]);
  });

  it("explains when no challenge exists", async () => {
    const editor = await createEditor(makeHass([]));
    expect(editor.shadowRoot?.textContent?.trim()).toBe(
      "No Daily Challenge set up yet.",
    );
  });

  it("treats a failed lookup as no challenges", async () => {
    const editor = await createEditor(makeHass(new Error("offline")));
    expect(form(editor)).toBeNull();
    expect(editor.shadowRoot?.textContent?.trim()).toBe(
      "No Daily Challenge set up yet.",
    );
  });

  it("renders nothing before hass is set", async () => {
    const editor = document.createElement(EDITOR_TYPE);
    editor.setConfig({ type: "custom:daily-challenge-card", entity: "x" });
    document.body.appendChild(editor);
    await editor.updateComplete;
    expect(editor.shadowRoot?.textContent?.trim()).toBe("");
  });
});
