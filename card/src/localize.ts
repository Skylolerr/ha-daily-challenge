import type { HomeAssistant } from "./types";

// English base strings. More languages are added in phase 2.g.
const en = {
  best: "Best",
  current_streak: "Current streak",
  edit_value: "Enter today's value",
  entity_not_found: "Entity not found: {entity}",
  missing_entity: "Please define an entity of a Daily Challenge.",
  not_a_challenge: "{entity} does not belong to a Daily Challenge.",
} as const;

export type StringKey = keyof typeof en;

const languages: Record<string, Partial<Record<StringKey, string>>> = { en };

export function localize(
  hass: HomeAssistant | undefined,
  key: StringKey,
  placeholders: Record<string, string> = {},
): string {
  const language = hass?.locale.language.split("-")[0] ?? "en";
  const text = languages[language]?.[key] ?? en[key];
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in placeholders ? placeholders[name] : match,
  );
}
