import { Skeleton } from "@/components/ui/skeleton";

// Shared loading shapes mirroring real page layouts, so every navigation
// shows instant structural feedback instead of a blank page.
export function StatCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-md border p-4">
          <div className="flex items-center justify-between pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="size-4" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export function ToolbarSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-24" />
      <span className="ml-auto">
        <Skeleton className="h-8 w-24" />
      </span>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex w-full flex-col gap-2.5">
      <ToolbarSkeleton />
      <div className="overflow-hidden rounded-md border">
        <div className="flex flex-col">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-12 w-full rounded-none border-b last:border-b-0"
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between py-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-48" />
      </div>
    </div>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="flex max-w-md flex-col gap-4 rounded-md border p-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
      <Skeleton className="h-8 w-28" />
    </div>
  );
}
