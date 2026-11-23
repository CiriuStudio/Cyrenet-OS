<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

# ADR-0002: Cyrenet × M3 双层 UI 架构（方案 A 落地 / 方案 B 归档）

- **状态（Status）：** Accepted（V1.0 采用**方案 A**；**方案 B** 归档为后续进阶备选；D1 本地集成 POC 已验证）
- **日期（Date）：** 2026-11-23
- **关联章节（Related PROJECT.md Section）：** `§1.3 设计哲学`、`§9 Cyrenet LuCI 视觉系统`、`§10 自研系统组件`、`§21.2 V-11`

## 背景（Context）

[PROJECT.md](../../PROJECT.md) 第 9 章确定 Cyrenet OS 必须保留 LuCI 原生认证、菜单、ACL、第三方插件兼容性及本地静态资源运行特性，同时不另起独立的全栈 Web 服务器。与此同时，[UIDESIGN.md](../../UIDESIGN.md) 与后续视觉收敛引入了 **Material Design 3（M3）** 的分级表面（Surface Container）、按钮强调层级（Filled / Filled Tonal / Outlined / Text）与 Canonical Pane 排布规范，用于解决简单表单堆砌、视觉层次偏散的问题。

关于外壳层实现存在两条候选工程路线：

- **方案 A（V1.0 生效路线）**：层 A（`themes/luci-theme-cyrenet/`）遵循 ImmortalWrt 25.12 原生 LuCI `ucode` 规范，参考 Argon 3.x 的可折叠侧栏、顶栏与登录结构，直接基于共享 `--cn-*` Token 构建干净的原生 M3 LuCI 壳；所有自研功能页（层 B）则在内容区挂载独立 React + M3 Feature Islands。
- **方案 B（已归档 — 后续进阶备选）**：使用 React + M3 直接重写 Argon 导航壳（侧栏/Drawer/顶栏/搜索/主题切换），中间 `#maincontent` 在传统/第三方页直通 LuCI View，在自研页渲染 Feature Island。

## 决策（Decision）

正式采用 [UIDESIGN.md](../../UIDESIGN.md) 定义的 **Cyrenet × M3 双层 UI + 共享 Token** 架构，**V1.0 执行方案 A，方案 B 暂时归档保留**：

1. **层 A — 参考 Argon 结构的原生 M3 LuCI 壳层（方案 A，`themes/luci-theme-cyrenet/`，默认 `Apache-2.0`）**：
   - 基于 ImmortalWrt 25.12 原生 LuCI `ucode` 模板与共享 `--cn-*` Token（参考 Argon 3.x 布局结构，不再承担上游重历史 CSS 魔改），负责登录认证、全站明暗主题单一真源、M3 侧栏抽屉、顶栏与原生/第三方 LuCI 页面兼容（壳层零 React 依赖，首屏无额外 JS 闪烁）。
2. **层 B — Cyrenet 原创功能 UI 层（`ui/` → 静态构建至 `packages/luci-app-cyrenet-*`，默认 `GPL-3.0-only`，显式 SPDX 标注优先）**：
   - 采用 React + TypeScript + Radix/shadcn 无头原语（组件源码入库，保留原有 `MIT` 等显式 SPDX 声明）+ Tailwind CSS v4 + Vite 仅在 **CI 或开发机编译期** 打包为纯静态 JS/CSS 资产；
   - UI 布局与控件规范统一遵循 Cyrenet × M3（4 列 KPI 条、3 槽列表项、Filled/Tonal/Outlined/Text/Danger 按钮层级与 28px 高表面弹窗）；
   - 打包产物随 `luci-app-cyrenet-{dashboard,dns,updater,backup,diagnostics,network,performance}` 独立安装包进入固件；
   - 路由端仅通过 LuCI View 在内容区挂载独立容器（**React Feature Islands**）加载本地静态资产，**严禁在路由器上运行 Node.js / Vite / SSR 服务，严禁依赖外部 CDN**；
   - 数据读写统一经类型化 API Client 请求受 `rpcd` ACL 保护的原生 `ubus`/`UCI` 接口。
3. **层 C — 共享设计真源（`design/tokens/` 与 `design/assets/`，默认 `Apache-2.0`）**：
   - 在 `design/tokens/cyrenet.css` 统一维护 `--cn-*` 基础与 M3 Tonal 表面/容器变量（`--cn-surface-container-*`、`--cn-primary-container`、`--cn-secondary-container`、`--cn-outline*` 等）及原创涟漪/星轨矢量资产。
4. **归档保留的方案 B 备选（Archived / Post-V1.0 Future Evolution）**：
   - 若未来阶段需要让全站导航抽屉、全局过滤或交互转场也完全由 React 组件统一驱动，可在保持相同 `--cn-*` Token 与 LuCI `#maincontent` 插槽契约的前提下，另立新 ADR 评估并启用方案 B（需同步评估防闪烁内联脚本、无 JS 降级及 MPA 重载开销）。
5. **D1 POC 强制门禁**：
   - 在投入 D3–D5 大规模页面开发前，必须先通过 **D1 UI 集成 POC**（`DESIGN.md` `V-13`），实测验证 Vite hash 资产在 LuCI 中的加载路径、Tailwind v4 `@layer base` + `cn:` 作用域隔离（不覆盖按钮底色与边框、不破坏原生 LuCI 表单）、主题桥以及 Portal 弹窗焦点/层级兼容性。

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
  - **Tailwind CSS v4 `@layer base` + `cn:` 作用域隔离**：在 `ui/src/styles/index.css` 中显式声明 `@layer theme, base, utilities;`，将 `ui/src/styles/scoped-preflight.css`（`.cyrenet-ui-root` 基础重置）封装在 `@layer base` 内并置于 `@layer utilities` 之前（修复未分层重置覆盖按钮背景色与 `cn:border` 描边的实机问题），配合 `prefix(cn)` 与 `extendTailwindMerge({ prefix: "cn" })`；实测编译 CSS 未生成全局 `body{`、`html,`、`table{` 重置及 `:root{--background:` 泄漏。
  - **Portal 与主题桥接**：Radix Dialog 通过 `PortalProvider` 统一挂载于 `.cyrenet-ui-root` 内部的 `.cyrenet-portal-root`（M3 `28px` 圆角、`surface-container-high`）；`ThemeBridge` 通过 `MutationObserver`、`matchMedia` 与 `cyrenet:theme-change` 事件同步宿主的 `data-darkmode` / `data-cyrenet-theme` / `.dark`。
  - **静态产物与挂载路径**：`scripts/build/build-ui.sh` 以 `base: "./"`、`sourcemap: false`、`preserveEntrySignatures: "strict"` 构建并同步至 `packages/luci-app-cyrenet-dashboard/htdocs/luci-static/resources/cyrenet/`；D1 M3 升级版实测产物体积为 `manifest.json`（`0.20 kB`，gzip `0.14 kB`）、`poc-BvUuw_cL.css`（`23.38 kB`，gzip `4.82 kB`）、`poc-CWEQKLbz.js`（`330.07 kB`，gzip `102.50 kB`），CSS 与 JS 均无外部 CDN 资产加载；LuCI 视图 `view/cyrenet/poc.js` 提供资产失败时一键回退原生 LuCI 概览页的提示。
