<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 许可证说明（Licensing & SPDX Policy）

Cyrenet OS 采用 **按职责拆分 + SPDX / REUSE 显式声明** 的开源许可证策略（详见 [ADR-0001](../docs/adr/0001-licensing-and-spdx-strategy.md)）。

## 1. 仓库默认许可证划分

| 目录 / 文件范围 | 默认 SPDX 标识 | 适用原因 | 完整文本 |
|---|---|---|---|
| 根 `LICENSE`、`config/`、`profiles/`、`files/`、`patches/`、`scripts/`、`tests/`、`.github/workflows/` | `GPL-2.0-only` | 与上游 ImmortalWrt / OpenWrt 构建系统与基础脚本保持一致 | [GPL-2.0-only.txt](GPL-2.0-only.txt) |
| `themes/`、`packages/luci-app-cyrenet-*/` | `Apache-2.0` | 与上游 LuCI 及 `luci-theme-argon` 保持一致；独立安装包通过 UCI / ubus / rpcd 边界通信，不与 `GPL-2.0-only` 二进制静态链接 | [Apache-2.0.txt](Apache-2.0.txt) |
| `docs/`、根与各目录 `*.md`、`manifests/`、`release/`、`.github/pull_request_template.md`、`.github/CODEOWNERS` | `Apache-2.0` | 文档、Schema 与发布元数据 | [Apache-2.0.txt](Apache-2.0.txt) |
| `.gitignore`、`.gitattributes`、`.editorconfig`、`REUSE.toml`、`**/.gitkeep` | `CC0-1.0` | 仓库基础设施与无版权门槛的空白占位文件 | [CC0-1.0.txt](CC0-1.0.txt) |

> **关键边界：**
> 1. `GPL-2.0-only` 与 `Apache-2.0` 之间**不得进行静态链接或源码级混编**。若在 `packages/` 下新增或派生源自 `GPL-2.0-only` 上游组件的脚本或程序，必须在该文件顶部显式标注 `SPDX-License-Identifier: GPL-2.0-only`，并与 `Apache-2.0` 代码保持清晰的包/进程边界。
> 2. 文件内的显式 `SPDX-License-Identifier` 头部优先级高于 [REUSE.toml](../REUSE.toml) 的目录默认映射。

## 2. 标准 SPDX 文件头写法

所有新建源码、脚本、配置模板和文档文件，应在文件头部标注 SPDX 标识与版权归属：

### Shell / Python / Makefile / YAML / Config

```text
# SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
# SPDX-License-Identifier: GPL-2.0-only
```

（若位于 `manifests/`、`packages/luci-app-cyrenet-*/` 等 `Apache-2.0` 目录，则将第二行替换为 `Apache-2.0`。）

### JavaScript / CSS

```css
/*
 * SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
```

### Lua

```lua
-- SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
-- SPDX-License-Identifier: Apache-2.0
```

### Markdown

```markdown
<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->
```

## 3. 第三方组件与上游派生声明

- **第三方软件包与内核模块**：受各自上游许可证约束，不适用统一覆盖声明。所有预装或集成的第三方组件必须在 `manifests/bom/` 中独立记录其准确 `license`、来源仓库与提交哈希（参见 [PROJECT.md](../PROJECT.md) §16.4）。
- **Argon 主题派生**：`themes/luci-theme-cyrenet` 基于 `jerrykuku/luci-theme-argon`（`Apache-2.0`）二次开发，必须完整保留上游版权声明与许可证文本。
- **非官方与品牌归属声明**：Cyrenet OS 为独立社区衍生发行版，与 ImmortalWrt 官方、OpenWrt 官方及《崩坏：星穹铁道》版权方均无任何授权、背书或从属关系（参见 [PROJECT.md](../PROJECT.md) §16.5）。
