// SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
// SPDX-License-Identifier: MIT

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "cn:inline-flex cn:items-center cn:gap-1.5 cn:rounded-full cn:border cn:px-2.5 cn:py-0.5 cn:text-xs cn:font-medium cn:transition-colors",
  {
    variants: {
      variant: {
        default: "cn:border-transparent cn:bg-primary cn:text-primary-foreground",
        secondary: "cn:border-border cn:bg-secondary cn:text-secondary-foreground",
        destructive: "cn:border-destructive/40 cn:bg-destructive/15 cn:text-destructive",
        outline: "cn:border-border cn:text-foreground",
        success: "cn:border-success/40 cn:bg-success/15 cn:text-success",
        warning: "cn:border-warning/40 cn:bg-warning/15 cn:text-warning",
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
