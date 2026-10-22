import { css, html, LitElement, nothing } from "lit";

import type { DailyChallengeCardConfig, HomeAssistant } from "./types";

export const CARD_TYPE = "daily-challenge-card";

export class DailyChallengeCard extends LitElement {
  static override properties = {
    hass: { attribute: false },
    _config: { state: true },
  };

  declare hass?: HomeAssistant;
  declare private _config?: DailyChallengeCardConfig;

  setConfig(config: DailyChallengeCardConfig): void {
    if (!config?.entity) {
      throw new Error("Please define an entity of a Daily Challenge.");
    }
    this._config = config;
  }

  getCardSize(): number {
    return 3;
  }

  protected override render() {
    if (!this._config || !this.hass) {
      return nothing;
    }
    const stateObj = this.hass.states[this._config.entity];
    if (!stateObj) {
      return html`<ha-card>
        <div class="warning">Entity not found: ${this._config.entity}</div>
      </ha-card>`;
    }
    const unit = stateObj.attributes.unit_of_measurement;
    return html`<ha-card>
      <div class="header">
        ${stateObj.attributes.friendly_name ?? stateObj.entity_id}
      </div>
      <div class="value">${stateObj.state}${unit ? html` <span>${unit}</span>` : nothing}</div>
    </ha-card>`;
  }

  static override styles = css`
    ha-card {
      padding: 16px;
    }
    .header {
      font-size: 1.2em;
      font-weight: 500;
    }
    .value {
      font-size: 2.5em;
      margin-top: 8px;
    }
    .value span {
      font-size: 0.4em;
      color: var(--secondary-text-color);
    }
    .warning {
      color: var(--error-color);
    }
  `;
}

if (!customElements.get(CARD_TYPE)) {
  customElements.define(CARD_TYPE, DailyChallengeCard);
}

declare global {
  interface HTMLElementTagNameMap {
    [CARD_TYPE]: DailyChallengeCard;
  }
}
