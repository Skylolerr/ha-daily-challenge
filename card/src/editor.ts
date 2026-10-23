import { html, LitElement, nothing, type PropertyValues } from "lit";

import { localize } from "./localize";
import type {
  ChallengeInfo,
  ChallengeList,
  DailyChallengeCardConfig,
  HomeAssistant,
} from "./types";

export const EDITOR_TYPE = "daily-challenge-card-editor";

interface FormSchema {
  name: string;
  required?: boolean;
  selector: Record<string, unknown>;
}

/** Visual editor: pick the challenge from a dropdown. */
export class DailyChallengeCardEditor extends LitElement {
  static override properties = {
    hass: { attribute: false },
    _config: { state: true },
    _challenges: { state: true },
  };

  declare hass?: HomeAssistant;
  declare private _config?: DailyChallengeCardConfig;
  /** undefined while loading. */
  declare private _challenges?: ChallengeInfo[];

  private _loading = false;

  setConfig(config: DailyChallengeCardConfig): void {
    this._config = config;
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (changed.has("hass") && this.hass && !this._loading && !this._challenges) {
      this._loading = true;
      void this._load();
    }
  }

  private async _load(): Promise<void> {
    try {
      const result = await this.hass?.callWS<ChallengeList>({
        type: "daily_challenge/list",
      });
      this._challenges = result?.challenges ?? [];
    } catch {
      this._challenges = [];
    } finally {
      this._loading = false;
    }
  }

  private _selected(): string | undefined {
    const entity = this._config?.entity;
    return this._challenges?.find((challenge) =>
      Object.values(challenge.entities).includes(entity ?? ""),
    )?.entry_id;
  }

  private _schema(challenges: ChallengeInfo[]): FormSchema[] {
    return [
      {
        name: "challenge",
        required: true,
        selector: {
          select: {
            mode: "dropdown",
            options: challenges.map((challenge) => ({
              value: challenge.entry_id,
              label: challenge.name,
            })),
          },
        },
      },
    ];
  }

  private _valueChanged(ev: CustomEvent<{ value: { challenge?: string } }>): void {
    ev.stopPropagation();
    const challenge = this._challenges?.find(
      (item) => item.entry_id === ev.detail.value.challenge,
    );
    const entity = challenge?.entities.today;
    if (!this._config || !entity || entity === this._config.entity) {
      return;
    }
    this._config = { ...this._config, entity };
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      }),
    );
  }

  protected override render() {
    if (!this.hass || !this._config || !this._challenges) {
      return nothing;
    }
    if (this._challenges.length === 0) {
      return html`<p>${localize(this.hass, "no_challenges")}</p>`;
    }
    return html`<ha-form
      .hass=${this.hass}
      .data=${{ challenge: this._selected() }}
      .schema=${this._schema(this._challenges)}
      .computeLabel=${(schema: FormSchema) =>
        localize(this.hass, schema.name as "challenge")}
      @value-changed=${this._valueChanged}
    ></ha-form>`;
  }
}

if (!customElements.get(EDITOR_TYPE)) {
  customElements.define(EDITOR_TYPE, DailyChallengeCardEditor);
}

declare global {
  interface HTMLElementTagNameMap {
    [EDITOR_TYPE]: DailyChallengeCardEditor;
  }
}
