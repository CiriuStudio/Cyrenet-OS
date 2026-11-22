<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 自研 OpenWrt 软件包目录（`packages/`）

本目录采用标准 OpenWrt Package Feed 组织形式（构建时通过 `src-link` 挂载），使完整 Buildroot 与独立 SDK 均可直接编译产出 `.apk` 软件包。

## 许可证约定

- Cyrenet 自研应用包（含 `luci-app-cyrenet-*` 及 `packages/` 下其他自研包）以 **`GPL-3.0-only`** 为主：**当包或源码文件内有特定显式 `SPDX-License-Identifier` 标注时优先按显式标注执行，否则均默认为 `GPL-3.0-only`**（详见 [ADR-0001](../docs/adr/0001-licensing-and-spdx-strategy.md) 与 [REUSE.toml](../REUSE.toml)）。
- 如引入或派生源自 `GPL-2.0-only` 的上游组件或内核相关脚本，必须在对应包目录与源码头显式标注 `SPDX-License-Identifier: GPL-2.0-only`，且不得将 `GPL-3.0-only` / `Apache-2.0` 模块与 `GPL-2.0-only` 二进制静态链接。

## 计划自研包清单（对应 PROJECT.md §10 与 UIDESIGN.md §2.2）

> 自研包的前端页面源码维护于 `ui/`，在构建期通过 Vite 编译为纯静态 JS/CSS 资产后打入对应软件包，路由器端不运行 Node.js 或任何构建工具链。

| 包名 | 职责 | 计划里程碑 |
|---|---|---|
| `luci-app-cyrenet-dashboard` | 实时状态摘要、流量曲线与网络健康首页 | M2 |
| `luci-app-cyrenet-dns` | DNS Center（AdGuard Home / Adblock Fast 互斥切换、SmartDNS 与 OpenClash 冲突检查） | M2 / M3 |
| `luci-app-cyrenet-network` | IPv6 服务发布中心、STUN/NATMap 状态整合 | M3 |
| `luci-app-cyrenet-performance` | 性能模式编排、SQM/CAKE 入口、加速冲突检测 | M3 / M6 |
| `luci-app-cyrenet-diagnostics` | 分层网络诊断、健康检查与脱敏故障报告导出 | M4 |
| `luci-app-cyrenet-backup` | 全量/模块化配置备份、加密、Schema 迁移与恢复预览 | M4 |
| `luci-app-cyrenet-updater` | Serverless OTA 检查、验签、预检、备份与受控升级 | M5 |

## 每个自研包必须满足（PROJECT.md §10.1）

1. 标准 OpenWrt `Makefile`（使用 `Tab` 缩进）与明确依赖清单；
2. 遵循最小权限的 `rpcd` ACL（`root/usr/share/rpcd/acl.d/`）；
3. 标准日志规范、错误处理与失败回滚逻辑；
4. 干净的卸载与恢复默认行为，且不得破坏原生 LuCI/UCI/ubus 接口；
5. 配套单元或集成测试用例。
