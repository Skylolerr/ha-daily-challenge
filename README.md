<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Skylolerr/ha-daily-challenge/main/docs/images/banner-dark.png">
    <img alt="Daily Challenge – daily goals for Home Assistant, with streaks and its own card" src="https://raw.githubusercontent.com/Skylolerr/ha-daily-challenge/main/docs/images/banner-light.png" width="900">
  </picture>
</p>

<p align="center">
  <a href="https://hacs.xyz/docs/faq/custom_repositories"><img alt="HACS custom repository" src="https://img.shields.io/badge/HACS-custom-41BDF5?logo=homeassistantcommunitystore&logoColor=white"></a>
  <a href="https://github.com/Skylolerr/ha-daily-challenge/releases/latest"><img alt="Latest release" src="https://img.shields.io/github/v/release/Skylolerr/ha-daily-challenge?sort=semver&color=0c63b8"></a>
  <img alt="Home Assistant 2026.10 or newer" src="https://img.shields.io/badge/Home%20Assistant-2026.10%2B-18BCF2?logo=homeassistant&logoColor=white">
  <a href="https://github.com/Skylolerr/ha-daily-challenge/actions/workflows/validate.yml"><img alt="Validate" src="https://github.com/Skylolerr/ha-daily-challenge/actions/workflows/validate.yml/badge.svg"></a>
  <a href="https://github.com/Skylolerr/ha-daily-challenge/actions/workflows/tests.yml"><img alt="Tests" src="https://github.com/Skylolerr/ha-daily-challenge/actions/workflows/tests.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="MIT license" src="https://img.shields.io/github/license/Skylolerr/ha-daily-challenge?color=555"></a>
</p>

<p align="center">
  <a href="https://my.home-assistant.io/redirect/hacs_repository/?owner=Skylolerr&repository=ha-daily-challenge&category=integration"><img alt="Open this repository in HACS" src="https://my.home-assistant.io/badges/hacs_repository.svg"></a>
  <a href="https://my.home-assistant.io/redirect/config_flow_start/?domain=daily_challenge"><img alt="Set up Daily Challenge" src="https://my.home-assistant.io/badges/config_flow_start.svg"></a>
</p>

**Not a sensor-triggered counter – a goal-based daily challenge tracker.** Daily Challenge
tracks amounts you want to reach every day – "20 push-ups", "30 minutes of reading",
"8 glasses of water" – with streaks, target vs. actual over the whole challenge, an
optional catch-up mode and its own dashboard card.

> [!NOTE]
> **Beta.** Breaking changes are possible before 1.0. They are always listed in the
> [changelog](CHANGELOG.md), and your recorded data is migrated, never dropped.

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Skylolerr/ha-daily-challenge/main/docs/images/hero-dark.png">
    <img alt="Three Daily Challenge cards: push-ups with an end date, reading in catch-up mode and water with today's goal reached" src="https://raw.githubusercontent.com/Skylolerr/ha-daily-challenge/main/docs/images/hero-light.png">
  </picture>
</p>

## See it in action

<table>
  <tr>
    <td width="33%"><img alt="Tapping +5 fills the ring and reaches today's goal; Undo in the message takes it back" src="https://raw.githubusercontent.com/Skylolerr/ha-daily-challenge/main/docs/images/buttons.gif"></td>
    <td width="33%"><img alt="A long press on the value opens an input; 32 and Enter set today's value" src="https://raw.githubusercontent.com/Skylolerr/ha-daily-challenge/main/docs/images/input.gif"></td>
    <td width="33%"><img alt="In catch-up mode +10 and +5 make up yesterday's deficit; the card says Deficit made up" src="https://raw.githubusercontent.com/Skylolerr/ha-daily-challenge/main/docs/images/catch-up.gif"></td>
  </tr>
  <tr>
    <td><b>One tap, with undo.</b> Quick buttons for your steps; every change can be taken back from the message that follows.</td>
    <td><b>Type a value.</b> A long press on today's value opens an input – handy after a workout without the phone.</td>
    <td><b>Catch up.</b> Yesterday's deficit raises today's target; make it up and your streak survives.</td>
  </tr>
</table>

## Features

**Track your goal**

- **A daily amount, not a yes/no habit** – each challenge has its own daily target, unit
  and buttons.
- **Target vs. actual over the whole runtime** – ahead or behind at a glance and, with an
  end date, what is left, in how many days and the average still needed per day.
