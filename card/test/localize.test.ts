import { afterEach, describe, expect, it } from "vitest";

import {
  formatDelta,
  formatNumber,
  LANGUAGES,
  localize,
} from "../src/localize";
import { de } from "../src/translations/de";
import { en } from "../src/translations/en";
import type { HomeAssistant } from "../src/types";

function hass(language: string, number_format?: string): HomeAssistant {
  return {
    locale: { language, number_format },
    states: {},
    callWS: async () => undefined as never,
    callService: async () => undefined,
  };
}

afterEach(() => {
  document.documentElement.lang = "";
});

describe("localize", () => {
  it("uses the user's language", () => {
    expect(localize(hass("de"), "best")).toBe("Rekord");
    expect(localize(hass("en"), "best")).toBe("Best");
  });

  it("falls back from a regional variant to the base language", () => {
    expect(localize(hass("de-CH"), "best")).toBe("Rekord");
  });

  it("falls back to English for unknown languages", () => {
    expect(localize(hass("ja"), "best")).toBe("Best");
  });

  it("uses the page language without hass", () => {
    document.documentElement.lang = "de";
    expect(localize(undefined, "card_description")).toBe(
      "Zeigt den heutigen Fortschritt einer täglichen Challenge.",
    );
    document.documentElement.lang = "";
    expect(localize(undefined, "best")).toBe("Best");
  });

  it("fills placeholders and keeps unknown ones", () => {
    expect(
      localize(hass("de"), "catch_up", { target: "20", deficit: "10" }),
    ).toBe("Heute: 20 + 10 Rückstand");
    expect(localize(hass("en"), "catch_up", { target: "20" })).toBe(
      "Today: 20 + {deficit} deficit",
    );
  });

  it("speaks French and Italian", () => {
    expect(localize(hass("fr-CH"), "challenge")).toBe("Défi");
    expect(localize(hass("it"), "challenge")).toBe("Sfida");
  });

  it.each(Object.keys(LANGUAGES))(
    "%s has every English text with the same placeholders",
    (language) => {
      const translations = LANGUAGES[language];
      const placeholders = (text: string) =>
        [...text.matchAll(/\{\w+\}/g)].map((match) => match[0]).sort();
      expect(Object.keys(translations).sort()).toEqual(Object.keys(en).sort());
      for (const key of Object.keys(en) as (keyof typeof en)[]) {
        expect(placeholders(translations[key]), key).toEqual(
          placeholders(en[key]),
        );
        expect(translations[key].trim(), key).not.toBe("");
      }
    },
  );

  it("covers English, German, French and Italian", () => {
    expect(Object.keys(LANGUAGES).sort()).toEqual(["de", "en", "fr", "it"]);
    expect(LANGUAGES.de).toBe(de);
  });
});

describe("formatNumber", () => {
  it.each([
    ["language", "en", "1,234.5"],
    ["language", "de", "1.234,5"],
    [undefined, "de", "1.234,5"],
    ["comma_decimal", "de", "1,234.5"],
    ["decimal_comma", "en", "1.234,5"],
    ["none", "en", "1234.5"],
  ])("format %s with language %s gives %s", (format, language, expected) => {
    expect(formatNumber(hass(language, format), 1234.5)).toBe(expected);
  });

  it("uses the Swiss apostrophe for quote_decimal", () => {
    expect(formatNumber(hass("de", "quote_decimal"), 1234.5)).toMatch(
      /^1['’]234\.5$/,
    );
  });

  it("uses spaces for space_comma", () => {
    expect(
      formatNumber(hass("en", "space_comma"), 1234.5).replace(/\s/g, " "),
    ).toBe("1 234,5");
  });

  it("uses the system locale for system", () => {
    expect(formatNumber(hass("de", "system"), 1234.5)).toBe(
      new Intl.NumberFormat(undefined).format(1234.5),
    );
  });

  it("falls back to plain digits for invalid languages", () => {
    expect(formatNumber(hass("not a locale!"), 1234)).toBe("1234");
  });
});

describe("formatDelta", () => {
  it("adds an explicit sign", () => {
    expect(formatDelta(hass("de"), 1240)).toBe("+1.240");
    expect(formatDelta(hass("de"), -12)).toBe("−12");
    expect(formatDelta(hass("de"), 0)).toBe("±0");
  });
});
