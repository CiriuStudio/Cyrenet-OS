<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 审查补丁目录（`patches/`）

本目录存放针对上游 ImmortalWrt 主源码树与 feeds 的最小化补丁（默认适用 `GPL-2.0-only`；若补丁直接作用于 `Apache-2.0` 上游包，应显式保留对应上游许可证头）。

## 目录结构

- `immortalwrt/`：作用于 ImmortalWrt 主源码树的补丁
- `feeds/`：作用于外部 feeds 软件包的补丁

## 命名与格式规范

1. 按 `0001-<kebab-case-topic>.patch` 编号顺序命名，严格使用 **LF** 换行符（详见 [.editorconfig](../.editorconfig)）。
2. 每个补丁文件头部必须清晰注明：
   - **Purpose**：为何必须打此补丁（能否通过配置/自定义包替代）；
   - **Upstream Status**：上游链接、PR/Issue 状态或适用版本范围；
   - **SPDX-License-Identifier**：与目标上游源码保持一致。
3. 本目录属于高风险审查范围（`PROJECT.md` §20.4），合入前须经独立审查与构建验证；上游合入对应修复后应及时清理过期补丁。
