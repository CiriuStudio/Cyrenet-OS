// SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
// SPDX-License-Identifier: GPL-3.0-only

import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  prefix: "cn",
});

/** Merge Tailwind v4 `cn:` prefixed class names with conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
