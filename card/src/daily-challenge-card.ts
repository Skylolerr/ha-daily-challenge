import { css, html, LitElement, nothing, svg, type PropertyValues } from "lit";

import { EDITOR_TYPE } from "./editor";
import { formatDelta, formatNumber, localize } from "./localize";
import type {
  ChallengeHistory,
  ChallengeInfo,
  ChallengeList,
  DailyChallengeCardConfig,
  HomeAssistant,
} from "./types";

export const CARD_TYPE = "daily-challenge-card";
export const LONG_PRESS_MS = 500;

const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const NOT_LOADED = Symbol("not loaded");
const INACTIVE_STATES = new Set(["unknown", "unavailable"]);

/** Find the "today" entity of the first challenge without a round trip. */
export function findStubEntity(hass: HomeAssistant | undefined): string {
  const entry = Object.values(hass?.entities ?? {}).find(
    (item) => item.platform === "daily_challenge" && item.translation_key === "today",
  );
  return entry?.entity_id ?? "";
}

/** Keys of the add buttons ("add_5") sorted by amount. */
function addSteps(entities: Record<string, string>): number[] {
  return Object.keys(entities)
    .filter((key) => /^add_\d+$/.test(key))
    .map((key) => Number(key.slice(4)))
    .sort((a, b) => a - b);
}

export class DailyChallengeCard extends LitElement {
  static override properties = {
    hass: { attribute: false },
    _config: { state: true },
    _challenge: { state: true },
    _editing: { state: true },
    _history: { state: true },
  };

  static getConfigElement(): HTMLElement {
    return document.createElement(EDITOR_TYPE);
  }

  static getStubConfig(hass?: HomeAssistant): DailyChallengeCardConfig {
    return { type: `custom:${CARD_TYPE}`, entity: findStubEntity(hass) };
  }

  declare hass?: HomeAssistant;
  declare private _config?: DailyChallengeCardConfig;
  /** undefined while loading, null if the entity is not part of a challenge. */
  declare private _challenge?: ChallengeInfo | null;
  declare private _editing: boolean;
  /** Daily values for the history views of later phases. */
  declare private _history?: ChallengeHistory;

  private _entitiesSeen: unknown = NOT_LOADED;
  private _pressTimer?: ReturnType<typeof setTimeout>;
  private _committing = false;
  private _historyTotal?: string;

  constructor() {
    super();
    this._editing = false;
  }

  setConfig(config: DailyChallengeCardConfig): void {
    if (!config?.entity) {
      throw new Error(localize(this.hass, "missing_entity"));
    }
    if (config.entity !== this._config?.entity) {
      this._challenge = undefined;
      this._history = undefined;
      this._historyTotal = undefined;
      this._entitiesSeen = NOT_LOADED;
    }
    this._config = config;
  }

  getCardSize(): number {
    return 4;
  }

  protected override willUpdate(changed: PropertyValues): void {
    // Look the challenge up again whenever the entity registry changes,
    // e.g. after the steps were edited and buttons were added or removed.
    if (changed.has("hass") && this.hass && this.hass.entities !== this._entitiesSeen) {
      this._entitiesSeen = this.hass.entities;
      void this._loadChallenge();
    }
    // Every change of a day also changes the total: fetch the history again.
    const total = this._state("total");
    if (this._challenge && total !== undefined && total !== this._historyTotal) {
      this._historyTotal = total;
      void this._loadHistory(this._challenge.entry_id);
    }
  }

  /** The most recently loaded history (undefined until loaded). */
  get history(): ChallengeHistory | undefined {
    return this._history;
  }

