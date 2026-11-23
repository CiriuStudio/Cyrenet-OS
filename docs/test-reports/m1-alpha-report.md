<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

# M1 Alpha 构建与基础启动验收测试报告

> 本报告严格遵循 [测试报告模板](../../release/templates/test-report-template.md) 与 `PROJECT.md` §17.4 诚实性准则：仅记录 M1 阶段实际观察到的构建产物、校验输出与实机/虚拟机测试结论；所有未运行场景均显式标注为 `Not Run`。

---

## 1. 构建与测试元数据

| 项目 | 数值 / 状态 |
|---|---|
| 发布版本 / 里程碑 | M1 Alpha（基线配置：`a7fdab3`） |
| 覆盖 Profile | `core`、`standard`、`extended` |
| 上游版本与 Commit SHA | ImmortalWrt `v25.12.2`（`4fc16f2985a358bd43bb522e43f05395fcbd6ed5`，`r38135-0c4cd0f9920a`）；LuCI `d6167ea0`（`branch 26.249.28459~d6167ea`） |
| 内核版本 | Linux `6.12.103` |
| 实测 Kernel Vermagic | Core: `25d2fa69aefe9aaa919af7db9c43c8c8` / Standard: `022b2343f60bda01562cb90d157c71d9` / Extended: `9432e987562971d806911322094ae4af`（官方 `25.12.2` `profiles.json` 基线：`0413601b1c3f0490e17f340fe09229ea`） |
| 包管理器体系 | `APK`（ADB 压缩格式） |
| 构建主机环境 | Hong Kong Cloud ECS（`Ubuntu 26.04.1 LTS`，`GCC 15.2.0`，32 vCPU / 60 GiB RAM） |
| 测试日期 | 2026-11-22（全量构建与 SHA256 校验）～ 2026-11-23（Core VMware 实机引导） |
| 测试执行人 | Cyrenet OS 项目维护者 + AI 辅助工程验证 |

### 1.1 M1 构建耗时、包数量与产物规格明细

| Profile | 构建批次 ID | 构建耗时 | Manifest 包数量 | SquashFS UEFI `.qcow2` 大小 | SquashFS `.img.gz` 大小 | Ext4 `.img.gz` 大小 | Ext4 `.qcow2.gz` 大小 |
|---|---|---|---|---|---|---|---|
| `core` | `core-20261122-124445` | `16:31.82`（冷构建） | `270` | `26.81 MiB` | `26.17 MiB` | `30.90 MiB` | `30.65 MiB` |
| `standard` | `standard-20261122-131456` | `3:37.92`（热缓存） | `310` | `36.56 MiB` | `35.98 MiB` | `43.18 MiB` | `42.97 MiB` |
| `extended` | `extended-20261122-131919` | `3:02.76`（热缓存） | `351` | `37.31 MiB` | `36.71 MiB` | `44.15 MiB` | `43.95 MiB` |

Core 关键镜像实测 SHA256 摘要：

- `immortalwrt-x86-64-generic-squashfs-combined-efi.qcow2`：`cbd7600a240d513b8f5419a6d5384fc35374d4cd3f1bf6abb9697a673f6c9349`
- `immortalwrt-x86-64-generic-squashfs-combined-efi.img.gz`：`023d572b027adeb3cb0910a0c46d002cfa532a231b80f67b260abc1ec19920f8`
- `immortalwrt-x86-64-generic-ext4-combined-efi.img.gz`：`58d088ce7c34ce7a044ee75a310db568e30b240783be5c64f04978807bfe36c2`
- `immortalwrt-x86-64-generic-ext4-combined-efi.qcow2.gz`：`66cf3f18473ea3c95e5579ce5da765f6a9f23b4e7b652a04fe71f235176bff48`

---

## 2. 支持与实测的平台

