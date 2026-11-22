<!--
SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
SPDX-License-Identifier: Apache-2.0
-->

# 发行 Profile 目录（`profiles/`）

Cyrenet OS V1.0 定义三个共享同一源码与构建体系的发行 Profile（详见 [PROJECT.md](../PROJECT.md) 第三章与 [DESIGN.md](../DESIGN.md) 第 2 节）。

## 继承链

```text
config/common.config
  └── profiles/core/profile.config       -> Cyrenet Core
        └── profiles/standard/profile.config -> Cyrenet Standard
              └── profiles/extended/profile.config -> Cyrenet Extended
```

每个 Profile 目录下包含：

- `profile.config`：相对于上一层的**增量**软件包与特性 Kconfig 片段（`GPL-2.0-only`）。
- `files/`：该 Profile 专属的 RootFS Overlay，在通用 `files/` 之后叠加。

> 注意：`profile.config` 决定**预装软件包集合**，不代表对应第三方高级服务在首次开机时自动运行。
