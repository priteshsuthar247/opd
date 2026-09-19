import type { ReactNode } from "react";

// The zero-data state shared by every table: message plus an optional
// action (e.g. the Add dialog for a first record).
export function TableEmpty({
  message,
  action,
}: {
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border py-12 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}
