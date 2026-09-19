import type { ReactNode } from "react";

// The title + count + action row shared by every list page.
export function PageHeader({
  title,
  count,
  action,
}: {
  title: string;
  count?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        {count !== undefined && (
          <p className="text-xs text-muted-foreground">{count}</p>
        )}
      </div>
      {action}
    </div>
  );
}
