<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 构建、校验与发布脚本目录（`scripts/`）

本目录存放构建拼装、静态检查与发布辅助脚本，默认适用 `GPL-2.0-only`。

## 已实现脚本

- `build/`：
  - [`fetch-upstream.sh`](build/fetch-upstream.sh)：依据 `manifests/upstream.lock.yaml` 确定性检出 ImmortalWrt 上游及 5 个 feeds，校验 `HEAD` 与锁定 Commit 一致并生成含 `src-link` 本地挂载的 `feeds.conf`（支持 `--dry-run`）。
  - [`merge-config.sh`](build/merge-config.sh)：按 `common.config → core → standard → extended` 继承链（及可选 `--experimental` 隔离片段）合并并去重生成 Buildroot `.config`。
  - [`prepare-overlay.sh`](build/prepare-overlay.sh)：叠加 `files/` 与 `profiles/<profile>/files/` 形成完整 RootFS Overlay，注入 `/etc/cyrenet-release` 并拦截任何私钥/凭据文件。
  - [`generate-release-info.py`](build/generate-release-info.py)：生成符合 [DESIGN.md](../DESIGN.md) 第 3 节规范的 `/etc/cyrenet-release` 元数据文件。
- `lint/`：
  - [`check-repo.py`](lint/check-repo.py)：一键校验 JSON Schema、`upstream.lock.yaml`、`bom/*.yaml`、`REUSE.toml` 与 SPDX 文件头、全仓 LF 换行、`bash -n` 语法与防密钥泄露规则。

## 脚本工程规范

- 必须使用 **LF** 换行符，通过 `shellcheck` 或 Python 标准检查。
- 禁止调用未经审查的远程安装脚本（如 `curl ... | sh`），所有下载必须校验预期 SHA256 或锁定的 Git Commit。
- 构建脚本不得写死单台私人服务器路径或硬编码开发者环境。
