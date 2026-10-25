#!/usr/bin/env bash
# Create the GitHub release for the version in manifest.json.
#
# Usage: scripts/release.sh [--dry-run]
#        scripts/release.sh --notes X.Y.Z   (only print the notes of a version)
#
# Checks before anything is published: clean main in sync with origin, the same
# version in manifest.json and card/package.json, a CHANGELOG section
# "## [X.Y.Z]", no tag vX.Y.Z yet, and green Validate and Tests runs for the
# current commit. Then creates a normal (not pre-) release vX.Y.Z with the
# CHANGELOG section as notes; release.yml attaches daily_challenge.zip.
# --dry-run only runs the checks and prints the notes.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
GH="${GH:-gh}"
PYTHON="${PYTHON:-python}"
REPO="https://github.com/Skylolerr/ha-daily-challenge"
DRY_RUN=false
NOTES_ONLY=""
case "${1:-}" in
  --dry-run) DRY_RUN=true ;;
  --notes) NOTES_ONLY="${2:?usage: scripts/release.sh --notes X.Y.Z}" ;;
  "") ;;
  *) echo "usage: scripts/release.sh [--dry-run | --notes X.Y.Z]" >&2; exit 2 ;;
esac

fail() {
  echo "error: $*" >&2
  exit 1
}

version_of() {
  "$PYTHON" -c "import json, sys; print(json.load(open(sys.argv[1], encoding='utf-8'))['version'])" "$1"
}

# Write the release notes of VERSION (tag TAG at COMMIT) to NOTES.
build_notes() {
  awk "/^## \[${VERSION}\]/{found=1; next} /^## \[/{found=0} found && !/^\[/" CHANGELOG.md >"$NOTES"
  [ -s "$NOTES" ] || fail "the CHANGELOG section for ${VERSION} is empty"
  # GitHub keeps every line break in release notes, so the wrapped lines of a
  # paragraph, list item or quote are joined into one.
  "$PYTHON" - "$NOTES" <<'PY'
import re
import sys

path = sys.argv[1]
lines = open(path, encoding="utf-8").read().splitlines()
out: list[str] = []
for line in lines:
    prev = out[-1] if out else ""
    starts_block = re.match(r"(#|[-*] |\d+\. |!\[|---|\*[A-Z])", line)
    if prev and line.startswith("> ") and prev.startswith("> "):
        out[-1] = f"{prev} {line[2:].strip()}"
    elif prev and line.startswith("  ") and line.strip():
        out[-1] = f"{prev} {line.strip()}"
    elif prev.strip() and line.strip() and not starts_block and not re.match(r"(#|!\[|>)", prev):
        out[-1] = f"{prev} {line.strip()}"
    else:
        out.append(line)
open(path, "w", encoding="utf-8", newline="\n").write("\n".join(out).strip("\n") + "\n")
PY
  # Links under the notes, which HACS and Home Assistant show with the update.
  PREVIOUS="$(git describe --tags --abbrev=0 "${COMMIT}^" 2>/dev/null || true)"
  {
    echo
    echo "---"
    echo
    printf '[Documentation](%s#readme) · [Report a problem](%s/issues)' "$REPO" "$REPO"
    [ -n "$PREVIOUS" ] && printf ' · [All changes since %s](%s/compare/%s...%s)' "$PREVIOUS" "$REPO" "$PREVIOUS" "$TAG"
    echo
  } >>"$NOTES"
}

NOTES="$(mktemp)"
trap 'rm -f "$NOTES"' EXIT

if [ -n "$NOTES_ONLY" ]; then
  VERSION="$NOTES_ONLY"
  TAG="v${VERSION}"
  COMMIT="$(git rev-list -n 1 "$TAG" 2>/dev/null || git rev-parse HEAD)"
  build_notes
  cat "$NOTES"
  exit 0
fi

VERSION="$(version_of custom_components/daily_challenge/manifest.json)"
TAG="v${VERSION}"
[ "$(version_of card/package.json)" = "$VERSION" ] || fail "card/package.json does not have version ${VERSION}"

[ "$(git rev-parse --abbrev-ref HEAD)" = "main" ] || fail "not on main"
[ -z "$(git status --porcelain)" ] || fail "working tree is not clean"
git fetch --quiet --tags origin main
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] || fail "main is not in sync with origin/main"
grep -q "^## \[${VERSION}\]" CHANGELOG.md || fail "CHANGELOG.md has no section '## [${VERSION}]'"
if git ls-remote --exit-code --tags origin "refs/tags/${TAG}" >/dev/null; then
  fail "tag ${TAG} exists already"
fi

COMMIT="$(git rev-parse HEAD)"
for workflow in validate.yml tests.yml; do
  conclusion="$("$GH" run list --workflow "$workflow" --commit "$COMMIT" --json conclusion -q '.[0].conclusion')"
  [ "$conclusion" = "success" ] || fail "${workflow} is '${conclusion:-not run}' for ${COMMIT}"
done

build_notes
if $DRY_RUN; then
  echo "All checks passed for ${TAG}. Release notes:"
  cat "$NOTES"
  exit 0
fi
"$GH" release create "$TAG" --target "$COMMIT" --title "$TAG" --notes-file "$NOTES"
echo "Created ${TAG}; release.yml attaches daily_challenge.zip."
