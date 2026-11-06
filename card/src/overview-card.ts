import { css, html, LitElement, nothing, type PropertyValues } from "lit";

import { formatNumber, localize } from "./localize";
import { OVERVIEW_EDITOR_TYPE } from "./overview-editor";
import type { ChallengeInfo, ChallengeList, HomeAssistant } from "./types";

export const OVERVIEW_TYPE = "daily-challenge-overview-card";
const LOOKUP_RETRY_MS = 5000;
const NOT_LOADED = Symbol("not loaded");
const INACTIVE_STATES = new Set(["unknown", "unavailable"]);

export interface OverviewCardConfig {
  type: string;
  title?: string;
  /** `today` numbers of the challenges to show; all when empty. */
  entities?: string[];
  show_buttons?: boolean;
}

/** All challenges, or a chosen few, with one compact row each. */
export class DailyChallengeOverviewCard extends LitElement {
  static override properties = {
    hass: { attribute: false },
    _config: { state: true },
    _challenges: { state: true },
  };

  static getConfigElement(): HTMLElement {
    return document.createElement(OVERVIEW_EDITOR_TYPE);
  }

  static getStubConfig(): OverviewCardConfig {
    return { type: `custom:${OVERVIEW_TYPE}` };
  }

  declare hass?: HomeAssistant;
  declare private _config?: OverviewCardConfig;
  /** undefined while loading. */
  declare private _challenges?: ChallengeInfo[];

  private _entitiesSeen: unknown = NOT_LOADED;
  private _retryAt = 0;
  private _lookupId = 0;

  setConfig(config: OverviewCardConfig): void {
    if (config.entities !== undefined && !Array.isArray(config.entities)) {
      throw new Error(localize(this.hass, "invalid_entities"));
    }
    this._config = config;
  }

  getCardSize(): number {
    return Number(Boolean(this._config?.title)) + Math.max(1, this._visible().length);
  }

  protected override willUpdate(_changed: PropertyValues): void {
    // Look the challenges up again whenever the entity registry changes.
    if (
      this.hass &&
      this.hass.entities !== this._entitiesSeen &&
      Date.now() >= this._retryAt
    ) {
      this._entitiesSeen = this.hass.entities;
      void this._load();
    }
  }

  private async _load(): Promise<void> {
    const id = ++this._lookupId;
    try {
      const result = await this.hass?.callWS<ChallengeList>({
        type: "daily_challenge/list",
      });
      if (id === this._lookupId) {
        this._challenges = result?.challenges ?? [];
      }
    } catch {
      if (id === this._lookupId) {
        // E.g. while Home Assistant starts: try again with a later update.
        this._entitiesSeen = NOT_LOADED;
        this._retryAt = Date.now() + LOOKUP_RETRY_MS;
      }
    }
  }

  /** The challenges to show, in the configured order. */
  private _visible(): ChallengeInfo[] {
    const challenges = this._challenges ?? [];
    const wanted = this._config?.entities ?? [];
    if (wanted.length === 0) {
      return challenges;
    }
    return wanted
      .map((entityId) =>
        challenges.find((challenge) => challenge.entities.today === entityId),
      )
      .filter((challenge): challenge is ChallengeInfo => challenge !== undefined);
  }

  private _state(challenge: ChallengeInfo, key: string): string | undefined {
    const entityId = challenge.entities[key];
    return entityId ? this.hass?.states[entityId]?.state : undefined;
  }

  private _number(challenge: ChallengeInfo, key: string): number | undefined {
    const state = this._state(challenge, key);
    if (state === undefined || INACTIVE_STATES.has(state)) {
      return undefined;
    }
    const value = Number(state);
    return Number.isFinite(value) ? value : undefined;
  }

  /** The add button of the smallest step, if it can be pressed now. */
  private _smallestStep(challenge: ChallengeInfo): number | undefined {
    if (this._config?.show_buttons === false || challenge.today_from_source) {
      return undefined;
    }
    const steps = Object.keys(challenge.entities)
      .filter((key) => /^add_\d+$/.test(key))
      .map((key) => Number(key.slice(4)))
      .sort((a, b) => a - b)
      // A button's state is its last press ("unknown" before the first one).
      .filter((step) => {
        const state = this._state(challenge, `add_${step}`);
        return state !== undefined && state !== "unavailable";
      });
    return steps[0];
  }

