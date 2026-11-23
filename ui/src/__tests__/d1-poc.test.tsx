// SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
// SPDX-License-Identifier: GPL-3.0-only

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { PocApp } from "@/features/poc/PocApp";
import type { HostBridge, PocStatus } from "@/lib/api/types";
import { PortalProvider } from "@/lib/portal/PortalProvider";
import { resolveHostTheme } from "@/lib/theme/theme-bridge";
import { cn } from "@/lib/utils";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const UI_ROOT = path.resolve(TEST_DIR, "../..");

const READY_STATUS: PocStatus = {
  hostname: "CyrenetOS-Test",
  cyrenet_version: "1.0.0-alpha.1",
  cyrenet_profile: "core",
  cyrenet_channel: "nightly",
  upstream_version: "25.12.2",
  kernel_version: "6.12.103",
  uptime_seconds: 125,
  load_average: "0.08 0.02 0.00",
  observed_at: "2026-11-23T04:40:00Z",
};

function renderPoc(bridge: HostBridge) {
  const container = document.createElement("div");
  container.className = "cyrenet-ui-root";
  document.body.appendChild(container);

  return render(
    <PortalProvider>
      <PocApp bridge={bridge} container={container} />
    </PortalProvider>,
    { container },
  );
}

describe("D1 UI Integration POC contracts", () => {
  it("resolves host theme and reacts live to MutationObserver updates", async () => {
    document.documentElement.setAttribute("data-darkmode", "true");
    expect(resolveHostTheme()).toEqual({ theme: "dark", source: "data-darkmode" });

    const { container, unmount } = renderPoc({
      lang: "en",
      callRpc: async () => READY_STATUS,
    });

    expect(container.getAttribute("data-cyrenet-theme")).toBe("dark");
    expect(container.classList.contains("dark")).toBe(true);
    expect(screen.getByTestId("theme-badge")).toHaveTextContent("Dark (data-darkmode)");

    await act(async () => {
      document.documentElement.setAttribute("data-darkmode", "false");
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(container.getAttribute("data-cyrenet-theme")).toBe("light");
    });
    expect(container.classList.contains("dark")).toBe(false);
    expect(screen.getByTestId("theme-badge")).toHaveTextContent("Light (data-darkmode)");

    document.documentElement.setAttribute("data-cyrenet-theme", "dark");
    expect(resolveHostTheme()).toEqual({ theme: "dark", source: "data-cyrenet-theme" });

    unmount();
    container.remove();
  });

  it("mounts Radix Dialog portal strictly inside .cyrenet-ui-root and supports Escape", async () => {
    const user = userEvent.setup();
    const { container, unmount } = renderPoc({
      lang: "en",
      callRpc: async () => READY_STATUS,
    });

    const trigger = await screen.findByTestId("open-poc-dialog");
    await user.click(trigger);

    const dialog = await screen.findByRole("dialog");
    const portalRoot = container.querySelector(".cyrenet-portal-root");

    expect(portalRoot).not.toBeNull();
    expect(portalRoot?.contains(dialog)).toBe(true);
    expect(Array.from(document.body.children)).not.toContain(dialog);

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    unmount();
    container.remove();
  });

  it("maps ready, forbidden (ubus 6), unsupported (ubus 4), and error states without faking 0", async () => {
    const readyNullUptime = renderPoc({
      lang: "en",
      callRpc: async () => ({ ...READY_STATUS, uptime_seconds: null }),
    });
    const readyBox = await screen.findByTestId("poc-status-ready");
    expect(readyBox).toHaveTextContent("unknown");
    expect(readyBox).not.toHaveTextContent("0h 0m 0s");
    readyNullUptime.unmount();
    readyNullUptime.container.remove();

    const forbidden = renderPoc({
      lang: "en",
      callRpc: async () => {
        throw { code: 6, message: "Permission denied" };
      },
    });
    expect(await screen.findByTestId("poc-status-forbidden")).toHaveTextContent("Permission denied");
    forbidden.unmount();
    forbidden.container.remove();

    const unsupported = renderPoc({
      lang: "en",
      callRpc: async () => {
        throw { code: 4, message: "Object not found" };
      },
    });
    expect(await screen.findByTestId("poc-status-unsupported")).toHaveTextContent("Object not found");
    unsupported.unmount();
    unsupported.container.remove();

    const errored = renderPoc({
      lang: "en",
      callRpc: async () => {
        throw { code: "E_TIMEOUT", message: "Request timed out" };
      },
    });
    expect(await screen.findByTestId("poc-status-error")).toHaveTextContent("Request timed out");
    errored.unmount();
    errored.container.remove();
  });

  it("merges Tailwind v4 cn: prefixed classes without losing conflicts", () => {
    expect(cn("cn:px-2", "cn:px-4")).toBe("cn:px-4");
    expect(cn("cn:bg-primary", "cn:bg-card")).toBe("cn:bg-card");
  });

  it("verifies built Vite dist isolation, cn: utilities, and zero external CDN links", () => {
    const distDir = path.join(UI_ROOT, "dist");
    const manifestPath = path.join(distDir, "manifest.json");
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as Record<
      string,
      { file: string; css?: string[] }
    >;
    const entry = manifest["src/entries/poc.tsx"];
    expect(entry?.file).toMatch(/^assets\/poc-.*\.js$/);
    expect(entry?.css?.length ?? 0).toBeGreaterThan(0);

    const jsPath = path.join(distDir, entry.file);
    const jsText = fs.readFileSync(jsPath, "utf-8");
    expect(jsText).toContain("mountCyrenetIsland");

    const cssText = (entry.css ?? [])
      .map((rel) => fs.readFileSync(path.join(distDir, rel), "utf-8"))
      .join("\n");

    expect(cssText).toContain(".cyrenet-ui-root");
    expect(cssText).toContain("--cn-surface-container-low");
    expect(cssText).toMatch(/\.cn\\:bg-surface-low/);
    expect(cssText).toMatch(/\.cn\\:bg-primary/);
    expect(cssText).toMatch(/\.cn\\:bg-secondary-container/);
    expect(cssText).toMatch(/\.cn\\:border-outline/);

    const baseLayerIdx = cssText.indexOf("@layer base{");
    const utilitiesLayerIdx = cssText.indexOf("@layer utilities{");
    expect(baseLayerIdx).toBeGreaterThanOrEqual(0);
    expect(utilitiesLayerIdx).toBeGreaterThan(baseLayerIdx);
    const buttonResetIdx = cssText.indexOf(".cyrenet-ui-root button");
    expect(buttonResetIdx).toBeGreaterThan(baseLayerIdx);
    expect(buttonResetIdx).toBeLessThan(utilitiesLayerIdx);

    // Must not emit Tailwind Preflight global unprefixed resets or leak theme tokens on :root
    expect(cssText).not.toMatch(/(?:^|[}])body\{/);
    expect(cssText).not.toMatch(/(?:^|[}])html,/);
    expect(cssText).not.toMatch(/(?:^|[}])table\{/);
    expect(cssText).not.toMatch(/:root\{[^}]*--background:/);

    // Zero remote CDN dependencies in compiled CSS (excluding Tailwind license comment) or JS assets
    const cssWithoutComments = cssText.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(cssWithoutComments).not.toMatch(/https?:\/\//i);
    const urlsInJs = jsText.match(/https?:\/\/[^\s"'`<>)]+/gi) ?? [];
    for (const url of urlsInJs) {
      const host = new URL(url).hostname;
      expect(["www.w3.org", "react.dev", "reactjs.org"]).toContain(host);
    }
  });
});
