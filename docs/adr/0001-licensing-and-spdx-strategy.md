<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

# ADR-0001: 按职责拆分的开源许可证与 SPDX 管理策略

- **状态（Status）：** Accepted
- **日期（Date）：** 2026-11-22
- **关联章节（Related PROJECT.md Section）：** `§16.4 开源许可证`、`§16.5 品牌与归属`

## 背景（Context）

Cyrenet OS 基于 ImmortalWrt（核心系统、内核与构建体系主要遵循 `GPL-2.0-only`）以及 LuCI / Argon 3.x（管理界面与主题主要遵循 `Apache-2.0`），同时包含大量自研系统组件、文档、配置清单以及第三方网络软件包（如 AdGuard Home、Tailscale、OpenClash、SmartDNS 等各自拥有独立许可证）。

依据 [PROJECT.md](../../PROJECT.md) §16.4：项目必须遵守上游各自许可证，且“具体项目许可证不得简单统一覆盖所有第三方组件，应进行独立核查”。若全仓笼统套用单一许可证，容易与 Argon / LuCI（`Apache-2.0`）或 Buildroot 脚本（`GPL-2.0-only`）产生条款混淆或传染争议。

## 决策（Decision）

1. **职责拆分许可证**：
   - **根 `LICENSE` 与核心系统层**：`config/`、`profiles/`、`files/`、`patches/`、`scripts/`、`tests/`、`.github/workflows/` 默认采用 **`GPL-2.0-only`**，与上游 ImmortalWrt / OpenWrt 保持完全一致。
   - **LuCI 主题、自研应用与文档/元数据层**：`themes/`、`packages/luci-app-cyrenet-*/` 默认采用 **`Apache-2.0`**（与上游 LuCI 及 Argon 3.x 一致）；`docs/`、各类 `*.md`、`manifests/`、`release/` 与 `.github/` 非工作流协作模板同样采用 **`Apache-2.0`**。
   - **仓库基础设施占位**：`.gitignore`、`.gitattributes`、`.editorconfig`、`REUSE.toml` 与 `**/.gitkeep` 采用 **`CC0-1.0`**。
2. **机器可读的 REUSE + SPDX 声明**：
   - 根目录 `LICENSES/` 存放 `GPL-2.0-only.txt`、`Apache-2.0.txt` 与 `CC0-1.0.txt` 完整原文。
   - 根目录 `REUSE.toml` 使用 `precedence = "closest"` 定义目录级默认映射。
   - 所有新建源码、脚本与文档文件必须在文件头部显式标注 `SPDX-FileCopyrightText` 与 `SPDX-License-Identifier`；派生或引自 `GPL-2.0-only` 上游的任何文件即使位于 `packages/` 下，也必须显式保留 `GPL-2.0-only`。
3. **进程/包隔离边界**：
   - `Apache-2.0` 的 LuCI 前端与脚本仅通过标准进程调用、UCI、ubus、rpcd 等系统边界与核心层交互，**严禁**与 `GPL-2.0-only` 二进制进行静态链接或源码级混编。
4. **第三方组件独立登记**：
   - 所有第三方软件包的精确许可证由 `manifests/bom/*.yaml` 逐项记录与审查，不受上述默认目录声明覆盖。

## 影响与权衡（Consequences）

- **正面收益**：构建/固件配置侧与 ImmortalWrt 零摩擦保持 `GPL-2.0-only`，LuCI 主题与自研管理应用与上游 LuCI/Argon 保持 `Apache-2.0` 一致，符合开源社区合规最佳实践并可接入自动化 REUSE 校验。
- **新增成本或限制**：贡献者与 AI Agent 在新增文件时必须严格添加 SPDX 头，且在 `packages/` 内开发二进制程序时必须留意不得静态链接 GPL-2.0 库（若不可避免，该二进制须明确采用 `GPL-2.0-only` 并拆包）。
- **安全与兼容性影响**：无运行时影响；显著降低后续公开发行时的许可证合规风险。

## 验证证据（Verification Evidence）

- `LICENSES/GPL-2.0-only.txt`、`LICENSES/Apache-2.0.txt`、`LICENSES/CC0-1.0.txt` 直接复制自标准 `/usr/share/common-licenses/` 原文。
- `REUSE.toml` 已通过 TOML 解析校验，将在 M0 后续阶段接入 CI 检查。
