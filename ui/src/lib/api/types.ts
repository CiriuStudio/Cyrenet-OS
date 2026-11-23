// SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
// SPDX-License-Identifier: GPL-3.0-only

/** Unified remote state union defined in UIDESIGN.md §8.3. */
export type RemoteState<T> =
  | { status: "idle" }
  | { status: "loading"; previous?: T }
  | { status: "ready"; data: T; observedAt: string }
  | { status: "stale"; data: T; observedAt: string; reason: string }
  | { status: "unsupported"; reason: string }
  | { status: "forbidden"; reason: string }
  | { status: "error"; code: string; message: string };

/** Payload returned by `luci.cyrenet.poc.status` rpcd endpoint. */
export interface PocStatus {
  hostname: string;
  cyrenet_version: string;
  cyrenet_profile: string;
  cyrenet_channel: string;
  upstream_version: string;
  kernel_version: string;
  uptime_seconds: number | null;
  load_average: string;
  observed_at: string;
}

/** Host LuCI integration bridge passed by View loader or local harness. */
export interface HostBridge {
  lang?: string;
  resourceBase?: string;
  callRpc?: (
    object: string,
    method: string,
    params?: Record<string, unknown>,
  ) => Promise<unknown>;
}

export interface RpcErrorLike {
  code?: number | string;
  httpStatus?: number;
  status?: number;
  message?: string;
  reason?: string;
}
