<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

# Cyrenet LuCI 主题目录（`themes/`）

本目录托管 **`luci-theme-cyrenet`**（以独立 OpenWrt Feed 软件包形式组织，默认许可证 **`Apache-2.0`**）。

## 设计与工程约束（对应 PROJECT.md 第 9 章）

1. **技术基线**：基于 `jerrykuku/luci-theme-argon`（Argon 3.x，`Apache-2.0`）进行 Fork 与二次开发，必须完整保留上游版权声明与许可证头。
2. **品牌视觉定位**：以 Cyrene 的涟漪、记忆及星轨意象为灵感（浅粉、淡紫、冰蓝、暗紫灰与低饱和度浅色背景），支持明暗双模式，严禁直接使用受版权保护的角色立绘或官方 UI 素材。
3. **离线与兼容**：所有字体、样式与静态资源必须本地打包，禁止依赖公网 CDN；完整兼容桌面/移动端、中/英文、LuCI 原生页面、第三方插件页面、表格与长表单。
4. **应急回退**：主题异常或切换失败不得影响网络服务或后台登录，必须保留可切换回原生 LuCI 主题（如 `luci-theme-bootstrap`）及 SSH 恢复的通道。
