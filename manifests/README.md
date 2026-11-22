<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 供应链锁定与物料清单目录（`manifests/`）

本目录管理 Cyrenet OS 的可追溯依赖基线（默认适用 `Apache-2.0`），属于高风险安全审查范围（`PROJECT.md` §11.3 / §16.2 / §20.4）。

| 文件 / 目录 | 用途 |
|---|---|
| [`upstream.lock.yaml`](upstream.lock.yaml) | 锁定 ImmortalWrt 主源码树、feeds 与核心第三方仓库的具体 Commit |
| [`bom/`](bom/README.md) | 三个 Profile 的软件包物料清单（BOM） |
| [`schemas/upstream-lock.schema.json`](schemas/upstream-lock.schema.json) | `upstream.lock.yaml` 的 JSON Schema 校验规范 |
| [`schemas/bom.schema.json`](schemas/bom.schema.json) | Profile BOM 的 JSON Schema 校验规范（强制包含 §11.3 全部 11 项字段） |
| [`schemas/ota-manifest.schema.json`](schemas/ota-manifest.schema.json) | Serverless OTA 清单的 JSON Schema 校验规范（强制包含 §13.2 全部 14 项字段） |

## 校验约束

- 正式构建**禁止**使用浮动分支 `HEAD`，所有 Commit 必须为 40 位十六进制 SHA-1（M0 离线骨架阶段未联网核查项暂显式标注为 `"TBD"`，须在 M0 Step 3 联网核验并锁定）。
- 任何第三方软件包升级必须通过 BOM 变更审查，核对其许可证与依赖兼容性。
