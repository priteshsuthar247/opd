import { cn } from "cn";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

// GET filter forms (report ranges, queue scope): label + control + apply.
// Server-rendered, no client JS — the form submits as query params.
export function FilterBar({
  action,
  className,
  children,
}: {
  action: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <form
      action={action}
      method="get"
      className={cn("mb-4 flex flex-wrap items-end gap-2", className)}
    >
      {children}
    </form>
  );
}

export function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function FilterApply({ label = "Apply" }: { label?: string }) {
  return (
    <Button type="submit" variant="outline" size="sm">
      {label}
    </Button>
  );
}
