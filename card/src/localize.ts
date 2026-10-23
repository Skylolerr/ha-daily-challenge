import { de } from "./translations/de";
import { en } from "./translations/en";
import { fr } from "./translations/fr";
import { it } from "./translations/it";
import type { HomeAssistant } from "./types";

export type StringKey = keyof typeof en;
export type Translations = Record<StringKey, string>;

export const LANGUAGES: Record<string, Translations> = { de, en, fr, it };

/** The user's language: from Home Assistant, else from the page. */
function language(hass: HomeAssistant | undefined): string {
  return (
    hass?.locale.language ||
    (typeof document === "undefined" ? "" : document.documentElement.lang) ||
    "en"
  );
}

/** Translations for a language tag ("de-CH" falls back to "de", then English). */
function translations(tag: string): Translations {
  return LANGUAGES[tag] ?? LANGUAGES[tag.split("-")[0]] ?? en;
}

export function localize(
  hass: HomeAssistant | undefined,
  key: StringKey,
  placeholders: Record<string, string> = {},
): string {
  return translations(language(hass))[key].replace(
    /\{(\w+)\}/g,
    (match, name: string) => (name in placeholders ? placeholders[name] : match),
  );
}

/** Locales for the number formats of the user profile (as the HA frontend does). */
const NUMBER_FORMAT_LOCALES: Record<string, string[] | undefined> = {
  comma_decimal: ["en-US", "en"],
  decimal_comma: ["de", "es", "it"],
  quote_decimal: ["de-CH"],
  space_comma: ["fr", "sv", "cs"],
  system: undefined,
};

/** Format a number following the number format of the user's HA profile. */
export function formatNumber(hass: HomeAssistant | undefined, value: number): string {
  const numberFormat = hass?.locale.number_format ?? "language";
  const locales =
    numberFormat in NUMBER_FORMAT_LOCALES
      ? NUMBER_FORMAT_LOCALES[numberFormat]
      : numberFormat === "none"
        ? ["en-US"]
        : [language(hass)];
  try {
    return new Intl.NumberFormat(locales, {
      useGrouping: numberFormat !== "none",
    }).format(value);
  } catch {
    return String(value);
  }
}

/** Format a difference with an explicit sign: +40, −12, ±0. */
export function formatDelta(hass: HomeAssistant | undefined, value: number): string {
  if (value === 0) {
    return "±0";
  }
  return `${value > 0 ? "+" : "−"}${formatNumber(hass, Math.abs(value))}`;
}
