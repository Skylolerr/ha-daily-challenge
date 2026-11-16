import { css, html, nothing } from "lit";

import type { HomeAssistant } from "./types";

/** Up to two initials of a name: "Anna Muster" → "AM", "tom" → "T". */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) {
    return "";
  }
  const first = (word: string) => Array.from(word)[0]?.toUpperCase() ?? "";
  return words.length === 1
    ? first(words[0])
    : `${first(words[0])}${first(words[words.length - 1])}`;
}

/** Name and picture of a person, from its state (else from the fallback). */
export function personInfo(
  hass: HomeAssistant | undefined,
  personId: string | null | undefined,
  fallback: { name?: string; picture?: string | null } = {},
): { name: string; picture?: string } | undefined {
  if (!personId) {
    return undefined;
  }
  const attributes = hass?.states[personId]?.attributes;
  const name =
    (typeof attributes?.friendly_name === "string" && attributes.friendly_name) ||
    fallback.name;
  const picture =
    (typeof attributes?.entity_picture === "string" && attributes.entity_picture) ||
    fallback.picture ||
    undefined;
  if (!name && !picture) {
    return undefined;
  }
  return { name: name ?? "", picture };
}

/**
 * A small round avatar of the person: the picture, else the initials.
 * Nothing without a person.
 */
export function renderAvatar(
  hass: HomeAssistant | undefined,
  personId: string | null | undefined,
  fallback: { name?: string; picture?: string | null } = {},
) {
  const person = personInfo(hass, personId, fallback);
  if (!person) {
    return nothing;
  }
  return html`<span class="avatar" role="img" aria-label=${person.name} title=${person.name}
    >${person.picture
      ? html`<img src=${person.picture} alt="" loading="lazy" />`
      : html`<span class="initials" aria-hidden="true">${initials(person.name)}</span>`}</span
  >`;
}

export const avatarStyles = css`
  .avatar {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--dc-avatar-size, 24px);
    height: var(--dc-avatar-size, 24px);
    border-radius: 50%;
    overflow: hidden;
    background: var(--primary-color);
    color: var(--text-primary-color, #fff);
    font-size: calc(var(--dc-avatar-size, 24px) * 0.42);
    font-weight: 500;
    line-height: 1;
    user-select: none;
  }
  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;
