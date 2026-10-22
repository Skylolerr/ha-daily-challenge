# CLAUDE.md – Daily Challenge

Home Assistant custom integration that tracks quantity-based daily challenges
(e.g. "20 push-ups per day"), shipped with its own Lovelace card.

**`SPEC.md` is the binding specification.** Decisions in SPEC.md are fixed. If something
is unclear or cannot be implemented with the current Home Assistant release, ask the
maintainer instead of deviating.

## Project facts

- Domain: `daily_challenge` – integration code lives in `custom_components/daily_challenge/`
- Repo: `skylolerlp/ha-daily-challenge`, license MIT (Copyright skylolerlp)
- Minimum Home Assistant version: **2026.11.0** (`hacs.json`), Python as required by that HA release
- `integration_type: service`, one config entry and one device per challenge
- Source of truth: one `helpers.storage.Store` per challenge (`.storage/daily_challenge.<entry_id>`)
- All business logic lives in `calculations.py` as pure functions (no HA imports needed to test it)

## Rules

- **Language:** code, comments, docstrings, README, CHANGELOG and commit messages in **English**.
- **Translations:** EN is the base (`strings.json` + `translations/en.json`), plus DE, FR, IT.
  Every new user-facing string (config/options flow, entity names, exceptions, actions)
  must be added to all existing translation files in the same change.
- **Tests are mandatory.** Every feature or bug fix comes with tests
  (`pytest-homeassistant-custom-component`, `freezegun`). Target ≥ 90 % coverage of the
  Python modules. Test calculation changes first.
- **Store changes only with a migration.** Any change to the store format bumps
  `STORAGE_VERSION`/minor version and adds a migration. User data must never be lost.
- **Card bundle is committed.** `custom_components/daily_challenge/frontend/daily-challenge-card.js`
  is built from `card/` and committed, because HACS runs no build step. CI checks that the
  bundle matches the source – always rebuild before committing card changes.
- **Versioning:** SemVer. `manifest.json` `version` is the single source of the version;
  git tags / GitHub releases use the form `vX.Y.Z` and must match it. Before 1.0, minor
  releases may contain breaking changes, which must be clearly marked in CHANGELOG.md.
  Releases are real GitHub releases with a changelog, not just tags.
- **Quality:** `ConfigEntry.runtime_data` with a typed entry alias, never `hass.data`.
  Fully async, no blocking I/O in the event loop. `has_entity_name = True` and
  `translation_key` on every entity; unique IDs are `<entry_id>_<key>`.
  Validation errors in actions use `ServiceValidationError` with `translation_key`.
- Never "reset" counters at midnight – the day rollover only recalculates with a new date key.
- Keep commits small and focused; conventional, imperative commit subjects.

## Commands

```bash
# Setup (Python version must match the HA release)
python -m venv .venv && .venv/bin/pip install -r requirements_test.txt

# Tests with coverage
pytest

# Lint / format / types
ruff check . && ruff format --check .
mypy custom_components/daily_challenge

# Deploy to your own HA instance (values from .env, see .env.example)
scripts/deploy.sh
```

## Phases

See SPEC.md §16. Phase 1 = integration core. Phase 2 (card) only starts after the
maintainer has tested and approved Phase 1 on their own HA instance.
