import {
  FilterApply,
  FilterBar,
  FilterField,
} from "@/components/ui/filter-bar";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/roles";

import { Input } from "@/components/ui/input";
import { todayStr } from "@/lib/dates";
import { DailySection } from "@/components/admin/report-sections";
import { TableSkeleton } from "@/components/shell/loading-blocks";

export default async function DailyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  if (!(await requireRole("admin"))) redirect("/");
  const params = await searchParams;
  const date =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : todayStr();

  return (
    <main className="w-full px-4 lg:px-6 py-4 md:py-6">
      <FilterBar action="/admin/reports/daily" className="print:hidden">
        <FilterField label="Date">
          <Input type="date" name="date" defaultValue={date} className="w-40" />
        </FilterField>
        <FilterApply />
      </FilterBar>
      <Suspense fallback={<TableSkeleton rows={8} />}>
        <DailySection date={date} />
      </Suspense>
    </main>
  );
}
