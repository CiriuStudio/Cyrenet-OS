#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
# SPDX-License-Identifier: GPL-2.0-only
#
# Deterministically check out locked ImmortalWrt upstream and generate feeds.conf.

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: fetch-upstream.sh [--dest <dir>] [--lock-file <file>] [--repo-root <dir>] [--dry-run]
EOF
}

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEST=""
LOCK_FILE=""
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dest)
      [[ $# -ge 2 ]] || { echo "Error: --dest requires an argument" >&2; exit 2; }
      DEST="$2"
      shift 2
      ;;
    --lock-file)
      [[ $# -ge 2 ]] || { echo "Error: --lock-file requires an argument" >&2; exit 2; }
      LOCK_FILE="$2"
      shift 2
      ;;
    --repo-root)
      [[ $# -ge 2 ]] || { echo "Error: --repo-root requires an argument" >&2; exit 2; }
      REPO_ROOT="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Error: unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

REPO_ROOT="$(cd "$REPO_ROOT" && pwd)"
DEST="${DEST:-$REPO_ROOT/upstream}"
LOCK_FILE="${LOCK_FILE:-$REPO_ROOT/manifests/upstream.lock.yaml}"

if [[ ! -f "$LOCK_FILE" ]]; then
  echo "Error: lock file not found: $LOCK_FILE" >&2
  exit 1
fi

PARSED_INFO="$(python3 - "$LOCK_FILE" "$REPO_ROOT" <<'PY'
import pathlib
import re
import sys
import yaml

lock_path = pathlib.Path(sys.argv[1])
repo_root = pathlib.Path(sys.argv[2]).resolve()
sha_re = re.compile(r"^[0-9a-f]{40}$")

data = yaml.safe_load(lock_path.read_text(encoding="utf-8"))
upstream = data["upstream"]
u_url = upstream["repo_url"]
u_commit = upstream["commit"]
if not sha_re.match(u_commit):
    raise SystemExit(f"Invalid or unlocked upstream commit: {u_commit!r}")

print(f"UPSTREAM\t{u_url}\t{u_commit}")

for feed in data["feeds"]:
    f_name = feed["name"]
    f_url = feed["repo_url"]
    f_commit = feed["commit"]
    if not sha_re.match(f_commit):
        raise SystemExit(f"Invalid or unlocked commit for feed {f_name!r}: {f_commit!r}")
    print(f"FEED\tsrc-git {f_name} {f_url}^{f_commit}")

print(f"FEED\tsrc-link cyrenet_packages {repo_root / 'packages'}")
print(f"FEED\tsrc-link cyrenet_themes {repo_root / 'themes'}")
PY
)"

UPSTREAM_URL=""
UPSTREAM_COMMIT=""
FEEDS_CONF_LINES=()

while IFS=$'\t' read -r kind arg1 arg2; do
  case "$kind" in
    UPSTREAM)
      UPSTREAM_URL="$arg1"
      UPSTREAM_COMMIT="$arg2"
      ;;
    FEED)
      FEEDS_CONF_LINES+=("$arg1")
      ;;
  esac
done <<< "$PARSED_INFO"

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "[dry-run] Target checkout dir: $DEST"
  echo "[dry-run] Upstream repo: $UPSTREAM_URL"
  echo "[dry-run] Locked commit: $UPSTREAM_COMMIT"
  echo "[dry-run] Generated $DEST/feeds.conf:"
  printf '%s\n' "${FEEDS_CONF_LINES[@]}"
  exit 0
fi

if [[ -d "$DEST/.git" ]]; then
  git -C "$DEST" fetch --tags origin
else
  mkdir -p "$(dirname "$DEST")"
  git clone --no-checkout "$UPSTREAM_URL" "$DEST"
fi

git -C "$DEST" checkout --force "$UPSTREAM_COMMIT"
ACTUAL_HEAD="$(git -C "$DEST" rev-parse HEAD)"
if [[ "$ACTUAL_HEAD" != "$UPSTREAM_COMMIT" ]]; then
  echo "Error: checked-out HEAD ($ACTUAL_HEAD) != locked commit ($UPSTREAM_COMMIT)" >&2
  exit 1
fi

printf '%s\n' "${FEEDS_CONF_LINES[@]}" > "$DEST/feeds.conf"
echo "Checked out $UPSTREAM_URL @ $ACTUAL_HEAD and wrote $DEST/feeds.conf"
