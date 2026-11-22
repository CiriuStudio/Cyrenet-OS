<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 通用构建配置目录（`config/`）

本目录存放跨 Profile 共享的基础 Buildroot 配置片段，默认适用 `GPL-2.0-only`。

- `common.config`：所有发行版本（`core`、`standard`、`extended`）共享的基础 `x86_64` UEFI 与原生协议栈配置片段。
- `experimental/`：实验性内核或特性配置片段（例如 SFE），**物理隔离于常规发行配置**，不得直接合入 `common.config` 或稳定发布通道。
