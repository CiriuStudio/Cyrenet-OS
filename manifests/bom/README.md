<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 软件包物料清单目录（`manifests/bom/`）

本目录维护三个发行版本的软件包物料清单（BOM），采用与 `profiles/` 一致的**增量继承模型**，并由 [`../../scripts/lint/check-repo.py`](../../scripts/lint/check-repo.py) 依据 [`../schemas/bom.schema.json`](../schemas/bom.schema.json) 自动校验：

- [`core.yaml`](core.yaml) — Cyrenet Core 基础及核心网络功能包清单
- [`standard.yaml`](standard.yaml) — Cyrenet Standard 相对 Core 的增量包清单
- [`extended.yaml`](extended.yaml) — Cyrenet Extended 相对 Standard 的增量包清单

> 随着 M1–M6 自研组件（`luci-theme-cyrenet`、`luci-app-cyrenet-*`）与实际 `make defconfig` 解析的传递依赖落地，各 BOM 将同步扩充完整记录。

## 审计规范（对应 PROJECT.md §11.3 / §16.4）

1. 每条记录必须包含全部 11 项字段：`name`、`version`、`source_repo`、`source_commit`、`license`、`dependencies`、`profiles`、`default_enabled`、`is_kmod`、`requires_extra_config`、`conflicts`。
2. `license` 字段必须如实填写上游许可证，禁止随意合并覆盖。
3. 软件包升级必须经由 BOM 变更审核与兼容性检查，禁止盲目拉取最新版本。
