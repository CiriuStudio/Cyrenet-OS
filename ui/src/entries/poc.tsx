// SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
// SPDX-License-Identifier: GPL-3.0-only

import "../styles/index.css";

import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";

import { PocApp } from "@/features/poc/PocApp";
import type { HostBridge } from "@/lib/api/types";
import { PortalProvider } from "@/lib/portal/PortalProvider";
import { applyContainerTheme, resolveHostTheme } from "@/lib/theme/theme-bridge";

export interface MountedIsland {
  unmount: () => void;
}

/**
 * Mount the Cyrenet D1 UI Integration POC React Island inside a host LuCI container.
 */
export function mountCyrenetIsland(
  container: HTMLElement,
  bridge?: HostBridge,
): MountedIsland {
  container.classList.add("cyrenet-ui-root");
  applyContainerTheme(container, resolveHostTheme().theme);

  const root: Root = createRoot(container);
  root.render(
    <StrictMode>
      <PortalProvider>
        <PocApp bridge={bridge} container={container} />
      </PortalProvider>
    </StrictMode>,
  );

  return {
    unmount: () => {
      root.unmount();
    },
  };
}
