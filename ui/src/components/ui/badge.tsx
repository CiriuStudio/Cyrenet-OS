// SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
// SPDX-License-Identifier: MIT

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "cn:inline-flex cn:items-center cn:gap-1.5 cn:rounded-full cn:border cn:px-3 cn:py-1 cn:text-xs cn:font-medium cn:transition-colors",
  {
    variants: {
      variant: {
        default:
          "cn:border-transparent cn:bg-primary-container cn:text-on-primary-container",
        secondary:
          "cn:border-outline-variant cn:bg-surface-container cn:text-foreground",
        destructive:
          "cn:border-destructive/30 cn:bg-error-container cn:text-on-error-container",
        outline: "cn:border-outline cn:bg-transparent cn:text-foreground",
        success: "cn:border-success/35 cn:bg-success/15 cn:text-success",
        warning: "cn:border-warning/35 cn:bg-warning/15 cn:text-warning",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
