import {
  FilterApply,
  FilterBar,
  FilterField,
} from "@/components/ui/filter-bar";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { TrendSection } from "@/components/admin/report-sections";
import { TableSkeleton } from "@/components/shell/loading-blocks";
import { requireRole } from "@/lib/roles";
import { listAppointmentsInRange } from "@/db/queries/reports";
import { Input } from "@/components/ui/input";

export default async function DiagnosisTrendPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  if (!(await requireRole("admin"))) redirect("/");
  const params = await searchParams;
  const today = new Date();
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const ok = (s: string | undefined) =>
    s !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const to = ok(params.to) ? params.to! : fmt(today);
  const from = ok(params.from)
    ? params.from!
    : fmt(new Date(today.getTime() - 29 * 86400000));

  return (
    <main className="w-full px-4 lg:px-6 py-4 md:py-6">
      <FilterBar action="/admin/reports/diagnosis-trend">
        <FilterField label="From">
          <Input type="date" name="from" defaultValue={from} className="w-40" />
        </FilterField>
        <FilterField label="To">
          <Input type="date" name="to" defaultValue={to} className="w-40" />
        </FilterField>
        <FilterApply />
      </FilterBar>
      <Suspense fallback={<TableSkeleton rows={8} />}>
        <TrendSection from={from} to={to} />
      </Suspense>
    </main>
  );
}
