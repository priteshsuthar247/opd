import { and, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { appointments } from "@/db/schema";

export type DateRange = { from: string; to: string };

function inRange(dateCol: typeof appointments.date, range: DateRange) {
  return and(gte(dateCol, range.from), lte(dateCol, range.to));
}

export function listAppointmentsInRange(range: DateRange) {
  return db.query.appointments.findMany({
    where: inRange(appointments.date, range),
    with: {
      patient: true,
      doctor: { with: { user: true, department: true } },
      consultation: true,
      statusLogs: true,
      invoice: true,
    },
    orderBy: (t, { asc }) => [asc(t.date), asc(t.tokenNumber)],
  });
}

export type RangeAppointment = Awaited<
  ReturnType<typeof listAppointmentsInRange>
>[number];

// Minutes between the waiting and in_progress log rows, when both exist.
export function waitMinutes(
  logs: { newStatus: string; changedAt: Date | string }[]
): number | null {
  const t0 = logs.find((l) => l.newStatus === "waiting")?.changedAt;
  const t1 = logs.find((l) => l.newStatus === "in_progress")?.changedAt;
  if (!t0 || !t1) return null;
  const ms = new Date(t1).getTime() - new Date(t0).getTime();
  return ms >= 0 ? Math.round(ms / 60000) : null;
}

export function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10;
}
