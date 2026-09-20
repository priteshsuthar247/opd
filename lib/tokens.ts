import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { appointments, queueConfigurations } from "@/db/schema";

// Transaction handle type, derived from the driver so booking and
// rescheduling share one lock-and-assign implementation.
export type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Locks the doctor row, then assigns max+1 for the doctor+day scope.
// Drizzle cannot express SELECT ... FOR UPDATE, so the lock is raw SQL
// (repo convention allows raw SQL with a why-comment). The unique index on
// (doctor, date, token) underneath is the final backstop. Also enforces
// the per-day token cap — booking and rescheduling both funnel here.
export async function assignToken(
  tx: DbTx,
  doctorId: number,
  date: string
): Promise<{ token: number; maxTokens: number }> {
  await tx.execute(sql`select id from doctors where id = ${doctorId} for update`);
  const config = await tx.query.queueConfigurations.findFirst({
    where: eq(queueConfigurations.doctorId, doctorId),
  });
  if (!config || config.status !== "active")
    throw new Error("Queue is closed for this doctor.");
  const existing = await tx.query.appointments.findMany({
    where: and(
      eq(appointments.doctorId, doctorId),
      eq(appointments.date, date)
    ),
    columns: { tokenNumber: true },
  });
  const max = existing.reduce((m, a) => Math.max(m, a.tokenNumber), 0);
  const token = max + 1;
  if (token > config.maxTokensPerDay)
    throw new Error("No tokens left for this doctor today.");
  return { token, maxTokens: config.maxTokensPerDay };
}
