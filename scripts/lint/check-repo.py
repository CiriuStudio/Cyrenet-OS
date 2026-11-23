#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
# SPDX-License-Identifier: GPL-2.0-only
"""Repository lint & supply-chain audit checks for Cyrenet OS."""

from __future__ import annotations

import argparse
import json
import pathlib
import re
import subprocess
import sys
import tomllib

import jsonschema
import yaml

HIGH_RISK_DEFAULT_DISABLED = {
    "adblock-fast",
    "tailscale",
    "luci-app-openclash",
    "miniupnpd-nftables",
    "mwan3",
    "luci-app-syncdial",
    "prometheus-node-exporter-lua",
    "kmod-tcp-bbr",
    "kmod-nft-offload",
}

FORBIDDEN_SECRET_FILENAME_RE = re.compile(r"^(.+\.(key|pem|priv|sec)|\.env(\..+)?)$")

# Construct regexes without embedding verbatim literal trigger markers inside this file.
PRIVATE_KEY_HEADER_RE = re.compile(r"-----" + r"BEGIN [A-Z0-9 ]*PRIVATE KEY" + r"-----")
ALIYUN_AK_RE = re.compile(r"LTAI" + r"5t[0-9A-Za-z]{16,}")
GITHUB_PAT_RE = re.compile(r"ghp" + r"_[0-9A-Za-z]{36}")
TAILSCALE_KEY_RE = re.compile(r"tskey-auth" + r"-[A-Za-z0-9_-]{10,}")

BINARY_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".ico",
    ".woff",
    ".woff2",
    ".gz",
    ".xz",
    ".zst",
    ".tar",
    ".img",
    ".apk",
}


def iter_repo_files(repo_root: pathlib.Path) -> list[pathlib.Path]:
    ignored_dirs = {".git", "__pycache__", ".pytest_cache", "node_modules"}
    ignored_root_dirs = {"upstream", "build_dir", "staging_dir", "tmp", "bin", "dl", "feeds", "logs"}
    files = []
    for path in sorted(repo_root.rglob("*")):
        if not path.is_file():
            continue
        rel_parts = path.relative_to(repo_root).parts
        if any(part in ignored_dirs for part in rel_parts) or rel_parts[0] in ignored_root_dirs:
            continue
        if rel_parts[:2] == ("scripts", "temp") or path.name.endswith((".tmp.sh", ".local.sh")):
            continue
        if path.suffix in {".pyc", ".pyo"}:
            continue
        files.append(path)
    return files


def check_json_schemas(repo_root: pathlib.Path, errors: list[str]) -> dict[str, dict]:
    schemas: dict[str, dict] = {}
    schema_dir = repo_root / "manifests" / "schemas"
    schema_files = sorted(schema_dir.glob("*.json"))
    if not schema_files:
        errors.append("No JSON schemas found under manifests/schemas/")
        return schemas
    for sf in schema_files:
        try:
            data = json.loads(sf.read_text(encoding="utf-8"))
            jsonschema.Draft202012Validator.check_schema(data)
            schemas[sf.name] = data
        except Exception as exc:
            errors.append(f"Invalid JSON schema {sf.relative_to(repo_root)}: {exc}")
    return schemas


def check_upstream_lock(repo_root: pathlib.Path, schemas: dict[str, dict], strict: bool, errors: list[str]) -> None:
    lock_path = repo_root / "manifests" / "upstream.lock.yaml"
    schema = schemas.get("upstream-lock.schema.json")
    if not lock_path.is_file() or schema is None:
        errors.append("Missing manifests/upstream.lock.yaml or upstream-lock.schema.json")
        return

    try:
        data = yaml.safe_load(lock_path.read_text(encoding="utf-8"))
        jsonschema.validate(instance=data, schema=schema)
    except Exception as exc:
        errors.append(f"upstream.lock.yaml schema validation failed: {exc}")
        return

    if strict:
        if data.get("verified_at") == "TBD":
            errors.append("Strict check failed: upstream.lock.yaml verified_at is TBD")
        if data["upstream"]["commit"] == "TBD":
            errors.append("Strict check failed: upstream.commit is TBD")
        for feed in data.get("feeds", []):
            if feed.get("commit") == "TBD":
                errors.append(f"Strict check failed: feed {feed.get('name')} commit is TBD")
        for tp in data.get("third_party", []):
            if tp.get("commit") == "TBD":
                errors.append(f"Strict check failed: third_party {tp.get('name')} commit is TBD")


def check_boms(repo_root: pathlib.Path, schemas: dict[str, dict], strict: bool, errors: list[str]) -> None:
    schema = schemas.get("bom.schema.json")
    if schema is None:
        errors.append("Missing bom.schema.json")
        return

    seen_global: dict[str, str] = {}
    for profile in ("core", "standard", "extended"):
        bom_path = repo_root / "manifests" / "bom" / f"{profile}.yaml"
        if not bom_path.is_file():
            errors.append(f"Missing BOM file: {bom_path.relative_to(repo_root)}")
            continue
        try:
            data = yaml.safe_load(bom_path.read_text(encoding="utf-8"))
            jsonschema.validate(instance=data, schema=schema)
        except Exception as exc:
            errors.append(f"{bom_path.relative_to(repo_root)} validation failed: {exc}")
            continue

        if data.get("profile") != profile:
            errors.append(f"{bom_path.relative_to(repo_root)} profile mismatch: {data.get('profile')!r} != {profile!r}")

        seen_local: set[str] = set()
        for pkg in data.get("packages", []):
            name = pkg["name"]
            if name in seen_local:
                errors.append(f"Duplicate package {name!r} inside {profile}.yaml")
            seen_local.add(name)

            if name in seen_global:
                errors.append(f"Package {name!r} duplicated across {seen_global[name]}.yaml and {profile}.yaml")
            seen_global[name] = profile

            if profile not in pkg["profiles"]:
                errors.append(f"Package {name!r} in {profile}.yaml does not list {profile!r} in profiles")

            if name in HIGH_RISK_DEFAULT_DISABLED and pkg["default_enabled"] is not False:
                errors.append(f"Optional/high-risk package {name!r} in {profile}.yaml must have default_enabled: false")

            if strict and pkg["source_commit"] == "TBD":
                errors.append(f"Strict check failed: {profile}.yaml package {name!r} has source_commit='TBD'")


