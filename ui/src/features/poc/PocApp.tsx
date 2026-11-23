// SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
// SPDX-License-Identifier: GPL-3.0-only

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  Lock,
  Moon,
  Palette,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Terminal,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createApiClient } from "@/lib/api/client";
import type { HostBridge, PocStatus, RemoteState } from "@/lib/api/types";
import { applyContainerTheme, useHostTheme } from "@/lib/theme/theme-bridge";

interface CopyStrings {
  title: string;
  subtitle: string;
  themeLabel: string;
  lightMode: string;
  darkMode: string;
  refresh: string;
  loading: string;
  ready: string;
  forbiddenTitle: string;
  unsupportedTitle: string;
  errorTitle: string;
  unknown: string;
  hostname: string;
  version: string;
  profile: string;
  kernel: string;
  uptime: string;
  loadAvg: string;
  observedAt: string;
  capabilityCardTitle: string;
  capabilityCardDesc: string;
  capThemeTitle: string;
  capThemeDesc: string;
  capThemeBadge: string;
  capAclTitle: string;
  capAclDesc: string;
  capAclBadge: string;
  capIsolationTitle: string;
  capIsolationDesc: string;
  capIsolationBadge: string;
  capFallbackTitle: string;
  capFallbackDesc: string;
  capFallbackBadge: string;
  uiCardTitle: string;
  uiCardDesc: string;
  actionTierLabel: string;
  dangerTierLabel: string;
  filledAction: string;
  tonalAction: string;
  outlineAction: string;
  textAction: string;
  dangerAction: string;
  dangerTonalAction: string;
  openDialog: string;
  dialogTitle: string;
  dialogDesc: string;
  dialogBody: string;
  dialogClose: string;
  dialogConfirm: string;
  fallbackTitle: string;
  fallbackDesc: string;
}

