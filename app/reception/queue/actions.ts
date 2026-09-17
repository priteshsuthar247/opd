"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { appointments, queueStatusLogs } from "@/db/schema";
import { requireRole } from "@/lib/roles";
import {
  appointmentCancelSchema,
  appointmentRescheduleSchema,
} from "@/lib/validations/appointment";

export type ActionResult = { ok: true } | { ok: false; error: string };

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function logStatus(
  tx: DbTx,
  appointmentId: number,
  previousStatus: "waiting" | "in_progress" | "completed" | "cancelled" | "no_show",
  newStatus: "waiting" | "in_progress" | "completed" | "cancelled" | "no_show",
  changedBy: number | null
) {
  await tx.insert(queueStatusLogs).values({
    appointmentId,
    previousStatus,
    newStatus,
    changedBy,
  });
}

export async function cancelAppointment(input: unknown): Promise<ActionResult> {
  const session = await requireRole("receptionist", "admin");
  if (!session) return { ok: false, error: "Not authorized." };
  const parsed = appointmentCancelSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const changedBy = Number(session.user.id);

  const current = await db.query.appointments.findFirst({
    where: eq(appointments.id, parsed.data.id),
  });
  if (!current) return { ok: false, error: "Appointment not found." };
  if (current.status !== "waiting")
    return { ok: false, error: "Only waiting appointments can be cancelled." };

  await db.transaction(async (tx) => {
    await tx
      .update(appointments)
      .set({ status: "cancelled" })
      .where(eq(appointments.id, current.id));
    await logStatus(
      tx,
      current.id,
      "waiting",
      "cancelled",
      Number.isInteger(changedBy) ? changedBy : null
    );
  });
  revalidatePath("/reception/queue");
  return { ok: true };
}

export async function rescheduleAppointment(
  input: unknown
): Promise<ActionResult> {
  const session = await requireRole("receptionist", "admin");
  if (!session) return { ok: false, error: "Not authorized." };
  const parsed = appointmentRescheduleSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  try {
    await db.transaction(async (tx) => {
      const current = await tx.query.appointments.findFirst({
        where: eq(appointments.id, parsed.data.id),
      });
      if (!current) throw new Error("Appointment not found.");
      if (current.status !== "waiting")
        throw new Error("Only waiting appointments can be rescheduled.");
      if (current.date === parsed.data.date)
        throw new Error("Already booked for this date.");

      // Same lock-and-assign discipline as booking: serialize on the
      // doctor row so the moved token can never collide (raw SQL because
      // Drizzle cannot express SELECT ... FOR UPDATE).
      await tx.execute(
        sql`select id from doctors where id = ${current.doctorId} for update`
      );
      const sameDay = await tx.query.appointments.findMany({
        where: (t, { and, eq }) =>
          and(
            eq(t.doctorId, current.doctorId),
            eq(t.date, parsed.data.date)
          ),
        columns: { tokenNumber: true },
      });
      const token =
        sameDay.reduce((m, a) => Math.max(m, a.tokenNumber), 0) + 1;

      await tx
        .update(appointments)
        .set({ date: parsed.data.date, tokenNumber: token })
        .where(eq(appointments.id, current.id));
      // No status-log row: the status didn't change, and the move itself
      // is recorded on the appointment (new date + token).
    });
  } catch (err) {
    if (err instanceof Error) return { ok: false, error: err.message };
    return { ok: false, error: "Could not reschedule the appointment." };
  }
  revalidatePath("/reception/queue");
  return { ok: true };
}
