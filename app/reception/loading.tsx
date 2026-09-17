import { Skeleton } from "@/components/ui/skeleton";

// Segment fallback for everything under /reception: mirrors the list-page
// shape (header row plus table rows) so navigation shows structure, not
// a blank page.
export default function ReceptionLoading() {
  return (
    <main className="w-full px-4 lg:px-6 py-4 md:py-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-7 w-28" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    </main>
  );
}
