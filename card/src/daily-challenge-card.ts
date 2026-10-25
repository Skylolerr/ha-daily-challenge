import { css, html, LitElement, nothing, svg, type PropertyValues } from "lit";

import { EDITOR_TYPE } from "./editor";
import { formatDelta, formatNumber, localize } from "./localize";
import type {
  ChallengeHistory,
  ChallengeInfo,
  ChallengeList,
  DailyChallengeCardConfig,
  DisplayOption,
  HomeAssistant,
} from "./types";

export const CARD_TYPE = "daily-challenge-card";
export const LONG_PRESS_MS = 500;
export const LOOKUP_RETRY_MS = 5000;
/** How long the undo message stays. */
export const UNDO_MS = 5000;

const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const NOT_LOADED = Symbol("not loaded");
const INACTIVE_STATES = new Set(["unknown", "unavailable"]);

/** A message in Home Assistant's toast, optionally with an action button. */
interface Toast {
  message: string;
  duration?: number;
  action?: { text: string; action: () => void };
}

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
  // Only the latest lookup may set its result; older answers are dropped.
  private _lookupId = 0;
  private _historyId = 0;
  /** After a failed lookup (e.g. while HA restarts), retry no earlier than this. */
  private _retryAt = 0;
  /** Value shown when the inline input opens; not updated while typing. */
  private _editValue = "";

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
    // Rows of 50 px: header, ring (4), summary lines and buttons.
    if (this._ended()) {
      return 6;
    }
    const summaryLines =
      Number(this._show("show_target_vs_actual")) +
      Number(this._show("show_remaining") || this._show("show_required_average"));
    return 5 + summaryLines + Number(this._show("show_buttons"));
  }

  protected override willUpdate(_changed: PropertyValues): void {
    // Look the challenge up for a new entity and again whenever the entity
    // registry changes, e.g. after the steps were edited.
    if (
      this.hass &&
      this._config &&
      this.hass.entities !== this._entitiesSeen &&
      Date.now() >= this._retryAt
    ) {
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
    const id = ++this._historyId;
    try {
      const history = await this.hass?.callWS<ChallengeHistory>({
        type: "daily_challenge/history",
        entry_id: entryId,
      });
      if (id === this._historyId && entryId === this._challenge?.entry_id) {
        this._history = history;
      }
    } catch {
      // Keep the last known history; the next change retries.
    }
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has("_editing")) {
      if (this._editing) {
        const input = this.renderRoot.querySelector("input");
        input?.focus();
        input?.select();
        // Mobile browsers may not focus the input, so blur never fires:
        // a tap anywhere else also closes it.
        document.addEventListener("pointerdown", this._outsidePointer, true);
      } else {
        document.removeEventListener("pointerdown", this._outsidePointer, true);
      }
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("pointerdown", this._outsidePointer, true);
    this._clearPress();
  }

  private _outsidePointer = (ev: PointerEvent): void => {
    const input = this.renderRoot.querySelector("input");
    if (input && !ev.composedPath().includes(input)) {
      void this._commit(input);
    }
  };

  private async _loadChallenge(): Promise<void> {
    const entity = this._config?.entity;
    if (!this.hass || !entity) {
      return;
    }
    const id = ++this._lookupId;
    try {
      const result = await this.hass.callWS<ChallengeList>({
        type: "daily_challenge/list",
      });
      if (id !== this._lookupId || entity !== this._config?.entity) {
        return;
      }
      this._challenge =
        result.challenges.find((challenge) =>
          Object.values(challenge.entities).includes(entity),
        ) ?? null;
    } catch {
      if (id !== this._lookupId) {
        return;
      }
      // Not an answer (e.g. HA is still starting): keep what is shown and
      // try again with a later update.
      this._entitiesSeen = NOT_LOADED;
      this._retryAt = Date.now() + LOOKUP_RETRY_MS;
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

  /** Call a service; errors are shown as a message. Returns whether it worked. */
  private async _call(
    domain: string,
    service: string,
    data: Record<string, unknown>,
  ): Promise<boolean> {
    try {
      await this.hass?.callService(domain, service, data);
      return true;
    } catch (err) {
      this._notify({ message: err instanceof Error ? err.message : String(err) });
      return false;
    }
  }

  private _notify(toast: Toast): void {
    this.dispatchEvent(
      new CustomEvent("hass-notification", {
        detail: toast,
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** Show what changed with a button that takes it back. */
  private _offerUndo(
    challenge: ChallengeInfo,
    change: string,
    service: "add" | "set",
    data: Record<string, number>,
  ): void {
    this._notify({
      message: localize(this.hass, "change", { name: challenge.name, change }),
      duration: UNDO_MS,
      action: {
        text: localize(this.hass, "undo"),
        action: () =>
          void this._call("daily_challenge", service, {
            config_entry_id: challenge.entry_id,
            ...data,
          }),
      },
    });
  }

  private async _press(key: string): Promise<void> {
    const challenge = this._challenge;
    const entityId = challenge?.entities[key];
    if (!challenge || !entityId) {
      return;
    }
    const before = this._number("today");
    const step =
      key === "subtract"
        ? -(addSteps(challenge.entities)[0] ?? 0)
        : Number(key.slice("add_".length));
    // The minus button never goes below 0, so it may take off less.
    const change = before !== undefined && step < 0 ? Math.max(step, -before) : step;
    if ((await this._call("button", "press", { entity_id: entityId })) && change) {
      // Undo by the change, so quick presses in a row stay correct.
      this._offerUndo(challenge, formatDelta(this.hass, change), "add", {
        amount: -change,
      });
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
    const value = this._number("today");
    if (value !== undefined) {
      this._editValue = String(value);
      this._committing = false;
      this._editing = true;
    }
  }

  private _inputKeyDown(ev: KeyboardEvent): void {
    if (ev.key === "Enter") {
      ev.preventDefault();
      ev.stopPropagation();
      void this._commit(ev.target as HTMLInputElement);
    } else if (ev.key === "Escape") {
      // Keep Escape from also closing a surrounding dialog (card editor).
      ev.preventDefault();
      ev.stopPropagation();
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
    const current = this._number("today");
    if (
      entityId &&
      current !== undefined &&
      input.value.trim() !== "" &&
      Number.isInteger(value) &&
      value >= 0 &&
      value !== current &&
      (await this._call("number", "set_value", { entity_id: entityId, value })) &&
      this._challenge
    ) {
      this._offerUndo(this._challenge, formatNumber(this.hass, value), "set", {
        value: current,
      });
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
    const streak = (key: string) => {
      const days = this._number(key);
      return days === undefined ? "–" : formatNumber(this.hass, days);
    };
    const current = streak("current_streak");
    const best = streak("best_streak");
    return html`<div class="header">
      <ha-icon .icon=${challenge.icon}></ha-icon>
      <span class="name">${challenge.name}</span>
      ${this._show("show_streak")
        ? html`<span class="streak" title=${localize(this.hass, "current_streak")}>
            🔥 <span class="current">${current}</span>
            <span class="best">· ${localize(this.hass, "best")} ${best}</span>
          </span>`
        : nothing}
    </div>`;
  }

  /** Whether the end date has passed (only challenges with one can end). */
  private _ended(): boolean {
    return this._number("days_left") === 0;
  }

  /** Whether a part of the card is shown (all are by default). */
  private _show(option: DisplayOption): boolean {
    return this._config?.[option] !== false;
  }

  private _renderValue(challenge: ChallengeInfo) {
    // After the end the card shows the total against the end goal.
    const ended = this._ended();
    const value = this._number(ended ? "total" : "today");
    const target = this._number(ended ? "target_to_date" : "today_target");
    const reached = ended
      ? value !== undefined && target !== undefined && value >= target
      : this._state("goal_reached_today") === "on";
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
      ${ended
        ? html`<div class="value">${this._renderFigures(value, target, unit)}</div>`
        : this._editing
        ? html`<input
            class="value-input"
            type="number"
            inputmode="numeric"
            min="0"
            step="1"
            aria-label=${localize(this.hass, "edit_value")}
            .value=${this._editValue}
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
            ${this._renderFigures(value, target, unit)}
          </div>`}
    </div>`;
  }

  private _renderFigures(
    value: number | undefined,
    target: number | undefined,
    unit: string,
  ) {
    const format = (figure: number | undefined) =>
      figure === undefined ? "–" : formatNumber(this.hass, figure);
    return html`<span class="number">${format(value)}</span>
      <span class="target">/ ${format(target)}</span>
      <span class="unit">${unit}</span>`;
  }

  /** "Challenge finished · 90 %", or the reached goal. */
  private _renderFinished() {
    const hass = this.hass;
    const total = this._number("total");
    const target = this._number("target_to_date");
    if (total === undefined || target === undefined) {
      return nothing;
    }
    // Rounded down, so 100 % only shows when the goal was really reached.
    const message =
      total >= target
        ? localize(hass, "finished_goal_reached")
        : localize(hass, "finished", {
            percent: formatNumber(hass, target ? Math.floor((total / target) * 100) : 0),
          });
    return html`<div class="summary"><div class="finished">${message}</div></div>`;
  }

  private _renderSummary() {
    if (this._ended()) {
      return this._renderFinished();
    }
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

    const lines = [];
    if (
      this._show("show_target_vs_actual") &&
      total !== undefined &&
      targetToDate !== undefined
    ) {
      lines.push(
        html`<div class="target-vs-actual">
          ${localize(hass, "target_vs_actual", {
            total: formatNumber(hass, total),
            target: formatNumber(hass, targetToDate),
          })}${delta === undefined
            ? nothing
            : html` ·
                <span class="delta ${delta < 0 ? "behind" : "ahead"}"
                  >${formatDelta(hass, delta)}</span
                >`}
        </div>`,
      );
    }
    const remainingParts =
      remaining === undefined ? [] : this._remainingParts(remaining);
    if (remainingParts.length) {
      // Each part stays on one line; wrapping only happens between parts.
      lines.push(
        html`<div class="remaining">
          ${remainingParts.map(
            (part, index) =>
              html`${index ? " · " : ""}<span class="part">${part}</span>`,
          )}
        </div>`,
      );
    }
    if (this._show("show_catch_up") && catchUp) {
      lines.push(
        html`<div class="catch-up">
          ${this._state("goal_reached_today") === "on"
            ? localize(hass, "caught_up")
            : localize(hass, "catch_up", {
                target: formatNumber(hass, dailyTarget),
                deficit: formatNumber(hass, deficit),
              })}
        </div>`,
      );
    }
    return lines.length ? html`<div class="summary">${lines}</div>` : nothing;
  }

  /**
   * "3'100 left in 60 days · Ø 51.7/day"; each part can be hidden and is
   * shortened when figures are missing.
   */
  private _remainingParts(remaining: number): string[] {
    const hass = this.hass;
    const days = this._number("days_left");
    const perDay = this._number("required_per_day");
    const amount = formatNumber(hass, remaining);
    const parts: string[] = [];
    if (this._show("show_remaining")) {
      if (days === 1) {
        parts.push(localize(hass, "left_to_goal_last_day", { remaining: amount }));
      } else if (days !== undefined && days > 1) {
        parts.push(
          localize(hass, "left_in_days", {
            remaining: amount,
            days: formatNumber(hass, days),
          }),
        );
      } else {
        parts.push(localize(hass, "left_to_goal", { remaining: amount }));
      }
    }
    if (
      this._show("show_required_average") &&
      days !== undefined &&
      days > 1 &&
      perDay !== undefined
    ) {
      parts.push(
        localize(hass, "required_per_day", {
          per_day: formatNumber(hass, perDay),
        }),
      );
    }
    return parts;
  }

  private _renderButtons(challenge: ChallengeInfo) {
    if (!this._show("show_buttons") || this._ended()) {
      return nothing;
    }
    // Disabled entities are listed by the backend but have no state.
    const exists = (key: string) => {
      const entityId = challenge.entities[key];
      return entityId !== undefined && this.hass?.states[entityId] !== undefined;
    };
    const allSteps = addSteps(challenge.entities);
    const steps = allSteps.filter((step) => exists(`add_${step}`));
    const disabled = this._number("today_target") === undefined;
    return html`<div class="buttons">
      ${exists("subtract") && allSteps.length
        ? html`<button
            class="subtract"
            ?disabled=${disabled}
            @click=${() => this._press("subtract")}
          >
            −${allSteps[0]}
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
    .remaining .part {
      white-space: nowrap;
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