def check_reuse_and_spdx(repo_root: pathlib.Path, files: list[pathlib.Path], errors: list[str]) -> None:
    reuse_path = repo_root / "REUSE.toml"
    if not reuse_path.is_file():
        errors.append("Missing REUSE.toml")
    else:
        try:
            reuse_data = tomllib.loads(reuse_path.read_text(encoding="utf-8"))
            if reuse_data.get("version") != 1 or not reuse_data.get("annotations"):
                errors.append("REUSE.toml must define version = 1 and non-empty [[annotations]]")
        except Exception as exc:
            errors.append(f"Invalid REUSE.toml: {exc}")

    for lic_name in ("GPL-2.0-only.txt", "GPL-3.0-only.txt", "Apache-2.0.txt", "CC0-1.0.txt"):
        if not (repo_root / "LICENSES" / lic_name).is_file():
            errors.append(f"Missing license text: LICENSES/{lic_name}")

    for path in files:
        rel = path.relative_to(repo_root).as_posix()
        if rel in ("PROJECT.md", "LICENSE") or (rel.startswith("LICENSES/") and rel.endswith(".txt")):
            continue
        if path.suffix in BINARY_EXTENSIONS or path.suffix == ".json":
            continue
        try:
            head_lines = path.read_text(encoding="utf-8").splitlines()[:10]
        except UnicodeDecodeError:
            errors.append(f"Non-UTF-8 text file: {rel}")
            continue
        if not any("SPDX-License-Identifier:" in line for line in head_lines):
            errors.append(f"Missing SPDX-License-Identifier header in first 10 lines: {rel}")


def check_lf_and_secrets(repo_root: pathlib.Path, files: list[pathlib.Path], errors: list[str]) -> None:
    for path in files:
        rel = path.relative_to(repo_root).as_posix()
        if FORBIDDEN_SECRET_FILENAME_RE.match(path.name):
            errors.append(f"Forbidden secret/key filename in repository: {rel}")

        if path.suffix in BINARY_EXTENSIONS:
            continue

        raw = path.read_bytes()
        if b"\r\n" in raw or b"\r" in raw:
            errors.append(f"CR/CRLF line ending detected (LF required): {rel}")

        if rel.startswith("tests/fixtures/"):
            continue

        text = raw.decode("utf-8", errors="replace")
        for label, pattern in (
            ("private key block", PRIVATE_KEY_HEADER_RE),
            ("Alibaba Cloud AccessKey pattern", ALIYUN_AK_RE),
            ("GitHub token pattern", GITHUB_PAT_RE),
            ("Tailscale auth key pattern", TAILSCALE_KEY_RE),
        ):
            if pattern.search(text):
                errors.append(f"Potential secret ({label}) detected in: {rel}")


def check_shell_syntax(repo_root: pathlib.Path, files: list[pathlib.Path], errors: list[str]) -> None:
    for path in files:
        rel_path = path.relative_to(repo_root)
        rel = rel_path.as_posix()
        parts = rel_path.parts
        if rel.startswith("scripts/") and path.suffix == ".sh":
            res = subprocess.run(["bash", "-n", str(path)], capture_output=True, text=True)
            if res.returncode != 0:
                errors.append(f"bash -n failed for {rel}: {res.stderr.strip()}")
        elif (
            (len(parts) >= 4 and parts[:3] == ("files", "etc", "uci-defaults"))
            or (
                len(parts) >= 6
                and parts[0] == "profiles"
                and parts[2:5] == ("files", "etc", "uci-defaults")
            )
        ):
            if path.name.startswith(".") or path.suffix == ".md":
                continue
            res = subprocess.run(["sh", "-n", str(path)], capture_output=True, text=True)
            if res.returncode != 0:
                errors.append(f"sh -n failed for {rel}: {res.stderr.strip()}")


def main(argv: list[str] | None = None) -> int:
    default_root = pathlib.Path(__file__).resolve().parents[2]
    parser = argparse.ArgumentParser(description="Run Cyrenet OS repository lint & audit checks.")
    parser.add_argument("--repo-root", type=pathlib.Path, default=default_root)
    parser.add_argument(
        "--strict",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Reject TBD lock commits and timestamps (enabled by default).",
    )
    args = parser.parse_args(argv)

    repo_root = args.repo_root.resolve()
    files = iter_repo_files(repo_root)
    errors: list[str] = []

    schemas = check_json_schemas(repo_root, errors)
    check_upstream_lock(repo_root, schemas, args.strict, errors)
    check_boms(repo_root, schemas, args.strict, errors)
    check_reuse_and_spdx(repo_root, files, errors)
    check_lf_and_secrets(repo_root, files, errors)
    check_shell_syntax(repo_root, files, errors)

    if errors:
        print("Repository audit FAILED:", file=sys.stderr)
        for err in errors:
            print(f"  - {err}", file=sys.stderr)
        return 1

    print(
        f"Repository audit PASSED (files={len(files)}, schemas={len(schemas)}, strict={args.strict})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
