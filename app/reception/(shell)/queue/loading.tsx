import { TableSkeleton } from "@/components/shell/loading-blocks";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:px-6 md:py-6">
      <TableSkeleton rows={8} />
    </div>
  );
}
