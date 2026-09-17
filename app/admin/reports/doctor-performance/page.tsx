import { redirect } from "next/navigation";
import { requireRole } from "@/lib/roles";
import {
  avg,
  listAppointmentsInRange,
  waitMinutes,
  type DateRange,
} from "@/db/queries/reports";
import { ExportCsvButton } from "@/components/admin/export-csv-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const rows = await listAppointmentsInRange(range);

  const byDoctor = new Map<
    number,
    {
      name: string;
      department: string;
      seen: number;
      total: number;
      noShows: number;
      waits: number[];
      days: Set<string>;
    }
  >();
  for (const r of rows) {
    const e = byDoctor.get(r.doctorId) ?? {
      name: r.doctor.user.name,
      department: r.doctor.department.name,
      seen: 0,
      total: 0,
      noShows: 0,
      waits: [] as number[],
      days: new Set<string>(),
    };
    e.total++;
    e.days.add(r.date);
    if (r.status === "completed") e.seen++;
    if (r.status === "no_show") e.noShows++;
    const w = waitMinutes(r.statusLogs);
    if (w !== null) e.waits.push(w);
    byDoctor.set(r.doctorId, e);
  }
  const perfRows = [...byDoctor.values()].map((d) => ({
    Doctor: d.name,
    Department: d.department,
    "Active days": d.days.size,
    Seen: d.seen,
    "Seen/day":
      d.days.size === 0 ? "—" : (Math.round((d.seen / d.days.size) * 10) / 10).toFixed(1),
    "No-show %":
      d.total === 0 ? "—" : `${Math.round((d.noShows / d.total) * 100)}%`,
    "Avg wait (min)": avg(d.waits) ?? "—",
  }));

  return (
    <main className="w-full px-4 lg:px-6 py-4 md:py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Doctor Performance</h1>
          <p className="text-xs text-muted-foreground">
            {range.from} → {range.to}
          </p>
        </div>
        <ExportCsvButton
          rows={perfRows}
          filename={`doctor-performance-${range.from}-${range.to}`}
        />
      </div>
      <form
        action="/admin/reports/doctor-performance"
        method="get"
        className="mb-4 flex flex-wrap items-end gap-2"
      >
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">From</span>
          <Input type="date" name="from" defaultValue={range.from} className="w-40" />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">To</span>
          <Input type="date" name="to" defaultValue={range.to} className="w-40" />
        </label>
        <Button type="submit" variant="outline" size="sm">
          Apply
        </Button>
      </form>
      {perfRows.length === 0 ? (
        <div className="border py-12 text-center text-sm text-muted-foreground">
          No appointments in this range.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Doctor</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Active days</TableHead>
              <TableHead>Seen</TableHead>
              <TableHead>Seen/day</TableHead>
              <TableHead>No-show %</TableHead>
              <TableHead>Avg wait (min)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {perfRows.map((d) => (
              <TableRow key={String(d.Doctor)}>
                <TableCell>
                  <span className="font-medium">{String(d.Doctor)}</span>
                </TableCell>
                <TableCell>{String(d.Department)}</TableCell>
                <TableCell>{d["Active days"]}</TableCell>
                <TableCell>{d.Seen}</TableCell>
                <TableCell>{d["Seen/day"]}</TableCell>
                <TableCell>{d["No-show %"]}</TableCell>
                <TableCell>{String(d["Avg wait (min)"])}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </main>
  );
}