| 平台 / 硬件形态 | 实测镜像与方式 | 结果 | 备注 / 观测摘要 |
|---|---|---|---|
| VMware Virtual Platform（UEFI） | Core `squashfs-combined-efi.qcow2` 转 `.vmdk` | **Passed** | `12th Gen Intel(R) Core(TM) i5-12600KF x 1C 2T` (`3686.401MHz`)，`x86/64`，Kernel `6.12.103`，成功进入中文 LuCI 界面，运行时间 `0h 1m 58s`，平均负载 `0.08, 0.02, 0.00`，CPU `0%` |
| Proxmox VE / QEMU KVM 直启 | — | **Not Run** | 待后续里程碑完成独立 PVE/KVM 测试 |
| 物理裸机（N100 / N5105 / 通用 x86_64） | — | **Not Run** | 待真机网卡驱动与多网口场景验收 |
| Standard / Extended 运行时引导 | — | **Not Run** | M1 已验证全量编译与 SHA256 完整性，运行时启动尚未单独执行 |

---

## 3. 测试执行结果汇总

### 3.1 构建与静态校验

| 检查项 | 执行命令 / 依据 | 结果 | 实测说明 |
|---|---|---|---|
| `core` 全量固件编译 | `scripts/build/`（HK ECS，冷构建） | **Passed** | `Exit status: 0`，生成 13 项构建产物与 APK 仓库（`270` 个包） |
| `standard` 全量固件编译 | `scripts/build/`（HK ECS，热缓存） | **Passed** | `Exit status: 0`，生成 13 项构建产物（`310` 个包） |
| `extended` 全量固件编译 | `scripts/build/`（HK ECS，热缓存） | **Passed** | `Exit status: 0`，生成 13 项构建产物（`351` 个包） |
| 镜像产物完整性校验 | `(cd "$dir/images" && sha256sum -c SHA256SUMS.cyrenet)` | **Passed** | 三档 Profile 均实现 `13/13 OK`（合计 `39/39 OK`） |
| 仓库规范与 Schema 审计 | `python3 scripts/lint/check-repo.py --strict` | **Passed** | `Repository audit PASSED (files=72, schemas=3, strict=True)` |

### 3.2 核心功能验证

| 测试项 | 覆盖范围 | 结果 | 实测说明 |
|---|---|---|---|
| UEFI 引导与内核初始化 | `core` SquashFS Combined EFI | **Passed** | VMware UEFI 顺利完成内核 `6.12.103` 初始化并进入系统 |
| 原生 LuCI 管理界面访问 | `core` 镜像默认 Web 管理 | **Passed** | 正常加载中文 LuCI 系统概览页，系统时间、负载与内存状态显示正常 |
| 系统稳定性初步观测 | `core` 启动后 2 分钟窗口 | **Passed** | 运行 `0h 1m 58s`，平均负载 `0.08, 0.02, 0.00`，CPU `0%` |
| PPPoE / DHCP / 静态 IPv4 WAN 拨号 | WAN 接入链路 | **Not Run** | M1 仅验证基础引导与 LuCI 可达，未接真实上游 WAN 链路 |
| IPv6-PD 前缀下发与客户端连通性 | 双栈基础组网 | **Not Run** | 待后续网络基线验证 |
| 预装高级服务默认关闭审计 | Standard / Extended 首启服务状态 | **Not Run** | 已基于 APK 包内部脚本核实服务名并新增 `99-cyrenet-defaults`，待重编后实机验证 |

### 3.3 扩展模块 / 运维验证

| 测试项 | 覆盖范围 | 结果 | 实测说明 |
|---|---|---|---|
| SquashFS + Overlay vs Ext4 升级/扩容 | `sysupgrade` 保留配置行为 | **Not Run** | 涉及 `V-02`，待 M1/M5 专项升级测试 |
| AdGuard Home / Adblock Fast / SmartDNS 切换 | DNS 模式切换与互斥 | **Not Run** | 计划于 M2–M3 执行 |
| OpenClash 集成与 `firewall4` 兼容性 | 代理模式兼容链路 | **Not Run** | 计划于 M3 执行 |
| OTA 在线升级与公钥签名校验 | `luci-app-cyrenet-updater` | **Not Run** | 计划于 M5 执行 |
| 配置加密备份与跨版本迁移 | `luci-app-cyrenet-backup` | **Not Run** | 计划于 M4 执行 |

