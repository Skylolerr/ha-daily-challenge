import { html, LitElement, nothing } from "lit";

import { localize, type StringKey } from "./localize";
import type { OverviewCardConfig } from "./overview-card";
import type { HomeAssistant } from "./types";

export const OVERVIEW_EDITOR_TYPE = "daily-challenge-overview-card-editor";

interface FormSchema {
  name: string;
  selector: Record<string, unknown>;
}

const SCHEMA: FormSchema[] = [
  { name: "title", selector: { text: {} } },
  {
    name: "entities",
    selector: {
      entity: {
        multiple: true,
        filter: [{ integration: "daily_challenge", domain: "number" }],
      },
    },
  },
  { name: "show_buttons", selector: { boolean: {} } },
];

/** Visual editor of the overview card. */
export class DailyChallengeOverviewCardEditor extends LitElement {
  static override properties = {
    hass: { attribute: false },
    _config: { state: true },
  };

  declare hass?: HomeAssistant;
  declare private _config?: OverviewCardConfig;

  setConfig(config: OverviewCardConfig): void {
    this._config = config;
  }

  private _valueChanged(ev: CustomEvent<{ value: Record<string, unknown> }>): void {
    ev.stopPropagation();
    if (!this._config) {
      return;
    }
    const value = ev.detail.value;
    // Keep everything else, e.g. grid_options or visibility.
    const config: OverviewCardConfig = { ...this._config };
    delete config.title;
    delete config.entities;
    delete config.show_buttons;
    const title = typeof value.title === "string" ? value.title.trim() : "";
    if (title) {
      config.title = title;
    }
    const entities = Array.isArray(value.entities)
      ? (value.entities as string[]).filter(Boolean)
      : [];
    if (entities.length) {
      config.entities = entities;
    }
    // Only hidden buttons are written; shown is the default.
    if (value.show_buttons === false) {
      config.show_buttons = false;
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
    if (!this.hass || !this._config) {
      return nothing;
    }
    const data = {
      title: this._config.title ?? "",
      entities: this._config.entities ?? [],
      show_buttons: this._config.show_buttons !== false,
    };
    return html`<ha-form
      .hass=${this.hass}
      .data=${data}
      .schema=${SCHEMA}
      .computeLabel=${(schema: FormSchema) =>
        localize(this.hass, schema.name as StringKey)}
      @value-changed=${this._valueChanged}
    ></ha-form>`;
  }
}

if (!customElements.get(OVERVIEW_EDITOR_TYPE)) {
  customElements.define(OVERVIEW_EDITOR_TYPE, DailyChallengeOverviewCardEditor);
}

declare global {
  interface HTMLElementTagNameMap {
    [OVERVIEW_EDITOR_TYPE]: DailyChallengeOverviewCardEditor;
  }
}