- **Correct any past day** with the actions (and, from v0.2.0, directly in the card).

**Stay motivated**

- **Streaks** with a choice of rule (daily target reached, or any amount), plus best
  streak, best day, daily average and weekly, monthly and yearly sums.
- **Optional catch-up mode** – yesterday's deficit raises today's target, so a missed day
  can be made up on the following day without breaking the streak.
- **Reminder blueprint** – a notification at 20:00 while today's goal is still open.

**Fits into Home Assistant**

- **Its own card** with a progress ring, quick buttons, undo, streak and target vs.
  actual, and a visual editor – installed and registered automatically.
- **Plain entities** that work just as well with Tile, Entities, Mushroom or ApexCharts.
- **English, German, French and Italian**, light and dark theme, your number format.

## Installation

1. **HACS:** click *Open this repository in HACS* above, or add
   `https://github.com/Skylolerr/ha-daily-challenge` under HACS → ⋮ → **Custom
   repositories** with type **Integration**. Download **Daily Challenge** and restart
   Home Assistant.
2. **Set up:** click *Set up Daily Challenge* above, or Settings → Devices & services →
   **Add integration** → **Daily Challenge**. Each challenge is its own entry; add the
   integration again for another challenge.
3. **Add the card:** *Edit dashboard* → *Add card* → **Daily Challenge**.

Requires Home Assistant **2026.10.0** or newer.

<details>
<summary>Manual installation</summary>

