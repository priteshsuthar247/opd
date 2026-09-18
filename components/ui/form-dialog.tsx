"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// One dialog shell for every form in the app. Widths live here alone —
// the sm:max-w-sm default on DialogContent beats bare max-w classes, so
// every size carries its explicit sm: override in exactly one place.
const sizes = {
  sm: "max-w-sm sm:max-w-sm",
  md: "max-w-md sm:max-w-md",
  lg: "max-w-lg sm:max-w-lg",
  xl: "max-w-2xl sm:max-w-2xl",
} as const;

export function FormDialog({
  open,
  onOpenChange,
  triggerLabel,
  triggerVariant = "default",
  title,
  description,
  size = "sm",
  submitLabel = "Save",
  busyLabel = "Saving…",
  busy = false,
  onSubmit,
  footer,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Omit the trigger for externally controlled dialogs (e.g. opened from
  // a table row action instead of their own button).
  triggerLabel?: ReactNode;
  triggerVariant?: "default" | "outline" | "ghost";
  title: ReactNode;
  description?: ReactNode;
  size?: keyof typeof sizes;
  submitLabel?: string;
  busyLabel?: string;
  busy?: boolean;
  onSubmit?: (e: React.FormEvent) => void;
  footer?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {triggerLabel !== undefined && (
        <DialogTrigger
          render={
            <Button variant={triggerVariant} size="sm">
              {triggerLabel}
            </Button>
          }
        />
      )}
      <DialogContent
        className={`${sizes[size]} max-h-[calc(100dvh-2rem)] overflow-y-auto`}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        {footer ?? (
          <form onSubmit={onSubmit}>
            {children}
            <DialogFooter className="mt-4">
              <Button type="submit" disabled={busy}>
                {busy ? busyLabel : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
