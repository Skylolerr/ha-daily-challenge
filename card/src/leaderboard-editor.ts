import { html, LitElement, nothing, type PropertyValues } from "lit";

import type { LeaderboardCardConfig } from "./leaderboard-card";
import { localize, type StringKey } from "./localize";
import {
  type ChallengeList,
  type GroupInfo,
  type HomeAssistant,
  RANKING_METRICS,
  RANKING_PERIODS,
  type RankingMetric,
  type RankingPeriod,
} from "./types";

export const LEADERBOARD_EDITOR_TYPE = "daily-challenge-leaderboard-card-editor";

interface FormSchema {
  name: string;
  required?: boolean;
  selector: Record<string, unknown>;
}

/** Visual editor of the leaderboard card. */
export class DailyChallengeLeaderboardCardEditor extends LitElement {
  static override properties = {
    hass: { attribute: false },
    _config: { state: true },
    _groups: { state: true },
  };

  declare hass?: HomeAssistant;
  declare private _config?: LeaderboardCardConfig;
  /** undefined while loading. */
  declare private _groups?: GroupInfo[];

  private _loading = false;

  setConfig(config: LeaderboardCardConfig): void {
    this._config = config;
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (changed.has("hass") && this.hass && !this._loading && !this._groups) {
      this._loading = true;
      void this._load();
    }
  }

  private async _load(): Promise<void> {
    try {
      const result = await this.hass?.callWS<ChallengeList>({
        type: "daily_challenge/list",
      });
      this._groups = result?.groups ?? [];
    } catch {
      this._groups = [];
    } finally {
      this._loading = false;
    }
  }

  private _schema(groups: GroupInfo[]): FormSchema[] {
    const options = (prefix: string, values: readonly string[]) =>
      values.map((value) => ({
        value,
        label: localize(this.hass, `${prefix}_${value}` as StringKey),
      }));
    return [
      {
        name: "group",
        required: true,
        selector: {
          select: {
            mode: "dropdown",
            options: groups.map((group) => ({ value: group.entry_id, label: group.name })),
          },
        },
      },
      { name: "title", selector: { text: {} } },
      {
        name: "period",
        selector: { select: { mode: "dropdown", options: options("period", RANKING_PERIODS) } },
      },
      {
        name: "ranking",
        selector: { select: { mode: "dropdown", options: options("metric", RANKING_METRICS) } },
      },
      { name: "show_goal", selector: { boolean: {} } },
    ];
  }

  private _valueChanged(ev: CustomEvent<{ value: Record<string, unknown> }>): void {
    ev.stopPropagation();
    if (!this._config) {
      return;
    }
    const value = ev.detail.value;
    // Keep everything else, e.g. grid_options or visibility.
    const config: LeaderboardCardConfig = { ...this._config };
    delete config.title;
    delete config.period;
    delete config.ranking;
    delete config.show_goal;
    if (typeof value.group === "string" && value.group) {
      config.group = value.group;
    }
    const title = typeof value.title === "string" ? value.title.trim() : "";
    if (title) {
      config.title = title;
    }
    // Only what differs from the defaults is written.
    const period = value.period as RankingPeriod | undefined;
    if (period && period !== "week" && RANKING_PERIODS.includes(period)) {
      config.period = period;
    }
    const ranking = value.ranking as RankingMetric | undefined;
    if (ranking && RANKING_METRICS.includes(ranking)) {
      config.ranking = ranking;
    }
    if (value.show_goal === false) {
      config.show_goal = false;
    }
    if (JSON.stringify(config) === JSON.stringify(this._config)) {
      return;
    }
    this._config = config;
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config },
        bubbles: true,
        composed: true,
      }),
    );
  }

  protected override render() {
    if (!this.hass || !this._config || !this._groups) {
      return nothing;
    }
    if (this._groups.length === 0) {
      return html`<p>${localize(this.hass, "no_groups")}</p>`;
    }
    const data = {
      group: this._config.group || undefined,
      title: this._config.title ?? "",
      period: this._config.period ?? "week",
      ranking: this._config.ranking,
      show_goal: this._config.show_goal !== false,
    };
    return html`<ha-form
      .hass=${this.hass}
      .data=${data}
      .schema=${this._schema(this._groups)}
      .computeLabel=${(schema: FormSchema) => localize(this.hass, schema.name as StringKey)}
      @value-changed=${this._valueChanged}
    ></ha-form>`;
  }
}

if (!customElements.get(LEADERBOARD_EDITOR_TYPE)) {
  customElements.define(LEADERBOARD_EDITOR_TYPE, DailyChallengeLeaderboardCardEditor);
}

declare global {
  interface HTMLElementTagNameMap {
    [LEADERBOARD_EDITOR_TYPE]: DailyChallengeLeaderboardCardEditor;
  }
}
