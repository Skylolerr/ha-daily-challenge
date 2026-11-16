import { render } from "lit";
import { describe, expect, it } from "vitest";

import { initials, personInfo, renderAvatar } from "../src/avatar";
import type { HomeAssistant } from "../src/types";

function hass(states: HomeAssistant["states"] = {}): HomeAssistant {
  return {
    locale: { language: "en" },
    states,
    callWS: async () => undefined as never,
    callService: async () => undefined,
  };
}

describe("initials", () => {
  it.each([
    ["Anna Muster", "AM"],
    ["anna", "A"],
    ["  Jean  Luc  Picard ", "JP"],
    ["Élodie émile", "ÉÉ"],
    ["", ""],
    ["   ", ""],
  ])("%s gives %s", (name, expected) => {
    expect(initials(name)).toBe(expected);
  });
});

describe("personInfo", () => {
  const anna = {
    entity_id: "person.anna",
    state: "home",
    attributes: { friendly_name: "Anna", entity_picture: "/a.jpg" },
  };

  it("reads name and picture from the state", () => {
    expect(personInfo(hass({ "person.anna": anna }), "person.anna")).toEqual({
      name: "Anna",
      picture: "/a.jpg",
    });
  });

  it("uses the fallback without a state", () => {
    expect(personInfo(hass(), "person.anna", { name: "Anna", picture: null })).toEqual({
      name: "Anna",
      picture: undefined,
    });
    expect(personInfo(hass(), "person.anna", { picture: "/b.jpg" })).toEqual({
      name: "",
      picture: "/b.jpg",
    });
  });

  it("is undefined without a person or anything to show", () => {
    expect(personInfo(hass(), null)).toBeUndefined();
    expect(personInfo(hass(), undefined)).toBeUndefined();
    expect(personInfo(hass(), "person.gone")).toBeUndefined();
  });
});

describe("renderAvatar", () => {
  it("renders the initials as a labelled image", () => {
    const container = document.createElement("div");
    render(renderAvatar(hass(), "person.tom", { name: "Tom Turbo" }), container);
    const avatar = container.querySelector(".avatar");
    expect(avatar?.getAttribute("role")).toBe("img");
    expect(avatar?.getAttribute("aria-label")).toBe("Tom Turbo");
    expect(avatar?.textContent?.trim()).toBe("TT");
  });
});
