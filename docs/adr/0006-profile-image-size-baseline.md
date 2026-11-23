<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

# ADR-0006：三档 Profile 镜像体积基线与 RootFS 分区预算

- **状态**：`Accepted`（M1 实测基线已建立；M2–M3 合入自研包后需持续复核）
- **日期**：`2026-11-23`
- **关联文档**：`PROJECT.md` §3 / §21.2（`V-06`）、`DESIGN.md` §7、`config/common.config`、[M1 Alpha 测试报告](../test-reports/m1-alpha-report.md)

---

## 1. 背景与问题（Context）

Cyrenet OS 规划了 `core`、`standard` 与 `extended` 三档定位不同的 x86_64 UEFI 固件 Profile（对应 `V-06`）。在 M1 阶段之前，仓库在 `config/common.config` 中预设了 `CONFIG_TARGET_ROOTFS_PARTSIZE=300`（300 MiB），但尚无真实全量编译下的镜像体积与 Manifest 包数量数据，无法评估后续 M2（Argon 主题 Fork、D1 UI、基础 LuCI 应用）与 M3（AdGuard Home、SmartDNS、OpenClash 等）预装组件合入后的分区余量及发布体积阈值。

---

## 2. 决策内容（Decision）

1. **维持统一 RootFS 分区预算**：
   - 保持 `config/common.config` 中的 `CONFIG_TARGET_ROOTFS_PARTSIZE=300`（300 MiB）作为三档 Profile 的统一基线。
2. **确立 M1 实测体积与包数量基线**：
   - `core`（`core-20261122-124445`，`270` 个 Manifest 包）：SquashFS `.qcow2` `26.81 MiB`、SquashFS `.img.gz` `26.17 MiB`、Ext4 `.img.gz` `30.90 MiB`、Ext4 `.qcow2.gz` `30.65 MiB`。
   - `standard`（`standard-20261122-131456`，`310` 个 Manifest 包）：SquashFS `.qcow2` `36.56 MiB`、SquashFS `.img.gz` `35.98 MiB`、Ext4 `.img.gz` `43.18 MiB`、Ext4 `.qcow2.gz` `42.97 MiB`。
   - `extended`（`extended-20261122-131919`，`351` 个 Manifest 包）：SquashFS `.qcow2` `37.31 MiB`、SquashFS `.img.gz` `36.71 MiB`、Ext4 `.img.gz` `44.15 MiB`、Ext4 `.qcow2.gz` `43.95 MiB`。
3. **设定后续里程碑体积软告警阈值（Soft Gate）**：
   - 单档 SquashFS 镜像（`squashfs-combined-efi.qcow2` 或 `.img.gz`）超过 **`80 MiB`** 时触发体积膨胀审查（检查是否误打包大体积非必需依赖或未压缩静态资源）。
   - 单档 Ext4 压缩镜像（`ext4-combined-efi.img.gz` 或 `.qcow2.gz`）超过 **`120 MiB`** 时触发体积审查。
4. **演进预留说明**：
   - M1 中 `standard` 到 `extended` 仅增长 `+41` 个包、SquashFS `.qcow2` 仅增长 `+0.75 MiB`，原因是 M3 重型组件（如 OpenClash + Mihomo 内核）及 Cyrenet 自研前端资产尚未在 M1 集成；当前距 `300 MiB` 分区上限及 `80 MiB / 120 MiB` 软阈值仍有充足冗余。

---

## 3. 影响与约束（Consequences）

- **正面影响**：为 M2/M3 阶段合入自研 UI 与扩展网络包提供了量化基准与充足的 Overlay 持久化空间，同时避免盲目放大镜像分区占用用户小容量引导盘空间。
- **工程约束**：若后续在 M3 集成扩展插件后任一镜像接近或超出软阈值，必须先审计依赖清单与资源体积；若确需调整 `PARTSIZE`，须更新 ADR 并重新验证 `sysupgrade` 分区升级兼容性（`V-02` / `ADR-0003`）。

---

## 4. 验证证据（Verification Evidence）

- **M1 全量构建与校验**：2026-11-22 HK ECS 编译三档产物并经本地 `(cd "$dir/images" && sha256sum -c SHA256SUMS.cyrenet)` 验证全部 `13/13 OK`（总计 `39/39 OK`），详见 [M1 Alpha 测试报告](../test-reports/m1-alpha-report.md) 第 1.1 节与第 3.1 节。
- **运行时启动验证**：Core `immortalwrt-x86-64-generic-squashfs-combined-efi.qcow2`（转 `.vmdk`）已于 VMware UEFI 环境完成实机启动验证。
