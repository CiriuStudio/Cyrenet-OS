<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

## 1. 任务目标与涉及模块（Goal & Scope）

- **目标：**
- **涉及模块 / 目录：**
- **不允许破坏的既有能力：**

## 2. 实际修改的文件（Modified Files）

- `path/to/file` — 修改说明

## 3. 实现说明（Implementation Summary）

-

## 4. 依赖与 BOM 变化（Dependencies & BOM）

- [ ] 无新增或升级的第三方软件包 / 上游源码
- [ ] 已同步更新 `manifests/upstream.lock.yaml` 或 `manifests/bom/*.yaml`（并确认许可证信息）

## 5. 执行过的测试与真实结果（Tests Executed & Results）

> **严禁虚构或将未运行的测试标注为通过（PROJECT.md §17.4 / §20.3）。**

| 检查 / 测试项 | 执行环境 | 结果（Pass / Fail / Not Run） | 输出摘要 / 日志说明 |
|---|---|---|---|
| | | | |

## 6. 已知问题（Known Issues）

-

## 7. 回滚或撤销方式（Rollback Plan）

-

---

## 工程规范与高风险复核清单（Checklist）

- [ ] 本次变更未擅自更改 [PROJECT.md](PROJECT.md) 基线范围；重大技术决定已沉淀至 `docs/adr/`
- [ ] 新增文件均包含正确的 `SPDX-FileCopyrightText` 与 `SPDX-License-Identifier` 头，符合 [REUSE.toml](REUSE.toml) 规则
- [ ] 全文件采用 LF 换行符，无硬编码硬件/网卡名称，无私钥/凭据/Token 泄露
- [ ] 默认保持安全策略（不预置密码、不开放 WAN 管理口、可选服务默认关闭）

### 是否涉及高风险复核领域（PROJECT.md §20.4）

- [ ] OTA 更新与验签
- [ ] DNS 双引擎切换 / OpenClash 冲突处理
- [ ] 防火墙 / IPv6 服务发布规则
- [ ] 配置备份、加密与跨版本迁移
- [ ] `rpcd` ACL / 权限控制
- [ ] 外部下载 / 上游锁定 / 第三方包 BOM
- [ ] 构建与发布流水线（`.github/workflows/`、`scripts/`）
- [ ] 以上均不涉及
