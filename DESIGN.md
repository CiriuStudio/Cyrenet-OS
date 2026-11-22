<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

# DESIGN.md — Cyrenet OS 工程技术契约与架构总览

本文件定义 Cyrenet OS 在 [PROJECT.md](PROJECT.md)（V1.0 冻结产品基线）之下的工程实施契约、跨模块接口标准与待验证技术登记表。后续不复述产品需求，仅约定各模块必须共同遵守的技术边界。

---

## 1. 系统分层与仓库目录映射（对应 PROJECT.md §1.2 / §11.1）

| 系统层 | 核心职责 | 仓库映射目录 | 默认 SPDX 许可证 |
|---|---|---|---|
| **ImmortalWrt 基础系统** | 协议栈、`netifd`、`firewall4`、APK 包管理、内核与驱动 | `manifests/upstream.lock.yaml`、`patches/`、`config/`、`files/` | `GPL-2.0-only` |
| **Cyrenet Feature Layer** | 第三方服务编排、启停控制、依赖与冲突检测 | `profiles/`、`packages/luci-app-cyrenet-{dns,network,performance}/` | 配置文件 `GPL-2.0-only` / 自研包 `Apache-2.0` |
| **Cyrenet LuCI** | 统一视觉语言、Dashboard、菜单信息架构 | `themes/luci-theme-cyrenet/` | `Apache-2.0` |
| **Cyrenet Management** | 实时监控、网络诊断、脱敏报告、配置备份与 OTA | `packages/luci-app-cyrenet-{diagnostics,backup,updater}/` | `Apache-2.0` |
| **Cyrenet Build & Release** | 配置合并、BOM 审计、CI/CD 测试构建与 Serverless OTA | `scripts/`、`.github/workflows/`、`manifests/`、`release/`、`tests/` | 构建/测试 `GPL-2.0-only` / 元数据 `Apache-2.0` |

---

## 2. 构建与 Profile 组合模型（对应 PROJECT.md §3 / §12）

项目采用**单仓库、分层片段组合**模式生成三个发行 Profile（`core`、`standard`、`extended`），避免三份全量 `.config` 长期漂移：

### 2.1 `.config` 分层合并链

1. **基础层**：`config/common.config`（`x86_64`、UEFI、基础文件系统、APK、原生网络栈与共有基础组件）。
2. **Profile 增量层（严格继承）**：
   - `core` = `config/common.config` + `profiles/core/profile.config`
   - `standard` = `core` + `profiles/standard/profile.config`
   - `extended` = `standard` + `profiles/extended/profile.config`
3. **规范化落地**：拼装脚本将合并后的片段输入 ImmortalWrt Buildroot 并执行 `make defconfig`，确保所有隐含内核与包依赖由上游 Kconfig 唯一解析。
4. **实验特性物理隔离**：SFE 等实验性内核配置独立存放于 `config/experimental/`，**禁止**合入常规 `common.config` 或三套稳定 Profile；实验镜像必须在版本号、`CYRENET_EXPERIMENTAL` 字段和发布通道中明确隔离标识。

### 2.2 RootFS Overlay 合并链

- 通用默认策略放置于 `files/`（如初始安全策略、`uci-defaults` 初始化脚本、版本标识模板）。
- Profile 专属覆盖放置于 `profiles/<profile>/files/`，按 `files/` → `profiles/<profile>/files/` 顺序叠加到构建目录。
- 所有 `files/` 中的脚本不得预置通用管理员密码、私人凭据或硬编码特定网卡/PCIe 拓扑。

### 2.3 本地 OpenWrt Feed 挂载

- `packages/` 与 `themes/` 均按标准 OpenWrt Package Feed 目录结构组织（每个子目录包含规范 `Makefile`）。
- 构建阶段通过 `feeds.conf` 的 `src-link` 方式本地挂载，使完整 Buildroot 编译与基于 SDK 的独立 APK 编译共享同一套包定义。

---

## 3. 固件标识契约（`/etc/cyrenet-release`）

所有 Cyrenet OS 固件必须在根文件系统中生成机器可读的身份文件 `/etc/cyrenet-release`（`KEY="value"` 格式，供 OTA 客户端、备份中心、诊断报告与 LuCI 首页统一读取）：

```ini
CYRENET_VERSION="1.0.0"
CYRENET_CHANNEL="nightly"
CYRENET_PROFILE="core"
CYRENET_TARGET="x86/64"
CYRENET_IMAGE_TYPE="generic-squashfs-combined-efi"
CYRENET_BUILD_ID="20261122-001"
CYRENET_CONFIG_SCHEMA="1"
CYRENET_UPSTREAM_VERSION="25.12.2"
CYRENET_UPSTREAM_COMMIT="<40-char-sha>"
CYRENET_FEEDS_LOCK_SHA256="<64-char-sha256>"
CYRENET_KERNEL_VERSION="<kernel-version>"
CYRENET_KERNEL_ABI="<abi-string>"
CYRENET_EXPERIMENTAL="false"
```

