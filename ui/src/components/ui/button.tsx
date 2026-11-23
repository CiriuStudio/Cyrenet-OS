// SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
// SPDX-License-Identifier: MIT

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "cn:inline-flex cn:items-center cn:justify-center cn:gap-2 cn:whitespace-nowrap cn:rounded-md cn:text-sm cn:font-medium cn:transition-colors cn:focus-visible:outline-none cn:focus-visible:ring-2 cn:focus-visible:ring-ring cn:disabled:pointer-events-none cn:disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "cn:bg-primary cn:text-primary-foreground cn:hover:opacity-90",
        destructive: "cn:bg-destructive cn:text-destructive-foreground cn:hover:opacity-90",
        outline:
          "cn:border cn:border-border cn:bg-card cn:text-foreground cn:hover:bg-accent cn:hover:text-accent-foreground",
        secondary:
          "cn:bg-secondary cn:text-secondary-foreground cn:hover:opacity-85",
        ghost: "cn:hover:bg-accent cn:hover:text-accent-foreground",
        link: "cn:text-primary cn:underline-offset-4 cn:hover:underline",
      },
      size: {
        default: "cn:h-10 cn:px-4 cn:py-2",
        sm: "cn:h-9 cn:rounded-md cn:px-3",
        lg: "cn:h-11 cn:rounded-md cn:px-6",
        icon: "cn:h-10 cn:w-10",
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
