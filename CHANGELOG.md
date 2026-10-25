# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/). Before 1.0, minor releases may contain
breaking changes; they are marked as **Breaking**.

Each version starts with its highlight and ends with the Home Assistant release it was
tested with. The section of a version is also the text of its GitHub release, which HACS
and Home Assistant show when they offer the update.

## [Unreleased]

## [0.1.1] - 2026-10-25

> **Highlight:** undo for every tap, and a summary once a challenge has ended.

![Tapping +5 reaches today's goal; Undo in the message takes it back](https://raw.githubusercontent.com/Skylolerr/ha-daily-challenge/main/docs/images/buttons.gif)

### ✨ Added

- **Undo** in the card: every button press and typed value is followed by a message with
  an *Undo* button (8 seconds).
- **Finished challenges** show the total against the end goal in the card, e.g.
  *Challenge finished · 90 %* or *goal reached ✓*, instead of an empty day.
- In catch-up mode the card says **Deficit made up ✓** once today's goal including
  yesterday's deficit is reached.

### 🔄 Changed

- Today's value and the buttons are unavailable before the start and after the end date
  instead of rejecting input with an error. Past days stay editable through the actions.

### 🐛 Fixed

- Setting today's value to a fraction (e.g. 12.5) is rejected instead of cut off, and
  actions no longer accept `true`/`false` as a number.

*Tested with Home Assistant 2026.10.2 · minimum 2026.10.0*

## [0.1.0] - 2026-10-25

> **Highlight:** the first public beta – daily goals with streaks, catch-up mode and its
> own card.

![Three Daily Challenge cards: push-ups with an end date, reading in catch-up mode and water with today's goal reached](https://raw.githubusercontent.com/Skylolerr/ha-daily-challenge/main/docs/images/hero-light.png)

### ✨ Added

- **One device per challenge**, set up and changed in the UI: name, icon, unit, daily
  target, start and optional end date, up to three steps, streak rule (daily target
  reached or any amount) and deficit handling (show only or catch up). A new daily target
  applies from the day of the change; past days keep theirs.
- **Entities:** today's value, add and subtract buttons, today's target, progress, total,
  current and best streak, target to date, ahead/behind, remaining until the end goal,
  days left and required average per day (with an end date), daily average, best day,
  weekly, monthly and yearly sums and "goal reached today".
- **Catch-up mode:** yesterday's deficit raises today's target, and a missed day can be
  made up on the following day without breaking the streak – only the previous day, no
  working ahead.
- **Card** `custom:daily-challenge-card`, installed and registered automatically: progress
  ring, quick buttons, direct input by long press, streaks, target vs. actual, what is
  left with days left and required average, catch-up deficit, and a visual editor with a
  switch for each part.
- **Actions** `daily_challenge.add`, `daily_challenge.set` and
  `daily_challenge.get_history`, with translated validation errors.
- **Reminder blueprint:** a notification at a chosen time while today's goal is still
  open.
- Day rollover at local midnight without resetting anything, robust against restarts and
  daylight saving time; diagnostics; WebSocket commands for the card.
- English, German, French and Italian (French and Italian open for community review).

*Tested with Home Assistant 2026.10.2 · minimum 2026.10.0*

[Unreleased]: https://github.com/Skylolerr/ha-daily-challenge/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/Skylolerr/ha-daily-challenge/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Skylolerr/ha-daily-challenge/releases/tag/v0.1.0
