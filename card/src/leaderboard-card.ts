import { css, html, LitElement, nothing, type PropertyValues } from "lit";

import { avatarStyles, renderAvatar } from "./avatar";
import { LEADERBOARD_EDITOR_TYPE } from "./leaderboard-editor";
import { formatNumber, localize, type StringKey } from "./localize";
import {
  type ChallengeInfo,
  type ChallengeList,
  type GroupInfo,
  type GroupRanking,
  type HomeAssistant,
  RANKING_METRICS,
  RANKING_PERIODS,
  type RankingMetric,
  type RankingPeriod,
  type RankingRow,
} from "./types";

export const LEADERBOARD_TYPE = "daily-challenge-leaderboard-card";
export const LEADERBOARD_RETRY_MS = 5000;
const NOT_LOADED = Symbol("not loaded");

export interface LeaderboardCardConfig {
  type: string;
  /** Entry ID of the group. */
  group: string;
  title?: string;
  /** Period shown first; a week by default. */
  period?: RankingPeriod;
  /** Figure ranked by first; the group's setting by default. */
  ranking?: RankingMetric;
  show_goal?: boolean;
}

/** Errors of `daily_challenge/ranking` that are shown instead of the ranking. */
type RankingError = "not_found" | "not_loaded";

function errorCode(err: unknown): string | undefined {
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

/** The ranking of a group of challenges. */
export class DailyChallengeLeaderboardCard extends LitElement {
  static override properties = {
    hass: { attribute: false },
    _config: { state: true },
    _group: { state: true },
    _ranking: { state: true },
    _error: { state: true },
    _period: { state: true },
    _metric: { state: true },
  };

  static getConfigElement(): HTMLElement {
    return document.createElement(LEADERBOARD_EDITOR_TYPE);
  }

  /** The first group, if there is one. */
  static async getStubConfig(hass?: HomeAssistant): Promise<LeaderboardCardConfig> {
    let group = "";
    try {
      const result = await hass?.callWS<ChallengeList>({ type: "daily_challenge/list" });
      group = result?.groups?.[0]?.entry_id ?? "";
    } catch {
      // Without an answer the user picks the group in the editor.
    }
    return { type: `custom:${LEADERBOARD_TYPE}`, group };
  }

  declare hass?: HomeAssistant;
  declare private _config?: LeaderboardCardConfig;
  /** undefined while loading, null if the list has no such group. */
  declare private _group?: GroupInfo | null;
  declare private _ranking?: GroupRanking;
  declare private _error?: RankingError;
  /** Period and figure chosen in the card. */
  declare private _period: RankingPeriod;
  /** undefined: as set in the group. */
  declare private _metric?: RankingMetric;

  /** Member challenges, to watch their entities and open their details. */
  private _members: ChallengeInfo[] = [];
  /** Entities whose changes matter; undefined until the list is loaded. */
  private _watched?: string[];
  private _entitiesSeen: unknown = NOT_LOADED;
  private _listRetryAt = 0;
  private _listId = 0;
  /** What the shown (or loading) ranking was asked for. */
  private _rankingKey?: string;
  private _rankingRetryAt = 0;
  private _rankingId = 0;

  constructor() {
    super();
    this._period = "week";
  }

  setConfig(config: LeaderboardCardConfig): void {
    if (!config?.group) {
      throw new Error(localize(this.hass, "missing_group"));
    }
    const check = (option: string, value: unknown, allowed: readonly string[]) => {
      if (value !== undefined && !allowed.includes(value as string)) {
        throw new Error(
          localize(this.hass, "invalid_option", { option, values: allowed.join(", ") }),
        );
      }
    };
    check("period", config.period, RANKING_PERIODS);
    check("ranking", config.ranking, RANKING_METRICS);
    const old = this._config;
    if (config.group !== old?.group) {
      this._group = undefined;
      this._ranking = undefined;
      this._error = undefined;
      this._members = [];
      this._watched = undefined;
      this._entitiesSeen = NOT_LOADED;
      this._listRetryAt = 0;
      this._rankingKey = undefined;
      this._rankingRetryAt = 0;
    }
    // A new start in the config also resets the choice in the card.
    if (config.group !== old?.group || config.period !== old?.period) {
      this._period = config.period ?? "week";
    }
    if (config.group !== old?.group || config.ranking !== old?.ranking) {
      this._metric = config.ranking;
    }
    this._config = config;
  }

  getCardSize(): number {
    // Header, selectors, one row per member, then goal and streak.
    const rows = this._ranking?.rows.length ?? this._group?.members.length ?? 3;
    const goal = Number(Boolean(this._ranking?.goal) && this._config?.show_goal !== false);
    return 2 + Math.max(1, rows) + goal + 1;
  }

  getGridOptions(): { columns: number; min_columns: number; rows: string } {
    return { columns: 6, min_columns: 4, rows: "auto" };
  }

  /** The most recently loaded ranking (undefined until loaded). */
  get ranking(): GroupRanking | undefined {
    return this._ranking;
  }

  /**
   * Home Assistant replaces `hass` on every state change anywhere. Only
   * changes of the members' entities, the registry, the locale or the user matter.
   */
  protected override shouldUpdate(changed: PropertyValues): boolean {
    if (changed.size !== 1 || !changed.has("hass") || this._watched === undefined) {
      return true;
    }
    const old = changed.get("hass") as HomeAssistant | undefined;
    const hass = this.hass;
    if (
      !old ||
      !hass ||
      old.entities !== hass.entities ||
      old.locale !== hass.locale ||
      old.user !== hass.user ||
      // A new day starts a new period.
      this._rankingKey !== this._key()
    ) {
      return true;
    }
    return this._watched.some((entityId) => old.states[entityId] !== hass.states[entityId]);
  }

  protected override willUpdate(_changed: PropertyValues): void {
    // Look the group up again whenever the entity registry changes, e.g.
    // after its members were edited.
    if (
      this.hass &&
      this._config &&
      this.hass.entities !== this._entitiesSeen &&
      Date.now() >= this._listRetryAt
    ) {
      this._entitiesSeen = this.hass.entities;
      void this._loadList();
    }
    const key = this._key();
    if (
      this.hass &&
      this._config &&
      this._watched !== undefined &&
      key !== this._rankingKey &&
      Date.now() >= this._rankingRetryAt
    ) {
      this._rankingKey = key;
      void this._loadRanking();
    }
  }

  /** Everything the ranking depends on; a new key loads it again. */
  private _key(): string {
    const states = (this._watched ?? []).map((entityId) => this.hass?.states[entityId]?.state);
    // The browser's date is only a hint for a new day; HA's zone may differ.
    return JSON.stringify([
      this._config?.group,
      this._period,
      this._metric,
      states,
      new Date().toDateString(),
    ]);
  }

  private async _loadList(): Promise<void> {
    const group = this._config?.group;
    const id = ++this._listId;
    try {
      const result = await this.hass?.callWS<ChallengeList>({
        type: "daily_challenge/list",
      });
      if (id !== this._listId || group !== this._config?.group) {
        return;
      }
      const info = result?.groups?.find((item) => item.entry_id === group) ?? null;
      const challenges = result?.challenges ?? [];
      this._group = info;
      this._members = (info?.members ?? [])
        .map((entryId) => challenges.find((challenge) => challenge.entry_id === entryId))
        .filter((challenge): challenge is ChallengeInfo => challenge !== undefined);
      this._watched = this._members.flatMap((challenge) =>
        [challenge.entities.today, challenge.person].filter(
          (entityId): entityId is string => Boolean(entityId),
        ),
      );
    } catch {
      if (id === this._listId) {
        // E.g. while Home Assistant starts: try again with a later update.
        this._entitiesSeen = NOT_LOADED;
        this._listRetryAt = Date.now() + LEADERBOARD_RETRY_MS;
      }
    }
  }

  private async _loadRanking(): Promise<void> {
    const group = this._config?.group;
    const id = ++this._rankingId;
    const message: { type: string; [key: string]: unknown } = {
      type: "daily_challenge/ranking",
      entry_id: group,
      period: this._period,
    };
    if (this._metric) {
      message.metric = this._metric;
    }
    try {
      const ranking = await this.hass?.callWS<GroupRanking>(message);
      if (id === this._rankingId && group === this._config?.group) {
        this._ranking = ranking;
        this._error = undefined;
      }
    } catch (err) {
      if (id !== this._rankingId || group !== this._config?.group) {
        return;
      }
      const code = errorCode(err);
      if (code === "not_found" || code === "not_loaded") {
        this._error = code;
        this._ranking = undefined;
      }
      // Keep what is shown and try again with a later update.
      this._rankingKey = undefined;
      this._rankingRetryAt = Date.now() + LEADERBOARD_RETRY_MS;
    }
  }

  private _choosePeriod(period: RankingPeriod): void {
    this._period = period;
    this._rankingRetryAt = 0;
  }

  private _chooseMetric(metric: RankingMetric): void {
    this._metric = metric;
    this._rankingRetryAt = 0;
  }

  /** The figure that is ranked by (as answered, else as asked). */
  private _shownMetric(): RankingMetric {
    return this._metric ?? this._ranking?.metric ?? this._group?.ranking ?? "percent";
  }

  private _moreInfo(row: RankingRow): void {
    const entityId = this._members.find((challenge) => challenge.entry_id === row.entry_id)
      ?.entities.today;
    if (!entityId) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        detail: { entityId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  // --- rendering -------------------------------------------------------------

  protected override render() {
    if (!this._config || !this.hass) {
      return nothing;
    }
    const hass = this.hass;
    const title =
      this._config.title ?? this._ranking?.name ?? this._group?.name ?? "";
    const icon = this._ranking?.icon ?? this._group?.icon;
    const header =
      title || icon
        ? html`<div class="header">
            ${icon ? html`<ha-icon .icon=${icon}></ha-icon>` : nothing}
            <h1 class="title">${title}</h1>
          </div>`
        : nothing;

    if (this._error) {
      return html`<ha-card>
        ${header}
        <div class="message warning">
          ${localize(
            hass,
            this._error === "not_found" ? "group_not_found" : "group_not_loaded",
          )}
        </div>
      </ha-card>`;
    }
    const ranking = this._ranking;
    return html`<ha-card>
      ${header} ${this._renderSelectors()}
      ${ranking
        ? html`<div class="rows" aria-busy=${this._loadingOther() ? "true" : "false"}>
              ${ranking.rows.length
                ? ranking.rows.map((row) => this._renderRow(ranking, row))
                : html`<div class="message">${localize(hass, "ranking_empty")}</div>`}
            </div>
            ${this._renderGoal(ranking)} ${this._renderStreak(ranking)}`
        : html`<div class="message" aria-live="polite">${localize(hass, "loading")}</div>`}
    </ha-card>`;
  }

  /** Whether a ranking for another choice is on its way. */
  private _loadingOther(): boolean {
    const ranking = this._ranking;
    return (
      ranking !== undefined &&
      (ranking.period !== this._period ||
        (this._metric !== undefined && ranking.metric !== this._metric))
    );
  }

  private _renderSelectors() {
    const hass = this.hass;
    const metric = this._shownMetric();
    const segment = <T extends string>(
      label: StringKey,
      prefix: string,
      values: readonly T[],
      selected: T,
      choose: (value: T) => void,
    ) =>
      html`<div class="segments" role="group" aria-label=${localize(hass, label)}>
        ${values.map(
          (value) =>
            html`<button
              class="segment ${value === selected ? "selected" : ""}"
              aria-pressed=${value === selected ? "true" : "false"}
              @click=${() => choose(value)}
            >
              ${localize(hass, `${prefix}_${value}` as StringKey)}
            </button>`,
        )}
      </div>`;
    return html`<div class="selectors">
      ${segment("period", "period", RANKING_PERIODS, this._period, (value) =>
        this._choosePeriod(value),
      )}
      ${segment("metric", "metric", RANKING_METRICS, metric, (value) =>
        this._chooseMetric(value),
      )}
    </div>`;
  }

  private _formatValue(ranking: GroupRanking, row: RankingRow): string {
    const hass = this.hass;
    switch (ranking.metric) {
      case "amount":
        return `${formatNumber(hass, row.amount)} ${row.unit}`.trim();
      case "streak":
        return localize(hass, row.streak === 1 ? "streak_day" : "streak_days", {
          value: formatNumber(hass, row.streak),
        });
      default:
        return localize(hass, "value_percent", { value: formatNumber(hass, row.percent) });
    }
  }

  private _renderRow(ranking: GroupRanking, row: RankingRow) {
    const hass = this.hass;
    const progress = Math.max(0, Math.min(100, row.percent || 0));
    const medal = row.rank >= 1 && row.rank <= 3 ? `medal-${row.rank}` : "";
    const avatar = row.person
      ? renderAvatar(hass, row.person, { name: row.name, picture: row.picture })
      : nothing;
    const open = () => this._moreInfo(row);
    return html`<div
      class="row"
      role="button"
      tabindex="0"
      @click=${open}
      @keydown=${(ev: KeyboardEvent) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          open();
        }
      }}
    >
      <span
        class="rank ${medal}"
        role="img"
        aria-label=${localize(hass, "rank", { rank: String(row.rank) })}
        >${row.rank}</span
      >
      ${avatar === nothing
        ? html`<span class="avatar icon-avatar" aria-hidden="true"
            ><ha-icon .icon=${row.icon}></ha-icon
          ></span>`
        : avatar}
      <div class="main">
        <div class="line">
          <span class="name">${row.name}</span>
          <span class="value">${this._formatValue(ranking, row)}</span>
        </div>
        ${row.challenge && row.challenge !== row.name
          ? html`<div class="challenge">${row.challenge}</div>`
          : nothing}
        <div class="bar" aria-hidden="true">
          <div
            class="fill ${progress >= 100 ? "reached" : ""}"
            style="width: ${progress}%"
          ></div>
        </div>
      </div>
    </div>`;
  }

  private _renderGoal(ranking: GroupRanking) {
    const goal = ranking.goal;
    if (!goal || this._config?.show_goal === false) {
      return nothing;
    }
    const hass = this.hass;
    const unit = ranking.unit ?? "";
    const progress = Math.max(0, Math.min(100, goal.progress || 0));
    const reached = goal.remaining <= 0;
    return html`<div class="goal">
      <div class="line">
        <span class="label">${localize(hass, `goal_${goal.period}` as StringKey)}</span>
        <span class="value"
          >${formatNumber(hass, goal.total)} / ${formatNumber(hass, goal.goal)}
          ${unit}</span
        >
      </div>
      <div
        class="bar"
        role="progressbar"
        aria-label=${localize(hass, `goal_${goal.period}` as StringKey)}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow=${progress}
      >
        <div class="fill ${reached ? "reached" : ""}" style="width: ${progress}%"></div>
      </div>
      <div class="note">
        ${reached
          ? localize(hass, "goal_reached")
          : localize(hass, "goal_remaining", {
              remaining: `${formatNumber(hass, goal.remaining)} ${unit}`.trim(),
            })}
      </div>
    </div>`;
  }

  private _renderStreak(ranking: GroupRanking) {
    const hass = this.hass;
    return html`<div class="group-streak">
      <span class="label">${localize(hass, "group_streak")}</span>
      <span class="streak"
        >🔥 <span class="current">${formatNumber(hass, ranking.streak)}</span>
        <span class="best"
          >· ${localize(hass, "best")} ${formatNumber(hass, ranking.best_streak)}</span
        ></span
      >
      ${ranking.all_reached_today
        ? html`<div class="all-reached">${localize(hass, "all_reached_today")}</div>`
        : nothing}
    </div>`;
  }

  static override styles = [
    avatarStyles,
    css`
      ha-card {
        display: block;
        padding: 16px;
      }
      .header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }
      .header ha-icon {
        color: var(--state-icon-color, var(--primary-color));
      }
      .title {
        flex: 1;
        min-width: 0;
        margin: 0;
        font-size: 1.2em;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .selectors {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 8px;
      }
      .segments {
        display: inline-flex;
        flex-wrap: wrap;
        border: 1px solid var(--divider-color);
        border-radius: 16px;
        overflow: hidden;
      }
      .segment {
        padding: 4px 10px;
        border: none;
        background: transparent;
        color: var(--primary-text-color);
        font: inherit;
        font-size: 0.85em;
        cursor: pointer;
      }
      .segment + .segment {
        border-left: 1px solid var(--divider-color);
      }
      .segment.selected {
        background: var(--primary-color);
        color: var(--text-primary-color, #fff);
      }
      .segment:focus-visible {
        outline: 2px solid var(--primary-text-color);
        outline-offset: -2px;
      }
      .rows {
        display: flex;
        flex-direction: column;
        margin: 0 -8px;
      }
      .rows[aria-busy="true"] {
        opacity: 0.6;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px;
        border-radius: 8px;
        cursor: pointer;
        --dc-avatar-size: 32px;
      }
      .row:hover,
      .row:focus-visible {
        background: var(--secondary-background-color);
        outline: none;
      }
      .rank {
        flex: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        color: var(--secondary-text-color);
        font-weight: 500;
        font-variant-numeric: tabular-nums;
      }
      .rank.medal-1,
      .rank.medal-2,
      .rank.medal-3 {
        color: #000;
      }
      .rank.medal-1 {
        background: #f5c518;
      }
      .rank.medal-2 {
        background: #c0c4c8;
      }
      .rank.medal-3 {
        background: #d39a64;
      }
      .icon-avatar {
        background: var(--secondary-background-color);
        color: var(--state-icon-color, var(--primary-color));
        --mdc-icon-size: 20px;
      }
      .main {
        flex: 1;
        min-width: 0;
      }
      .line {
        display: flex;
        align-items: baseline;
        gap: 8px;
      }
      .name {
        flex: 1;
        min-width: 0;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .value {
        flex: none;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .challenge,
      .note,
      .label,
      .best {
        color: var(--secondary-text-color);
      }
      .challenge {
        font-size: 0.85em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
      .goal,
      .group-streak {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--divider-color);
      }
      .goal .label {
        flex: 1;
        min-width: 0;
      }
      .note {
        margin-top: 4px;
        font-size: 0.9em;
      }
      .group-streak {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        justify-content: space-between;
        gap: 4px 8px;
      }
      .streak {
        white-space: nowrap;
      }
      .current {
        font-weight: 500;
      }
      .all-reached {
        flex-basis: 100%;
        color: var(--success-color, #43a047);
        font-size: 0.9em;
      }
      .message {
        padding: 8px 0;
        color: var(--secondary-text-color);
      }
      .message.warning {
        color: var(--warning-color, var(--primary-text-color));
      }
    `,
  ];
}

if (!customElements.get(LEADERBOARD_TYPE)) {
  customElements.define(LEADERBOARD_TYPE, DailyChallengeLeaderboardCard);
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
if (!cardWindow.customCards.some((card) => card.type === LEADERBOARD_TYPE)) {
  cardWindow.customCards.push({
    type: LEADERBOARD_TYPE,
    name: localize(undefined, "leaderboard_name"),
    description: localize(undefined, "leaderboard_description"),
    preview: true,
    documentationURL: "https://github.com/Skylolerr/ha-daily-challenge",
  });
}

declare global {
  interface HTMLElementTagNameMap {
    [LEADERBOARD_TYPE]: DailyChallengeLeaderboardCard;
  }
}
