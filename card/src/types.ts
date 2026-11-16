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
  /** The logged-in user. */
  user?: { id: string; name?: string };
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

/** Parts of the card that can be hidden; all are shown by default. */
export const DISPLAY_OPTIONS = [
  "show_streak",
  "show_target_vs_actual",
  "show_remaining",
  "show_required_average",
  "show_catch_up",
  "show_buttons",
  "show_stats",
  "show_heatmap",
  "show_celebration",
] as const;

export type DisplayOption = (typeof DISPLAY_OPTIONS)[number];

export interface DailyChallengeCardConfig
  extends Partial<Record<DisplayOption, boolean>> {
  type: string;
  entity: string;
  /** Weeks shown in the heatmap; a year by default. */
  heatmap_range?: "year" | "6months" | "3months";
}

/** One challenge as returned by `daily_challenge/list`. */
export interface ChallengeInfo {
  entry_id: string;
  name: string;
  icon: string;
  unit: string;
  /** A source sensor sets today's value; there is no manual input. */
  today_from_source?: boolean;
  /** Entity ID of the person the challenge belongs to (`person.*`). */
  person?: string | null;
  /** Entity key (e.g. "today", "add_5") to entity ID. */
  entities: Record<string, string>;
}

export interface ChallengeList {
  challenges: ChallengeInfo[];
  /** Groups of challenges (since 0.3). */
  groups?: GroupInfo[];
}

export const RANKING_PERIODS = ["today", "week", "month", "total"] as const;
export type RankingPeriod = (typeof RANKING_PERIODS)[number];

export const RANKING_METRICS = ["percent", "amount", "streak"] as const;
export type RankingMetric = (typeof RANKING_METRICS)[number];

/** One group as returned by `daily_challenge/list`. */
export interface GroupInfo {
  entry_id: string;
  name: string;
  icon: string;
  /** Entry IDs of the member challenges. */
  members: string[];
  ranking: RankingMetric;
}

/** One member in the result of `daily_challenge/ranking`. */
export interface RankingRow {
  entry_id: string;
  /** Shared by members with the same figure. */
  rank: number;
  /** Name of the person, else of the challenge. */
  name: string;
  challenge: string;
  icon: string;
  unit: string;
  person: string | null;
  picture: string | null;
  amount: number;
  target: number;
  percent: number;
  streak: number;
}

/** Result of `daily_challenge/ranking`. */
export interface GroupRanking {
  name: string;
  icon: string;
  metric: RankingMetric;
  period: RankingPeriod;
  /** The unit all members share, else null. */
  unit: string | null;
  rows: RankingRow[];
  streak: number;
  best_streak: number;
  all_reached_today: boolean;
  goal: null | {
    total: number;
    goal: number;
    progress: number;
    remaining: number;
    period: "week" | "month" | "year";
  };
}

/** Result of `daily_challenge/history`; keys are ISO dates. */
export interface ChallengeHistory {
  days: Record<string, number>;
  targets: Record<string, number>;
  fulfilled: Record<string, boolean>;
  /** Unfulfilled days that can still be made up today (catch-up). */
  rescuable?: string[];
}
