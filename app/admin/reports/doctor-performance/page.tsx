import { Suspense } from "react";
import {
  FilterApply,
  FilterBar,
  FilterField,
} from "@/components/ui/filter-bar";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/roles";
import type { DateRange } from "@/db/queries/reports";
import { PerformanceSection } from "@/components/admin/report-sections";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/shell/loading-blocks";

function rangeParams(params: {
  from?: string;
  to?: string;
}): DateRange {
  const today = new Date();
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const fallbackTo = fmt(today);
  const fallbackFrom = fmt(new Date(today.getTime() - 13 * 86400000));
  const ok = (s: string | undefined) =>
    s !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const from = ok(params.from) ? params.from! : fallbackFrom;
  const to = ok(params.to) ? params.to! : fallbackTo;
  return from <= to ? { from, to } : { from: to, to: from };
}

export default async function DoctorPerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  if (!(await requireRole("admin"))) redirect("/");
  const range = rangeParams(await searchParams);
  return (
    <main className="w-full px-4 lg:px-6 py-4 md:py-6">
      <FilterBar action="/admin/reports/doctor-performance">
        <FilterField label="From">
          <Input type="date" name="from" defaultValue={range.from} className="w-40" />
        </FilterField>
        <FilterField label="To">
          <Input type="date" name="to" defaultValue={range.to} className="w-40" />
        </FilterField>
        <FilterApply />
      </FilterBar>
      <Suspense fallback={<TableSkeleton rows={8} />}>
        <PerformanceSection from={range.from} to={range.to} />
      </Suspense>
    </main>
  );
}
