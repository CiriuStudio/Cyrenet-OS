#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
# SPDX-License-Identifier: GPL-2.0-only
"""Generate /etc/cyrenet-release conforming to DESIGN.md §3."""

from __future__ import annotations

import argparse
import hashlib
import pathlib
import re
import sys
import yaml

SEMVER_RE = re.compile(r"^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$")
SHA1_RE = re.compile(r"^[0-9a-f]{40}$")
SAFE_VALUE_RE = re.compile(r'^[^"\r\n`$\\]+$')

VALID_PROFILES = ("core", "standard", "extended")
VALID_CHANNELS = ("nightly", "beta", "stable")


def validate_safe_value(name: str, value: str) -> str:
    if not value:
        raise ValueError(f"{name} must not be empty")
    if not SAFE_VALUE_RE.match(value):
        raise ValueError(f"{name} contains forbidden characters: {value!r}")
    return value


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    default_root = pathlib.Path(__file__).resolve().parents[2]
    parser = argparse.ArgumentParser(description="Generate /etc/cyrenet-release metadata file.")
    parser.add_argument("--profile", required=True, choices=VALID_PROFILES)
    parser.add_argument("--version", required=True, help="Semantic version, e.g. 1.0.0 or 1.0.0-alpha.1")
    parser.add_argument("--channel", required=True, choices=VALID_CHANNELS)
    parser.add_argument("--build-id", required=True, help="Unique build identifier, e.g. 20261122-001")
    parser.add_argument("--image-type", required=True, help="Image type, e.g. generic-squashfs-combined-efi")
    parser.add_argument("--output", required=True, type=pathlib.Path)
    parser.add_argument("--config-schema", type=int, default=1)
    parser.add_argument("--kernel-version", default="unknown")
    parser.add_argument("--kernel-abi", default="unknown")
    parser.add_argument("--experimental", default="false")
    parser.add_argument(
        "--lock-file",
        type=pathlib.Path,
        default=default_root / "manifests" / "upstream.lock.yaml",
    )
    parser.add_argument(
        "--allow-tbd",
        action="store_true",
        help="Allow TBD upstream commit hashes (only for offline draft dry-runs).",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)

    if not SEMVER_RE.match(args.version):
        raise ValueError(f"Invalid SemVer for --version: {args.version!r}")
    if args.config_schema < 1:
        raise ValueError("--config-schema must be >= 1")
    if args.experimental not in ("false", "sfe"):
        raise ValueError(f"Invalid --experimental value: {args.experimental!r} (expected 'false' or 'sfe')")

    lock_path = args.lock_file.resolve()
    if not lock_path.is_file():
        raise FileNotFoundError(f"Lock file not found: {lock_path}")

    lock_bytes = lock_path.read_bytes()
    lock_sha256 = hashlib.sha256(lock_bytes).hexdigest()
    lock_data = yaml.safe_load(lock_bytes.decode("utf-8"))

    upstream = lock_data.get("upstream", {})
    upstream_tag = str(upstream.get("tag", "")).lstrip("v")
    upstream_commit = str(upstream.get("commit", ""))

    if not upstream_tag:
        raise ValueError("Missing upstream.tag in lock file")
    if upstream_commit == "TBD":
        if not args.allow_tbd:
            raise ValueError("Refusing upstream.commit='TBD' without --allow-tbd")
    elif not SHA1_RE.match(upstream_commit):
        raise ValueError(f"Invalid upstream.commit SHA in lock file: {upstream_commit!r}")

    fields = [
        ("CYRENET_VERSION", validate_safe_value("version", args.version)),
        ("CYRENET_CHANNEL", args.channel),
        ("CYRENET_PROFILE", args.profile),
        ("CYRENET_TARGET", "x86/64"),
        ("CYRENET_IMAGE_TYPE", validate_safe_value("image-type", args.image_type)),
        ("CYRENET_BUILD_ID", validate_safe_value("build-id", args.build_id)),
        ("CYRENET_CONFIG_SCHEMA", str(args.config_schema)),
        ("CYRENET_UPSTREAM_VERSION", validate_safe_value("upstream-version", upstream_tag)),
        ("CYRENET_UPSTREAM_COMMIT", upstream_commit),
        ("CYRENET_FEEDS_LOCK_SHA256", lock_sha256),
        ("CYRENET_KERNEL_VERSION", validate_safe_value("kernel-version", args.kernel_version)),
        ("CYRENET_KERNEL_ABI", validate_safe_value("kernel-abi", args.kernel_abi)),
        ("CYRENET_EXPERIMENTAL", args.experimental),
    ]

    args.output.parent.mkdir(parents=True, exist_ok=True)
    content = "\n".join(f'{k}="{v}"' for k, v in fields) + "\n"
    args.output.write_text(content, encoding="utf-8", newline="\n")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        raise SystemExit(1)
