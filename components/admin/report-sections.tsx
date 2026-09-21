import {
  avg,
  listAppointmentsInRange,
  waitMinutes,
} from "@/db/queries/reports";
import { ExportCsvButton } from "@/components/admin/export-csv-button";
import { DownloadReportButton } from "@/components/reports/download-report-button";
import { PrintButton } from "@/components/consultation/print-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Streaming sections for the aggregation reports: filter bars paint
// from params alone while these load the range bundle, aggregate, and
// render behind skeletons. Hand-rolled tables stay (dense aggregates,
// not row-grids) — only their datafetch moves behind a boundary.

// Daily OPD summary: header stats + per-doctor breakdown.
export async function DailySection({ date }: { date: string }) {
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
    <>
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
          <DownloadReportButton query={`report=daily&date=${date}`} filename={`daily-${date}`} />
          <PrintButton />
        </div>
      </div>
      {doctorRows.length === 0 ? (
        <div className="border py-12 text-center text-sm text-muted-foreground">
          No appointments on this date.
        </div>
      ) : (
        <div className="overflow-x-auto">
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
        </div>
      )}
    </>
  );
}

// Diagnosis trend aggregation over a range.
export async function TrendSection({
  from,
  to,
}: {
  from: string;
  to: string;
}) {
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
    <>
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
        <DownloadReportButton query={`report=trend&from=${from}&to=${to}`} filename={`diagnosis-trend-${from}-${to}`} />
      </div>
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
                <TableRow key={t.Diagnosis}>
                  <TableCell>
                    <span className="font-medium">{t.Diagnosis}</span>
                  </TableCell>
                  <TableCell>{t.Visits}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}

// Doctor performance aggregation over a range.
export async function PerformanceSection({
  from,
  to,
}: {
  from: string;
  to: string;
}) {
  const rows = await listAppointmentsInRange({ from, to });
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
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Doctor Performance</h1>
          <p className="text-xs text-muted-foreground">
            {from} → {to}
          </p>
        </div>
        <ExportCsvButton
          rows={perfRows}
          filename={`doctor-performance-${from}-${to}`}
        />
        <DownloadReportButton query={`report=performance&from=${from}&to=${to}`} filename={`doctor-performance-${from}-${to}`} />
      </div>
      {perfRows.length === 0 ? (
        <div className="border py-12 text-center text-sm text-muted-foreground">
          No appointments in this range.
        </div>
      ) : (
        <div className="overflow-x-auto">
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
        </div>
      )}
    </>
  );
}