  private _moreInfo(challenge: ChallengeInfo): void {
    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        detail: { entityId: challenge.entities.today },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private async _add(ev: Event, challenge: ChallengeInfo, step: number): Promise<void> {
    ev.stopPropagation();
    try {
      await this.hass?.callService("button", "press", {
        entity_id: challenge.entities[`add_${step}`],
      });
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

  protected override render() {
    if (!this._config || !this.hass) {
      return nothing;
    }
    const title = this._config.title
      ? html`<h1 class="card-header">${this._config.title}</h1>`
      : nothing;
    if (this._challenges === undefined) {
      return html`<ha-card>${title}</ha-card>`;
    }
    const challenges = this._visible();
    return html`<ha-card>
      ${title}
      <div class="rows">
        ${challenges.length
          ? challenges.map((challenge) => this._renderRow(challenge))
          : html`<div class="empty">${localize(this.hass, "no_challenges")}</div>`}
      </div>
    </ha-card>`;
  }

  private _renderRow(challenge: ChallengeInfo) {
    const hass = this.hass;
    const ended = this._number(challenge, "days_left") === 0;
    const value = this._number(challenge, "today");
    const target = this._number(challenge, "today_target");
    const reached = this._state(challenge, "goal_reached_today") === "on";
    const streak = this._number(challenge, "current_streak");
    const unit =
      (hass?.states[challenge.entities.today]?.attributes.unit_of_measurement as
        | string
        | undefined) ?? challenge.unit;
    const progress = reached
      ? 1
      : value !== undefined && target
        ? Math.min(1, value / target)
        : 0;
    const format = (figure: number | undefined) =>
      figure === undefined ? "–" : formatNumber(hass, figure);
    const step = ended ? undefined : this._smallestStep(challenge);

    return html`<div
      class="row"
      role="button"
      tabindex="0"
      @click=${() => this._moreInfo(challenge)}
      @keydown=${(ev: KeyboardEvent) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          this._moreInfo(challenge);
        }
      }}
    >
      <ha-icon .icon=${challenge.icon}></ha-icon>
      <div class="main">
        <div class="name">${challenge.name}</div>
        <div class="bar" aria-hidden="true">
          <div
            class="fill ${reached ? "reached" : ""}"
            style="width: ${(ended ? 0 : progress) * 100}%"
          ></div>
        </div>
        <div class="figures">
          ${ended
            ? localize(hass, "overview_ended")
            : html`${format(value)} / ${format(target)} ${unit}`}
        </div>
      </div>
      <span class="streak" title=${localize(hass, "current_streak")}
        >🔥 ${format(streak)}</span
      >
      ${step === undefined
        ? nothing
        : html`<button
            class="add"
            aria-label=${localize(hass, "add_amount", { amount: String(step) })}
            @click=${(ev: Event) => this._add(ev, challenge, step)}
            @keydown=${(ev: KeyboardEvent) => ev.stopPropagation()}
          >
            +${step}
          </button>`}
    </div>`;
  }

  static override styles = css`
    ha-card {
      display: block;
      padding-bottom: 8px;
    }
    .card-header {
      margin: 0;
      padding: 16px 16px 0;
      font-size: 1.2em;
      font-weight: 500;
    }
    .rows {
      display: flex;
      flex-direction: column;
      padding: 8px 8px 0;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      border-radius: 8px;
      cursor: pointer;
    }
    .row:hover,
    .row:focus-visible {
      background: var(--secondary-background-color);
      outline: none;
    }
    ha-icon {
      color: var(--state-icon-color, var(--primary-color));
      flex: none;
    }
    .main {
      flex: 1;
      min-width: 0;
    }
    .name {
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .figures {
      margin-top: 2px;
      color: var(--secondary-text-color);
      font-size: 0.9em;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }
    .bar {
      height: 6px;
      margin-top: 4px;
      border-radius: 3px;
      background: var(--divider-color);
      overflow: hidden;
    }
    .fill {
      height: 100%;
      border-radius: 3px;
      background: var(--primary-color);
      transition: width 0.3s ease;
    }
    .fill.reached {
      background: var(--success-color, #43a047);
    }
    .streak {
      flex: none;
      color: var(--secondary-text-color);
      white-space: nowrap;
    }
    .add {
      flex: none;
      min-width: 48px;
      padding: 6px 10px;
      border: none;
      border-radius: 18px;
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
      font: inherit;
      font-weight: 500;
      cursor: pointer;
    }
    .add:focus-visible {
      outline: 2px solid var(--primary-text-color);
      outline-offset: 2px;
    }
    .empty {
      padding: 8px;
      color: var(--secondary-text-color);
    }
  `;
}

if (!customElements.get(OVERVIEW_TYPE)) {
  customElements.define(OVERVIEW_TYPE, DailyChallengeOverviewCard);
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
if (!cardWindow.customCards.some((card) => card.type === OVERVIEW_TYPE)) {
  cardWindow.customCards.push({
    type: OVERVIEW_TYPE,
    name: localize(undefined, "overview_name"),
    description: localize(undefined, "overview_description"),
    preview: true,
    documentationURL: "https://github.com/Skylolerr/ha-daily-challenge",
  });
}

declare global {
  interface HTMLElementTagNameMap {
    [OVERVIEW_TYPE]: DailyChallengeOverviewCard;
  }
}
