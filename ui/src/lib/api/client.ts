// SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { HostBridge, PocStatus, RemoteState, RpcErrorLike } from "./types";

interface LuciGlobal {
  env?: {
    sessionid?: string;
    lang?: string;
  };
}

let rpcSequence = 1;

function getLuciGlobal(): LuciGlobal | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  return (window as unknown as { L?: LuciGlobal }).L;
}

/**
 * Fallback direct JSON-RPC 2.0 call to LuCI `/ubus` endpoint.
 * Never persists auth tokens in browser storage (`UIDESIGN.md` §8.2).
 */
async function callViaUbus<T>(
  object: string,
  method: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  const sessionId = getLuciGlobal()?.env?.sessionid;
  if (!sessionId) {
    const err: RpcErrorLike = {
      code: "NO_SESSION",
      httpStatus: 401,
      message: "Missing active LuCI RPC session",
    };
    throw err;
  }

  const response = await fetch("/ubus", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: rpcSequence++,
      method: "call",
      params: [sessionId, object, method, params],
    }),
  });

  if (!response.ok) {
    const err: RpcErrorLike = {
      httpStatus: response.status,
      code: `HTTP_${response.status}`,
      message: `HTTP ${response.status} from /ubus`,
    };
    throw err;
  }

  const payload = (await response.json()) as {
    result?: [number, T?];
    error?: { code?: number; message?: string };
  };

  if (payload.error) {
    const err: RpcErrorLike = {
      code: payload.error.code ?? "JSONRPC_ERROR",
      message: payload.error.message ?? "JSON-RPC error",
    };
    throw err;
  }

  if (!Array.isArray(payload.result)) {
    const err: RpcErrorLike = {
      code: "INVALID_RESPONSE",
      message: "Malformed /ubus JSON-RPC response",
    };
    throw err;
  }

  const [ubusCode, data] = payload.result;
  if (ubusCode !== 0) {
    const err: RpcErrorLike = {
      code: ubusCode,
      message: `ubus call failed with status code ${ubusCode}`,
    };
    throw err;
  }

  return (data ?? {}) as T;
}

/** Maps RPC / HTTP / ubus failures into typed `RemoteState` variants without faking success or zero metrics. */
export function mapRpcFailureToState<T>(error: unknown): RemoteState<T> {
  if (typeof error === "object" && error !== null) {
    const e = error as RpcErrorLike;
    const httpStatus = e.httpStatus ?? e.status;
    const codeStr = e.code !== undefined ? String(e.code).toUpperCase() : "";
    const msg = e.reason ?? e.message ?? "RPC request failed";

    if (
      httpStatus === 401 ||
      httpStatus === 403 ||
      e.code === 6 ||
      codeStr === "FORBIDDEN" ||
      codeStr === "NO_SESSION" ||
      /permission denied|access denied|forbidden|unauthorized/i.test(msg)
    ) {
      return {
        status: "forbidden",
        reason: msg,
      };
    }

    if (
      httpStatus === 404 ||
      e.code === 3 ||
      e.code === 4 ||
      codeStr === "UNSUPPORTED" ||
      /object not found|method not found|not supported|unsupported/i.test(msg)
    ) {
      return {
        status: "unsupported",
        reason: msg,
      };
    }

    return {
      status: "error",
      code: codeStr || "RPC_ERROR",
      message: msg,
    };
  }

  return {
    status: "error",
    code: "UNKNOWN_ERROR",
    message: error instanceof Error ? error.message : String(error),
  };
}

export interface CyrenetApiClient {
  fetchPocStatus: () => Promise<RemoteState<PocStatus>>;
}

/** Create a typed client bound to the host LuCI RPC bridge or `/ubus`. */
export function createApiClient(bridge?: HostBridge): CyrenetApiClient {
  const invoke = <T,>(object: string, method: string, params: Record<string, unknown> = {}) => {
    if (bridge?.callRpc) {
      return bridge.callRpc(object, method, params) as Promise<T>;
    }
    return callViaUbus<T>(object, method, params);
  };

  return {
    async fetchPocStatus(): Promise<RemoteState<PocStatus>> {
      try {
        const data = await invoke<PocStatus>("luci.cyrenet.poc", "status");
        return {
          status: "ready",
          data,
          observedAt: data.observed_at || new Date().toISOString(),
        };
      } catch (err) {
        return mapRpcFailureToState<PocStatus>(err);
      }
    },
  };
}