### 字段约束

| 字段 | 允许值与说明 |
|---|---|
| `CYRENET_VERSION` | 语义化版本 `Major.Minor.Patch`（可带 `-alpha.N` / `-rc.N` / `-nightly.YYYYMMDD` 预发布后缀） |
| `CYRENET_CHANNEL` | `nightly` \| `beta` \| `stable`（实验性构建可加前缀或由 `CYRENET_EXPERIMENTAL` 阻断常规自动更新） |
| `CYRENET_PROFILE` | `core` \| `standard` \| `extended` |
| `CYRENET_TARGET` | V1.0 固定为 `x86/64` |
| `CYRENET_CONFIG_SCHEMA` | 正整数字符串（从 `1` 起步），标识当前系统自研配置 Schema 版本 |
| `CYRENET_EXPERIMENTAL` | `false` \| `sfe`（非 `false` 时，稳定通道 OTA 客户端必须拒绝与常规 Stable 镜像混刷） |

---

## 4. 配置 Schema 与备份迁移契约（对应 PROJECT.md §14）

### 4.1 UCI 命名空间约定

- Cyrenet 自研组件统一使用 `cyrenet_<module>` 作为 UCI 配置名（例如 `cyrenet_dns`、`cyrenet_updater`、`cyrenet_backup`、`cyrenet_network`、`cyrenet_performance`、`cyrenet_monitor`），禁止直接侵入或改写原生配置语义。
- 每个 `cyrenet_*` UCI 配置文件必须包含全局节记录 `option schema_version '1'`，以便迁移器准确识别配置版本。

### 4.2 备份归档元数据契约

`luci-app-cyrenet-backup` 导出的归档内必须包含顶层 `metadata.json`，字段约定如下：

```json
{
  "format_version": 1,
  "cyrenet_version": "1.0.0",
  "profile": "standard",
  "target": "x86/64",
  "config_schema_version": 1,
  "created_at": "2026-11-22T10:30:00Z",
  "mode": "full",
  "encrypted": true,
  "modules": ["network", "dhcp", "dns", "firewall", "cyrenet_dns"],
  "package_manifest_sha256": "<sha256>"
}
```

- **迁移原则**：跨 Schema 版本恢复时，必须经由显式版本化迁移器按步骤前向迁移，先备份当前配置并做预检，禁止直接盲目覆盖新版网络与防火墙文件；恢复失败时保留原配置并输出可定位日志。

---

## 5. 自研软件包与 Cyrenet LuCI 契约（对应 PROJECT.md §9 / §10）

### 5.1 自研软件包清单与标准布局

自研功能统一拆分到 `packages/` 下独立 APK 软件包（默认 `Apache-2.0`）：

- `luci-app-cyrenet-dns`（DNS 与广告过滤中心）
- `luci-app-cyrenet-updater`（OTA 与固件更新客户端）
- `luci-app-cyrenet-backup`（配置备份与迁移中心）
- `luci-app-cyrenet-diagnostics`（分层网络诊断与脱敏报告）
- `luci-app-cyrenet-network`（IPv6 服务发布中心与 NAT 映射状态）
- `luci-app-cyrenet-performance`（性能模式、SQM/加速入口与冲突提示）

标准目录结构约定：

```text
packages/luci-app-cyrenet-<name>/
├── Makefile
├── htdocs/luci-static/resources/   # LuCI 客户端 JS 视图（如有）
├── root/
│   ├── etc/uci-defaults/           # 幂等初始化脚本
│   ├── usr/libexec/rpcd/           # ubus / rpcd 后端执行脚本或二进制
│   └── usr/share/
│       ├── luci/menu.d/            # LuCI 菜单声明
│       └── rpcd/acl.d/             # 最小权限 ACL 定义
└── tests/                          # 单元/静态检查（亦可统一关联 tests/）
```

### 5.2 Cyrenet LuCI 主题与菜单契约

- `themes/luci-theme-cyrenet/` 基于 Argon 3.x Fork（保留 `Apache-2.0` 与上游版权信息）。
- **一级菜单信息架构**：统一整合为 `Overview`、`Network`、`Services`、`Performance`、`Diagnostics`、`System` 六个主入口，依据当前 Profile 与已安装软件包通过 `menu.d` `depends` 条件动态显示，不展示空白或不可用菜单。
- **离线可用与回退**：全部字体、图标与静态资源必须本地打包，禁止依赖公网 CDN；始终保留切换回原生 LuCI 主题（如 `luci-theme-bootstrap`）及通过 SSH/CLI 管理的应急通道。

---

## 6. 关键子系统接口契约

### 6.1 DNS Center 拓扑与事务切换（对应 PROJECT.md §5）