const COPY: Record<"zh" | "en", CopyStrings> = {
  zh: {
    title: "Cyrenet OS — Cyrenet × M3 集成预览",
    subtitle:
      "方案 A 架构验证：原生 M3 风格 LuCI 壳层承载 React + shadcn/Radix Feature Island，统一分级表面与作用域隔离。",
    themeLabel: "主题桥接",
    lightMode: "浅色模式",
    darkMode: "深色模式",
    refresh: "刷新状态",
    loading: "正在从 luci.cyrenet.poc 读取真实系统状态…",
    ready: "状态正常",
    forbiddenTitle: "权限不足（rpcd ACL 拒绝）",
    unsupportedTitle: "后端能力不可用 / 未检测",
    errorTitle: "接口调用异常",
    unknown: "unknown",
    hostname: "节点主机名",
    version: "固件发行版本",
    profile: "Profile / 发布通道",
    kernel: "Linux 内核",
    uptime: "持续运行时间",
    loadAvg: "平均负载",
    observedAt: "采样时间",
    capabilityCardTitle: "系统契约与双层边界状态",
    capabilityCardDesc: "按 M3 三槽列表排布（图标 + 主副文案 + 状态芯片），所有状态均可实测回溯。",
    capThemeTitle: "Argon → Cyrenet 主题桥接",
    capThemeDesc: "自动监听宿主 data-darkmode / prefers-color-scheme，无闪烁同步。",
    capThemeBadge: "实时同步",
    capAclTitle: "受限只读 rpcd ACL",
    capAclDesc: "仅授权读取 luci.cyrenet.poc.status，零无授权写入口。",
    capAclBadge: "最小权限",
    capIsolationTitle: "Tailwind v4 作用域隔离",
    capIsolationDesc: "@layer base 封装重置 + cn: 前缀，不污染原生 LuCI 表单。",
    capIsolationBadge: "已隔离",
    capFallbackTitle: "原生 LuCI 与 SSH 应急兜底",
    capFallbackDesc: "资产故障或降级时保留原生 LuCI 概览页及 SSH 恢复能力。",
    capFallbackBadge: "独立保留",
    uiCardTitle: "M3 按钮层级与作用域 Portal 弹窗",
    uiCardDesc: "每个操作区明确区分 Filled / Filled Tonal / Outlined / Text 与危险操作语义。",
    actionTierLabel: "常规操作层级（M3 Emphasis）",
    dangerTierLabel: "高危 / 破坏性操作语义",
    filledAction: "Filled 主操作",
    tonalAction: "Filled Tonal",
    outlineAction: "Outlined 描边",
    textAction: "Text 轻量",
    dangerAction: "Danger 实心",
    dangerTonalAction: "Danger 柔和",
    openDialog: "打开作用域 M3 弹窗",
    dialogTitle: "M3 作用域 Portal 确认弹窗",
    dialogDesc:
      "该 28px 圆角高表面弹窗通过 Radix DialogPortal 挂载在 .cyrenet-ui-root 内的 .cyrenet-portal-root，确保完整继承 Cyrenet Tokens 与明暗主题。",
    dialogBody: "支持键盘 Esc 关闭，关闭后焦点自动回归触发按钮。",
    dialogClose: "关闭",
    dialogConfirm: "确认效果",
    fallbackTitle: "方案 A（原生 LuCI 壳 + React 业务岛）生效中",
    fallbackDesc:
      "方案 B（React 重写底层 Argon 导航壳）已按决策归档为 V1.0 后续演进备选；当前方案兼容全部 ImmortalWrt 25.12 第三方插件页面。",
  },
  en: {
    title: "Cyrenet OS — Cyrenet × M3 Integration Preview",
    subtitle:
      "Plan A verification: clean native M3 LuCI shell hosting React + shadcn/Radix Feature Islands with tonal surfaces and scoped CSS.",
    themeLabel: "Theme Bridge",
    lightMode: "Light",
    darkMode: "Dark",
    refresh: "Refresh",
    loading: "Reading host status from luci.cyrenet.poc...",
    ready: "Ready",
    forbiddenTitle: "Access Denied (rpcd ACL)",
    unsupportedTitle: "Capability Unsupported / Unavailable",
    errorTitle: "RPC Request Failed",
    unknown: "unknown",
    hostname: "Node Hostname",
    version: "Cyrenet Release",
    profile: "Profile / Channel",
    kernel: "Linux Kernel",
    uptime: "Uptime",
    loadAvg: "Load Average",
    observedAt: "Observed At",
    capabilityCardTitle: "System Contract & Layer Boundaries",
    capabilityCardDesc:
      "Structured M3 3-slot list items (leading icon badge, headline/supporting copy, trailing status chip).",
    capThemeTitle: "Host → Cyrenet Theme Bridge",
    capThemeDesc: "Tracks data-darkmode / prefers-color-scheme changes without flicker.",
    capThemeBadge: "Live Sync",
    capAclTitle: "Scoped Read-Only rpcd ACL",
    capAclDesc: "Restricted strictly to luci.cyrenet.poc.status without write grants.",
    capAclBadge: "Least Privilege",
    capIsolationTitle: "Tailwind v4 Layer Isolation",
    capIsolationDesc: "@layer base resets + cn: prefix protect native LuCI forms.",
    capIsolationBadge: "Isolated",
    capFallbackTitle: "Native LuCI & SSH Fallback",
    capFallbackDesc: "Preserves native LuCI status views and SSH recovery on asset failure.",
    capFallbackBadge: "Preserved",
    uiCardTitle: "M3 Button Hierarchy & Scoped Portal",
    uiCardDesc: "Clear separation between Filled, Filled Tonal, Outlined, Text, and Danger actions.",
    actionTierLabel: "Standard Emphasis Tiers",
    dangerTierLabel: "Destructive Semantics",
    filledAction: "Filled",
    tonalAction: "Filled Tonal",
    outlineAction: "Outlined",
    textAction: "Text",
    dangerAction: "Danger",
    dangerTonalAction: "Danger Tonal",
    openDialog: "Open Scoped M3 Dialog",
    dialogTitle: "Scoped M3 Portal Dialog",
    dialogDesc:
      "Rendered inside .cyrenet-portal-root within .cyrenet-ui-root (28px expressive radius, surface-container-high) so tokens apply cleanly.",
    dialogBody: "Press Escape to dismiss and restore keyboard focus to the trigger.",
    dialogClose: "Close",
    dialogConfirm: "Confirm",
    fallbackTitle: "Plan A (Native M3 LuCI Shell + React Feature Islands) Active",
    fallbackDesc:
      "Plan B (React navigation shell rewrite) is archived for future evolution; Plan A guarantees 100% compatibility with third-party LuCI plugins.",
  },
};

function formatUptime(seconds: number | null, fallback: string): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) {
    return fallback;
  }
  const s = Math.floor(seconds);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const rem = s % 60;
  return days > 0 ? `${days}d ${hours}h ${mins}m ${rem}s` : `${hours}h ${mins}m ${rem}s`;
}

