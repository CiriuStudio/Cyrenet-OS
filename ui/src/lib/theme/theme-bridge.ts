// SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
// SPDX-License-Identifier: GPL-3.0-only

import { useEffect, useState } from "react";

export type CyrenetTheme = "light" | "dark";

export type ThemeSource =
  | "data-cyrenet-theme"
  | "data-darkmode"
  | "data-theme"
  | "class-dark"
  | "prefers-color-scheme"
  | "default";

export interface HostThemeState {
  theme: CyrenetTheme;
  source: ThemeSource;
}

/**
 * Inspect host LuCI / Argon attributes and system media preference to determine active theme.
 */
export function resolveHostTheme(
  doc: Document | undefined = typeof document !== "undefined" ? document : undefined,
  win: Window | undefined = typeof window !== "undefined" ? window : undefined,
): HostThemeState {
  if (!doc) {
    return { theme: "light", source: "default" };
  }

  const root = doc.documentElement;
  const cyrenetAttr = root.getAttribute("data-cyrenet-theme")?.toLowerCase();
  if (cyrenetAttr === "dark" || cyrenetAttr === "light") {
    return { theme: cyrenetAttr, source: "data-cyrenet-theme" };
  }

  const darkModeAttr = root.getAttribute("data-darkmode")?.toLowerCase();
  if (darkModeAttr === "true") {
    return { theme: "dark", source: "data-darkmode" };
  }
  if (darkModeAttr === "false") {
    return { theme: "light", source: "data-darkmode" };
  }

  const dataThemeAttr = root.getAttribute("data-theme")?.toLowerCase();
  if (dataThemeAttr === "dark" || dataThemeAttr === "light") {
    return { theme: dataThemeAttr, source: "data-theme" };
  }

  if (root.classList.contains("dark") || doc.body?.classList.contains("dark")) {
    return { theme: "dark", source: "class-dark" };
  }

  if (win?.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return { theme: "dark", source: "prefers-color-scheme" };
  }

  return { theme: "light", source: "default" };
}

/** Synchronize `.cyrenet-ui-root` theme attribute and `.dark` class synchronously. */
export function applyContainerTheme(container: HTMLElement, theme: CyrenetTheme): void {
  container.setAttribute("data-cyrenet-theme", theme);
  container.classList.toggle("dark", theme === "dark");
}

/**
 * Subscribe to host LuCI / Argon theme changes via DOM MutationObserver,
 * media query listener, and `cyrenet:theme-change` custom events.
 */
export function subscribeHostTheme(
  onChange: (state: HostThemeState) => void,
  doc: Document | undefined = typeof document !== "undefined" ? document : undefined,
  win: Window | undefined = typeof window !== "undefined" ? window : undefined,
): () => void {
  if (!doc) {
    return () => {};
  }

  let lastTheme = resolveHostTheme(doc, win);
  const emitIfChanged = () => {
    const next = resolveHostTheme(doc, win);
    if (next.theme !== lastTheme.theme || next.source !== lastTheme.source) {
      lastTheme = next;
      onChange(next);
    }
  };

  const attrFilter = ["data-cyrenet-theme", "data-darkmode", "data-theme", "class"];
  const observer =
    typeof MutationObserver !== "undefined" ? new MutationObserver(emitIfChanged) : null;

  observer?.observe(doc.documentElement, {
    attributes: true,
    attributeFilter: attrFilter,
  });

  if (doc.body && observer) {
    observer.observe(doc.body, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
  }

  const mediaQuery = win?.matchMedia?.("(prefers-color-scheme: dark)");
  if (mediaQuery?.addEventListener) {
    mediaQuery.addEventListener("change", emitIfChanged);
  } else if (mediaQuery?.addListener) {
    mediaQuery.addListener(emitIfChanged);
  }

  win?.addEventListener("cyrenet:theme-change", emitIfChanged);

  return () => {
    observer?.disconnect();
    if (mediaQuery?.removeEventListener) {
      mediaQuery.removeEventListener("change", emitIfChanged);
    } else if (mediaQuery?.removeListener) {
      mediaQuery.removeListener(emitIfChanged);
    }
    win?.removeEventListener("cyrenet:theme-change", emitIfChanged);
  };
}

/** React hook returning live Cyrenet theme synchronized with host LuCI shell. */
export function useHostTheme(
  doc: Document | undefined = typeof document !== "undefined" ? document : undefined,
  win: Window | undefined = typeof window !== "undefined" ? window : undefined,
): HostThemeState {
  const [state, setState] = useState<HostThemeState>(() => resolveHostTheme(doc, win));

  useEffect(() => {
    setState(resolveHostTheme(doc, win));
    return subscribeHostTheme(setState, doc, win);
  }, [doc, win]);

  return state;
}
