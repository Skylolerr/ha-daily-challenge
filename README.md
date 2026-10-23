# Daily Challenge

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://hacs.xyz/docs/faq/custom_repositories)
[![GitHub Release](https://img.shields.io/github/v/release/Skylolerr/ha-daily-challenge?include_prereleases)](https://github.com/Skylolerr/ha-daily-challenge/releases)
[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-2026.10%2B-41BDF5.svg)](https://www.home-assistant.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Track quantity-based daily challenges in Home Assistant – "20 push-ups per day",
"30 minutes of reading", "8 glasses of water" – with streaks, target vs. actual over
the whole challenge and its own dashboard card.

**Not a sensor-triggered counter – a goal-based daily challenge tracker.**

> [!WARNING]
> **Beta** – breaking changes are possible before 1.0. They are always listed in the
> [changelog](CHANGELOG.md), and your recorded data is migrated, never dropped.

<p>
  <img src="https://raw.githubusercontent.com/Skylolerr/ha-daily-challenge/main/docs/images/card-dark.png" alt="Daily Challenge card in dark mode" width="320">
  <img src="https://raw.githubusercontent.com/Skylolerr/ha-daily-challenge/main/docs/images/card-light.png" alt="Daily Challenge card in light mode with the goal reached" width="320">
</p>

## Features

- **A daily amount, not a yes/no habit.** Each challenge has its own daily target and unit.
- **Target vs. actual over the whole runtime.** See at a glance whether you are ahead or
  behind, and – with an end date – how much is left until the end goal.
- **Optional catch-up mode.** Yesterday's deficit raises today's target, so a missed day
  can be made up on the following day without breaking the streak.
- **Streaks** with a choice of rule (daily target reached, or any amount), plus best streak,
  best day, daily average and weekly, monthly and yearly sums.
- **Correct any past day** via actions (and, from v0.2.0, directly in the card).
- **Its own card** with a progress ring, quick buttons, streak and target vs. actual – and
  a visual editor. It is installed and registered automatically.
- **Plain entities** that work just as well with Tile, Entities, Mushroom or ApexCharts.
- Available in English, German, French and Italian.

## Requirements

- Home Assistant **2026.10** or newer
- [HACS](https://hacs.xyz) for the recommended installation

## Installation

### HACS (recommended)

[![Open your Home Assistant instance and open this repository in HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Skylolerr&repository=ha-daily-challenge&category=integration)

Or manually in HACS:

1. Open HACS, then **⋮ → Custom repositories**.
2. Add `https://github.com/Skylolerr/ha-daily-challenge` with the type **Integration**.
3. Search for **Daily Challenge**, open it and select **Download**.
4. Restart Home Assistant.

### Manual

1. Download `daily_challenge.zip` from the [latest release](https://github.com/Skylolerr/ha-daily-challenge/releases).
2. Extract it to `config/custom_components/daily_challenge/`.
3. Restart Home Assistant.

## Setup

[![Open your Home Assistant instance and start setting up Daily Challenge.](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start/?domain=daily_challenge)

Or go to **Settings → Devices & services → Add integration → Daily Challenge**.
Each challenge is its own entry; add the integration again for another challenge.

<img src="https://raw.githubusercontent.com/Skylolerr/ha-daily-challenge/main/docs/images/setup-form.png" alt="Setup form of a new challenge" width="360">

| Option | Default | Description |
|---|---|---|
| Name | – | Unique name of the challenge, also the device name. |
| Icon | `mdi:trophy` | Shown in the card and on the "Today" entity. |
| Unit | repetitions | Pick a suggestion (repetitions, minutes, km, pages, glasses) or type your own. |
| Daily target | 20 | Whole number above 0. |
| Start date | today | Cannot be in the future. |
| End date | – | Optional. Enables what is left until the end goal, days left and the required average per day. |
| Steps | 1, 5, 10 | Up to 3 amounts in ascending order. Each gets a **+** button; the smallest one is also used for **−**. |
| Streak rule | Daily target reached | When a day counts towards the streak: *daily target reached* or *any amount above 0*. |
| Deficit handling | Only show the deficit | *Only show the deficit*, or *Catch up*: yesterday's deficit raises today's target. |

All options can be changed later via **Configure**:

- A new **daily target** applies from today on. Past days keep the target they had.
- Changed **steps** replace the buttons; buttons of removed steps are deleted.
- A **start date** moved to later ignores the days before it, but does not delete them.

## How it works

- **Target to date** is the sum of the daily targets from the start date up to and
  including today. **Ahead / behind** is the total minus that target – so it is negative
  in the morning until today's amount is done.
- **Today's target** is the daily target. In **catch-up mode** it also includes what was
  missing yesterday – only yesterday; older deficits are not carried along and a lead
  never lowers it.
- **Streaks:** a day counts if it meets the streak rule. Today never breaks the streak
  while it is still running; it counts as soon as it is fulfilled. Without catch-up a
  missed day ends the streak. In catch-up mode with the "daily target" rule, a missed day
  still counts if the **following day** makes up both targets together – so yesterday can
  be rescued today, but nothing older. Working ahead does not count for later days.
- **Midnight:** nothing is reset. A new day simply reads a new date, so restarts, daylight
  saving time and Home Assistant being off over midnight are no problem.
- **Required per day** spreads what is still missing for the end goal over the days left,
  today included. It goes down as soon as you log today's amount.
- After the **end date** no values are accepted for new days; past days stay editable.

## Entities

One device per challenge with these entities (example IDs for a challenge named
"Push-ups"). Home Assistant creates the entity IDs in its system language, so with German
they look like `number.push_ups_heute` or `sensor.push_ups_notig_pro_tag`.

| Entity | Example ID | Description |
|---|---|---|
| Today | `number.push_ups_today` | Today's value, directly settable. |
| +n / −n | `button.push_ups_add_5`, `button.push_ups_subtract` | Add a step or subtract the smallest step (never below 0). |
| Today's target | `sensor.push_ups_today_s_target` | Effective target of today. Attributes `daily_target` and `deficit`. |
| Progress | `sensor.push_ups_progress` | Today's progress in % (up to 999 %). |
| Total | `sensor.push_ups_total` | Sum since the start. |
| Current streak | `sensor.push_ups_current_streak` | In days. |
| Best streak | `sensor.push_ups_best_streak` | In days, attributes `start` and `end`. |
| Ahead / behind | `sensor.push_ups_ahead_behind` | Total minus target to date. |
| Remaining | `sensor.push_ups_remaining` | Left until the end goal (only with an end date). |
| Days left | `sensor.push_ups_days_left` | Days until the end date, today included (only with an end date). |
| Required per day | `sensor.push_ups_required_per_day` | Average still needed per day to reach the end goal (only with an end date). |
| Best day | `sensor.push_ups_best_day` | Highest daily value, attribute `date`. |
| Goal reached today | `binary_sensor.push_ups_goal_reached_today` | On once today's target is reached. |
| Target to date, Daily average, This week, This month, This year | `sensor.push_ups_target_to_date`, … | Diagnostic sensors. Weeks start on Monday. |

The quantity sensors use the unit of the challenge.

## Card

The card is installed and registered as a dashboard resource automatically. Add it via
**Edit dashboard → Add card → Daily Challenge**, or in YAML:

```yaml
type: custom:daily-challenge-card
entity: number.push_ups_today
```

`entity` can be any entity of the challenge; the card finds the others. The visual editor
lets you pick the challenge from a list and switch parts of the card on or off:

| Option | Default | Shows |
|---|---|---|
| `show_streak` | `true` | Current and best streak in the header |
| `show_target_vs_actual` | `true` | Actual vs. target with ahead/behind |
| `show_remaining` | `true` | What is left until the end goal and in how many days |
| `show_required_average` | `true` | The average still needed per day |
| `show_catch_up` | `true` | The deficit in today's target in catch-up mode |
| `show_buttons` | `true` | The − and + buttons |

Today's value and the progress ring are always shown.

<img src="https://raw.githubusercontent.com/Skylolerr/ha-daily-challenge/main/docs/images/card-catch-up.png" alt="Card in catch-up mode with yesterday's deficit added to today's target" width="320">

- Header with icon, name, current and best streak
- Today's value with a progress ring against today's target – full in the success colour
  once the goal is reached
- **−** and **+n** buttons; **long press** (or Enter) on the value to type a value directly
- Target vs. actual with ahead/behind; with an end date also what is left, in how many
  days and the average still needed per day; the deficit marked in catch-up mode
- Follows your theme (light and dark), language and number format

## Actions

All actions take the challenge as `config_entry_id` (pick it in the UI).
Dates must lie between the start date (and end date) of the challenge and today.

### `daily_challenge.add`

Adds an amount to a day; negative amounts subtract. The result never drops below 0.

```yaml
action: daily_challenge.add
data:
  config_entry_id: 01J0EXAMPLE
  amount: 10
  date: "2026-11-03" # optional, defaults to today
```

### `daily_challenge.set`

Sets the value of a day; `0` removes the entry.

```yaml
action: daily_challenge.set
data:
  config_entry_id: 01J0EXAMPLE
  value: 25
  date: "2026-11-03" # optional, defaults to today
```

### `daily_challenge.get_history`

Returns values, targets and streak fulfilment for a date range (default: the whole
challenge up to today).

```yaml
action: daily_challenge.get_history
data:
  config_entry_id: 01J0EXAMPLE
  start: "2026-11-01" # optional
  end: "2026-11-30" # optional
response_variable: history
```

```yaml
days:
  "2026-11-01": 20
  "2026-11-03": 25
targets:
  "2026-11-01": 20
  "2026-11-02": 20
  "2026-11-03": 20
fulfilled:
  "2026-11-01": true
  "2026-11-02": false
  "2026-11-03": true
```

## Example: evening reminder

```yaml
automation:
  - alias: "Push-ups reminder"
    triggers:
      - trigger: time
        at: "20:00:00"
    conditions:
      - condition: state
        entity_id: binary_sensor.push_ups_goal_reached_today
        state: "off"
    actions:
      - action: notify.notify
        data:
          message: >
            Still {{ states('sensor.push_ups_today_s_target') | int
            - states('number.push_ups_today') | int }} push-ups to go today!
```

## Known limitations

- There are no rest or skip days – "daily" means every day.
- A day always ends at local midnight.
- Past days can be corrected with the actions; editing them in the card comes with
  v0.2.0.
- Only "at least" challenges: an upper limit such as "at most one coffee" is not
  supported yet.
- Long-term statistics are not filled in retroactively when a past day is corrected.

## Troubleshooting

- **The card is missing in the card picker or looks outdated:** reload the page. In the
  Companion app use *Settings → Companion app → Troubleshooting → Reset frontend cache*.
  *Settings → Dashboards → ⋮ → Resources* should list exactly one
  `/daily_challenge/daily-challenge-card.js?v=…`.
- **A figure looks wrong:** download the diagnostics (*Settings → Devices & services →
  Daily Challenge → ⋮ → Download diagnostics*) and attach them to an
  [issue](https://github.com/Skylolerr/ha-daily-challenge/issues).
- **Debug logging:**

  ```yaml
  logger:
    logs:
      custom_components.daily_challenge: debug
  ```

## Removal

1. **Settings → Devices & services → Daily Challenge**, then delete each challenge
   (**⋮ → Delete**). This also deletes its recorded data. The card resource is removed
   together with the last challenge.
2. Remove the integration in HACS (**⋮ → Remove**), or delete
   `config/custom_components/daily_challenge/` for a manual installation.
3. Restart Home Assistant.

## Translations

The integration and the card are available in English, German, French and Italian.
The French and Italian translations are new – **community review welcome!** Please
open an issue or pull request if something reads oddly.

## Development

```bash
python -m venv .venv
.venv/bin/pip install -r requirements_test.txt
pytest
ruff check . && ruff format --check .
mypy custom_components/daily_challenge

cd card && npm ci && npm run typecheck && npm test && npm run build
```

The card bundle in `custom_components/daily_challenge/frontend/` is built from `card/` and
committed. Deploy to your own Home Assistant instance with `scripts/deploy.sh`
(see `.env.example`).

## License

[MIT](LICENSE) © skylolerlp
