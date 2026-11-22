<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 软件包物料清单目录（`manifests/bom/`）

本目录将在 **M0 Step 3** 填充三个发行版本的初始物料清单（BOM），并接受 [`../schemas/bom.schema.json`](../schemas/bom.schema.json) 自动化结构校验：

- `core.yaml` — Cyrenet Core 预装包清单
- `standard.yaml` — Cyrenet Standard 预装包清单（或增量清单）
- `extended.yaml` — Cyrenet Extended 预装包清单（或增量清单）

## 审计规范（对应 PROJECT.md §11.3 / §16.4）

1. 每条记录必须包含全部 11 项字段：`name`、`version`、`source_repo`、`source_commit`、`license`、`dependencies`、`profiles`、`default_enabled`、`is_kmod`、`requires_extra_config`、`conflicts`。
2. `license` 字段必须如实填写上游许可证，禁止随意合并覆盖。
3. 软件包升级必须经由 BOM 变更审核与兼容性检查，禁止盲目拉取最新版本。
