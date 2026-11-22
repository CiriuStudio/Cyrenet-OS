<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 发布配置与 OTA 清单基线（`release/`）

本目录管理发布相关的公钥、更新说明模板与测试验收模板（默认适用 `Apache-2.0`）。

- [`keys/`](keys/README.md)：存放用于固件内 OTA 验签的**公钥**（严禁存放私钥）。
- [`templates/test-report-template.md`](templates/test-report-template.md)：候选版与里程碑测试结论报告模板（对应 `PROJECT.md` §17.4）。

> **注意：** 实际发布到线的 `manifest.json`、校验和与签名产物由 GitHub Actions 自动生成，托管于 **GitHub Releases** 与 **GitHub Pages（`gh-pages` 分支）**，不会在每次构建时写入 `main` 分支造成提交历史膨胀。
