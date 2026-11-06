import { css, html, LitElement, nothing, svg, type PropertyValues } from "lit";

import { EDITOR_TYPE } from "./editor";
import { addDays, buildHeatmap, cellOpacity, type HeatmapCell } from "./heatmap";
// The overview card ships in the same bundle.
import "./overview-card";
import { errorMessage, formatDate, formatDelta, formatNumber, localize } from "./localize";
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
export const UNDO_MS = 8000;
/** How long a celebration stays. */
export const CELEBRATION_MS = 3000;
const CONFETTI_PIECES = 24;
const CONFETTI_COLORS = [
  "var(--success-color, #43a047)",
  "var(--primary-color, #03a9f4)",
  "var(--warning-color, #ffa600)",
  "var(--accent-color, #ff9800)",
];

const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const NOT_LOADED = Symbol("not loaded");
const INACTIVE_STATES = new Set(["unknown", "unavailable"]);

/** A message in Home Assistant's toast, optionally with an action button. */
/** A running celebration: confetti and, for milestones, a short text. */
interface Celebration {
  id: number;
  message?: string;
  pieces: { x: number; y: number; rotate: number; delay: number; color: string }[];
}

/** The past day being edited in the dialog. */
interface DayDialog {
  cell: HeatmapCell;
  value: string;
  error?: string;
  /** A save is on its way; further saves wait for it. */
  saving?: boolean;
}

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
    _dialog: { state: true },
    _celebration: { state: true },
    _focusDate: { state: true },
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
  /** Daily values for the heatmap. */
  declare private _history?: ChallengeHistory;
  declare private _dialog?: DayDialog;
  declare private _celebration?: Celebration;
  /** Last seen states; undefined until the first look, so loading never celebrates. */
  private _lastGoal?: string;
  private _lastMilestone?: string;
  private _celebrationTimer?: ReturnType<typeof setTimeout>;
  /** The calendar day that keyboard focus is on (roving tabindex). */
  declare private _focusDate?: string;
  /** After a failed history load, retry no earlier than this. */
  private _historyRetryAt = 0;
  /** Last seen state of today's number, to notice a reload of the challenge. */
  private _todaySeen?: string;
  /** The heatmap of the last render and what it was built from. */
  private _heatmapCache?: { key: unknown[]; template: unknown };

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
      this._lastGoal = undefined;
      this._lastMilestone = undefined;
      this._dialog = undefined;
      this._focusDate = undefined;
      this._historyRetryAt = 0;
      this._todaySeen = undefined;
      this._challenge = undefined;
      this._history = undefined;
      this._historyTotal = undefined;
      this._entitiesSeen = NOT_LOADED;
    }
    this._config = config;
  }

  getCardSize(): number {
    // Rows of 50 px: header, ring (4), summary lines and buttons.
    const extras = Number(this._show("show_stats")) + (this._show("show_heatmap") ? 3 : 0);
    if (this._ended()) {
      return 6 + extras;
    }
    const summaryLines =
      Number(this._show("show_target_vs_actual")) +
      Number(this._show("show_remaining") || this._show("show_required_average"));
    const buttons = this._show("show_buttons") && !this._challenge?.today_from_source;
    return 5 + summaryLines + Number(buttons) + extras;
  }

  /** Size in the sections view: half the width at least, height from the content. */
  getGridOptions(): { columns: number; min_columns: number; rows: string } {
    return { columns: 6, min_columns: 6, rows: "auto" };
  }

  /**
   * Home Assistant replaces `hass` on every state change anywhere. Only
   * changes of this challenge's entities, the registry or the locale matter.
   */
  protected override shouldUpdate(changed: PropertyValues): boolean {
    if (changed.size !== 1 || !changed.has("hass") || !this._challenge || !this._history) {
      return true;
    }
    const old = changed.get("hass") as HomeAssistant | undefined;
    const hass = this.hass;
    if (!old || !hass || old.entities !== hass.entities || old.locale !== hass.locale) {
      return true;
    }
    return Object.values(this._challenge.entities).some(
      (entityId) => old.states[entityId] !== hass.states[entityId],
    );
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
    this._watchCelebrations();
    // An options change reloads the challenge (unavailable, then back): its
    // name or source may have changed, so look it up again.
    const todayState = this._state("today");
    if (
      this._challenge &&
      this._todaySeen === "unavailable" &&
      todayState !== undefined &&
      todayState !== "unavailable"
    ) {
      void this._loadChallenge();
    }
    this._todaySeen = todayState;
    // Every change of a day also changes the total, and a new day in Home
    // Assistant raises the target to date: fetch the history again. (The
    // browser's date is only a fallback; its zone may differ from HA's.)
    const total = this._state("total");
    const day = this._state("target_to_date") ?? new Date().toDateString();
    const key = `${total}|${day}`;
    if (
      this._challenge &&
      total !== undefined &&
      key !== this._historyTotal &&
      Date.now() >= this._historyRetryAt
    ) {
      this._historyTotal = key;
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
        this._refreshDialog();
      }
    } catch {
      // Keep the last known history and try again with a later update.
      if (id === this._historyId) {
        this._historyTotal = undefined;
        this._historyRetryAt = Date.now() + LOOKUP_RETRY_MS;
      }
    }
  }

  /** Show the latest figures of the day in an open dialog. */
  private _refreshDialog(): void {
    const dialog = this._dialog;
    const history = this._history;
    if (!dialog || !history || dialog.saving) {
      return;
    }
    const date = dialog.cell.date;
    const value = history.days[date] ?? 0;
    const cell: HeatmapCell = {
      ...dialog.cell,
      value,
      target: history.targets[date] ?? dialog.cell.target,
      fulfilled: history.fulfilled[date] === true,
      rescuable: (history.rescuable ?? []).includes(date),
    };
    // Keep what the user typed; otherwise show the new value.
    const edited = dialog.value !== String(dialog.cell.value);
    this._dialog = { ...dialog, cell, value: edited ? dialog.value : String(value) };
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has("_dialog") && this._dialog && !changed.get("_dialog")) {
      const input = this.renderRoot.querySelector<HTMLInputElement>(".day-input");
      input?.focus();
      input?.select();
    }
    // Keyboard focus follows the calendar day, also back from the dialog
    // (but not while the dialog is open: its input has the focus then).
    if (
      (changed.has("_focusDate") || (changed.has("_dialog") && !this._dialog)) &&
      this._focusDate &&
      !this._dialog
    ) {
      this.renderRoot
        .querySelector<SVGRectElement>(`rect[data-date="${this._focusDate}"]`)
        ?.focus();
    }
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
    clearTimeout(this._celebrationTimer);
    this._celebration = undefined;
    // What happens while the card is away is not celebrated on its return.
    this._lastGoal = undefined;
    this._lastMilestone = undefined;
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
      this._notify({ message: errorMessage(err) });
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
    // The day stays within its limits, so a press may change less than the step.
    const max = Number(this.hass?.states[challenge.entities.today]?.attributes.max);
    const room = before !== undefined && max >= before ? max - before : step;
    const change = before !== undefined && step < 0 ? Math.max(step, -before) : Math.min(step, room);
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
    if (this._challenge?.today_from_source) {
      return;
    }
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
      ${this._renderStats()} ${this._renderHeatmap()} ${this._renderCelebration()}
      ${this._renderDialog()}
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
      ${ended || challenge.today_from_source
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
    const number = format(value);
    // The default size fits five digits; longer figures shrink to fit the ring.
    const size =
      number.length > 5
        ? `font-size: ${Math.max(1, 13 / number.length).toFixed(2)}em`
        : nothing;
    return html`<span class="number" style=${size}>${number}</span>
      <span class="target">/ ${format(target)}</span>
      <span class="unit" title=${unit}>${unit}</span>`;
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
    if (
      !this._show("show_buttons") ||
      this._ended() ||
      challenge.today_from_source
    ) {
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

  // --- celebration ------------------------------------------------------------

  /** Celebrate today's goal and milestones that happen while the card is open. */
  private _watchCelebrations(): void {
    const challenge = this._challenge;
    if (!challenge || !this.hass) {
      return;
    }
    const goal = this._state("goal_reached_today");
    const milestoneId = challenge.entities.milestone;
    const milestone = milestoneId ? this.hass.states[milestoneId] : undefined;
    const wanted = this._show("show_celebration");
    if (wanted && this._lastGoal === "off" && goal === "on") {
      this._celebrate();
    }
    if (
      wanted &&
      milestone &&
      this._lastMilestone !== undefined &&
      this._lastMilestone !== "unavailable" &&
      milestone.state !== this._lastMilestone &&
      !INACTIVE_STATES.has(milestone.state)
    ) {
      this._celebrate(this._milestoneMessage(milestone.attributes));
    }
    this._lastGoal = goal;
    this._lastMilestone = milestone?.state;
  }

  private _milestoneMessage(attributes: Record<string, unknown>): string | undefined {
    const kind = attributes.event_type;
    const value = Number(attributes.value);
    if (!Number.isFinite(value)) {
      return undefined;
    }
    const unit =
      (this.hass?.states[this._challenge?.entities.today ?? ""]?.attributes
        .unit_of_measurement as string | undefined) ??
      this._challenge?.unit ??
      "";
    const placeholders = { value: formatNumber(this.hass, value), unit };
    switch (kind) {
      case "streak":
        return localize(this.hass, "celebrate_streak", placeholders);
      case "best_streak":
        return localize(this.hass, "celebrate_best_streak", placeholders);
      case "best_day":
        return localize(this.hass, "celebrate_best_day", placeholders);
      case "total":
        return localize(this.hass, "celebrate_total", placeholders);
      default:
        return undefined;
    }
  }

  private _celebrate(message?: string): void {
    const id = (this._celebration?.id ?? 0) + 1;
    // A goal and a milestone at once: keep the milestone's text.
    const text = message ?? this._celebration?.message;
    const pieces = Array.from({ length: CONFETTI_PIECES }, (_, i) => {
      const angle = (i / CONFETTI_PIECES) * 2 * Math.PI + Math.random() * 0.4;
      const distance = 70 + Math.random() * 60;
      return {
        x: Math.round(Math.cos(angle) * distance),
        y: Math.round(Math.sin(angle) * distance),
        rotate: Math.round(Math.random() * 720 - 360),
        delay: Math.round(Math.random() * 150),
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      };
    });
    this._celebration = { id, message: text, pieces };
    clearTimeout(this._celebrationTimer);
    this._celebrationTimer = setTimeout(() => {
      if (this._celebration?.id === id) {
        this._celebration = undefined;
      }
    }, CELEBRATION_MS);
  }

  private _renderCelebration() {
    const celebration = this._celebration;
    if (!celebration) {
      return nothing;
    }
    return html`<div class="celebration" aria-live="polite">
      ${celebration.pieces.map(
        (piece) =>
          html`<span
            class="confetti"
            style="--x: ${piece.x}px; --y: ${piece.y}px; --r: ${piece.rotate}deg; --delay: ${piece.delay}ms; background: ${piece.color}"
          ></span>`,
      )}
      ${celebration.message
        ? html`<div class="celebration-message">${celebration.message}</div>`
        : nothing}
    </div>`;
  }

  // --- statistics, heatmap and day dialog ----------------------------------

  private _renderStats() {
    if (!this._show("show_stats")) {
      return nothing;
    }
    const hass = this.hass;
    const figure = (key: string, suffix = "") => {
      const value = this._number(key);
      return value === undefined ? "–" : `${formatNumber(hass, value)}${suffix}`;
    };
    const items: [string, string][] = [
      [localize(hass, "stat_total"), figure("total")],
      [localize(hass, "stat_average"), figure("average")],
      [localize(hass, "stat_best_day"), figure("best_day")],
      [localize(hass, "stat_best_streak"), figure("best_streak")],
    ];
    return html`<div class="stats">
      ${items.map(
        ([label, value]) =>
          html`<div class="stat">
            <span class="stat-value">${value}</span>
            <span class="stat-label">${label}</span>
          </div>`,
      )}
    </div>`;
  }

  private _formatDate(iso: string, options: Intl.DateTimeFormatOptions): string {
    return formatDate(this.hass, iso, options);
  }

  private _cellTitle(cell: HeatmapCell): string {
    const date = this._formatDate(cell.date, { dateStyle: "medium" });
    if (!cell.inPeriod) {
      return date;
    }
    const figures = `${formatNumber(this.hass, cell.value)} / ${formatNumber(this.hass, cell.target)}`;
    const mark = cell.fulfilled ? " ✓" : cell.rescuable ? ` · ${localize(this.hass, "rescuable")}` : "";
    return `${date}: ${figures}${mark}`;
  }

  private _renderHeatmap() {
    const history = this._history;
    if (!this._show("show_heatmap") || !history) {
      return nothing;
    }
    // Rebuilding a year of cells is the most expensive part of a render.
    const key = [
      history,
      this._config?.heatmap_range,
      this._focusDate,
      this.hass?.locale?.language,
      this.hass?.locale?.number_format,
    ];
    const cached = this._heatmapCache;
    if (cached && cached.key.every((part, index) => part === key[index])) {
      return cached.template;
    }
    const template = this._buildHeatmap(history);
    this._heatmapCache = { key, template };
    return template;
  }

  private _buildHeatmap(history: ChallengeHistory) {
    const layout = buildHeatmap(history, this._config?.heatmap_range ?? "year");
    if (!layout.weeks.length) {
      return nothing;
    }
    const step = 13;
    const width = layout.weeks.length * step - 3;
    const height = 7 * step - 3;
    const days = layout.weeks.flat().filter((cell): cell is HeatmapCell => cell !== null);
    const focusDate =
      days.find((cell) => cell.date === this._focusDate)?.date ?? days[days.length - 1]?.date;
    const cells = layout.weeks.flatMap((week, column) =>
      week.map((cell, row) => {
        if (!cell) {
          return nothing;
        }
        const title = this._cellTitle(cell);
        // A day without a value can still count (catch-up made it up).
        const kind = !cell.inPeriod
          ? "outside"
          : cell.fulfilled
            ? "fulfilled"
            : cell.value === 0
              ? "empty"
              : "partial";
        const classes = [
          "cell",
          kind,
          cell.rescuable ? "rescuable" : "",
          cell.last ? "last" : "",
        ].join(" ");
        return svg`<rect
          class=${classes}
          x=${column * step}
          y=${row * step}
          width="10"
          height="10"
          rx="2"
          opacity=${cellOpacity(cell)}
          data-date=${cell.date}
          role=${cell.inPeriod ? "button" : "presentation"}
          tabindex=${cell.date === focusDate ? 0 : -1}
          aria-label=${title}
          @click=${() => this._openDay(cell)}
        ><title>${title}</title></rect>`;
      }),
    );
    // Month names as text, so they keep their size however wide the card is.
    const months = layout.months.map(
      (month) =>
        html`<span class="month" style="left: ${((month.week * step) / width) * 100}%"
          >${this._formatDate(month.date, { month: "short" })}</span
        >`,
    );
    return html`<div class="heatmap">
      <div class="heatmap-grid" style="max-width: ${layout.weeks.length * 22}px">
        <div class="months">${months}</div>
        <svg
          viewBox="0 0 ${width} ${height}"
          role="group"
          aria-label=${localize(this.hass, "heatmap")}
          @keydown=${(ev: KeyboardEvent) => this._heatmapKeyDown(ev, days)}
        >
          ${cells}
        </svg>
      </div>
    </div>`;
  }

  /** Arrow keys move between days (weeks are columns), Enter opens one. */
  private _heatmapKeyDown(ev: KeyboardEvent, days: HeatmapCell[]): void {
    const date = (ev.target as Element | null)?.getAttribute?.("data-date");
    const cell = days.find((item) => item.date === date);
    if (!cell) {
      return;
    }
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      this._openDay(cell);
      return;
    }
    const moves: Record<string, number> = {
      ArrowLeft: -7,
      ArrowRight: 7,
      ArrowUp: -1,
      ArrowDown: 1,
      Home: -Infinity,
      End: Infinity,
    };
    if (!(ev.key in moves)) {
      return;
    }
    ev.preventDefault();
    const move = moves[ev.key];
    const target = Number.isFinite(move)
      ? days.find((item) => item.date === addDays(cell.date, move))
      : move < 0
        ? days[0]
        : days[days.length - 1];
    if (target) {
      this._focusDate = target.date;
    }
  }

  private _openDay(cell: HeatmapCell): void {
    if (!cell.inPeriod) {
      return;
    }
    this._focusDate = cell.date;
    this._dialog = { cell, value: String(cell.value) };
  }

  private _closeDay(): void {
    this._dialog = undefined;
  }

  /** Whether the day of the dialog takes its value from a source sensor. */
  private _dialogFromSource(cell: HeatmapCell): boolean {
    return Boolean(this._challenge?.today_from_source && cell.last && !this._ended());
  }

  private async _saveDay(): Promise<void> {
    const dialog = this._dialog;
    const challenge = this._challenge;
    if (!dialog || dialog.saving || !challenge || !this.hass) {
      return;
    }
    const raw = dialog.value.trim();
    const value = Number(raw);
    if (raw === "" || !Number.isInteger(value) || value < 0) {
      this._dialog = { ...dialog, error: localize(this.hass, "invalid_value") };
      return;
    }
    // Compare with and undo to the latest known value of the day.
    const previous = this._history?.days[dialog.cell.date] ?? dialog.cell.value;
    if (value === previous) {
      this._closeDay();
      return;
    }
    const setDay = (newValue: number) =>
      this.hass?.callWS({
        type: "daily_challenge/set_day",
        entry_id: challenge.entry_id,
        date: dialog.cell.date,
        value: newValue,
      });
    const saving: DayDialog = { ...dialog, saving: true, error: undefined };
    this._dialog = saving;
    try {
      await setDay(value);
    } catch (err) {
      const message = errorMessage(err);
      // Only if the dialog is still open (it may have been closed meanwhile).
      if (this._dialog === saving) {
        this._dialog = { ...dialog, error: message };
      } else {
        this._notify({ message });
      }
      return;
    }
    if (this._dialog === saving) {
      this._closeDay();
    }
    this._notify({
      message: localize(this.hass, "change", {
        name: challenge.name,
        change: `${this._formatDate(dialog.cell.date, { dateStyle: "medium" })}: ${formatNumber(this.hass, value)}`,
      }),
      duration: UNDO_MS,
      action: {
        text: localize(this.hass, "undo"),
        action: () => {
          void Promise.resolve(setDay(previous)).catch((err: unknown) =>
            this._notify({ message: errorMessage(err) }),
          );
        },
      },
    });
  }

  private _dialogKeyDown(ev: KeyboardEvent): void {
    if (ev.key === "Escape") {
      ev.preventDefault();
      ev.stopPropagation();
      this._closeDay();
    } else if (
      ev.key === "Enter" &&
      (ev.target as Element | null)?.classList?.contains("day-input")
    ) {
      // Only in the field: Enter on a button is that button's click.
      ev.preventDefault();
      ev.stopPropagation();
      void this._saveDay();
    }
  }

  private _renderDialog() {
    const dialog = this._dialog;
    if (!dialog) {
      return nothing;
    }
    const hass = this.hass;
    const cell = dialog.cell;
    const fromSource = this._dialogFromSource(cell);
    const status = cell.fulfilled
      ? localize(hass, "day_fulfilled")
      : cell.rescuable
        ? localize(hass, "rescuable")
        : localize(hass, "day_not_fulfilled");
    return html`<div class="backdrop" @click=${this._closeDay}>
      <div
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-title"
        @click=${(ev: Event) => ev.stopPropagation()}
        @keydown=${this._dialogKeyDown}
      >
        <div id="day-title" class="dialog-title">
          ${this._formatDate(cell.date, { dateStyle: "full" })}
        </div>
        <div class="dialog-info">
          ${localize(hass, "day_target", { target: formatNumber(hass, cell.target) })} ·
          ${status}
        </div>
        <label class="dialog-field">
          <span>${localize(hass, "day_value")}</span>
          <input
            class="day-input"
            type="number"
            inputmode="numeric"
            min="0"
            step="1"
            .value=${dialog.value}
            ?disabled=${fromSource}
            @input=${(ev: Event) => {
              this._dialog = {
                ...dialog,
                value: (ev.target as HTMLInputElement).value,
                error: undefined,
              };
            }}
          />
        </label>
        ${fromSource
          ? html`<div class="dialog-note">${localize(hass, "day_from_source")}</div>`
          : nothing}
        ${dialog.error ? html`<div class="dialog-error">${dialog.error}</div>` : nothing}
        <div class="dialog-actions">
          <button class="cancel" @click=${this._closeDay}>
            ${localize(hass, "cancel")}
          </button>
          ${fromSource
            ? nothing
            : html`<button class="save" @click=${() => this._saveDay()}>
                ${localize(hass, "save")}
              </button>`}
        </div>
      </div>
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
    .unit {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
    ha-card {
      position: relative;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 4px;
      margin-top: 16px;
      text-align: center;
    }
    .stat {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .stat-value {
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }
    .stat-label {
      color: var(--secondary-text-color);
      font-size: 0.8em;
      line-height: 1.2;
      overflow-wrap: anywhere;
    }
    .heatmap {
      margin-top: 16px;
      display: flex;
      justify-content: center;
    }
    .heatmap-grid {
      width: 100%;
    }
    .heatmap svg {
      display: block;
      width: 100%;
      height: auto;
      overflow: visible;
    }
    .months {
      position: relative;
      overflow: hidden;
      height: 1.3em;
      font-size: 0.75em;
      color: var(--secondary-text-color);
    }
    .month {
      position: absolute;
      top: 0;
      white-space: nowrap;
    }
    .cell {
      cursor: pointer;
    }
    .cell:focus {
      outline: none;
    }

    .cell.outside {
      fill: var(--disabled-color, #bdbdbd);
      opacity: 0.25;
      cursor: default;
    }
    .cell.empty {
      fill: var(--divider-color, #e0e0e0);
    }
    .cell.partial {
      fill: var(--primary-color);
    }
    .cell.fulfilled {
      fill: var(--success-color, #43a047);
    }
    .cell.rescuable {
      stroke: var(--warning-color, #ffa600);
      stroke-width: 1.5;
      stroke-dasharray: 2 1.5;
    }
    .cell.last {
      stroke: var(--primary-text-color);
      stroke-width: 1.5;
    }
    /* After the outlines above, so the focus wins on today and yesterday too. */
    .heatmap .cell:focus-visible {
      stroke: var(--primary-color);
      stroke-width: 2.5;
      stroke-dasharray: none;
    }
    .celebration {
      position: absolute;
      inset: 0;
      z-index: 1;
      overflow: hidden;
      pointer-events: none;
      border-radius: var(--ha-card-border-radius, 12px);
    }
    .confetti {
      position: absolute;
      top: 120px;
      left: 50%;
      width: 8px;
      height: 12px;
      border-radius: 2px;
      opacity: 0;
      animation: dc-burst 1.4s ease-out var(--delay) forwards;
    }
    @keyframes dc-burst {
      0% {
        opacity: 1;
        transform: translate(-50%, -50%) rotate(0deg);
      }
      100% {
        opacity: 0;
        transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y) + 40px))
          rotate(var(--r));
      }
    }
    .celebration-message {
      position: absolute;
      top: 12px;
      left: 50%;
      max-width: calc(100% - 32px);
      padding: 6px 14px;
      border-radius: 16px;
      background: var(--success-color, #43a047);
      color: #fff;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transform: translateX(-50%);
      animation: dc-pop 3s ease forwards;
    }
    @keyframes dc-pop {
      0% {
        opacity: 0;
        transform: translate(-50%, -6px);
      }
      10%,
      85% {
        opacity: 1;
        transform: translate(-50%, 0);
      }
      100% {
        opacity: 0;
        transform: translate(-50%, 0);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .confetti {
        display: none;
      }
      .celebration-message {
        animation: none;
      }
    }
    .backdrop {
      position: absolute;
      inset: 0;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      border-radius: var(--ha-card-border-radius, 12px);
      background: rgba(0, 0, 0, 0.4);
    }
    .dialog {
      width: 100%;
      max-width: 320px;
      padding: 16px;
      border-radius: 12px;
      background: var(--card-background-color, var(--ha-card-background, #fff));
      color: var(--primary-text-color);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    }
    .dialog-title {
      font-size: 1.1em;
      font-weight: 500;
    }
    .dialog-info,
    .dialog-note {
      margin-top: 4px;
      color: var(--secondary-text-color);
    }
    .dialog-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 12px;
    }
    .day-input {
      font: inherit;
      font-size: 1.4em;
      padding: 6px 8px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      background: var(--secondary-background-color);
      color: var(--primary-text-color);
    }
    .dialog-error {
      margin-top: 8px;
      color: var(--error-color);
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 16px;
    }
    .dialog-actions button {
      padding: 8px 16px;
      border: none;
      border-radius: 18px;
      font: inherit;
      font-weight: 500;
      cursor: pointer;
    }
    .dialog-actions .cancel {
      background: transparent;
      color: var(--primary-color);
    }
    .dialog-actions .save {
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
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
