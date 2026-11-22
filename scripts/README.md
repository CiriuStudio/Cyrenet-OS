<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 构建、校验与发布脚本目录（`scripts/`）

本目录存放构建拼装、静态检查与发布辅助脚本，默认适用 `GPL-2.0-only`。

- `build/`：上游源码拉取与校验脚本、分层 `.config` 合并脚本（`common.config` + `profile.config`）、云主机（ECS）首次编译引导脚本与 `/etc/cyrenet-release` 生成脚本。
- `lint/`：Schema 校验（`upstream.lock.yaml`、`bom/*.yaml`、`ota-manifest`）、ShellCheck 封装、SPDX 头检查与防密钥泄露检查脚本。

## 脚本工程规范

- 必须使用 **LF** 换行符，通过 `shellcheck` 或 Python 标准检查。
- 禁止调用未经审查的远程安装脚本（如 `curl ... | sh`），所有下载必须校验预期 SHA256 或锁定的 Git Commit。
- 构建脚本不得写死单台私人服务器路径或硬编码开发者环境。