export interface PocAppProps {
  bridge?: HostBridge;
  container?: HTMLElement | null;
}

export function PocApp({ bridge, container }: PocAppProps) {
  const themeState = useHostTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [remoteState, setRemoteState] = useState<RemoteState<PocStatus>>({ status: "idle" });

  const langKey: "zh" | "en" = useMemo(() => {
    const raw = (
      bridge?.lang ??
      (typeof document !== "undefined" ? document.documentElement.lang : "")
    ).toLowerCase();
    return raw.startsWith("zh") ? "zh" : "en";
  }, [bridge?.lang]);

  const t = COPY[langKey];
  const apiClient = useMemo(() => createApiClient(bridge), [bridge]);

  useEffect(() => {
    if (container) {
      applyContainerTheme(container, themeState.theme);
    }
  }, [container, themeState.theme]);

  const loadStatus = useCallback(async () => {
    setRemoteState((prev) => ({
      status: "loading",
      previous: prev.status === "ready" || prev.status === "stale" ? prev.data : undefined,
    }));
    const next = await apiClient.fetchPocStatus();
    setRemoteState(next);
  }, [apiClient]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const capabilities = [
    {
      icon: Palette,
      title: t.capThemeTitle,
      desc: t.capThemeDesc,
      badge: t.capThemeBadge,
      variant: "default" as const,
    },
    {
      icon: Lock,
      title: t.capAclTitle,
      desc: t.capAclDesc,
      badge: t.capAclBadge,
      variant: "secondary" as const,
    },
    {
      icon: ShieldCheck,
      title: t.capIsolationTitle,
      desc: t.capIsolationDesc,
      badge: t.capIsolationBadge,
      variant: "success" as const,
    },
    {
      icon: Terminal,
      title: t.capFallbackTitle,
      desc: t.capFallbackDesc,
      badge: t.capFallbackBadge,
      variant: "outline" as const,
    },
  ];

  return (
    <div className="cn:mx-auto cn:flex cn:w-full cn:max-w-6xl cn:flex-col cn:gap-6 cn:p-2 cn:sm:p-4 cn:text-foreground">
      {/* M3 Top Page Header + Right Action Cluster */}
      <header className="cn:flex cn:flex-wrap cn:items-start cn:justify-between cn:gap-4 cn:border-b cn:border-outline-variant cn:pb-5">
        <div className="cn:space-y-1.5">
          <h1 className="cn:text-2xl cn:font-semibold cn:tracking-tight cn:text-foreground">
            {t.title}
          </h1>
          <p className="cn:max-w-3xl cn:text-sm cn:leading-relaxed cn:text-muted-foreground">
            {t.subtitle}
          </p>
        </div>

        <div className="cn:flex cn:shrink-0 cn:flex-wrap cn:items-center cn:gap-2.5">
          <Badge variant="secondary" data-testid="theme-badge">
            {themeState.theme === "dark" ? (
              <Moon className="cn:h-3.5 cn:w-3.5" aria-hidden="true" />
            ) : (
              <Sun className="cn:h-3.5 cn:w-3.5" aria-hidden="true" />
            )}
            <span>
              {t.themeLabel}: {themeState.theme === "dark" ? t.darkMode : t.lightMode} ({themeState.source})
            </span>
          </Badge>

          <Button variant="tonal" size="sm" onClick={() => void loadStatus()}>
            <RefreshCw className="cn:h-3.5 cn:w-3.5" aria-hidden="true" />
            <span>{t.refresh}</span>
          </Button>
        </div>
      </header>

      {/* RemoteState Banner or 4-Column M3 KPI Hero Strip */}
      {remoteState.status === "loading" && (
        <div className="cn:rounded-2xl cn:border cn:border-outline-variant cn:bg-surface-container cn:p-4 cn:text-sm cn:text-muted-foreground">
          {t.loading}
        </div>
      )}

      {remoteState.status === "forbidden" && (
        <Alert variant="destructive" data-testid="poc-status-forbidden">
          <div className="cn:flex cn:items-start cn:gap-3">
            <Lock className="cn:h-5 cn:w-5 cn:shrink-0" aria-hidden="true" />
            <div className="cn:min-w-0">
              <AlertTitle>{t.forbiddenTitle}</AlertTitle>
              <AlertDescription>{remoteState.reason}</AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      {remoteState.status === "unsupported" && (
        <Alert variant="warning" data-testid="poc-status-unsupported">
          <div className="cn:flex cn:items-start cn:gap-3">
            <AlertTriangle className="cn:h-5 cn:w-5 cn:shrink-0" aria-hidden="true" />
            <div className="cn:min-w-0">
              <AlertTitle>{t.unsupportedTitle}</AlertTitle>
              <AlertDescription>{remoteState.reason}</AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      {remoteState.status === "error" && (
        <Alert variant="destructive" data-testid="poc-status-error">
          <div className="cn:flex cn:items-start cn:gap-3">
            <ShieldAlert className="cn:h-5 cn:w-5 cn:shrink-0" aria-hidden="true" />
            <div className="cn:min-w-0">
              <AlertTitle>
                {t.errorTitle} ({remoteState.code})
              </AlertTitle>
              <AlertDescription>{remoteState.message}</AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      {remoteState.status === "ready" && (
        <section className="cn:space-y-3" data-testid="poc-status-ready">
          <div className="cn:flex cn:flex-wrap cn:items-center cn:justify-between cn:gap-2">
            <Badge variant="success">
              <CheckCircle2 className="cn:h-3.5 cn:w-3.5" aria-hidden="true" />
              <span>{t.ready}</span>
            </Badge>
            <span className="cn:font-mono cn:text-xs cn:text-muted-foreground">
              {t.observedAt}: {remoteState.observedAt}
            </span>
          </div>

          <dl className="cn:grid cn:grid-cols-1 cn:gap-3 cn:sm:grid-cols-2 cn:xl:grid-cols-4">
            <div className="cn:flex cn:items-start cn:gap-3 cn:rounded-2xl cn:border cn:border-outline-variant cn:bg-surface-low cn:p-4">
              <div className="cn:flex cn:h-10 cn:w-10 cn:shrink-0 cn:items-center cn:justify-center cn:rounded-xl cn:bg-primary-container cn:text-on-primary-container">
                <Server className="cn:h-5 cn:w-5" aria-hidden="true" />
              </div>
              <div className="cn:min-w-0 cn:space-y-0.5">
                <dt className="cn:text-xs cn:text-muted-foreground">{t.hostname}</dt>
                <dd className="cn:truncate cn:font-mono cn:text-base cn:font-semibold cn:text-foreground">
                  {remoteState.data.hostname || t.unknown}
                </dd>
              </div>
            </div>

            <div className="cn:flex cn:items-start cn:gap-3 cn:rounded-2xl cn:border cn:border-outline-variant cn:bg-surface-low cn:p-4">
              <div className="cn:flex cn:h-10 cn:w-10 cn:shrink-0 cn:items-center cn:justify-center cn:rounded-xl cn:bg-secondary-container cn:text-on-secondary-container">
                <Layers className="cn:h-5 cn:w-5" aria-hidden="true" />
              </div>
              <div className="cn:min-w-0 cn:space-y-0.5">
                <dt className="cn:text-xs cn:text-muted-foreground">{t.version}</dt>
                <dd className="cn:truncate cn:font-mono cn:text-base cn:font-semibold cn:text-foreground">
                  {remoteState.data.cyrenet_version || t.unknown}
                </dd>
                <dd className="cn:font-mono cn:text-xs cn:text-muted-foreground">
                  {remoteState.data.cyrenet_profile || t.unknown} /{" "}
                  {remoteState.data.cyrenet_channel || t.unknown}
                </dd>
              </div>
            </div>

            <div className="cn:flex cn:items-start cn:gap-3 cn:rounded-2xl cn:border cn:border-outline-variant cn:bg-surface-low cn:p-4">
              <div className="cn:flex cn:h-10 cn:w-10 cn:shrink-0 cn:items-center cn:justify-center cn:rounded-xl cn:bg-tertiary-container cn:text-on-tertiary-container">
                <Cpu className="cn:h-5 cn:w-5" aria-hidden="true" />
              </div>
              <div className="cn:min-w-0 cn:space-y-0.5">
                <dt className="cn:text-xs cn:text-muted-foreground">{t.uptime}</dt>
                <dd className="cn:font-mono cn:text-base cn:font-semibold cn:tabular-nums cn:text-foreground">
                  {formatUptime(remoteState.data.uptime_seconds, t.unknown)}
                </dd>
                <dd className="cn:font-mono cn:text-xs cn:text-muted-foreground">
                  {t.kernel}: {remoteState.data.kernel_version || t.unknown}
                </dd>
              </div>
            </div>

            <div className="cn:flex cn:items-start cn:gap-3 cn:rounded-2xl cn:border cn:border-outline-variant cn:bg-surface-low cn:p-4">
              <div className="cn:flex cn:h-10 cn:w-10 cn:shrink-0 cn:items-center cn:justify-center cn:rounded-xl cn:bg-surface-high cn:text-foreground">
                <Activity className="cn:h-5 cn:w-5" aria-hidden="true" />
              </div>
              <div className="cn:min-w-0 cn:space-y-0.5">
                <dt className="cn:text-xs cn:text-muted-foreground">{t.loadAvg}</dt>
                <dd className="cn:font-mono cn:text-base cn:font-semibold cn:tabular-nums cn:text-foreground">
                  {remoteState.data.load_average || t.unknown}
                </dd>
                <dd className="cn:font-mono cn:text-xs cn:text-muted-foreground">
                  ImmortalWrt {remoteState.data.upstream_version || t.unknown}
                </dd>
              </div>
            </div>
          </dl>
        </section>
      )}

      {/* Balanced 2-Column M3 Canonical Pane */}
      <div className="cn:grid cn:grid-cols-1 cn:gap-4 cn:lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.capabilityCardTitle}</CardTitle>
            <CardDescription>{t.capabilityCardDesc}</CardDescription>
          </CardHeader>
          <CardContent className="cn:space-y-2.5">
            {capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="cn:flex cn:items-center cn:justify-between cn:gap-3 cn:rounded-xl cn:border cn:border-outline-variant cn:bg-surface-container cn:p-3.5"
                >
                  <div className="cn:flex cn:min-w-0 cn:items-start cn:gap-3">
                    <div className="cn:flex cn:h-9 cn:w-9 cn:shrink-0 cn:items-center cn:justify-center cn:rounded-xl cn:bg-surface-high cn:text-primary">
                      <Icon className="cn:h-4 cn:w-4" aria-hidden="true" />
                    </div>
                    <div className="cn:min-w-0 cn:space-y-0.5">
                      <p className="cn:text-sm cn:font-medium cn:text-foreground">{item.title}</p>
                      <p className="cn:text-xs cn:leading-relaxed cn:text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  <Badge variant={item.variant} className="cn:shrink-0">
                    {item.badge}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="cn:flex cn:flex-col cn:justify-between">
          <div>
            <CardHeader>
              <CardTitle>{t.uiCardTitle}</CardTitle>
              <CardDescription>{t.uiCardDesc}</CardDescription>
            </CardHeader>
            <CardContent className="cn:space-y-5">
              <div className="cn:space-y-2.5">
                <p className="cn:text-xs cn:font-medium cn:uppercase cn:tracking-wider cn:text-muted-foreground">
                  {t.actionTierLabel}
                </p>
                <div className="cn:flex cn:flex-wrap cn:items-center cn:gap-2.5">
                  <Button variant="default">{t.filledAction}</Button>
                  <Button variant="tonal">{t.tonalAction}</Button>
                  <Button variant="outline">{t.outlineAction}</Button>
                  <Button variant="text">{t.textAction}</Button>
                </div>
              </div>

              <div className="cn:border-t cn:border-outline-variant cn:pt-4 cn:space-y-2.5">
                <p className="cn:text-xs cn:font-medium cn:uppercase cn:tracking-wider cn:text-muted-foreground">
                  {t.dangerTierLabel}
                </p>
                <div className="cn:flex cn:flex-wrap cn:items-center cn:gap-2.5">
                  <Button variant="destructive">{t.dangerAction}</Button>
                  <Button variant="destructiveTonal">{t.dangerTonalAction}</Button>
                </div>
              </div>
            </CardContent>
          </div>

          <CardFooter className="cn:border-t cn:border-outline-variant cn:pt-4">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" data-testid="open-poc-dialog">
                  {t.openDialog}
                </Button>
              </DialogTrigger>
              <DialogContent closeLabel={t.dialogClose}>
                <DialogHeader>
                  <DialogTitle>{t.dialogTitle}</DialogTitle>
                  <DialogDescription>{t.dialogDesc}</DialogDescription>
                </DialogHeader>
                <p className="cn:text-sm cn:leading-relaxed cn:text-foreground">{t.dialogBody}</p>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="text">{t.dialogClose}</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button variant="default">{t.dialogConfirm}</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      </div>

      <Alert variant="info">
        <AlertTitle>{t.fallbackTitle}</AlertTitle>
        <AlertDescription>{t.fallbackDesc}</AlertDescription>
      </Alert>
    </div>
  );
}
