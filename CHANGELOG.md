# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/). Before 1.0, minor releases may contain
breaking changes; they are always listed under **Breaking changes**.

## [0.1.0] – unreleased

First public beta.

### Added

- Integration with one config entry and one device per challenge, set up and changed in
  the UI: name, icon, unit, daily target, start and optional end date, up to three steps,
  streak rule (daily target reached or any amount) and deficit handling (show only or
  catch up).
- Daily target changes apply from the day of the change; past days keep their target.
- Entities: today's value (number), add/subtract buttons, today's target, progress, total,
  current and best streak, target to date, ahead/behind, remaining until the end goal,
  daily average, best day, weekly/monthly/yearly sums and "goal reached today".
- Catch-up mode: a deficit raises today's target, and a missed day can be repaired on the
  following day without breaking the streak.
- Actions `daily_challenge.add`, `daily_challenge.set` and `daily_challenge.get_history`
  with translated validation errors.
- Day rollover at local midnight without resetting anything, robust against restarts and
  daylight saving time.
- Lovelace card `custom:daily-challenge-card`, installed and registered automatically:
  progress ring, quick buttons, direct input by long press, streaks, target vs. actual,
  remaining amount and catch-up deficit, visual editor and card picker entry.
- WebSocket commands `daily_challenge/list`, `daily_challenge/history` and
  `daily_challenge/set_day` for the card.
- Diagnostics.
- Translations: English, German, French and Italian (French and Italian open for
  community review).

[0.1.0]: https://github.com/Skylolerr/ha-daily-challenge/releases/tag/v0.1.0
