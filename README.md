<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

# Cyrenet OS

> **A Ripple of Connection.**  
> 基于 ImmortalWrt 的模块化、现代化、轻量级开源网络操作系统

## 项目定位

Cyrenet OS（暂定中文译名：昔涟网络操作系统）以 **ImmortalWrt `openwrt-25.12`（初始验证基线 25.12.2）** 为基础，采用原生 **APK** 软件包体系，初期以 **x86_64（UEFI）** 为正式目标平台（面向 Proxmox VE、KVM/QEMU 虚拟机与通用 x86_64 软路由）。

项目遵循 **KISS** 与 **上游优先** 原则：不重复实现 Linux/OpenWrt 原生协议栈，而通过模块化编排、统一的 `luci-theme-cyrenet` 视觉体系、自研管理套件与 Serverless OTA 发布体系，在保持 OpenWrt 透明性与可维护性的同时改善使用与运维体验。

## 发行版本规划（Build Profiles）

| Profile | 目标场景 | 核心特点 |
|---|---|---|
| **Core** | 普通家庭网络与轻量运维 | IPv4/IPv6、PPPoE/DHCP/DDNS、AdGuard Home / Adblock Fast 互斥切换、DNS Center、实时监控与流量统计、诊断、备份与 OTA |
| **Standard** | Homelab、NAS 与高级家庭网络 | 包含 Core 全部能力，增加 Tailscale、SmartDNS、OpenClash + Mihomo Core、SQM / CAKE、UPnP、STUN / NATMap、IPv6 服务发布中心、ACME 与性能策略 |
| **Extended** | 复杂组网与运维发烧友 | 包含 Standard 全部能力，增加 MWAN3 多 WAN、SyncDial 多拨、Prometheus Metrics Exporter 与历史监控支持（SFE 仅作独立实验构建） |

> 注：Profile 仅决定**预装软件包集合**；高级功能（如代理、UPnP、多拨、外部导出）默认关闭，由用户按需启用。

## 仓库目录结构

| 目录 / 文件 | 职责 |
|---|---|
| [`.github/`](.github/workflows/README.md) | CI 门禁、构建测试发布工作流、PR 模板与 `CODEOWNERS` |
| [`config/`](config/README.md) | 跨 Profile 共享的通用内核/目标配置及隔离的实验配置 |
| [`profiles/`](profiles/README.md) | `core`、`standard`、`extended` 增量配置与专属 Overlay |
| [`files/`](files/README.md) | 三 Profile 共用的根文件系统覆盖（`uci-defaults`、默认安全策略等） |
| [`packages/`](packages/README.md) | 原生 OpenWrt Feed 结构的自研管理软件包（`luci-app-cyrenet-*`） |
| [`themes/`](themes/README.md) | `luci-theme-cyrenet`（基于 Argon 3.x Fork） |
| [`patches/`](patches/README.md) | 经过审查的上游 ImmortalWrt 与 feeds 补丁 |
| [`manifests/`](manifests/README.md) | 上游 Commit 锁定（`upstream.lock.yaml`）、Profile BOM 与 JSON Schema |
| [`release/`](release/README.md) | OTA 公钥、发布模板与测试结论模板（Live OTA 清单由 CI 部署至 GitHub Pages） |
| [`scripts/`](scripts/README.md) | 配置拼装、校验与云编译/发布工具脚本 |
| [`tests/`](tests/README.md) | 单元测试、QEMU/PVE 冒烟测试与样本夹具 |
| [`docs/`](docs/README.md) | 架构决策记录（ADR）、子系统规格、部署恢复手册与测试报告 |

## 当前阶段

- **当前里程碑**：`M0：项目初始化与工程规范`（治理规则、SPDX 许可证体系、技术契约与目录骨架建设中）。
- **核心文档入口**：
  - [PROJECT.md](PROJECT.md) — V1.0 项目定稿书（冻结基线）
  - [DESIGN.md](DESIGN.md) — 技术契约、接口规范与工程待验证登记表
  - [AGENTS.md](AGENTS.md) — AI 辅助开发唯一权威规范
  - [CONTRIBUTING.md](CONTRIBUTING.md) — 分支模型、提交规范与高风险复核清单
  - [SECURITY.md](SECURITY.md) — 安全底线与漏洞披露流程
  - [LICENSES/README.md](LICENSES/README.md) — SPDX 拆分许可证说明

## 开源许可证与免责声明

- **许可证策略**：本项目采用按职责拆分的 SPDX / REUSE 许可证管理（详见 [LICENSES/README.md](LICENSES/README.md) 与 [ADR-0001](docs/adr/0001-licensing-and-spdx-strategy.md)）：
  - 核心构建、配置、Overlay、补丁与测试脚本默认采用 **`GPL-2.0-only`**（根目录 [LICENSE](LICENSE)）。
  - `themes/`、`packages/luci-app-cyrenet-*/`、文档与 Schema 默认采用 **`Apache-2.0`**。
  - 仓库元数据与占位文件采用 **`CC0-1.0`**。
  - 第三方软件包严格遵循各自上游许可证，并在 `manifests/bom/` 中独立登记。
- **非官方衍生声明**：Cyrenet OS 为独立开源社区衍生项目，与 ImmortalWrt 官方、OpenWrt 官方及《崩坏：星穹铁道》版权方均无授权或合作关系。
