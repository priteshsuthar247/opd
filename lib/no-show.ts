import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments, queueStatusLogs } from "@/db/schema";

// Auto-flags waiting tokens as no-show per Spec Section 8: a token that
// sits in waiting longer than the configured minutes, or falls behind the
// live token by more than the configured gap, is flagged. Runs lazily at
// the top of queue renders (no cron infra) — idempotent, only touches
// rows still in waiting. Returns the flagged count for display.
export async function flagNoShows(
  doctorId: number,
  date: string,
  now = new Date()
): Promise<number> {
  const rows = await db.query.settings.findMany();
  const get = (key: string): Record<string, unknown> | null => {
    const row = rows.find((r) => r.key === key);
    if (!row || typeof row.value !== "object" || row.value === null)
      return null;
    return row.value as Record<string, unknown>;
  };
  const minutes =
    typeof get("no_show_minutes")?.minutes === "number"
      ? (get("no_show_minutes")?.minutes as number)
      : 30;
  const gap =
    typeof get("no_show_token_gap")?.gap === "number"
      ? (get("no_show_token_gap")?.gap as number)
      : 3;

  const day = await db.query.appointments.findMany({
    where: and(
      eq(appointments.doctorId, doctorId),
      eq(appointments.date, date)
    ),
  });
  const live = day
    .filter((a) => a.status === "in_progress")
    .reduce((m, a) => Math.max(m, a.tokenNumber), 0);
  const stale = day.filter((a) => {
    if (a.status !== "waiting") return false;
    const ageMin =
      (now.getTime() - new Date(a.createdAt).getTime()) / 60000;
    if (ageMin > minutes) return true;
    // Token-gap rule only applies once calling has started.
    if (live > 0 && live - a.tokenNumber >= gap) return true;
    return false;
  });
  if (stale.length === 0) return 0;

  await db.transaction(async (tx) => {
    for (const a of stale) {
      await tx
        .update(appointments)
        .set({ status: "no_show" })
        .where(eq(appointments.id, a.id));
      await tx.insert(queueStatusLogs).values({
        appointmentId: a.id,
        previousStatus: "waiting",
        newStatus: "no_show",
        changedBy: null,
      });
    }
  });
  return stale.length;
}
