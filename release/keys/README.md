<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

# OTA 验签公钥目录（`release/keys/`）

## 铁律（PROJECT.md §13.3 / §20.3）

- 本目录**仅允许存放公钥**（Public Keys，如 `*.pub`）及密钥轮换元数据。
- **严禁将任何签名私钥、密码或助记词（`*.key`、`*.priv`、`*.sec`、`*.pem`）提交到本目录或仓库任意位置。** `.gitignore` 已设置拦截规则。
- 签名私钥仅能保管于受保护的发布签名环境（GitHub Environments / Secrets，搭配独立人工批准门禁）。
- 公钥轮换与私钥泄露应急流程将在 M5 前通过独立 ADR（`ADR-0007`）锁定。
