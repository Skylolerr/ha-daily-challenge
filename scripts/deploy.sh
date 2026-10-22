#!/usr/bin/env bash
# Deploy Daily Challenge to your own Home Assistant instance for testing.
#
# Usage: scripts/deploy.sh [--no-restart]
#
# Reads HA_HOST, HA_USER, HA_CONFIG_PATH (and optionally HA_SSH_PORT, HA_URL,
# HA_TOKEN) from .env in the repository root. Requires an SSH add-on on Home
# Assistant ("Advanced SSH & Web Terminal" or "Terminal & SSH").
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT}/.env"
RESTART=1

for arg in "$@"; do
  case "$arg" in
    --no-restart) RESTART=0 ;;
    -h | --help)
      sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 2
      ;;
  esac
done

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing ${ENV_FILE}. Copy .env.example to .env and adjust it." >&2
  exit 1
fi
# Strip Windows line endings so values do not end in \r.
set -a
# shellcheck disable=SC1090
source <(sed 's/\r$//' "$ENV_FILE")
set +a

: "${HA_HOST:?HA_HOST is not set in .env}"
: "${HA_USER:?HA_USER is not set in .env}"
: "${HA_CONFIG_PATH:?HA_CONFIG_PATH is not set in .env}"
HA_SSH_PORT="${HA_SSH_PORT:-22}"
HA_URL="${HA_URL:-http://${HA_HOST}:8123}"

SRC="${ROOT}/custom_components/daily_challenge/"
DEST="${HA_CONFIG_PATH%/}/custom_components/daily_challenge/"
TARGET="${HA_USER}@${HA_HOST}"
SSH=(ssh -p "$HA_SSH_PORT")

# Build the card bundle if the card sources exist.
if [[ -f "${ROOT}/card/package.json" ]]; then
  echo "==> Building card"
  (cd "${ROOT}/card" && npm ci && npm run build)
fi

echo "==> Copying integration to ${TARGET}:${DEST}"
"${SSH[@]}" "$TARGET" "mkdir -p '${DEST}'"
if command -v rsync >/dev/null && "${SSH[@]}" "$TARGET" "command -v rsync" >/dev/null; then
  rsync -rlptv --delete --exclude '__pycache__/' \
    -e "ssh -p ${HA_SSH_PORT}" "$SRC" "${TARGET}:${DEST}"
else
  # rsync is missing locally (e.g. Git Bash on Windows) or on the add-on.
  echo "    rsync not available on both sides, falling back to tar over ssh"
  tar -C "$SRC" --exclude='__pycache__' -cf - . |
    "${SSH[@]}" "$TARGET" "rm -rf '${DEST}' && mkdir -p '${DEST}' && tar -C '${DEST}' -xf -"
fi

if [[ "$RESTART" -eq 0 ]]; then
  echo "==> Done (restart skipped)"
  exit 0
fi
if [[ -z "${HA_TOKEN:-}" ]]; then
  echo "==> Done. Set HA_TOKEN in .env to restart automatically; restart Home Assistant now."
  exit 0
fi

api() {
  curl -fsS -X POST \
    -H "Authorization: Bearer ${HA_TOKEN}" \
    -H "Content-Type: application/json" \
    "${HA_URL%/}/api/$1"
}

echo "==> Checking configuration"
check="$(api config/core/check_config)"
if [[ ! "$check" =~ \"result\"[[:space:]]*:[[:space:]]*\"valid\" ]]; then
  echo "Configuration check failed, not restarting:" >&2
  echo "$check" >&2
  exit 1
fi

echo "==> Restarting Home Assistant"
api services/homeassistant/restart >/dev/null || true
echo "==> Done"
