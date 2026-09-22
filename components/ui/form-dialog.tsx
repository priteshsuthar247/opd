"use client";

import { useState, type ReactNode } from "react";
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
// Mobile is capped at full width minus 1rem gutters per side.
const sizes = {
  sm: "max-w-[calc(100%-2rem)] sm:max-w-sm",
  md: "max-w-[calc(100%-2rem)] sm:max-w-md",
  lg: "max-w-[calc(100%-2rem)] sm:max-w-lg",
  xl: "max-w-[calc(100%-2rem)] sm:max-w-2xl",
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
        {/* Mount children only when open to ensure RHF resets on close */}
        {open && (
          footer ? (
            <>
              {children}
              {footer}
            </>
          ) : (
            <form onSubmit={onSubmit}>
              {children}
              <DialogFooter className="mt-4">
                <Button type="submit" disabled={busy}>
                  {busy ? busyLabel : submitLabel}
                </Button>
              </DialogFooter>
            </form>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}

// Controlled/uncontrolled open state shared by every dialog: pages render
// dialogs uncontrolled (own trigger), tables render them controlled (row
// menu opens them). Returns the resolved open flag, setter, and whether
// the parent controls it (to hide the built-in trigger).
export function useFormDialog(external?: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = external?.open !== undefined;
  return {
    controlled,
    openState: external?.open ?? internalOpen,
    setOpenState: external?.onOpenChange ?? setInternalOpen,
  };
}
