// SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
// SPDX-License-Identifier: MIT

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "cn:relative cn:w-full cn:rounded-2xl cn:border cn:p-4 cn:text-sm",
  {
    variants: {
      variant: {
        default:
          "cn:border-outline-variant cn:bg-surface-container cn:text-foreground",
        info: "cn:border-info/30 cn:bg-tertiary-container cn:text-on-tertiary-container",
        warning: "cn:border-warning/40 cn:bg-warning/15 cn:text-foreground",
        destructive:
          "cn:border-destructive/35 cn:bg-error-container cn:text-on-error-container",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn("cn:mb-1 cn:font-semibold cn:leading-none cn:tracking-tight", className)}
      {...props}
    />
  ),
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("cn:text-sm cn:leading-relaxed", className)} {...props} />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
