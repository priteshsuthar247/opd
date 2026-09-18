import {
  StatCardsSkeleton,
  TableSkeleton,
} from "@/components/shell/loading-blocks";

// Segment fallback for everything under /reception.
export default function ReceptionLoading() {
  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
      <StatCardsSkeleton />
      <TableSkeleton />
    </div>
  );
}
