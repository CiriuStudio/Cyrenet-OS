<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 贡献指南（Contributing Guide）

欢迎参与 Cyrenet OS 开发。所有贡献（人工与 AI 辅助）均须遵守 [PROJECT.md](PROJECT.md) 的产品基线与 [DESIGN.md](DESIGN.md) 的工程契约。

---

## 1. 分支模型与提交规范

### 分支约定

- `main`：受保护主干分支，仅接受经过审核与基础门禁校验的变更（PR 合并）。
- 功能与修复分支前缀：
  - `feat/<topic>`：新特性或模块开发
  - `fix/<topic>`：缺陷修复
  - `docs/<topic>`：文档、ADR 与规范更新
  - `chore/<topic>`：构建脚本、CI 与依赖维护
  - `exp/<topic>`：实验性特性（如 SFE 内核验证，严禁直接合入 Stable 发布通道）

### Conventional Commits

所有提交信息建议使用标准语义前缀（英文或中英双语简要说明均可）：

```text
<type>(<scope>): <short summary>
```

常用 `<type>`：`feat`、`fix`、`docs`、`build`、`ci`、`test`、`refactor`、`chore`。

---

## 2. 许可证与 SPDX 规范

本项目采用 **按职责拆分 + REUSE / SPDX** 管理，详情见 [LICENSES/README.md](LICENSES/README.md) 与 [ADR-0001](docs/adr/0001-licensing-and-spdx-strategy.md)：

- 构建配置、Profile、根文件系统 Overlay、补丁、脚本与测试：`GPL-2.0-only`
- `themes/`、`packages/luci-app-cyrenet-*/`、文档与 Schema：`Apache-2.0`
- 仓库元数据与占位文件：`CC0-1.0`
- **所有新建源码与脚本必须在文件顶部添加 `SPDX-FileCopyrightText` 与 `SPDX-License-Identifier` 头**；派生自第三方或上游的文件必须完整保留原有版权声明与许可证，禁止用单一许可证粗暴覆盖第三方代码。

---

## 3. 工程编码规范

1. **换行与缩进**：严格遵守 [.gitattributes](.gitattributes) 与 [.editorconfig](.editorconfig) —— 全仓库使用 **LF** 换行；`Makefile` 与 `*.mk` 必须使用 `Tab` 缩进；Shell 脚本须通过 `shellcheck` 检查（可在具备工具的环境中运行）。
2. **KISS 与上游优先**：能用 ImmortalWrt / OpenWrt 原生能力（`netifd`、`firewall4`、`uci`、`ubus`、`rpcd`）或成熟开源包解决的问题，不重复造轮子；不破坏原生 LuCI 与 CLI 兼容性。
3. **运行时能力检测**：禁止对 N5105/N100/N305、固定 PCIe 编号、固定网卡名称或 `WAN`/`LAN` 映射做硬编码。
4. **安全与隐私**：严禁提交任何私钥、Token、测试环境密码或预置 Tailnet 密钥；默认不开放 WAN 管理端口。

---

## 4. PR 交付与高风险模块复核

### 必填交付信息（对应 PROJECT.md §20.2）

提交 Pull Request 时，请完整填写 [PR 模板](.github/pull_request_template.md) 中的 7 项内容：

1. 任务目标与范围
2. 实际修改的文件清单
3. 实现说明
4. 依赖与 BOM 变化
5. 执行过的测试与真实结果（**禁止将未运行测试标为通过**）
6. 已知问题
7. 回滚或撤销方式

### 强制人工复核的高风险模块（对应 PROJECT.md §20.4）

涉及以下 7 类领域的任何变更（尤其是 AI 辅助生成的代码），必须经过独立人工审查与实测验证后方可合入：

- **OTA 更新与签名校验**（`luci-app-cyrenet-updater`、`release/`）
- **DNS 模式切换与冲突检测**（`luci-app-cyrenet-dns`）
- **防火墙与 IPv6 公网服务发布规则**（`luci-app-cyrenet-network`、`firewall4`）
- **配置备份、加密、Schema 迁移与恢复**（`luci-app-cyrenet-backup`）
- **权限控制与 ACL**（`rpcd` ACL、系统服务权限）
- **外部下载、上游锁定与第三方软件包**（`manifests/`、`patches/`）
- **构建与发布流水线**（`.github/workflows/`、`scripts/`）

> **测试底线：** 所有固件或系统变更必须先在独立的 PVE / QEMU 隔离测试环境验证，严禁将正在使用的生产主路由作为唯一测试设备。
