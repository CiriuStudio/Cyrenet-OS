<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 自动化测试与测试夹具目录（`tests/`）

本目录存放自动化测试代码与样本夹具，默认适用 `GPL-2.0-only`（对应 `PROJECT.md` 第十七章）。

- `unit/`：脚本、配置拼装器、JSON Schema 校验、脱敏逻辑与 Schema 迁移器单元测试。
- `smoke/`：面向 QEMU / PVE 隔离环境的自动启动、WebUI、SSH、DHCP、DNS 切换及基础服务冒烟测试。
- `fixtures/`：脱敏后的模拟 UCI 配置、故障诊断测试样本、伪造签名与错误架构测试样本（严禁放入真实线上凭据或私钥）。

> **测试原则：** 严禁在生产主路由执行破坏性测试；测试不得伪造通过结果。
