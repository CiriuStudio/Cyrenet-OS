// SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
// SPDX-License-Identifier: MIT

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "cn:inline-flex cn:items-center cn:justify-center cn:gap-2 cn:whitespace-nowrap cn:rounded-full cn:text-sm cn:font-medium cn:transition-all cn:focus-visible:outline-none cn:focus-visible:ring-2 cn:focus-visible:ring-ring cn:focus-visible:ring-offset-2 cn:disabled:pointer-events-none cn:disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "cn:bg-primary cn:text-primary-foreground cn:shadow-xs cn:hover:opacity-92",
        tonal:
          "cn:bg-secondary-container cn:text-on-secondary-container cn:hover:opacity-90",
        secondary:
          "cn:bg-secondary-container cn:text-on-secondary-container cn:hover:opacity-90",
        outline:
          "cn:border cn:border-outline cn:bg-transparent cn:text-primary cn:hover:bg-primary/10",
        ghost: "cn:bg-transparent cn:text-primary cn:hover:bg-primary/10",
        text: "cn:bg-transparent cn:text-primary cn:hover:bg-primary/10",
        destructive:
          "cn:bg-destructive cn:text-destructive-foreground cn:shadow-xs cn:hover:opacity-90",
        destructiveTonal:
          "cn:bg-error-container cn:text-on-error-container cn:hover:opacity-90",
        link: "cn:text-primary cn:underline-offset-4 cn:hover:underline",
      },
      size: {
        default: "cn:h-10 cn:px-5 cn:py-2",
        sm: "cn:h-9 cn:px-4 cn:text-xs",
        lg: "cn:h-11 cn:px-6",
        icon: "cn:h-10 cn:w-10 cn:p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type = "button", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
