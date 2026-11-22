<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

# GitHub Actions 工作流规划（`.github/workflows/`）

本目录托管 Cyrenet OS 的持续集成、自动化测试与 Serverless OTA 发布流水线（工作流 YAML 默认适用 `GPL-2.0-only`）。

## 规划中的 9 个工作流（对应 PROJECT.md §12.3）

| 序号 | 工作流 | 状态 | 核心目的 | 计划引入里程碑 |
|---|---|---|---|---|
| 1 | **Source Check** | 计划中 | 检测 ImmortalWrt 与 feeds 上游更新（仅通知/开 PR，不自动发版） | M5 |
| 2 | [`dependency-audit.yml`](dependency-audit.yml) (**Dependency Audit**) | **已实现** | 严格校验 `upstream.lock.yaml`、BOM 字段与许可证、SPDX 头、`ShellCheck`、防密钥泄露与 M0 单元测试 | M0 Step 4 |
| 3 | **Package Build** | 计划中 | 使用 OpenWrt SDK 独立编译自研 `luci-app-cyrenet-*` 与 `luci-theme-cyrenet` APK | M2 / M5 |
| 4 | **Firmware Build** | 计划中 | 按 `Core` / `Standard` / `Extended` Profile 矩阵构建固件镜像 | M5 |
| 5 | **Smoke Test** | 计划中 | 基于 QEMU/KVM 验证启动、WebUI、SSH、DHCP 与基础服务 | M1 / M5 |
| 6 | **Integration Test** | 计划中 | 验证 DNS 双引擎切换回滚、防火墙规则、备份恢复与 OTA 防错 | M4 / M5 |
| 7 | **Release Candidate** | 计划中 | 生成 `Nightly` / `Beta` 候选版本与校验日志 | M5 |
| 8 | **Stable Release** | 计划中 | 经 GitHub Environment 人工批准门禁后正式发布 `Stable` | M5 / M7 |
| 9 | **OTA Manifest** | 计划中 | 生成并签名 OTA `manifest.json`，部署至 GitHub Pages（`gh-pages`） | M5 |

> **资源与安全约束（PROJECT.md §12.4 / §16.2）：** 标准 Runner 下需分离自研包构建与镜像组装（SDK + ImageBuilder 优先），正式签名与发布权限与构建步骤严格分离，且不得仅因上游源码变化就自动触发 Stable 发布。
