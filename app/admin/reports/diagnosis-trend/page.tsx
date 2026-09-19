import {
  FilterApply,
  FilterBar,
  FilterField,
} from "@/components/ui/filter-bar";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/roles";
import { listAppointmentsInRange } from "@/db/queries/reports";
import { ExportCsvButton } from "@/components/admin/export-csv-button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

  const rows = await listAppointmentsInRange({ from, to });
  const counts = new Map<string, { label: string; count: number }>();
  for (const r of rows) {
    const raw = r.consultation?.diagnosis?.trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    const entry = counts.get(key) ?? { label: raw, count: 0 };
    entry.count++;
    counts.set(key, entry);
  }
  const trendRows = [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .map((t) => ({ Diagnosis: t.label, Visits: t.count }));

  return (
    <main className="w-full px-4 lg:px-6 py-4 md:py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Diagnosis Trend</h1>
          <p className="text-xs text-muted-foreground">
            {from} → {to} · {trendRows.length} distinct{" "}
            {trendRows.length === 1 ? "diagnosis" : "diagnoses"}
          </p>
        </div>
        <ExportCsvButton
          rows={trendRows}
          filename={`diagnosis-trend-${from}-${to}`}
        />
      </div>
      <FilterBar action="/admin/reports/diagnosis-trend">
        <FilterField label="From">
          <Input type="date" name="from" defaultValue={from} className="w-40" />
        </FilterField>
        <FilterField label="To">
          <Input type="date" name="to" defaultValue={to} className="w-40" />
        </FilterField>
        <FilterApply />
      </FilterBar>
      {trendRows.length === 0 ? (
        <div className="border py-12 text-center text-sm text-muted-foreground">
          No recorded diagnoses in this range.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Diagnosis</TableHead>
              <TableHead>Visits</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trendRows.map((t) => (
              <TableRow key={String(t.Diagnosis)}>
                <TableCell>
                  <span className="font-medium">{String(t.Diagnosis)}</span>
                </TableCell>
                <TableCell>{t.Visits}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      )}
    </main>
  );
}
