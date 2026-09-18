import { Skeleton } from "@/components/ui/skeleton";

// Global fallback: first paint before any segment resolves.
export default function RootLoading() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-4">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-md border p-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </main>
  );
}
