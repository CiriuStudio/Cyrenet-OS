<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 安全政策（Security Policy）

## 1. 基础安全底线

根据 [PROJECT.md](PROJECT.md) 第十六章，Cyrenet OS 在设计与工程实现中强制执行以下安全基线：

1. **无预置管理员密码或后门**：禁止写入默认通用管理密码、开发者隐藏账户、预置 Tailscale Auth Key 或任何未审查的远程控制逻辑。
2. **最小暴露面**：WAN 口默认禁止开放 LuCI、SSH、UPnP 或监控 Exporter 端口；任何远程运维入口必须由用户主动配置。
3. **最小权限与受控提权**：自研 LuCI 后端操作必须遵循 `rpcd` ACL 权限边界，不得滥用 root 权限或覆盖系统核心文件。
4. **OTA 与供应链安全**：
   - OTA 签名私钥**严禁**存入源码仓库或固件镜像，仅存于受保护的发布签名环境（GitHub Environments / Secrets）。
   - 所有 OTA 更新包必须经 HTTPS 下载并强制校验数字签名、SHA256、目标架构、Profile、镜像格式与防回退版本规则，不得绕过原生 `sysupgrade` 兼容性检查。
   - 所有第三方源码与二进制依赖必须在 `manifests/` 中锁定版本与哈希，禁止将未审查的远程脚本作为构建步骤。
5. **用户隐私保护**：
   - 系统不默认向项目维护者或第三方发送流量、DNS 查询或设备标识。
   - 诊断报告默认只导出至本地并实施敏感字段脱敏（凭据、PPPoE 密码、Token、Tailscale 身份、代理订阅、私钥等）。

## 2. 漏洞报告（Vulnerability Disclosure）

如发现与 Cyrenet OS 构建脚本、自研软件包（`luci-app-cyrenet-*`）、主题（`luci-theme-cyrenet`）或 OTA 验证机制相关的安全隐患：

- **请勿在公开 Issue 或公共讨论区直接披露可利用的细节、私钥或凭据。**
- 在 GitHub 仓库启用后，请优先通过 **GitHub Security Advisories（Private vulnerability reporting）** 提交报告。
- 联系维护团队邮箱：`[TBD — 仓库公开前补充项目专用安全联系邮箱]`。
- 报告中请尽可能附带：受影响的 Cyrenet OS 版本 / Profile、复现步骤、影响范围评估以及建议的缓解方案。

## 3. 非官方与品牌归属声明

Cyrenet OS 为非官方社区衍生发行版，与 ImmortalWrt 官方、OpenWrt 官方及《崩坏：星穹铁道》版权方不存在任何官方授权、从属或安全担保关系。上游组件自身的安全公告请同时关注对应上游项目发布渠道。
