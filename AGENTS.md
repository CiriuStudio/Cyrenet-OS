<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

# AGENTS.md — Cyrenet OS AI 辅助开发唯一权威规范

本文件是所有 AI Coding Agent（包括 Claude、Gemini、Codex 及其他自动化助手）在本仓库协作的**唯一权威操作规范（Single Source of Truth）**。`CLAUDE.md` 与 `GEMINI.md` 仅作入口指针，不维护重复规则。

---

## 1. 文档权威层级

当遇到设计决策或规范冲突时，按以下从高到低优先级裁决：

1. **[PROJECT.md](PROJECT.md)** — V1.0 产品与技术设计基线（**冻结基线**：未经明确授权，禁止修改产品范围、目标平台或核心选型）。
2. **[DESIGN.md](DESIGN.md)** — 工程技术契约与跨模块接口约定。
3. **[docs/adr/](docs/adr/)** — 经过验证并拍板的架构决策记录（ADR）。
4. **本文件（`AGENTS.md`）** — AI Agent 工程执行规则与安全红线。

---

## 2. 核心工程原则（对应 PROJECT.md §1.3 / §2 / §4）

1. **KISS 与上游优先**：基于 ImmortalWrt `openwrt-25.12`（基线 `25.12.2`）、`x86_64`（UEFI）与 `APK` 包体系开发；不重新实现 `netifd`、`ubus`、`rpcd`、`odhcp6c`、`odhcpd`、`dnsmasq-full`、`firewall4`、`nftables`、`iproute2` 等原生网络组件。
2. **预装不等于默认启用**：Profile 仅决定固件预装包集合；除基本组网（路由、DHCP、基础防火墙、DNS）与 L1 实时状态外，代理、UPnP、SQM、多拨/MWAN3、外部 Prometheus Exporter 等高级功能必须**默认关闭**。
3. **故障隔离**：广告过滤、代理、监控、主题等扩展模块故障时，不得破坏基础路由、DHCP、IPv4/IPv6 基本连通性或 SSH/原生 LuCI 登录能力。
4. **原生接口兼容**：`luci-theme-cyrenet` 与 `luci-app-cyrenet-*` 可深度定制界面，但必须保持 UCI、LuCI、ubus、rpcd ACL 与 CLI 管理完全可用；主题必须保留本地静态资源与原生 LuCI 回退路径。
5. **运行时能力检测**：严禁针对 N5105、N100、N305 或特定机器硬编码 CPU 策略、PCIe 设备编号、网卡名称或 WAN/LAN 端口映射；硬件传感器/加速等无法检测的指标标记为 `unsupported`/`unknown`，禁止伪造或显示为 `0`。

---

## 3. 开源许可证与 SPDX 强制规则（对应 ADR-0001）

仓库采用按职责拆分的 SPDX / REUSE 许可证体系（详见 [LICENSES/README.md](LICENSES/README.md) 与 [REUSE.toml](REUSE.toml)）：

- **`GPL-2.0-only`**：`config/`、`profiles/`、`files/`、`patches/`、`scripts/`、`tests/`、`.github/workflows/` 及核心构建相关文件。
- **`Apache-2.0`**：`themes/`、`packages/luci-app-cyrenet-*/`、`docs/`、`*.md`、`manifests/`、`release/`。
- **`CC0-1.0`**：`.gitignore`、`.gitattributes`、`.editorconfig`、`REUSE.toml`、`**/.gitkeep`。
- **所有新建源码、脚本、配置、文档必须在头部包含 `SPDX-FileCopyrightText` 与 `SPDX-License-Identifier` 声明**。
- **严禁混编边界**：禁止将 `Apache-2.0` 与 `GPL-2.0-only` 代码静态链接；派生自 GPL 上游的文件必须显式标注 `GPL-2.0-only`。
- **第三方包独立登记**：第三方源码与包不得统一覆盖许可证，必须在 `manifests/bom/*.yaml` 中准确记录其上游 `license`、仓库与 Commit。

---

## 4. 目录职责与修改边界