---

## 4. 已知问题

1. **三档 Profile `vermagic` 不一致（`V-07`）**：
   - 实测 `core`（`25d2fa69...`）、`standard`（`022b2343...`）与 `extended`（`9432e987...`）因启用的内核模块组合不同，生成了互不相同的 `vermagic` 哈希，且均与 ImmortalWrt 官方 `25.12.2` `profiles.json`（`0413601b...`）不同。
   - **处置方案**：已制定 [ADR-0007](../adr/0007-kernel-abi-and-vermagic-unification.md)，并在 `config/common.config` 中将共享差异 `kmod` 统一为 `=m` 基线；该统一效果**尚待下一轮全量编译实测验证**。
2. **M1 首轮产物仍显示上游默认品牌标识**：
   - VMware 实测画面显示主机名为 `ImmortalWrt`，因 M1 首轮编译尚未在 `config/common.config` 启用 `CONFIG_VERSIONOPT=y` 品牌配置及注入 `99-cyrenet-defaults`。
   - **处置方案**：已在 M1 收尾变更中补充 `CONFIG_VERSION_DIST="Cyrenet OS"` 与首次启动初始化脚本 `files/etc/uci-defaults/99-cyrenet-defaults`。
3. **Standard / Extended 首启默认关闭策略待运行态实测**：
   - 通过解压检索 M1 产出的 APK 仓库确认了实际 `init.d` 服务名（`adblock-fast`、`adguardhome`、`ddns`、`tailscale`、`smartdns`、`sqm`、`miniupnpd`、`natmap`、`mwan3`、`collectd`、`prometheus-node-exporter-lua`；`acme-acmesh` 无守护脚本），并以此编写 `99-cyrenet-defaults`，但运行态尚未在 Standard/Extended 镜像上开机验证。
4. **M1 验收覆盖范围限制**：
   - 本阶段仅在 VMware 平台完成 Core 镜像的 `.qcow2` -> `.vmdk` 启动验收，Standard / Extended 启动、PVE/KVM、物理裸机多网卡及 `sysupgrade` 升级流程均尚未测试。

---

## 5. 阻塞正式发布的风险

| 风险项 | 严重程度 | 当前状态 | 缓解措施 |
|---|---|---|---|
| 不同 Profile 间内核 `vermagic` 不一致导致共享 APK 软件源 `kmod` 无法跨档安装 | **High** | 方案已提交，待下轮构建验证 | 通过 `ADR-0007` 将公共可选 `kmod` 统一为 `=m`，并要求构建脚本采集 `.vermagic` |
| SquashFS 与 Ext4 在 `sysupgrade` 扩容及配置保留中的行为差异尚未验证（`V-02`） | **Medium** | **Not Run** | 在 M2–M5 阶段于独立 PVE/QEMU 环境中完成双格式升级矩阵验证，补齐 `ADR-0003` |
| M1 尚无自研主题 `luci-theme-cyrenet` 与自研管理包，尚未验证预装扩展服务首次启动默认禁用是否 100% 生效 | **Medium** | 已合入首启脚本，待运行态验证 | M2 首轮构建后在 QEMU/VMware 中同时核验 Core/Standard/Extended 运行态服务列表 |

---

## 6. 性能对照记录

- **M1 Alpha 阶段未执行吞吐量、CAKE SQM 或 PPS 压测**，所有网络性能指标均为 `Not Run`（严禁填写未实测性能数据）。
- 仅记录 VMware Core 镜像静态系统状态基线（见 `PROJECT.md` 与用户实测截图回传）：
  - 主机型号：`VMware, Inc. VMware Virtual Platform`（`12th Gen Intel(R) Core(TM) i5-12600KF x 1C 2T @ 3686.401MHz`）
  - 实测启动后状态：运行时间 `0h 1m 58s`，平均负载 `0.08, 0.02, 0.00`，CPU 使用率 `0%`。
