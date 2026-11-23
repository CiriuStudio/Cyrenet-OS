// SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
// SPDX-License-Identifier: GPL-3.0-only

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Lock, Moon, RefreshCw, ShieldAlert, Sun } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  statusCardTitle: string;
  statusCardDesc: string;
  refresh: string;
  loading: string;
  ready: string;
  stale: string;
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
  uiCardTitle: string;
  uiCardDesc: string;
  primaryAction: string;
  secondaryAction: string;
  outlineAction: string;
  dangerAction: string;
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
    title: "Cyrenet OS — D1 UI 集成 POC",
    subtitle: "验证 LuCI / Argon 壳层与 React + shadcn/ui + Tailwind CSS v4 Feature Island 的资产加载、主题同步、CSS 隔离及 Portal 作用域兼容。",
    themeLabel: "主题桥接",
    lightMode: "浅色模式",
    darkMode: "深色模式",
    statusCardTitle: "受控 rpcd / ubus 状态读取",
    statusCardDesc: "经只读 ACL 接口 luci.cyrenet.poc.status 获取真实状态，禁止将采集失败伪装为 0。",
    refresh: "刷新状态",
    loading: "正在读取系统状态…",
    ready: "状态正常",
    stale: "数据已过期",
    forbiddenTitle: "权限不足（rpcd ACL 拒绝）",
    unsupportedTitle: "后端能力不可用 / 未检测",
    errorTitle: "接口调用异常",
    unknown: "unknown",
    hostname: "主机名",
    version: "Cyrenet 版本",
    profile: "固件 Profile / 通道",
    kernel: "内核版本",
    uptime: "运行时间",
    loadAvg: "平均负载",
    observedAt: "最近采样",
    uiCardTitle: "shadcn/ui 组件与 Portal 隔离验证",
    uiCardDesc: "全部样式限定在 .cyrenet-ui-root 与 cn: 前缀作用域内，弹窗 Portal 挂载于宿主隔离容器内。",
    primaryAction: "主操作",
    secondaryAction: "次要操作",
    outlineAction: "描边按钮",
    dangerAction: "危险语义",
    openDialog: "打开作用域弹窗",
    dialogTitle: "作用域 Portal 确认对话框",
    dialogDesc: "此弹窗通过 Radix DialogPortal 挂载在 .cyrenet-ui-root 内部的 .cyrenet-portal-root，确保继承 Cyrenet Design Tokens 且不污染原生 LuCI。",
    dialogBody: "支持键盘 Esc 关闭并在关闭后将焦点交还触发按钮。",
    dialogClose: "关闭",
    dialogConfirm: "确认已知晓",
    fallbackTitle: "独立管理降级保障",
    fallbackDesc: "当前 React 功能岛仅负责表现层展示；即便主题或静态资产不可用，底层网络、原生 LuCI 页面与 SSH 管理通路仍完整保留。",
  },
  en: {
    title: "Cyrenet OS — D1 UI Integration POC",
    subtitle: "Verifies LuCI/Argon shell hosting React + shadcn/ui + Tailwind CSS v4 Feature Islands: hashed asset loading, theme bridge, CSS isolation, and scoped Portals.",
    themeLabel: "Theme Bridge",
    lightMode: "Light",
    darkMode: "Dark",
    statusCardTitle: "Scoped rpcd / ubus Status Read",
    statusCardDesc: "Queries read-only ACL method luci.cyrenet.poc.status without faking missing values as 0.",
    refresh: "Refresh",
    loading: "Loading host status...",
    ready: "Ready",
    stale: "Stale",
    forbiddenTitle: "Access Denied (rpcd ACL)",
    unsupportedTitle: "Capability Unsupported / Unavailable",
    errorTitle: "RPC Request Failed",
    unknown: "unknown",
    hostname: "Hostname",
    version: "Cyrenet Version",
    profile: "Profile / Channel",
    kernel: "Kernel Version",
    uptime: "Uptime",
    loadAvg: "Load Average",
    observedAt: "Observed At",
    uiCardTitle: "shadcn/ui & Scoped Portal Verification",
    uiCardDesc: "Utilities use cn: prefix inside .cyrenet-ui-root; Radix Portals mount inside .cyrenet-portal-root.",
    primaryAction: "Primary",
    secondaryAction: "Secondary",
    outlineAction: "Outline",
    dangerAction: "Danger",
    openDialog: "Open Scoped Dialog",
    dialogTitle: "Scoped Portal Dialog",
    dialogDesc: "Mounted inside .cyrenet-portal-root inside .cyrenet-ui-root so Cyrenet Design Tokens apply without leaking CSS to LuCI.",
    dialogBody: "Press Escape to dismiss and restore focus back to the trigger button.",
    dialogClose: "Close",
    dialogConfirm: "Acknowledge",
    fallbackTitle: "Independent Fallback Safety",
    fallbackDesc: "This Feature Island never blocks base networking, native LuCI administration, or SSH recovery access.",
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

  return (
    <div className="cn:mx-auto cn:flex cn:w-full cn:max-w-5xl cn:flex-col cn:gap-6 cn:p-4 cn:text-foreground">
      <header className="cn:flex cn:flex-wrap cn:items-start cn:justify-between cn:gap-4 cn:border-b cn:border-border cn:pb-4">
        <div className="cn:space-y-1">
          <h1 className="cn:text-2xl cn:font-semibold cn:tracking-tight cn:text-foreground">
            {t.title}
          </h1>
          <p className="cn:max-w-2xl cn:text-sm cn:text-muted-foreground">{t.subtitle}</p>
        </div>

        <div className="cn:flex cn:items-center cn:gap-2">
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
        </div>
      </header>

      <div className="cn:grid cn:grid-cols-1 cn:gap-4 cn:lg:grid-cols-2">
        <Card>
          <CardHeader className="cn:flex-row cn:items-start cn:justify-between cn:gap-3">
            <div className="cn:space-y-1">
              <CardTitle>{t.statusCardTitle}</CardTitle>
              <CardDescription>{t.statusCardDesc}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => void loadStatus()}>
              <RefreshCw className="cn:h-4 cn:w-4" aria-hidden="true" />
              <span>{t.refresh}</span>
            </Button>
          </CardHeader>
          <CardContent className="cn:space-y-4">
            {remoteState.status === "loading" && (
              <div className="cn:rounded-md cn:border cn:border-border cn:bg-muted cn:p-3 cn:text-sm cn:text-muted-foreground">
                {t.loading}
              </div>
            )}

            {remoteState.status === "ready" && (
              <div className="cn:space-y-3" data-testid="poc-status-ready">
                <div className="cn:flex cn:items-center cn:justify-between cn:gap-2">
                  <Badge variant="success">
                    <CheckCircle2 className="cn:h-3.5 cn:w-3.5" aria-hidden="true" />
                    <span>{t.ready}</span>
                  </Badge>
                  <span className="cn:font-mono cn:text-xs cn:text-muted-foreground">
                    {t.observedAt}: {remoteState.observedAt}
                  </span>
                </div>
                <dl className="cn:grid cn:grid-cols-1 cn:gap-2 cn:sm:grid-cols-2">
                  <div className="cn:rounded-md cn:border cn:border-border cn:bg-secondary/50 cn:p-2.5">
                    <dt className="cn:text-xs cn:text-muted-foreground">{t.hostname}</dt>
                    <dd className="cn:font-mono cn:text-sm cn:font-medium">
                      {remoteState.data.hostname || t.unknown}
                    </dd>
                  </div>
                  <div className="cn:rounded-md cn:border cn:border-border cn:bg-secondary/50 cn:p-2.5">
                    <dt className="cn:text-xs cn:text-muted-foreground">{t.version}</dt>
                    <dd className="cn:font-mono cn:text-sm cn:font-medium">
                      {remoteState.data.cyrenet_version || t.unknown}
                    </dd>
                  </div>
                  <div className="cn:rounded-md cn:border cn:border-border cn:bg-secondary/50 cn:p-2.5">
                    <dt className="cn:text-xs cn:text-muted-foreground">{t.profile}</dt>
                    <dd className="cn:font-mono cn:text-sm cn:font-medium">
                      {remoteState.data.cyrenet_profile || t.unknown} /{" "}
                      {remoteState.data.cyrenet_channel || t.unknown}
                    </dd>
                  </div>
                  <div className="cn:rounded-md cn:border cn:border-border cn:bg-secondary/50 cn:p-2.5">
                    <dt className="cn:text-xs cn:text-muted-foreground">{t.kernel}</dt>
                    <dd className="cn:font-mono cn:text-sm cn:font-medium">
                      {remoteState.data.kernel_version || t.unknown}
                    </dd>
                  </div>
                  <div className="cn:rounded-md cn:border cn:border-border cn:bg-secondary/50 cn:p-2.5">
                    <dt className="cn:text-xs cn:text-muted-foreground">{t.uptime}</dt>
                    <dd className="cn:font-mono cn:text-sm cn:font-medium">
                      {formatUptime(remoteState.data.uptime_seconds, t.unknown)}
                    </dd>
                  </div>
                  <div className="cn:rounded-md cn:border cn:border-border cn:bg-secondary/50 cn:p-2.5">
                    <dt className="cn:text-xs cn:text-muted-foreground">{t.loadAvg}</dt>
                    <dd className="cn:font-mono cn:text-sm cn:font-medium">
                      {remoteState.data.load_average || t.unknown}
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            {remoteState.status === "forbidden" && (
              <Alert variant="destructive" data-testid="poc-status-forbidden">
                <Lock className="cn:mb-2 cn:h-4 cn:w-4" aria-hidden="true" />
                <AlertTitle>{t.forbiddenTitle}</AlertTitle>
                <AlertDescription>{remoteState.reason}</AlertDescription>
              </Alert>
            )}

            {remoteState.status === "unsupported" && (
              <Alert variant="warning" data-testid="poc-status-unsupported">
                <AlertTriangle className="cn:mb-2 cn:h-4 cn:w-4" aria-hidden="true" />
                <AlertTitle>{t.unsupportedTitle}</AlertTitle>
                <AlertDescription>{remoteState.reason}</AlertDescription>
              </Alert>
            )}

            {remoteState.status === "error" && (
              <Alert variant="destructive" data-testid="poc-status-error">
                <ShieldAlert className="cn:mb-2 cn:h-4 cn:w-4" aria-hidden="true" />
                <AlertTitle>
                  {t.errorTitle} ({remoteState.code})
                </AlertTitle>
                <AlertDescription>{remoteState.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.uiCardTitle}</CardTitle>
            <CardDescription>{t.uiCardDesc}</CardDescription>
          </CardHeader>
          <CardContent className="cn:flex cn:flex-col cn:gap-4">
            <div className="cn:flex cn:flex-wrap cn:gap-2">
              <Button variant="default">{t.primaryAction}</Button>
              <Button variant="secondary">{t.secondaryAction}</Button>
              <Button variant="outline">{t.outlineAction}</Button>
              <Button variant="destructive">{t.dangerAction}</Button>
            </div>

            <div>
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
                  <p className="cn:text-sm cn:text-foreground">{t.dialogBody}</p>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">{t.dialogClose}</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button variant="default">{t.dialogConfirm}</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert variant="info">
        <AlertTitle>{t.fallbackTitle}</AlertTitle>
        <AlertDescription>{t.fallbackDesc}</AlertDescription>
      </Alert>
    </div>
  );
}
