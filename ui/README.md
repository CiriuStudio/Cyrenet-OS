<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

# Cyrenet 原创功能前端源码目录（`ui/`）

本目录用于托管基于 **React + TypeScript + shadcn/ui + Tailwind CSS v4 + Vite** 的自研功能页面源码（对应 [UIDESIGN.md](../UIDESIGN.md) 层 B 与 [ADR-0002](../docs/adr/0002-dual-layer-ui-architecture.md)）。

## 许可证约定

- 本目录自研业务源码默认采用 **`GPL-3.0-only`**（见 [REUSE.toml](../REUSE.toml)）。
- 纳入版本控制的 shadcn/ui 组件源码或其他第三方前端代码，应保留其原有显式 `SPDX-License-Identifier`（例如 `MIT`），以文件内显式标注优先。

## 运行与构建约束

1. **仅编译期运行 Vite/Node.js**：构建产出的纯静态 JS/CSS 资源打包进入 `packages/luci-app-cyrenet-*`；固件内**严禁**携带 `node_modules` 或运行 Node.js 服务器。
2. **D1 POC 前置门禁**：在全面开发业务功能（D3–D5）前，必须先完成 LuCI Shell + React Feature Islands 的 CSS 作用域隔离、Theme Bridge 同步与本地资产加载 POC 验证（`DESIGN.md` `V-13`）。
3. **无外网依赖**：不得引用任何远程 CDN 字体、图标或脚本。
