// SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
// SPDX-License-Identifier: GPL-3.0-only

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("data-cyrenet-theme");
  document.documentElement.removeAttribute("data-darkmode");
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.classList.remove("dark");
  document.body.classList.remove("dark");
});