- **唯一主入口不变式**：同一时刻，客户端主 DNS 端口（默认 `:53`）**只允许存在唯一接管者**；`AdGuard Home` 与 `Adblock Fast` 可并存安装，但严格互斥接管。
- **逻辑模式**：
  - `adguardhome`：AdGuard Home 承担客户端 `:53` 入口，保留 `dnsmasq` 负责 DHCP 与必要本地域名解析（上游/反向分工在详设规格中锁定）。
  - `adblock-fast`：`dnsmasq` 承担客户端 `:53` 入口，`Adblock Fast` 管理过滤规则集。
  - `none`：关闭广告过滤，由 `dnsmasq` 提供基础 DNS 服务。
  - `smartdns`（Standard/Extended）：作为上游解析调度层加入转发链，由管理器显式编排端口避免回环。
  - **OpenClash 协同检测**：启用 OpenClash 时必须校验其 DNS 劫持、Fake-IP 与 TUN 配置，检测到端口抢占或解析回环风险时阻止危险切换并提示原因。
- **10 步事务切换与自动回滚**：切换必须严格按 `记录现态 → 校验目标已安装 → 检查端口与上游链 → 生成暂存配置 → 停冲突服务 → 启目标服务 → 验证本地解析 → 验证外网解析 → 提交配置 / 失败自动回滚` 执行，禁止无校验切换。

### 6.2 Serverless OTA 与防错契约（对应 PROJECT.md §13）

- **发布拓扑**：`GitHub Actions`（构建与签名） → `GitHub Releases`（固件二进制与校验产物） → `GitHub Pages`（`gh-pages` 分支托管签名后的 `manifest.json`，不污染 `main`）。
- **清单格式**：严格遵守 [`manifests/schemas/ota-manifest.schema.json`](manifests/schemas/ota-manifest.schema.json)。
- **10 步客户端验证流**：HTTPS 获取清单一并校验 → 数字签名验签（公钥预置在 `release/keys/` 并打入固件）→ SHA256 校验 → 目标架构匹配 → Profile 匹配（跨 Profile 禁止自动刷写）→ 镜像格式匹配 → `min_upgrade_version` 防降级检查 → 系统原生 `sysupgrade -T` 兼容性检查 → 升级前配置备份 → 用户显式确认后执行刷写。
- **断网/降级兜底**：支持本地上传固件完成同样的本地验签与兼容性检查。

### 6.3 分层网络诊断与脱敏契约（对应 PROJECT.md §10.4 / §10.8 / §15）

- **4 态诊断结论枚举**：所有诊断检查项只能返回 `ok`（正常）、`error`（异常）、`unknown`（无法判断）、`unsupported`（硬件/环境不支持），严禁将探测失败简单归咎为运营商故障或伪造为正常。
- **强制脱敏清单**：普通模式导出故障报告前，必须对账号凭据、PPPoE 密码、API Token、Tailscale 身份数据、代理订阅链接、私钥以及隐私设备标识实施脱敏，并向用户提供导出前预览。

---

## 7. 许可证边界与待验证事项登记表（对应 PROJECT.md §21.2）

- **许可证策略决议**：详见 [ADR-0001](docs/adr/0001-licensing-and-spdx-strategy.md)。
- **工程待验证事项登记表**（严禁以推测代替实测，每项完成后应沉淀对应 ADR）：

| 编号 | 待验证技术事项（PROJECT.md §21.2） | 目标里程碑 | 计划 ADR | 当前状态 |
|---|---|---|---|---|
| V-01 | 最终采用的 x86_64 镜像布局 | M1 | `ADR-0002` | 待验证 |
| V-02 | SquashFS + Overlay 与 Ext4 的升级行为差异 | M1 / M5 | `ADR-0002` | 待验证 |
| V-03 | AdGuard Home 与 dnsmasq 的稳定端口与切换方案 | M2 | `ADR-0003` | 待验证 |
| V-04 | SmartDNS 与 OpenClash 的 DNS 兼容性 | M3 | `ADR-0004` | 待验证 |
| V-05 | OpenClash 与 APK、内核及 firewall4 的依赖组合 | M3 | `ADR-0004` | 待验证 |
| V-06 | Core / Standard / Extended 三个 Profile 镜像大小 | M1–M3 | `ADR-0005` | 待验证 |
| V-07 | 软件包及内核 ABI 的版本锁定与混用防护方案 | M0 / M1 | `ADR-0006` | 待验证 |
| V-08 | 各类 x86 网卡与 PVE/KVM 虚拟化环境性能表现 | M1 / M6 | 测试报告 | 待验证 |
| V-09 | OTA 升级流程与系统分区的兼容性（含公钥轮换） | M5 | `ADR-0007` | 待验证 |
| V-10 | 配置备份恢复的跨版本 Schema 支持范围 | M4 | `ADR-0008` | 待验证 |
| V-11 | Argon 3.x Fork 的长期维护与上游同步成本 | M2 | `ADR-0009` | 待验证 |
| V-12 | 部分高级功能（Flow Offloading/BBR/多拨）的默认运行策略 | M3 / M6 | `ADR-0010` | 待验证 |
