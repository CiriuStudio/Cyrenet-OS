<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 通用 RootFS Overlay 目录（`files/`）

本目录存放三套 Profile 共用的根文件系统覆盖文件（默认适用 `GPL-2.0-only`），将在固件打包阶段叠加至系统 `/` 下（优先级低于 `profiles/<profile>/files/`）。

## 使用约定

- **初始化脚本**：`etc/uci-defaults/` 下的脚本必须保持**幂等性**且严格使用 **LF** 换行符。
- **固件标识**：`/etc/cyrenet-release`（详见 [DESIGN.md](../DESIGN.md) 第 3 节）由构建脚本按目标 Profile 动态生成注入，禁止在仓库中硬编码静态版本值。
- **严禁写入项**：
  - 通用管理员预设密码、SSH 私钥、API Token 或 Tailscale Auth Key；
  - 针对特定主板/硬件的 PCIe 编号、网卡设备名（如硬编码 `eth0`/`enp1s0`）或固定 WAN/LAN 接口绑定；
  - 放开 WAN 口 LuCI/SSH 管理或启用未授权远控的默认防火墙规则。
