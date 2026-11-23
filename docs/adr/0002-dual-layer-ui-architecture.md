<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

# ADR-0002: Argon LuCI Shell + React/shadcn Feature Islands 双层 UI 架构

- **状态（Status）：** Accepted（D1 本地集成 POC 已通过；待 M2 固件 LuCI/Argon 实机验证）
- **日期（Date）：** 2026-11-22
- **关联章节（Related PROJECT.md Section）：** `§1.3 设计哲学`、`§9 Cyrenet LuCI 视觉系统`、`§10 自研系统组件`、`§21.2 V-11`

## 背景（Context）

[PROJECT.md](../../PROJECT.md) 第 9 章确定 Cyrenet OS 必须保留 LuCI 原生认证、菜单、ACL、第三方插件兼容性及本地静态资源运行特性，同时不另起独立的全栈 Web 服务器。与此同时，[UIDESIGN.md](../../UIDESIGN.md) 对视觉一致性、状态语义、复杂交互（如 DNS 事务切换步进、OTA 预检进度、脱敏报告预览、实时图表）提出了商业网络产品级别的交互要求：

- 单纯在 Argon 主题中大面积魔改传统 LuCI 表单，容易破坏原生页面与第三方插件（如 OpenClash、SmartDNS、SQM）的兼容；
- 将整站重写为独立 React SPA 又违背 `PROJECT.md` §9.1（破坏原生 LuCI 兼容、认证与回退能力）。

## 决策（Decision）

正式采用 [UIDESIGN.md](../../UIDESIGN.md) 定义的**双层 UI + 共享 Token** 工程架构，与原生 LuCI/rpcd 后端严格解耦：

1. **层 A — LuCI / Argon 壳层（`themes/luci-theme-cyrenet/`，默认 `Apache-2.0`）**：
   - Fork 锁定版 Argon 3.x（当前在 `manifests/upstream.lock.yaml` 暂定锁定 `v3.1.4`），负责登录认证、全站明暗主题单一真源、顶栏/侧栏导航以及原生与第三方 LuCI 页面兼容。
2. **层 B — Cyrenet 原创功能 UI 层（`ui/` → 静态构建至 `packages/luci-app-cyrenet-*`，默认 `GPL-3.0-only`，显式 SPDX 标注优先）**：
   - 采用 React + TypeScript + shadcn/ui（组件源码入库，保留原有 `MIT` 等显式 SPDX 声明）+ Tailwind CSS v4 + Vite 仅在 **CI 或开发机编译期** 打包为纯静态 JS/CSS 资产；
   - 打包产物随 `luci-app-cyrenet-{dashboard,dns,updater,backup,diagnostics,network,performance}` 独立安装包进入固件；
   - 路由端仅通过 LuCI View 在内容区挂载独立容器（**React Feature Islands**）加载本地静态资产，**严禁在路由器上运行 Node.js / Vite / SSR 服务，严禁依赖外部 CDN**；
   - 数据读写统一经类型化 API Client 请求受 `rpcd` ACL 保护的原生 `ubus`/`UCI` 接口。
3. **层 C — 共享设计真源（`design/tokens/` 与 `design/assets/`，默认 `Apache-2.0`）**：
   - 使用 `--cn-*` CSS 变量作为两层共同映射的唯一视觉源，禁止在业务代码中硬编码两套主题或照搬非 Cyrenet 品牌元素。
4. **D1 POC 强制门禁**：
   - 在投入 D3–D5 大规模页面开发前，必须先通过 **D1 UI 集成 POC**（`DESIGN.md` `V-13`），实测验证 Vite hash 资产在 LuCI 中的加载路径与 CSP、Tailwind v4 Preflight 作用域隔离、Argon 主题桥以及 Portal 弹窗焦点/层级兼容性。若 Feature Islands 在目标 LuCI 版本上无法稳定隔离，再触发同源受控静态页备选方案评估。

## 影响与权衡（Consequences）

- **正面收益**：既完整保留 LuCI 登录、ACL、原生/第三方插件页面及应急回退主题能力，又使自研核心业务界面具备一致的组件模型、状态语义与无障碍质量。
- **新增成本或限制**：构建链路需新增前端静态产物构建步骤（由 CI 或开发机完成并可产出供固件打包的静态资产），且必须严格维护 `.cyrenet-ui-root` CSS 隔离边界与浏览器最低兼容矩阵。
- **安全与兼容性影响**：路由器运行时零额外后台服务与零外网依赖；权限仍完全受控于 `rpcd` ACL；单页静态资源故障不影响基础网络与原生 LuCI/SSH 管理。

## 验证证据（Verification Evidence）

- **D1 POC 验证状态（2026-11-23）**：已完成最小化工程脚手架、生产态静态构建与自动化集成单元测试；真实 ImmortalWrt `25.12.2` 固件与 Argon Fork 实机浏览器验证尚未执行（`Not Run`，计划随 M2 构建开展）。
- **锁定的前端工具链版本（`ui/package-lock.json`）**：
  - 运行时：`react@19.3.1`、`react-dom@19.3.1`、`@radix-ui/react-dialog@1.3.1`、`@radix-ui/react-slot@1.5.0`、`lucide-react@0.475.0`、`tailwind-merge@3.7.1`、`clsx@2.1.1`、`class-variance-authority@0.7.1`
  - 构建与测试：`typescript@5.9.3`、`vite@6.4.6`、`@vitejs/plugin-react@4.7.0`、`tailwindcss@4.3.5`、`@tailwindcss/vite@4.3.5`、`vitest@3.2.7`
- **已验证的关键隔离方案**：
  - **Tailwind CSS v4 作用域隔离**：省略全局 `tailwindcss/preflight.css`，在 `ui/src/styles/index.css` 显式采用 `prefix(cn)` 与 scoped `.cyrenet-ui-root` 变量别名、`ui/src/styles/scoped-preflight.css`，配合 `extendTailwindMerge({ prefix: "cn" })`；实测编译 CSS 未生成全局 `body{`、`html,`、`table{` 重置及 `:root{--background:` 泄漏。
  - **Portal 与主题桥接**：Radix Dialog 通过 `PortalProvider` 统一挂载于 `.cyrenet-ui-root` 内部的 `.cyrenet-portal-root`；`ThemeBridge` 通过 `MutationObserver`、`matchMedia` 与 `cyrenet:theme-change` 事件同步宿主的 `data-darkmode` / `data-cyrenet-theme` / `.dark`。
  - **静态产物与挂载路径**：`scripts/build/build-ui.sh` 以 `base: "./"`、`sourcemap: false`、`preserveEntrySignatures: "strict"` 构建并同步至 `packages/luci-app-cyrenet-dashboard/htdocs/luci-static/resources/cyrenet/`；D1 POC 实测产物体积为 `manifest.json`（`0.20 kB`，gzip `0.14 kB`）、`poc-DgMVtAE6.css`（`18.31 kB`，gzip `4.05 kB`）、`poc-B7hTkRE_.js`（`320.72 kB`，gzip `100.30 kB`），CSS 与 JS 均无外部 CDN 资产加载；LuCI 视图 `view/cyrenet/poc.js` 提供资产失败时一键回退原生 LuCI 概览页的提示。
