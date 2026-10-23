// English base strings of the card. Every other language must define all keys.
export const en = {
  best: "Best",
  card_description: "Track today's progress of a daily challenge.",
  card_name: "Daily Challenge",
  catch_up: "Today: {target} + {deficit} deficit",
  challenge: "Challenge",
  current_streak: "Current streak",
  edit_value: "Enter today's value",
  entity_not_found: "Entity not found: {entity}",
  left_to_goal: "{remaining} left to goal",
  left_to_goal_in_days: "{remaining} left in {days} days · Ø {per_day}/day",
  left_to_goal_last_day: "{remaining} left on the last day",
  missing_entity: "Please define an entity of a Daily Challenge.",
  no_challenges: "No Daily Challenge set up yet.",
  not_a_challenge: "{entity} does not belong to a Daily Challenge.",
  target_vs_actual: "Actual {total} / Target {target}",
} as const;
