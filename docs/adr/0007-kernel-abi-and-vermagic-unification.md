<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

# ADR-0007：多 Profile 内核 ABI 与 Vermagic 统一方案

- **状态**：`Accepted`（设计定稿并已合入 `config/common.config`；跨 Profile 相同 `vermagic` 实测一致性待下一轮全量编译验证）
- **日期**：`2026-11-23`
- **关联文档**：`PROJECT.md` §2 / §21.2（`V-07`）、`DESIGN.md` §7、`config/common.config`、`scripts/build/merge-config.sh`、[M1 Alpha 测试报告](../test-reports/m1-alpha-report.md)

---

## 1. 背景与问题（Context）

ImmortalWrt `25.12.2` 采用 `APK` 包体系，所有内核态扩展包（`kmod-*`）在安装与依赖解析时均严格校验目标固件内核的 `vermagic` 哈希。M1 首轮三档独立全量编译产生了如下实测结果：

- ImmortalWrt `25.12.2` 官方发布 `profiles.json` vermagic：`0413601b1c3f0490e17f340fe09229ea`
- Cyrenet M1 `core`（`core-20261122-124445`）：`25d2fa69aefe9aaa919af7db9c43c8c8`
- Cyrenet M1 `standard`（`standard-20261122-131456`）：`022b2343f60bda01562cb90d157c71d9`
- Cyrenet M1 `extended`（`extended-20261122-131919`）：`9432e987562971d806911322094ae4af`

**问题根因**：`core`、`standard` 与 `extended` 之间对公共底层内核模块（如 `kmod-tun`、`kmod-sched-cake`、`kmod-tcp-bbr`、`kmod-macvlan` 等）的 `=m` / `=y` / 未选中差异导致最终内核构建时的配置指纹不同，从而生成了 3 个互不兼容的 `vermagic`，且均与上游官方源不一致。若三档镜像 `vermagic` 不统一，Cyrenet OS 无法共享同一套自建 `kmod` APK 软件源，也会导致跨档离线/在线补装模块失败。

---

## 2. 决策内容（Decision）

1. **在 `config/common.config` 中统一共享 `kmod-*` 模块基线（`=m`）**：
   - 将跨 Profile 涉及的关键可选内核模块统一声明为模块编译（`=m`）写入 `config/common.config`：
     - `CONFIG_PACKAGE_kmod-tun=m`
     - `CONFIG_PACKAGE_kmod-sched-cake=m`
     - `CONFIG_PACKAGE_kmod-tcp-bbr=m`
     - `CONFIG_PACKAGE_kmod-macvlan=m`
   - 继续保留 `CONFIG_PACKAGE_kmod-nft-offload=y` 作为基础防火墙加速模块预装项（首次启动策略仍默认关闭）。
2. **利用 `merge-config.sh` 的分层覆盖机制保持镜像精简**：
   - `core` 直接继承 `=m`，将上述 `kmod` 编译输出为独立的 `.apk` 模块包放入软件源而不默认写入 `core` 根文件系统镜像。
   - `standard` / `extended` 在各自 `profiles/<name>/profile.config` 中按需将对应项覆盖为 `=y` 实现镜像预装，从而在保留镜像分层的同时收敛内核配置空间。
3. **禁止跨源混用，强制自托管匹配软件源**：
   - 严禁将自编译 Cyrenet 固件直接指向 ImmortalWrt 官方 `25.12.2` 核心 `kmod` 源进行跨 `vermagic` 混装；所有 `kmod-*` 升级与按需安装必须使用与目标固件相同源码 Commit 与相同 `vermagic` 编译产出的 Cyrenet APK 仓库。
4. **构建产物 `.vermagic` 采集与断言规则**：
   - 后续构建流水线必须在每次内核编译后采集实际生成的 `.vermagic` 值并写入构建清单；跨 `core` / `standard` / `extended` 发布同一版本时，CI 应校验三档 `vermagic` 完全一致。

---

## 3. 影响与约束（Consequences）

- **正面影响**：消除了 `core` / `standard` / `extended` 在基础 `kmod` 选配上的碎片化根源，为后续统一维护单个共享 APK `kmod` 软件源及 OTA 模块兼容奠定工程基础。
- **约束与风险**：每当在任一高层 Profile 中新增会影响内核 `.config` 符号表的 `kmod-*` 或内核特性开关时，必须同步评估是否提升至 `config/common.config` 作为 `=m` 基线。
- **待闭环验证项**：由于发现该问题后尚未触发第二轮全量重编，**`config/common.config` 更新后三档 Profile 是否产出完全一致的 `vermagic` 目前标注为待下一轮构建实测确认**。

---

## 4. 验证证据（Verification Evidence）

- **问题实测发现**：M1 首轮编译产出的 manifest 与编译产物目录中明确观测到 `core`（`25d2fa69...`）、`standard`（`022b2343...`）、`extended`（`9432e987...`）以及官方 `25.12.2`（`0413601b...`）四者 `vermagic` 互不相同（见 [M1 Alpha 测试报告](../test-reports/m1-alpha-report.md) 第 1 节与第 4 节）。
- **配置统一验证（单元层面）**：`tests/unit/test_m0_tooling.py` 验证 `merge-config.sh` 在 `core` 保留 `=m` 且在 `standard`/`extended` 正确覆盖提升为 `=y`。
- **全量编译 `vermagic` 一致性验证**：`Not Run`（计划随 M2 首轮全量编译执行并补充实测 `vermagic` 记录）。
