// Minimal subset of the Home Assistant frontend types used by the card.

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown> & {
    friendly_name?: string;
    icon?: string;
    unit_of_measurement?: string;
  };
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  locale: { language: string };
}

export interface DailyChallengeCardConfig {
  type: string;
  entity: string;
}
