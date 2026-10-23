import type { HomeAssistant } from "./types";

// English base strings. More languages are added in phase 2.g.
const en = {
  best: "Best",
  card_description: "Track today's progress of a daily challenge.",
  card_name: "Daily Challenge",
  catch_up: "Today: {target} + {deficit} deficit",
  challenge: "Challenge",
  current_streak: "Current streak",
  edit_value: "Enter today's value",
  entity_not_found: "Entity not found: {entity}",
  left_to_goal: "{remaining} left to goal",
  missing_entity: "Please define an entity of a Daily Challenge.",
  no_challenges: "No Daily Challenge set up yet.",
  not_a_challenge: "{entity} does not belong to a Daily Challenge.",
  target_vs_actual: "Actual {total} / Target {target}",
} as const;

export type StringKey = keyof typeof en;

const languages: Record<string, Partial<Record<StringKey, string>>> = { en };

function language(hass: HomeAssistant | undefined): string {
  return hass?.locale.language ?? "en";
}

export function localize(
  hass: HomeAssistant | undefined,
  key: StringKey,
  placeholders: Record<string, string> = {},
): string {
  const text = languages[language(hass).split("-")[0]]?.[key] ?? en[key];
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in placeholders ? placeholders[name] : match,
  );
}

/** Format a number in the user's locale (e.g. 1'240 for de-CH). */
export function formatNumber(hass: HomeAssistant | undefined, value: number): string {
  try {
    return new Intl.NumberFormat(language(hass)).format(value);
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
