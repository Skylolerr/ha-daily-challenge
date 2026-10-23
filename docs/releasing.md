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
3. In `CHANGELOG.md`, replace `unreleased` with the date (`YYYY-MM-DD`) and add the
   compare link at the bottom. Mark breaking changes under **Breaking changes**.
4. Commit (`Release vX.Y.Z`) and push.
5. Create the release with the changelog section as notes (add `--prerelease` before 1.0):

   ```bash
   VERSION=0.1.0
   awk "/^## \[${VERSION}\]/{found=1; next} /^## \[/{found=0} found && !/^\[/" CHANGELOG.md > notes.md
   gh release create "v${VERSION}" --title "v${VERSION}" --notes-file notes.md --prerelease
   rm notes.md
   ```

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

5. Create the release (steps 5–6 above) as a **pre-release**.
6. Install through HACS as a custom repository on your own instance. HACS replaces the
   copy made by `scripts/deploy.sh` in `custom_components/daily_challenge/`; your
   challenges and their data stay. Restart and check that the card and all challenges
   still work.
