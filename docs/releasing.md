# Releasing

Releases are GitHub releases with the changelog as notes; HACS installs from them.
The tag is `vX.Y.Z` and must match `version` in
`custom_components/daily_challenge/manifest.json` – `release.yml` checks this and
attaches `daily_challenge.zip`.

## Every release

1. Make sure `main` is green (Validate and Tests):

   ```bash
   gh run list --limit 4
   ```

2. Set the version in `custom_components/daily_challenge/manifest.json` and
   `card/package.json`, rebuild the card (`cd card && npm run build`).
3. In `CHANGELOG.md`, move the entries from `[Unreleased]` into a new section
   `## [X.Y.Z] - YYYY-MM-DD` and update the compare links at the bottom. Each section
   starts with `> **Highlight:** …` (one sentence), uses the headings `### ✨ Added`,
   `### 🔄 Changed`, `### 🐛 Fixed` (and **Breaking** where needed) and ends with
   `*Tested with Home Assistant X · minimum Y*` – only name a release you really tested
   with. The section is the text of the GitHub release that HACS and Home Assistant show.
4. Commit (`Release vX.Y.Z`) and push, and wait for green Validate and Tests runs.
5. Create the release:

   ```bash
   scripts/release.sh --dry-run   # checks and prints the notes
   scripts/release.sh
   ```

   The script checks that `main` is clean and pushed, the versions match, the changelog
   section exists, the tag is new and CI is green. It joins wrapped lines (GitHub shows
   every line break in release notes) and adds links to the documentation, issues and
   all changes since the previous release. Releases are normal releases, not
   pre-releases, so HACS shows them without the beta switch; the README says the
   integration is in beta before 1.0. `scripts/release.sh --notes X.Y.Z` prints the
   notes of any version, e.g. to update an existing release with
   `gh release edit vX.Y.Z --notes-file …`.
6. Check that `release.yml` succeeded and the release has `daily_challenge.zip`.
7. Update via HACS on your own instance and restart Home Assistant.

## First public release (v0.1.0) – one time

Before step 5 above:

1. Logo reworked and brand icons regenerated (`python scripts/make_brand_icons.py`).
2. Screenshots added to `docs/images/` and the `TODO screenshot` markers in `README.md`
   replaced.
3. Make the repository public:

   ```bash
   gh repo edit Skylolerr/ha-daily-challenge --visibility public --accept-visibility-change-consequences
   ```

4. The HACS job in `.github/workflows/validate.yml` was skipped while the repository was
   private. Run the workflow once (`gh workflow run Validate`) and make sure the HACS job
   is green.

5. Create the release (steps 5–6 above).
6. Install through HACS as a custom repository on your own instance. HACS replaces the
   copy made by `scripts/deploy.sh` in `custom_components/daily_challenge/`; your
   challenges and their data stay. Restart and check that the card and all challenges
   still work.
7. Submit to the HACS default repositories (only after the maintainer's go-ahead):
   - Requirements: public repo, HACS action and hassfest green without ignores, a full
     release, `brand/icon.png`, description, topics, issues enabled, OSI license.
   - The PR must come from the owner's personal account (`Skylolerr`) and stay editable.
   - Fork `hacs/default`, add `Skylolerr/ha-daily-challenge` alphabetically to the
     `integration` file on a new branch from `master`, and fill in the PR template
     completely.
   - Review takes months; until then users install via "Custom repositories".
