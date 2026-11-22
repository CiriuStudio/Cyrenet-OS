<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

# Cyrenet OS 候选版本 / 里程碑测试结论报告模板

> **强制规范（PROJECT.md §17.4）：** 禁止将未运行的测试标注为通过；所有数据必须来自独立测试环境（PVE / QEMU / 独立测试机）的真实执行记录。

## 1. 构建与测试元数据

- **Cyrenet 版本：** `e.g. 1.0.0-alpha.1`
- **发行通道：** `Nightly | Beta | Stable`
- **Profile：** `Core | Standard | Extended`
- **目标架构与镜像类型：** `x86_64 / generic-squashfs-combined-efi`
- **实验标记：** `false | sfe`
- **上游 ImmortalWrt 基线与 Commit：**
- **测试日期（UTC）与测试人：**

## 2. 支持与实测的平台（Supported & Tested Platforms）

- **实测环境：**（例如：PVE 8.x KVM + VirtIO / PCIe Passthrough、实体软路由型号）
- **未测试平台：**

## 3. 测试执行结果汇总

### 3.1 通过的测试（Passed Tests）

| 测试类别（§17.2） | 用例说明 | 验证环境 | 实测结果摘要 / 日志引用 |
|---|---|---|---|
| | | | |

### 3.2 失败的测试（Failed Tests）

| 测试类别 | 用例说明 | 复现步骤与现象 | 严重程度 | 关联 Issue / PR |
|---|---|---|---|---|
| | | | | |

### 3.3 未验证的功能（Unverified Features / Not Run）

-

## 4. 已知问题（Known Issues）

-

## 5. 阻塞正式发布的风险（Blocking Release Risks）

- [ ] 无阻塞项（仅当所有验收门槛通过时可勾选）
- 阻塞项说明：

## 6. 性能对照记录（与原版 ImmortalWrt 对照，如适用）

- **对照版本：**
- **关键指标（吞吐 / PPS / 时延 / CPU SoftIRQ / SQM）：**
- **退化分析：**