Download `daily_challenge.zip` from the
[latest release](https://github.com/Skylolerr/ha-daily-challenge/releases/latest),
extract it to `config/custom_components/daily_challenge/` and restart Home Assistant.
</details>

### Options

Set when you add a challenge; all of them can be changed later via **Configure**.

| Option | Default | Meaning |
|---|---|---|
| Name | – | Unique name of the challenge, also the device name. |
| Icon | `mdi:trophy` | Shown in the card and on the "Today" entity. |
| Unit | repetitions | Pick a suggestion (repetitions, minutes, km, pages, glasses) or type your own. |
| Daily target | 20 | Whole number above 0. A new target applies from today on; past days keep theirs. |
| Start date | today | Cannot be in the future. Moved later, the days before it are ignored but not deleted. |
| End date | – | Optional. Enables what is left until the end goal, days left and the required average per day. |
| Steps | 1, 5, 10 | Up to 3 amounts in ascending order. Each gets a **+** button; the smallest one is also used for **−**. |
| Streak rule | Daily target reached | When a day counts towards the streak: *daily target reached* or *any amount above 0*. |
| Deficit handling | Only show the deficit | *Only show the deficit*, or *Catch up*: yesterday's deficit raises today's target. |

<details>
<summary>The setup form</summary>

<p align="center">
  <img alt="The form for a new daily challenge" src="https://raw.githubusercontent.com/Skylolerr/ha-daily-challenge/main/docs/images/setup-form.png" width="360">
</p>
</details>

## Card

The card comes with the integration and is registered as a dashboard resource
automatically. Add it in the dashboard editor (*Add card* → **Daily Challenge**) or in
YAML:

```yaml
type: custom:daily-challenge-card
entity: number.push_ups_today   # any entity of the challenge
show_streak: true               # current and best streak in the header
show_target_vs_actual: true     # actual vs. target with ahead/behind
show_remaining: true            # what is left until the end goal, in how many days
show_required_average: true     # the average still needed per day
show_catch_up: true             # the deficit in today's target in catch-up mode
show_buttons: true              # the − and + buttons
```

All parts are shown by default; the visual editor has a switch for each. Today's value
and the progress ring are always shown.

| To … | Do this |
|---|---|
| Add a step | Tap **+5** (or another step) |
| Take back the last change | Tap **Undo** in the message that follows (8 seconds) |
| Type today's value | Long press (or Enter) on the value, type, Enter |
| See yesterday's deficit | In catch-up mode the card shows *Today: 20 + 10 deficit*, then *Deficit made up ✓* |
| See how a finished challenge went | After the end date the card shows the total against the end goal |

<p align="center">
  <img alt="A finished challenge: 136 of 155 km, Challenge finished · 87 %" src="https://raw.githubusercontent.com/Skylolerr/ha-daily-challenge/main/docs/images/card-finished.png" width="340">
</p>

The card follows your theme, language and number format.

## Entities

One device per challenge with these entities (example IDs for a challenge named
"Push-ups"). Home Assistant creates the entity IDs in its system language, so with German
they look like `number.push_ups_heute` or `sensor.push_ups_notig_pro_tag`.

| Entity | Example ID | Description |
|---|---|---|
| Today | `number.push_ups_today` | Today's value, directly settable. Unavailable before the start and after the end date. |
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

The quantity sensors use the unit of the challenge; the averages use it per day.

## Actions

All actions take the challenge as `config_entry_id` (pick it in the UI). Dates must lie
between the start date (and end date) of the challenge and today.

```yaml
# Add an amount to a day; negative amounts subtract, the result never drops below 0.
action: daily_challenge.add
data:
  config_entry_id: 01J0EXAMPLE
  amount: 10
  date: "2026-11-03" # optional, defaults to today
```

```yaml
# Set the value of a day; 0 removes the entry.
action: daily_challenge.set
data:
  config_entry_id: 01J0EXAMPLE
  value: 25
  date: "2026-11-03" # optional, defaults to today
```

<details>
<summary><code>daily_challenge.get_history</code> – values, targets and streak days of a range</summary>

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
</details>

## Reminder blueprint

[![Open your Home Assistant instance and import the reminder blueprint.](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FSkylolerr%2Fha-daily-challenge%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Fdaily_challenge%2Freminder.yaml)

The blueprint reminds you at a chosen time (default 20:00) when today's goal of a
challenge is not reached yet. Pick the challenge's "Goal reached today" sensor, the time
and what should happen – by default a notification in Home Assistant. In your own
notification you can use `{{ challenge }}`, `{{ done }}`, `{{ target }}`,
`{{ remaining }}` and `{{ unit }}`, e.g. *"Still {{ remaining }} {{ unit }} to go today"*.

<details>
<summary>The same as a plain YAML automation</summary>

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
</details>

<details>
<summary><b>How it works</b></summary>

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
  be rescued today, but nothing older. While yesterday is still open, today only counts
  once it reaches its target **including** yesterday's deficit. Working ahead does not
  count for later days.
- **Midnight:** nothing is reset. A new day simply reads a new date, so restarts, daylight
  saving time and Home Assistant being off over midnight are no problem.
- **Required per day** spreads what is still missing for the end goal over the days left,
  today included. It goes down as soon as you log today's amount.
- After the **end date** today's value and the buttons are unavailable; past days stay
  editable through the actions.
- Each challenge keeps its days in `.storage/daily_challenge.<entry_id>`; the entities are
  calculated from it.
</details>

<details>
<summary><b>Known limitations</b></summary>

- There are no rest or skip days – "daily" means every day.
- A day always ends at local midnight.
- Past days can be corrected with the actions; editing them in the card comes with
  v0.2.0.
- Only "at least" challenges: an upper limit such as "at most one coffee" is not
  supported yet.
- Long-term statistics are not filled in retroactively when a past day is corrected.
</details>

<details>
<summary><b>Troubleshooting</b></summary>

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
</details>

<details>
<summary><b>Removal</b></summary>

1. **Settings → Devices & services → Daily Challenge**, then delete each challenge
   (**⋮ → Delete**). This also deletes its recorded data. The card resource is removed
   together with the last challenge.
2. Remove the integration in HACS (**⋮ → Remove**), or delete
   `config/custom_components/daily_challenge/` for a manual installation.
3. Restart Home Assistant.
</details>

<details>
<summary><b>Development</b></summary>

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
(see `.env.example`); releases are made with `scripts/release.sh` (see
[docs/releasing.md](docs/releasing.md)).
</details>

## Translations

English and German are maintained by the author; French and Italian are new – community
review is welcome.

Missing your language? Open an
[issue](https://github.com/Skylolerr/ha-daily-challenge/issues) and it will gladly be
added. Translations and corrections from users are very welcome, as an issue or a pull
request. The texts are in two places:

- `custom_components/daily_challenge/translations/<language>.json` (setup, options,
  entities, actions and messages; English base: `en.json`)
- `card/src/translations/<language>.ts` (the card and its editor; English base: `en.ts`)

Copy the English file, translate the texts and keep the keys and `{placeholders}` as they
are. You do not need to build anything; registering the new language is done when it is
merged.

## License

MIT © Skylolerr – see [LICENSE](LICENSE). Changes are listed in the
[changelog](CHANGELOG.md).
