import { html, LitElement, nothing, type PropertyValues } from "lit";

import { localize, type StringKey } from "./localize";
import {
  type ChallengeInfo,
  type ChallengeList,
  type DailyChallengeCardConfig,
  DISPLAY_OPTIONS,
  type HomeAssistant,
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
      ...DISPLAY_OPTIONS.map((option) => ({
        name: option,
        selector: { boolean: {} },
      })),
    ];
  }

  private _formData(): Record<string, unknown> {
    const data: Record<string, unknown> = { challenge: this._selected() };
    for (const option of DISPLAY_OPTIONS) {
      data[option] = this._config?.[option] !== false;
    }
    return data;
  }

  private _valueChanged(
    ev: CustomEvent<{ value: Record<string, unknown> }>,
  ): void {
    ev.stopPropagation();
    if (!this._config) {
      return;
    }
    const value = ev.detail.value;
    // Keep the configured entity (any entity of the challenge is allowed)
    // unless another challenge was picked.
    const challenge =
      value.challenge === this._selected()
        ? undefined
        : this._challenges?.find((item) => item.entry_id === value.challenge);
    const config: DailyChallengeCardConfig = {
      ...this._config,
      entity: challenge?.entities.today ?? this._config.entity,
    };
    // Only hidden parts are written; shown is the default.
    for (const option of DISPLAY_OPTIONS) {
      if (value[option] === false) {
        config[option] = false;
      } else {
        delete config[option];
      }
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
    if (!this.hass || !this._config || !this._challenges) {
      return nothing;
    }
    if (this._challenges.length === 0) {
      return html`<p>${localize(this.hass, "no_challenges")}</p>`;
    }
    return html`<ha-form
      .hass=${this.hass}
      .data=${this._formData()}
      .schema=${this._schema(this._challenges)}
      .computeLabel=${(schema: FormSchema) =>
        localize(this.hass, schema.name as StringKey)}
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
