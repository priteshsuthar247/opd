import { redirect } from "next/navigation";
import { requireRole } from "@/lib/roles";
import {
  avg,
  listAppointmentsInRange,
  waitMinutes,
} from "@/db/queries/reports";
import { ExportCsvButton } from "@/components/admin/export-csv-button";
import { PrintButton } from "@/components/consultation/print-button";
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

function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

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

  const rows = await listAppointmentsInRange({ from: date, to: date });
  const seen = rows.filter((r) => r.status === "completed").length;
  const noShows = rows.filter((r) => r.status === "no_show").length;
  const averageWait = avg(
    rows.map((r) => waitMinutes(r.statusLogs)).filter((w) => w !== null)
  );

  const byDoctor = new Map<
    number,
    { name: string; department: string; seen: number; waiting: number; waits: number[]; noShows: number }
  >();
  for (const r of rows) {
    const entry = byDoctor.get(r.doctorId) ?? {
      name: r.doctor.user.name,
      department: r.doctor.department.name,
      seen: 0,
      waiting: 0,
      waits: [] as number[],
      noShows: 0,
    };
    if (r.status === "completed") entry.seen++;
    if (r.status === "waiting" || r.status === "in_progress") entry.waiting++;
    if (r.status === "no_show") entry.noShows++;
    const w = waitMinutes(r.statusLogs);
    if (w !== null) entry.waits.push(w);
    byDoctor.set(r.doctorId, entry);
  }
  const doctorRows = [...byDoctor.values()].map((d) => ({
    Doctor: d.name,
    Department: d.department,
    Seen: d.seen,
    "In queue": d.waiting,
    "No-shows": d.noShows,
    "Avg wait (min)": avg(d.waits) ?? "—",
  }));

  return (
    <main className="mx-auto w-full max-w-4xl p-4">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Daily OPD Summary · {date}</h1>
          <p className="text-xs text-muted-foreground">
            {seen} seen · {noShows} no-shows · avg wait{" "}
            {averageWait === null ? "—" : `${averageWait} min`}
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <ExportCsvButton rows={doctorRows} filename={`daily-${date}`} />
          <PrintButton />
        </div>
      </div>
      <form
        action="/admin/reports/daily"
        method="get"
        className="mb-4 flex items-end gap-2 print:hidden"
      >
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Date</span>
          <Input type="date" name="date" defaultValue={date} className="w-40" />
        </label>
        <Button type="submit" variant="outline" size="sm">
          Apply
        </Button>
      </form>
      {doctorRows.length === 0 ? (
        <div className="border py-12 text-center text-sm text-muted-foreground">
          No appointments on this date.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Doctor</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Seen</TableHead>
              <TableHead>In queue</TableHead>
              <TableHead>No-shows</TableHead>
              <TableHead>Avg wait (min)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {doctorRows.map((d) => (
              <TableRow key={d.Doctor}>
                <TableCell>
                  <span className="font-medium">{String(d.Doctor)}</span>
                </TableCell>
                <TableCell>{String(d.Department)}</TableCell>
                <TableCell>{d.Seen}</TableCell>
                <TableCell>{d["In queue"]}</TableCell>
                <TableCell>{d["No-shows"]}</TableCell>
                <TableCell>{String(d["Avg wait (min)"])}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </main>
  );
}