  private async _loadHistory(entryId: string): Promise<void> {
    try {
      this._history = await this.hass?.callWS<ChallengeHistory>({
        type: "daily_challenge/history",
        entry_id: entryId,
      });
    } catch {
      // Keep the last known history; the next change retries.
    }
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has("_editing") && this._editing) {
      const input = this.renderRoot.querySelector("input");
      input?.focus();
      input?.select();
    }
  }

  private async _loadChallenge(): Promise<void> {
    const entity = this._config?.entity;
    if (!this.hass || !entity) {
      return;
    }
    try {
      const result = await this.hass.callWS<ChallengeList>({
        type: "daily_challenge/list",
      });
      this._challenge =
        result.challenges.find((challenge) =>
          Object.values(challenge.entities).includes(entity),
        ) ?? null;
    } catch {
      this._challenge = null;
    }
  }

  private _state(key: string): string | undefined {
    const entityId = this._challenge?.entities[key];
    return entityId ? this.hass?.states[entityId]?.state : undefined;
  }

  private _number(key: string): number | undefined {
    const state = this._state(key);
    if (state === undefined || INACTIVE_STATES.has(state)) {
      return undefined;
    }
    const value = Number(state);
    return Number.isFinite(value) ? value : undefined;
  }

  private async _call(
    domain: string,
    service: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.hass?.callService(domain, service, data);
    } catch (err) {
      this.dispatchEvent(
        new CustomEvent("hass-notification", {
          detail: { message: err instanceof Error ? err.message : String(err) },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private _press(key: string): void {
    const entityId = this._challenge?.entities[key];
    if (entityId) {
      void this._call("button", "press", { entity_id: entityId });
    }
  }

  // --- direct value input (long press) ------------------------------------

  private _pointerDown(): void {
    this._clearPress();
    this._pressTimer = setTimeout(() => this._startEdit(), LONG_PRESS_MS);
  }

  private _clearPress(): void {
    clearTimeout(this._pressTimer);
    this._pressTimer = undefined;
  }

  private _valueKeyDown(ev: KeyboardEvent): void {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      this._startEdit();
    }
  }

  private _startEdit(): void {
    this._clearPress();
    if (this._number("today") !== undefined) {
      this._committing = false;
      this._editing = true;
    }
  }

  private _inputKeyDown(ev: KeyboardEvent): void {
    if (ev.key === "Enter") {
      void this._commit(ev.target as HTMLInputElement);
    } else if (ev.key === "Escape") {
      this._committing = true;
      this._editing = false;
    }
  }

  private async _commit(input: HTMLInputElement): Promise<void> {
    if (this._committing) {
      return;
    }
    this._committing = true;
    this._editing = false;
    const value = Number(input.value);
    const entityId = this._challenge?.entities.today;
    if (
      entityId &&
      input.value.trim() !== "" &&
      Number.isInteger(value) &&
      value >= 0 &&
      value !== this._number("today")
    ) {
      await this._call("number", "set_value", { entity_id: entityId, value });
    }
  }

  // --- rendering -------------------------------------------------------------

  protected override render() {
    if (!this._config || !this.hass) {
      return nothing;
    }
    const entity = this._config.entity;
    if (!this.hass.states[entity]) {
      return this._warning(localize(this.hass, "entity_not_found", { entity }));
    }
    if (this._challenge === undefined) {
      return html`<ha-card></ha-card>`;
    }
    if (this._challenge === null) {
      return this._warning(localize(this.hass, "not_a_challenge", { entity }));
    }
    return html`<ha-card>
      ${this._renderHeader(this._challenge)} ${this._renderValue(this._challenge)}
      ${this._renderSummary()} ${this._renderButtons(this._challenge)}
    </ha-card>`;
  }

  private _warning(message: string) {
    return html`<ha-card><div class="warning">${message}</div></ha-card>`;
  }

  private _renderHeader(challenge: ChallengeInfo) {
    const current = this._state("current_streak") ?? "–";
    const best = this._state("best_streak") ?? "–";
    return html`<div class="header">
      <ha-icon .icon=${challenge.icon}></ha-icon>
      <span class="name">${challenge.name}</span>
      <span class="streak" title=${localize(this.hass, "current_streak")}>
        🔥 <span class="current">${current}</span>
        <span class="best">· ${localize(this.hass, "best")} ${best}</span>
      </span>
    </div>`;
  }

  private _renderValue(challenge: ChallengeInfo) {
    const value = this._number("today");
    const target = this._number("today_target");
    const reached = this._state("goal_reached_today") === "on";
    const progress = reached
      ? 1
      : value !== undefined && target
        ? Math.min(1, value / target)
        : 0;
    const unit =
      (this.hass?.states[challenge.entities.today]?.attributes
        .unit_of_measurement as string | undefined) ?? challenge.unit;

    return html`<div class="value-area">
      <svg class="ring" viewBox="0 0 120 120" aria-hidden="true">
        ${svg`<circle class="track" cx="60" cy="60" r=${RING_RADIUS}></circle>
          <circle
            class="progress ${reached ? "reached" : ""}"
            cx="60"
            cy="60"
            r=${RING_RADIUS}
            stroke-dasharray=${RING_CIRCUMFERENCE}
            stroke-dashoffset=${RING_CIRCUMFERENCE * (1 - progress)}
            transform="rotate(-90 60 60)"
          ></circle>`}
      </svg>
      ${this._editing
        ? html`<input
            class="value-input"
            type="number"
            inputmode="numeric"
            min="0"
            step="1"
            aria-label=${localize(this.hass, "edit_value")}
            .value=${String(value ?? 0)}
            @keydown=${this._inputKeyDown}
            @blur=${(ev: FocusEvent) =>
              this._commit(ev.target as HTMLInputElement)}
          />`
        : html`<div
            class="value"
            role="button"
            tabindex="0"
            title=${localize(this.hass, "edit_value")}
            @pointerdown=${this._pointerDown}
            @pointerup=${this._clearPress}
            @pointerleave=${this._clearPress}
            @pointercancel=${this._clearPress}
            @contextmenu=${(ev: Event) => ev.preventDefault()}
            @keydown=${this._valueKeyDown}
          >
            <span class="number"
              >${value === undefined ? "–" : formatNumber(this.hass, value)}</span
            >
            <span class="target"
              >/ ${target === undefined
                ? "–"
                : formatNumber(this.hass, target)}</span
            >
            <span class="unit">${unit}</span>
          </div>`}
    </div>`;
  }

  private _renderSummary() {
    const hass = this.hass;
    const total = this._number("total");
    const targetToDate = this._number("target_to_date");
    const delta = this._number("delta");
    const remaining = this._number("remaining");

    // In catch-up mode the effective target is the daily target plus deficit.
    const targetEntity = this._challenge?.entities.today_target;
    const attributes = targetEntity
      ? hass?.states[targetEntity]?.attributes
      : undefined;
    const effective = this._number("today_target");
    const dailyTarget = Number(attributes?.daily_target);
    const deficit = Number(attributes?.deficit);
    const catchUp =
      effective !== undefined &&
      Number.isFinite(dailyTarget) &&
      deficit > 0 &&
      effective > dailyTarget;

    return html`<div class="summary">
      ${total !== undefined && targetToDate !== undefined
        ? html`<div class="target-vs-actual">
            ${localize(hass, "target_vs_actual", {
              total: formatNumber(hass, total),
              target: formatNumber(hass, targetToDate),
            })}${delta === undefined
              ? nothing
              : html` ·
                  <span class="delta ${delta < 0 ? "behind" : "ahead"}"
                    >${formatDelta(hass, delta)}</span
                  >`}
          </div>`
        : nothing}
      ${remaining === undefined
        ? nothing
        : html`<div class="remaining">${this._remainingText(remaining)}</div>`}
      ${catchUp
        ? html`<div class="catch-up">
            ${localize(hass, "catch_up", {
              target: formatNumber(hass, dailyTarget),
              deficit: formatNumber(hass, deficit),
            })}
          </div>`
        : nothing}
    </div>`;
  }

  /** "3'100 left in 60 days · Ø 51.7/day" – or shorter if figures are missing. */
  private _remainingText(remaining: number): string {
    const hass = this.hass;
    const days = this._number("days_left");
    const perDay = this._number("required_per_day");
    const amount = formatNumber(hass, remaining);
    if (days === 1) {
      return localize(hass, "left_to_goal_last_day", { remaining: amount });
    }
    if (days !== undefined && days > 1 && perDay !== undefined) {
      return localize(hass, "left_to_goal_in_days", {
        remaining: amount,
        days: formatNumber(hass, days),
        per_day: formatNumber(hass, perDay),
      });
    }
    return localize(hass, "left_to_goal", { remaining: amount });
  }

  private _renderButtons(challenge: ChallengeInfo) {
    const steps = addSteps(challenge.entities);
    const disabled = this._number("today_target") === undefined;
    return html`<div class="buttons">
      ${challenge.entities.subtract && steps.length
        ? html`<button
            class="subtract"
            ?disabled=${disabled}
            @click=${() => this._press("subtract")}
          >
            −${steps[0]}
          </button>`
        : nothing}
      ${steps.map(
        (step) =>
          html`<button
            class="add"
            ?disabled=${disabled}
            @click=${() => this._press(`add_${step}`)}
          >
            +${step}
          </button>`,
      )}
    </div>`;
  }

  static override styles = css`
    ha-card {
      display: block;
      padding: 16px;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .name {
      flex: 1;
      min-width: 0;
      font-size: 1.2em;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .streak {
      color: var(--secondary-text-color);
      white-space: nowrap;
    }
    .streak .current {
      color: var(--primary-text-color);
      font-weight: 500;
    }
    .value-area {
      position: relative;
      width: 160px;
      height: 160px;
      margin: 16px auto;
    }
    .ring {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
    .ring circle {
      fill: none;
      stroke-width: 10;
    }
    .ring .track {
      stroke: var(--divider-color, #e0e0e0);
    }
    .ring .progress {
      stroke: var(--primary-color);
      stroke-linecap: round;
      transition: stroke-dashoffset 0.3s ease;
    }
    .ring .progress.reached {
      stroke: var(--success-color, #43a047);
    }
    .value,
    .value-input {
      position: absolute;
      inset: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      user-select: none;
      -webkit-user-select: none;
      cursor: pointer;
    }
    .value:focus-visible {
      outline: 2px solid var(--primary-color);
    }
    .number {
      font-size: 2.6em;
      font-weight: 500;
      line-height: 1;
    }
    .target,
    .unit {
      color: var(--secondary-text-color);
      font-size: 0.9em;
    }
    .value-input {
      box-sizing: border-box;
      border: 2px solid var(--primary-color);
      background: var(--card-background-color, transparent);
      color: var(--primary-text-color);
      font: inherit;
      font-size: 2em;
      text-align: center;
      cursor: text;
    }
    .summary {
      margin-bottom: 16px;
      text-align: center;
      color: var(--secondary-text-color);
      line-height: 1.5;
    }
    .delta {
      font-weight: 500;
    }
    .delta.ahead {
      color: var(--success-color, #43a047);
    }
    .delta.behind,
    .catch-up {
      color: var(--warning-color, #ffa600);
    }
    .buttons {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    button {
      min-width: 56px;
      min-height: 40px;
      padding: 0 12px;
      border: none;
      border-radius: 20px;
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
      font: inherit;
      font-weight: 500;
      cursor: pointer;
    }
    button.subtract {
      background: var(--secondary-background-color, #e0e0e0);
      color: var(--primary-text-color);
    }
    button:disabled {
      opacity: 0.4;
      cursor: default;
    }
    .warning {
      color: var(--error-color);
    }
  `;
}

if (!customElements.get(CARD_TYPE)) {
  customElements.define(CARD_TYPE, DailyChallengeCard);
}

interface CustomCardEntry {
  type: string;
  name: string;
  description: string;
  preview: boolean;
  documentationURL: string;
}

// Make the card show up in the card picker.
const cardWindow = window as unknown as { customCards?: CustomCardEntry[] };
cardWindow.customCards ??= [];
if (!cardWindow.customCards.some((card) => card.type === CARD_TYPE)) {
  cardWindow.customCards.push({
    type: CARD_TYPE,
    name: localize(undefined, "card_name"),
    description: localize(undefined, "card_description"),
    preview: true,
    documentationURL: "https://github.com/Skylolerr/ha-daily-challenge",
  });
}

declare global {
  interface HTMLElementTagNameMap {
    [CARD_TYPE]: DailyChallengeCard;
  }
}
