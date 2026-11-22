#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
# SPDX-License-Identifier: GPL-2.0-only
#
# Assemble layered rootfs overlay (files/ + profiles/<profile>/files/) and /etc/cyrenet-release.

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: prepare-overlay.sh --profile <core|standard|extended> --output <dir> [--release-file <file>] [--repo-root <dir>]
EOF
}

PROFILE=""
OUTPUT=""
RELEASE_FILE=""
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile)
      [[ $# -ge 2 ]] || { echo "Error: --profile requires an argument" >&2; exit 2; }
      PROFILE="$2"
      shift 2
      ;;
    --output)
      [[ $# -ge 2 ]] || { echo "Error: --output requires an argument" >&2; exit 2; }
      OUTPUT="$2"
      shift 2
      ;;
    --release-file)
      [[ $# -ge 2 ]] || { echo "Error: --release-file requires an argument" >&2; exit 2; }
      RELEASE_FILE="$2"
      shift 2
      ;;
    --repo-root)
      [[ $# -ge 2 ]] || { echo "Error: --repo-root requires an argument" >&2; exit 2; }
      REPO_ROOT="$2"
      shift 2
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

if [[ -z "$PROFILE" || -z "$OUTPUT" ]]; then
  echo "Error: --profile and --output are required" >&2
  usage >&2
  exit 2
fi

case "$PROFILE" in
  core|standard|extended) ;;
  *)
    echo "Error: invalid profile '$PROFILE' (expected core, standard, or extended)" >&2
    exit 2
    ;;
esac

REPO_ROOT="$(cd "$REPO_ROOT" && pwd)"

if [[ -n "$RELEASE_FILE" && ! -f "$RELEASE_FILE" ]]; then
  echo "Error: --release-file does not exist: $RELEASE_FILE" >&2
  exit 1
fi

check_no_secrets() {
  local dir="$1"
  [[ -d "$dir" ]] || return 0
  local found
  found="$(find "$dir" -type f \( -name '*.key' -o -name '*.pem' -o -name '*.priv' -o -name '*.sec' -o -name '.env' -o -name '.env.*' \) -print)"
  if [[ -n "$found" ]]; then
    echo "Error: forbidden secret/key file detected in overlay: $found" >&2
    exit 1
  fi
}

copy_overlay_layer() {
  local src="$1"
  local dst="$2"
  [[ -d "$src" ]] || return 0
  check_no_secrets "$src"
  while IFS= read -r -d '' file; do
    local rel="${file#"$src"/}"
    local base
    base="$(basename "$file")"
    if [[ "$base" == "README.md" || "$base" == ".gitkeep" ]]; then
      continue
    fi
    mkdir -p "$dst/$(dirname "$rel")"
    cp -p "$file" "$dst/$rel"
  done < <(find "$src" -type f -print0)
}

mkdir -p "$OUTPUT"
copy_overlay_layer "$REPO_ROOT/files" "$OUTPUT"
copy_overlay_layer "$REPO_ROOT/profiles/$PROFILE/files" "$OUTPUT"

if [[ -n "$RELEASE_FILE" ]]; then
  mkdir -p "$OUTPUT/etc"
  cp "$RELEASE_FILE" "$OUTPUT/etc/cyrenet-release"
  chmod 0644 "$OUTPUT/etc/cyrenet-release"
fi

check_no_secrets "$OUTPUT"
