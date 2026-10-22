import { afterEach, describe, expect, it } from "vitest";

import { CARD_TYPE, DailyChallengeCard } from "../src/daily-challenge-card";
import type { HomeAssistant } from "../src/types";

const hass: HomeAssistant = {
  locale: { language: "en" },
  states: {
    "number.push_ups_today": {
      entity_id: "number.push_ups_today",
      state: "15",
      attributes: {
        friendly_name: "Push-ups Today",
        unit_of_measurement: "repetitions",
      },
    },
  },
};

async function createCard(entity: string): Promise<DailyChallengeCard> {
  const card = document.createElement(CARD_TYPE);
  card.setConfig({ type: `custom:${CARD_TYPE}`, entity });
  card.hass = hass;
  document.body.appendChild(card);
  await card.updateComplete;
  return card;
}

function text(card: DailyChallengeCard): string {
  return (card.shadowRoot?.textContent ?? "").replace(/\s+/g, " ").trim();
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("daily-challenge-card", () => {
  it("is registered as a custom element", () => {
    expect(customElements.get(CARD_TYPE)).toBe(DailyChallengeCard);
  });

  it("requires an entity", () => {
    const card = document.createElement(CARD_TYPE);
    expect(() =>
      card.setConfig({ type: `custom:${CARD_TYPE}`, entity: "" }),
    ).toThrow(/entity/);
  });

  it("renders the entity name and today's value", async () => {
    const card = await createCard("number.push_ups_today");
    expect(text(card)).toBe("Push-ups Today 15 repetitions");
    expect(card.getCardSize()).toBe(3);
  });

  it("shows a warning for unknown entities", async () => {
    const card = await createCard("number.unknown");
    expect(text(card)).toBe("Entity not found: number.unknown");
  });

  it("renders nothing without hass", async () => {
    const card = document.createElement(CARD_TYPE);
    card.setConfig({ type: `custom:${CARD_TYPE}`, entity: "number.x" });
    document.body.appendChild(card);
    await card.updateComplete;
    expect(text(card)).toBe("");
  });
});