- **禁止擅改 `PROJECT.md`**：若实现验证发现需调整基线（如 [PROJECT.md](PROJECT.md) §21.2 的 12 项待验证事项），应在 `docs/adr/` 起草 ADR 并更新 `DESIGN.md`，由项目维护者批准。
- **禁止污染 `main` 与静态区**：`config/experimental/`（如 SFE 实验内核）必须与稳定配置物理隔离；Live OTA `manifest.json` 由 CI 发布到 `gh-pages`，不直接写入 `main`。
- **换行与格式**：全仓严格使用 **LF** 换行符（见 [.gitattributes](.gitattributes) 与 [.editorconfig](.editorconfig)）；`Makefile` 与 `*.mk` 必须使用 `Tab` 缩进。
- **禁止入库项**：`upstream/`、`build_dir/`、`staging_dir/`、`bin/`、`dl/`、`*.img*`、`*.apk` 等构建产物；任何 `*.key`、`*.pem`、`*.priv`、`*.sec`、`.env*` 私钥与凭据。

---

## 5. 任务输入与交付报告规范（对应 PROJECT.md §20.2）

### 接收与拆解任务时必须明确

- 任务目标与涉及模块
- 输入与输出
- 允许修改的目录/文件范围
- 不得破坏的既有功能
- 测试方法与验收标准

### 完成任务后必须提交 7 项交付报告

1. **实际修改的文件**（精确路径）
2. **实现说明**（核心变更与设计原因）
3. **依赖变化**（含上游 Commit、Feeds 或 BOM 变更；无变化则显式说明）
4. **执行过的测试**（实际运行的命令与环境）
5. **测试结果**（真实输出；未执行的测试须明确标为 `Not Run`）
6. **已知问题**（遗留风险、未覆盖场景或待验证项）
7. **回滚或撤销方式**（具体的 `git revert` / 配置还原方式）

---

## 6. 绝对禁止行为（对应 PROJECT.md §20.3）

AI Agent **严禁**执行以下任何行为：

1. 未经授权升级全部依赖或随意解锁 `manifests/upstream.lock.yaml` 中的 Commit。
2. 擅自修改默认安全策略（如预置通用管理密码、放开默认拒绝策略）。
3. 擅自开放 WAN 口 LuCI、SSH、UPnP 或监控采集管理端口。
4. 将私钥、API Token、PPPoE 密码或开发者 Tailscale Auth Key 写入源码仓库或固件配置。
5. 为追求功能可用强制覆盖系统核心文件或绕过原生 `sysupgrade` / ABI 兼容性检查。
6. 忽略编译、校验或运行错误并声称任务成功。
7. 虚构测试报告、未运行测试标为通过、或编造未实测的 Commit SHA / 性能指标（如未实测的千兆 CAKE / PPS 数值）。
8. 用未经审查的第三方在线安装脚本（如 `curl | sh`）替换成熟原生机制或作为正式构建步骤。
9. 将实验性功能（如 SFE 内核、未验收代码）直接合入或发布到 Stable 通道。
10. 在生产主路由上执行未经独立 PVE/QEMU 环境验证的破坏性测试。

---

## 7. 高风险复核清单（对应 PROJECT.md §20.4）

涉及以下 7 类领域的代码与配置，必须遵循「需求分析 → 技术方案 → 实现 → 自动化测试 → 独立审查 → 修复 → 验收」流程，**不得仅凭 AI 生成结果认定安全或兼容**：

1. **OTA 更新与签名校验**（`luci-app-cyrenet-updater`、`release/`）
2. **DNS 模式切换与冲突检测**（`luci-app-cyrenet-dns`、AdGuard Home / Adblock Fast / SmartDNS / OpenClash 互斥链路）
3. **防火墙规则与 IPv6 公网服务发布**（`luci-app-cyrenet-network`、`firewall4` / `nftables`）
4. **配置备份、加密与跨版本迁移**（`luci-app-cyrenet-backup`、Schema 迁移器）
5. **权限控制与访问边界**（`rpcd` ACL、最小权限）
6. **外部下载、上游锁定与第三方软件包**（`manifests/`、`patches/`）
7. **构建与发布流水线**（`.github/workflows/`、`scripts/`）

---

## 8. 诚实校验准则

- 仅陈述在当前会话中实际读取到的文件、符号、命令输出和运行结果。
- 尚待联网查询或后续里程碑实测的信息（例如未联网核查的上游 Commit 哈希），必须显式标记为 `"TBD"` 或待验证，严禁猜测填充。
- 若无法完成某项检查（例如缺少交叉编译工具链或目标设备），须如实报告工具缺口与状态。
