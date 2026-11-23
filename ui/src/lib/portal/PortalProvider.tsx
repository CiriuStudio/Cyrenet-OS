// SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
// SPDX-License-Identifier: GPL-3.0-only

import { createContext, useContext, useState, type ReactNode } from "react";

const PortalContext = createContext<HTMLElement | null>(null);

export interface PortalProviderProps {
  children: ReactNode;
}

/**
 * Provides a portal mount element strictly inside `.cyrenet-ui-root` so Radix
 * overlays retain scoped styles and theme tokens without leaking to `document.body`.
 */
export function PortalProvider({ children }: PortalProviderProps) {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);

  return (
    <PortalContext.Provider value={portalContainer}>
      {children}
      <div
        ref={setPortalContainer}
        className="cyrenet-portal-root"
        data-cyrenet-portal="true"
      />
    </PortalContext.Provider>
  );
}

/** Returns the scoped `.cyrenet-portal-root` container inside the active Feature Island. */
export function usePortalContainer(): HTMLElement | null {
  return useContext(PortalContext);
}
