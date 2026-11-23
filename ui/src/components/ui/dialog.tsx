// SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
// SPDX-License-Identifier: MIT

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { usePortalContainer } from "@/lib/portal/PortalProvider";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

function DialogPortal({
  container,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Portal>) {
  const scopedContainer = usePortalContainer();
  return <DialogPrimitive.Portal container={container ?? scopedContainer ?? undefined} {...props} />;
}

const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "cn:fixed cn:inset-0 cn:z-[9990] cn:bg-black/55 cn:backdrop-blur-[2px]",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    closeLabel?: string;
  }
>(({ className, children, closeLabel = "Close", ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "cn:fixed cn:left-1/2 cn:top-1/2 cn:z-[9995] cn:grid cn:w-[calc(100%-2rem)] cn:max-w-lg cn:-translate-x-1/2 cn:-translate-y-1/2 cn:gap-4 cn:rounded-[28px] cn:border cn:border-outline-variant cn:bg-surface-high cn:p-6 cn:text-card-foreground cn:shadow-2xl",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        type="button"
        aria-label={closeLabel}
        className="cn:absolute cn:right-5 cn:top-5 cn:flex cn:h-8 cn:w-8 cn:items-center cn:justify-center cn:rounded-full cn:text-muted-foreground cn:transition-colors cn:hover:bg-surface-highest cn:hover:text-foreground cn:focus-visible:outline-none cn:focus-visible:ring-2 cn:focus-visible:ring-ring"
      >
        <X className="cn:h-4 cn:w-4" aria-hidden="true" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("cn:flex cn:flex-col cn:gap-2 cn:pr-8 cn:text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("cn:flex cn:flex-wrap cn:justify-end cn:gap-2 cn:pt-2", className)}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("cn:text-xl cn:font-semibold cn:leading-tight cn:text-foreground", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("cn:text-sm cn:leading-relaxed cn:text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
