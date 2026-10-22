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
  // Replaced by the frontend whenever the entity registry changes.
  entities?: Record<string, unknown>;
  locale: { language: string };
  callWS<T>(msg: { type: string; [key: string]: unknown }): Promise<T>;
  callService(
    domain: string,
    service: string,
    data?: Record<string, unknown>,
  ): Promise<unknown>;
}

export interface DailyChallengeCardConfig {
  type: string;
  entity: string;
}

/** One challenge as returned by `daily_challenge/list`. */
export interface ChallengeInfo {
  entry_id: string;
  name: string;
  icon: string;
  unit: string;
  /** Entity key (e.g. "today", "add_5") to entity ID. */
  entities: Record<string, string>;
}

export interface ChallengeList {
  challenges: ChallengeInfo[];
}
