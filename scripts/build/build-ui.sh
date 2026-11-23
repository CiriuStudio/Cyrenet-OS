#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
# SPDX-License-Identifier: GPL-2.0-only
#
# Build Cyrenet OS static React/Vite assets in ui/ and sync them into
# packages/luci-app-cyrenet-dashboard/htdocs/luci-static/resources/cyrenet/.

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: build-ui.sh [--skip-install] [--repo-root <dir>]
EOF
}

SKIP_INSTALL="false"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-install)
      SKIP_INSTALL="true"
      shift
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

REPO_ROOT="$(cd "$REPO_ROOT" && pwd)"
UI_DIR="$REPO_ROOT/ui"
PKG_STATIC_DIR="$REPO_ROOT/packages/luci-app-cyrenet-dashboard/htdocs/luci-static/resources/cyrenet"

# Prefer native Linux Node.js / npm over WSL-bridged Windows paths
if [[ -x /usr/bin/node && -x /usr/bin/npm ]]; then
  export PATH="/usr/bin:$PATH"
fi

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Error: native Linux node and npm are required to build ui/" >&2
  exit 1
fi

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [[ "$NODE_MAJOR" -lt 20 ]]; then
  echo "Error: Node.js >= 20 required, found $(node -v)" >&2
  exit 1
fi

cd "$UI_DIR"

if [[ "$SKIP_INSTALL" != "true" ]]; then
  npm ci
fi

npm run build

python3 - "$UI_DIR/dist" <<'PY'
import json
import pathlib
import sys

dist_dir = pathlib.Path(sys.argv[1])
manifest_path = dist_dir / "manifest.json"
if not manifest_path.is_file():
    raise SystemExit(f"Missing Vite manifest: {manifest_path}")

manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
entry = manifest.get("src/entries/poc.tsx")
if not entry or "file" not in entry:
    raise SystemExit("Manifest missing entry 'src/entries/poc.tsx'")

js_file = dist_dir / entry["file"]
if not js_file.is_file():
    raise SystemExit(f"Missing built JS entry: {js_file}")

for css_rel in entry.get("css", []):
    css_file = dist_dir / css_rel
    if not css_file.is_file():
        raise SystemExit(f"Missing built CSS asset: {css_file}")

maps = list(dist_dir.rglob("*.map"))
if maps:
    raise SystemExit(f"Source maps must not ship to firmware dist: {maps}")
PY

rm -rf "$PKG_STATIC_DIR"
mkdir -p "$PKG_STATIC_DIR"
cp "$UI_DIR/dist/manifest.json" "$PKG_STATIC_DIR/manifest.json"
cp -R "$UI_DIR/dist/assets" "$PKG_STATIC_DIR/assets"

echo "Synced Cyrenet UI static assets -> $PKG_STATIC_DIR"
