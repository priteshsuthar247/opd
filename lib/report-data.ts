import {
  avg,
  listAppointmentsInRange,
  waitMinutes,
} from "@/db/queries/reports";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { patients } from "@/db/schema";

// Shared report row-builders: the streaming sections AND the PDF API
// route both consume these, so CSV, screen tables, and PDFs can never
// drift apart. Each builder returns a title, subtitle, column headers,
// and string-cell rows ready for any renderer.
export type ReportTable = {
  title: string;
  subtitle: string;
  columns: string[];
  rows: string[][];
};

export async function buildDailyReport(date: string): Promise<ReportTable> {
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
  return {
    title: `Daily OPD Summary · ${date}`,
    subtitle: `${seen} seen · ${noShows} no-shows · avg wait ${averageWait === null ? "—" : `${averageWait} min`}`,
    columns: ["Doctor", "Department", "Seen", "In queue", "No-shows", "Avg wait (min)"],
    rows: [...byDoctor.values()].map((d) => [
      d.name,
      d.department,
      String(d.seen),
      String(d.waiting),
      String(d.noShows),
      String(avg(d.waits) ?? "—"),
    ]),
  };
}

export async function buildTrendReport(
  from: string,
  to: string
): Promise<ReportTable> {
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
  const trend = [...counts.values()].sort((a, b) => b.count - a.count);
  return {
    title: "Diagnosis Trend",
    subtitle: `${from} to ${to} · ${trend.length} distinct ${trend.length === 1 ? "diagnosis" : "diagnoses"}`,
    columns: ["Diagnosis", "Visits"],
    rows: trend.map((t) => [t.label, String(t.count)]),
  };
}

export async function buildPerformanceReport(
  from: string,
  to: string
): Promise<ReportTable> {
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
  return {
    title: "Doctor Performance",
    subtitle: `${from} to ${to}`,
    columns: ["Doctor", "Department", "Active days", "Seen", "Seen/day", "No-show %", "Avg wait (min)"],
    rows: [...byDoctor.values()].map((d) => [
      d.name,
      d.department,
      String(d.days.size),
      String(d.seen),
      d.days.size === 0 ? "—" : ((Math.round((d.seen / d.days.size) * 10) / 10).toFixed(1)),
      d.total === 0 ? "—" : `${Math.round((d.noShows / d.total) * 100)}%`,
      String(avg(d.waits) ?? "—"),
    ]),
  };
}

export type CustomFilters = {
  departmentId?: number;
  doctorId?: number;
  patientId?: number;
  from: string;
  to: string;
  status?: "waiting" | "in_progress" | "completed" | "cancelled" | "no_show";
  diagnosis?: string;
};

export async function buildCustomReport(
  filters: CustomFilters
): Promise<ReportTable> {
  const { departmentId, doctorId, patientId, from, to, status, diagnosis } =
    filters;
  const rows = await listAppointmentsInRange({ from, to });
  const filtered = rows.filter(
    (r) =>
      (departmentId === undefined ||
        r.doctor.departmentId === departmentId) &&
      (doctorId === undefined || r.doctorId === doctorId) &&
      (patientId === undefined || r.patientId === patientId) &&
      (status === undefined || r.status === status) &&
      (diagnosis === undefined ||
        (r.consultation?.diagnosis ?? "")
          .toLowerCase()
          .includes(diagnosis.toLowerCase()))
  );
  return {
    title: "Custom Report",
    subtitle: `${filtered.length} ${filtered.length === 1 ? "visit" : "visits"} match · ${from} to ${to}`,
    columns: ["Date", "Token", "Patient", "Phone", "Doctor", "Department", "Type", "Status", "Diagnosis"],
    rows: filtered.map((r) => [
      r.date,
      String(r.tokenNumber),
      r.patient.name,
      r.patient.phone,
      r.doctor.user.name,
      r.doctor.department.name,
      r.type,
      r.status,
      r.consultation?.diagnosis ?? "",
    ]),
  };
}

export async function buildPatientVisitsReport(
  patientId: number
): Promise<ReportTable> {
  const patient = await db.query.patients.findFirst({
    where: eq(patients.id, patientId),
    columns: { name: true, phone: true },
  });
  if (!patient) {
    return {
      title: "Patient Visit Report",
      subtitle: "Patient not found.",
      columns: [],
      rows: [],
    };
  }
  const visits = await db.query.appointments.findMany({
    where: (t, { eq }) => eq(t.patientId, patientId),
    with: {
      doctor: { with: { user: true } },
      consultation: {
        with: {
          prescription: { with: { items: { with: { medicine: true } } } },
        },
      },
      invoice: true,
    },
    orderBy: (t, { desc }) => [desc(t.date), desc(t.tokenNumber)],
  });
  return {
    title: "Patient Visit Report",
    subtitle: `${patient.name} · ${patient.phone} · ${visits.length} visit${visits.length === 1 ? "" : "s"}`,
    columns: ["Date", "Token", "Doctor", "Status", "Diagnosis", "Medicines", "Total (₹)", "Payment"],
    rows: visits.map((v) => [
      v.date,
      String(v.tokenNumber),
      v.doctor.user.name,
      v.status,
      v.consultation?.diagnosis ?? "",
      v.consultation?.prescription?.items
        .map(
          (i) =>
            `${i.medicine?.name ?? i.freeTextName ?? "—"} ${i.dosage} ${i.frequency} × ${i.duration}`
        )
        .join("; ") ?? "",
      v.invoice ? Number(v.invoice.totalAmount).toFixed(2) : "",
      v.invoice?.paymentStatus ?? "",
    ]),
  };
}
