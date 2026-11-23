#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
# SPDX-License-Identifier: GPL-2.0-only
"""Unit tests for Cyrenet OS M0 build, lint, and schema contracts."""

from __future__ import annotations

import hashlib
import json
import pathlib
import shutil
import stat
import subprocess
import tempfile
import unittest

import jsonschema

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
SCRIPTS_DIR = REPO_ROOT / "scripts"


class TestM0Tooling(unittest.TestCase):
    def test_merge_config_inheritance_and_experimental_guard(self) -> None:
        script = SCRIPTS_DIR / "build" / "merge-config.sh"
        with tempfile.TemporaryDirectory() as td:
            tmp = pathlib.Path(td)
            core_out = tmp / "core.config"
            std_out = tmp / "standard.config"
            ext_out = tmp / "extended.config"

            for prof, out in (("core", core_out), ("standard", std_out), ("extended", ext_out)):
                res = subprocess.run(
                    ["bash", str(script), "--profile", prof, "--output", str(out)],
                    capture_output=True,
                    text=True,
                    check=False,
                )
                self.assertEqual(res.returncode, 0, msg=res.stderr)
                self.assertTrue(out.is_file())

            core_txt = core_out.read_text(encoding="utf-8")
            std_txt = std_out.read_text(encoding="utf-8")
            ext_txt = ext_out.read_text(encoding="utf-8")

            self.assertIn("CONFIG_TARGET_x86_64=y", core_txt)
            self.assertIn("# CONFIG_PACKAGE_dnsmasq is not set", core_txt)
            self.assertIn("CONFIG_PACKAGE_adguardhome=y", core_txt)
            self.assertNotIn("CONFIG_PACKAGE_tailscale=y", core_txt)

            self.assertIn("CONFIG_PACKAGE_adguardhome=y", std_txt)
            self.assertIn("CONFIG_PACKAGE_tailscale=y", std_txt)
            self.assertNotIn("CONFIG_PACKAGE_mwan3=y", std_txt)

            self.assertIn("CONFIG_PACKAGE_tailscale=y", ext_txt)
            self.assertIn("CONFIG_PACKAGE_mwan3=y", ext_txt)
            self.assertIn("CONFIG_PACKAGE_prometheus-node-exporter-lua=y", ext_txt)

            # ADR-0007 unified kernel module ABI baseline & profile overrides
            core_lines = set(core_txt.splitlines())
            std_lines = set(std_txt.splitlines())
            ext_lines = set(ext_txt.splitlines())

            self.assertIn('CONFIG_VERSION_DIST="Cyrenet OS"', core_lines)
            self.assertIn("CONFIG_PACKAGE_kmod-tun=m", core_lines)
            self.assertIn("CONFIG_PACKAGE_kmod-sched-cake=m", core_lines)
            self.assertNotIn("CONFIG_PACKAGE_kmod-sched-cake=y", core_lines)
            self.assertIn("CONFIG_PACKAGE_kmod-macvlan=m", core_lines)
            self.assertNotIn("CONFIG_PACKAGE_kmod-macvlan=y", core_lines)

            self.assertIn("CONFIG_PACKAGE_kmod-sched-cake=y", std_lines)
            self.assertNotIn("CONFIG_PACKAGE_kmod-sched-cake=m", std_lines)
            self.assertIn("CONFIG_PACKAGE_kmod-macvlan=m", std_lines)
            self.assertNotIn("CONFIG_PACKAGE_kmod-macvlan=y", std_lines)

            self.assertIn("CONFIG_PACKAGE_kmod-sched-cake=y", ext_lines)
            self.assertNotIn("CONFIG_PACKAGE_kmod-sched-cake=m", ext_lines)
            self.assertIn("CONFIG_PACKAGE_kmod-macvlan=y", ext_lines)
            self.assertNotIn("CONFIG_PACKAGE_kmod-macvlan=m", ext_lines)

            # Missing experimental fragment must fail cleanly
            missing_exp = subprocess.run(
                [
                    "bash",
                    str(script),
                    "--profile",
                    "core",
                    "--experimental",
                    "nonexistent-exp",
                    "--output",
                    str(tmp / "fail.config"),
                ],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertNotEqual(missing_exp.returncode, 0)

    def test_merge_config_deduplicates_later_override(self) -> None:
        script = SCRIPTS_DIR / "build" / "merge-config.sh"
        with tempfile.TemporaryDirectory() as td:
            root = pathlib.Path(td)
            (root / "config" / "experimental").mkdir(parents=True)
            (root / "profiles" / "core").mkdir(parents=True)
            (root / "profiles" / "standard").mkdir(parents=True)
            (root / "profiles" / "extended").mkdir(parents=True)

            (root / "config" / "common.config").write_text(
                "CONFIG_FOO=y\nCONFIG_BAR=y\n", encoding="utf-8"
            )
            (root / "profiles" / "core" / "profile.config").write_text(
                "# CONFIG_FOO is not set\nCONFIG_CORE_ONLY=y\n", encoding="utf-8"
            )
            (root / "profiles" / "standard" / "profile.config").write_text(
                "CONFIG_FOO=m\n", encoding="utf-8"
            )

            out = root / "merged.config"
            res = subprocess.run(
                [
                    "bash",
                    str(script),
                    "--repo-root",
                    str(root),
                    "--profile",
                    "standard",
                    "--output",
                    str(out),
                ],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(res.returncode, 0, msg=res.stderr)
            lines = out.read_text(encoding="utf-8").splitlines()
            foo_lines = [ln for ln in lines if "CONFIG_FOO" in ln]
            self.assertEqual(foo_lines, ["CONFIG_FOO=m"])
            self.assertIn("CONFIG_BAR=y", lines)
            self.assertIn("CONFIG_CORE_ONLY=y", lines)

            # Also verify core override unsets CONFIG_FOO
            out_core = root / "merged-core.config"
            res_core = subprocess.run(
                [
                    "bash",
                    str(script),
                    "--repo-root",
                    str(root),
                    "--profile",
                    "core",
                    "--output",
                    str(out_core),
                ],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(res_core.returncode, 0, msg=res_core.stderr)
            core_foo = [
                ln
                for ln in out_core.read_text(encoding="utf-8").splitlines()
                if "CONFIG_FOO" in ln
            ]
            self.assertEqual(core_foo, ["# CONFIG_FOO is not set"])

    def test_generate_release_info_and_validation(self) -> None:
        script = SCRIPTS_DIR / "build" / "generate-release-info.py"
        lock_file = REPO_ROOT / "manifests" / "upstream.lock.yaml"
        expected_lock_sha = hashlib.sha256(lock_file.read_bytes()).hexdigest()

        with tempfile.TemporaryDirectory() as td:
            out = pathlib.Path(td) / "cyrenet-release"
            res = subprocess.run(
                [
                    "python3",
                    str(script),
                    "--profile",
                    "standard",
                    "--version",
                    "1.0.0-alpha.1",
                    "--channel",
                    "nightly",
                    "--build-id",
                    "20261122-001",
                    "--image-type",
                    "generic-squashfs-combined-efi",
                    "--kernel-version",
                    "6.12.103",
                    "--kernel-abi",
                    "0413601b1c3f0490e17f340fe09229ea",
                    "--output",
                    str(out),
                ],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(res.returncode, 0, msg=res.stderr)
            raw = out.read_text(encoding="utf-8")
            kv = dict(line.split("=", 1) for line in raw.strip().splitlines())
            kv = {k: v.strip('"') for k, v in kv.items()}

            expected_keys = {
                "CYRENET_VERSION",
                "CYRENET_CHANNEL",
                "CYRENET_PROFILE",
                "CYRENET_TARGET",
                "CYRENET_IMAGE_TYPE",
                "CYRENET_BUILD_ID",
                "CYRENET_CONFIG_SCHEMA",
                "CYRENET_UPSTREAM_VERSION",
                "CYRENET_UPSTREAM_COMMIT",
                "CYRENET_FEEDS_LOCK_SHA256",
                "CYRENET_KERNEL_VERSION",
                "CYRENET_KERNEL_ABI",
                "CYRENET_EXPERIMENTAL",
            }
            self.assertEqual(set(kv.keys()), expected_keys)
            self.assertEqual(kv["CYRENET_TARGET"], "x86/64")
            self.assertEqual(kv["CYRENET_UPSTREAM_VERSION"], "25.12.2")
            self.assertEqual(kv["CYRENET_UPSTREAM_COMMIT"], "4fc16f2985a358bd43bb522e43f05395fcbd6ed5")
            self.assertEqual(kv["CYRENET_FEEDS_LOCK_SHA256"], expected_lock_sha)
            self.assertEqual(kv["CYRENET_EXPERIMENTAL"], "false")

            # Invalid semver / channel / profile must fail
            for bad_args in (
                ["--profile", "invalid", "--version", "1.0.0", "--channel", "nightly"],
                ["--profile", "core", "--version", "v1.0", "--channel", "nightly"],
                ["--profile", "core", "--version", "1.0.0", "--channel", "dev"],
            ):
                bad = subprocess.run(
                    [
                        "python3",
                        str(script),
                        *bad_args,
                        "--build-id",
                        "1",
                        "--image-type",
                        "efi",
                        "--output",
                        str(out),
                    ],
                    capture_output=True,
                    text=True,
                    check=False,
                )
                self.assertNotEqual(bad.returncode, 0)

    def test_fetch_upstream_dry_run(self) -> None:
        script = SCRIPTS_DIR / "build" / "fetch-upstream.sh"
        res = subprocess.run(
            ["bash", str(script), "--dry-run"],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(res.returncode, 0, msg=res.stderr)
        out = res.stdout
        self.assertIn("4fc16f2985a358bd43bb522e43f05395fcbd6ed5", out)
        for feed_line in (
            "src-git packages https://github.com/immortalwrt/packages.git^84bd86384928955b568988ca0e09e2c78c75173d",
            "src-git luci https://github.com/immortalwrt/luci.git^d6167ea0645cbd1327708d85f94824f42d0eb872",
            "src-git routing https://github.com/openwrt/routing.git^e49d76035aafb85ddc993b59271d8c7ba56b5362",
            "src-git telephony https://github.com/openwrt/telephony.git^2618106d5846a4a542fdf5809f0d3ed228ce439b",
            "src-git video https://github.com/openwrt/video.git^094bf58da6682f895255a35a84349a79dab4bf95",
        ):
            self.assertIn(feed_line, out)
        self.assertIn(f"src-link cyrenet_packages {REPO_ROOT / 'packages'}", out)
        self.assertIn(f"src-link cyrenet_themes {REPO_ROOT / 'themes'}", out)

    def test_prepare_overlay_layering_and_secret_rejection(self) -> None:
        script = SCRIPTS_DIR / "build" / "prepare-overlay.sh"
        with tempfile.TemporaryDirectory() as td:
            root = pathlib.Path(td) / "repo"
            (root / "files" / "etc").mkdir(parents=True)
            (root / "profiles" / "core" / "files" / "etc").mkdir(parents=True)
            (root / "files" / "README.md").write_text("skip\n", encoding="utf-8")
            (root / "files" / "etc" / "banner").write_text("base\n", encoding="utf-8")
            (root / "profiles" / "core" / "files" / ".gitkeep").write_text("", encoding="utf-8")
            (root / "profiles" / "core" / "files" / "etc" / "banner").write_text("core\n", encoding="utf-8")

            rel_file = pathlib.Path(td) / "cyrenet-release"
            rel_file.write_text('CYRENET_PROFILE="core"\n', encoding="utf-8")

            out = pathlib.Path(td) / "overlay"
            res = subprocess.run(
                [
                    "bash",
                    str(script),
                    "--repo-root",
                    str(root),
                    "--profile",
                    "core",
                    "--release-file",
                    str(rel_file),
                    "--output",
                    str(out),
                ],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(res.returncode, 0, msg=res.stderr)
            self.assertFalse((out / "README.md").exists())
            self.assertFalse((out / ".gitkeep").exists())
            self.assertEqual((out / "etc" / "banner").read_text(encoding="utf-8"), "core\n")
            self.assertEqual(
                (out / "etc" / "cyrenet-release").read_text(encoding="utf-8"),
                'CYRENET_PROFILE="core"\n',
            )

            # Secret key file in overlay must be rejected
            shutil.rmtree(out)
            (root / "files" / "etc" / "leaked.key").write_text("secret", encoding="utf-8")
            bad = subprocess.run(
                [
                    "bash",
                    str(script),
                    "--repo-root",
                    str(root),
                    "--profile",
                    "core",
                    "--output",
                    str(out),
                ],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertNotEqual(bad.returncode, 0)

    def test_prepare_overlay_preserves_uci_defaults_mode_and_syntax(self) -> None:
        script = SCRIPTS_DIR / "build" / "prepare-overlay.sh"
        with tempfile.TemporaryDirectory() as td:
            out = pathlib.Path(td) / "overlay"
            res = subprocess.run(
                [
                    "bash",
                    str(script),
                    "--profile",
                    "core",
                    "--output",
                    str(out),
                ],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(res.returncode, 0, msg=res.stderr)
            uci_script = out / "etc" / "uci-defaults" / "99-cyrenet-defaults"
            self.assertTrue(uci_script.is_file())
            self.assertTrue(bool(uci_script.stat().st_mode & stat.S_IXUSR))

            syntax = subprocess.run(
                ["sh", "-n", str(uci_script)],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(syntax.returncode, 0, msg=syntax.stderr)

    def test_ota_manifest_schema_validation(self) -> None:
        schema_path = REPO_ROOT / "manifests" / "schemas" / "ota-manifest.schema.json"
        schema = json.loads(schema_path.read_text(encoding="utf-8"))

        valid_manifest = {
            "version": "1.0.0",
            "channel": "stable",
            "upstream_version": "25.12.2",
            "profile": "core",
            "target": "x86/64",
            "image_type": "generic-squashfs-combined-efi",
            "config_schema_version": 1,
            "size_bytes": 18903437,
            "download_url": "https://github.com/CiriuStudio/Cyrenet-OS/releases/download/v1.0.0/core.img.gz",
            "sha256": "a" * 64,
            "signature": {
                "algorithm": "ed25519",
                "key_id": "cyrenet-2026-main",
                "value": "base64-signature-placeholder",
            },
            "min_upgrade_version": "1.0.0",
            "released_at": "2026-11-22T12:00:00Z",
            "changelog_url": "https://github.com/CiriuStudio/Cyrenet-OS/releases/tag/v1.0.0",
        }
        jsonschema.validate(instance=valid_manifest, schema=schema)

        for field, bad_val in (
            ("download_url", "http://insecure.example/fw.img.gz"),
            ("channel", "experimental"),
            ("sha256", "deadbeef"),
        ):
            broken = dict(valid_manifest)
            broken[field] = bad_val
            with self.assertRaises(jsonschema.ValidationError):
                jsonschema.validate(instance=broken, schema=schema)

        missing_sig = dict(valid_manifest)
        del missing_sig["signature"]
        with self.assertRaises(jsonschema.ValidationError):
            jsonschema.validate(instance=missing_sig, schema=schema)

    def test_check_repo_strict_passes(self) -> None:
        script = SCRIPTS_DIR / "lint" / "check-repo.py"
        res = subprocess.run(
            ["python3", str(script), "--strict"],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(res.returncode, 0, msg=res.stdout + "\n" + res.stderr)


if __name__ == "__main__":
    unittest.main()
