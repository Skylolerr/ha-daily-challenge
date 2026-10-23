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

/** Entry of the entity registry as exposed to the frontend. */
export interface EntityRegistryDisplayEntry {
  entity_id: string;
  platform?: string;
  translation_key?: string;
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  // Replaced by the frontend whenever the entity registry changes.
  entities?: Record<string, EntityRegistryDisplayEntry>;
  locale: {
    language: string;
    /** Number format of the user profile, e.g. "language" or "quote_decimal". */
    number_format?: string;
  };
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

/** Result of `daily_challenge/history`; keys are ISO dates. */
export interface ChallengeHistory {
  days: Record<string, number>;
  targets: Record<string, number>;
  fulfilled: Record<string, boolean>;
}
