# Daily Challenge

Home Assistant integration for quantity-based daily challenges, e.g. "20 push-ups per day".

Not a sensor-triggered counter – a goal-based daily challenge tracker.

> **Work in progress.** The first public beta (v0.1.0) is not released yet.
> Breaking changes are possible before 1.0.

## Features

- A daily target per challenge (one config entry and one device per challenge)
- Target vs. actual over the whole runtime: ahead/behind, remaining until the end goal
- Optional catch-up mode: a deficit raises today's target
- Streaks (target reached or any amount), best streak, best day, weekly/monthly/yearly sums
- Past days can be corrected at any time via actions
- Plain entities that work with Tile, Entities, Mushroom or ApexCharts cards

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
```

Deploy to your own Home Assistant instance with `scripts/deploy.sh` (see `.env.example`).
