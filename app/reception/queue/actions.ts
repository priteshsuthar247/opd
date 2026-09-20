"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments, queueStatusLogs } from "@/db/schema";
import { requireRole } from "@/lib/roles";
import { assignToken } from "@/lib/tokens";
import {
  appointmentCancelSchema,
  appointmentRescheduleSchema,
} from "@/lib/validations/appointment";

export type ActionResult = { ok: true } | { ok: false; error: string };

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === "23505"
  );
}

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
    columns: { id: true, status: true },
  });
  if (!current) return { ok: false, error: "Appointment not found." };
  if (current.status !== "waiting")
    return { ok: false, error: "Only waiting appointments can be cancelled." };

  // Conditional update inside the tx: if a concurrent callNext flipped
  // this row to in_progress after our read, zero rows update and we
  // refuse instead of cancelling a live consultation.
  const updated = await db.transaction(async (tx) => {
    const rows = await tx
      .update(appointments)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(appointments.id, current.id),
          eq(appointments.status, "waiting")
        )
      )
      .returning({ id: appointments.id });
    if (rows.length === 0) return false;
    await logStatus(
      tx,
      current.id,
      "waiting",
      "cancelled",
      Number.isInteger(changedBy) ? changedBy : null
    );
    return true;
  });
  if (!updated)
    return { ok: false, error: "Only waiting appointments can be cancelled." };
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

      // Same lock-and-assign discipline as booking (including the
      // per-day token cap) via the shared helper — a moved token must
      // never collide and must never exceed the doctor's daily limit.
      const { token } = await assignToken(
        tx,
        current.doctorId,
        parsed.data.date
      );

      await tx
        .update(appointments)
        .set({ date: parsed.data.date, tokenNumber: token })
        .where(eq(appointments.id, current.id));
      // No status-log row: the status didn't change, and the move itself
      // is recorded on the appointment (new date + token).
    });
  } catch (err) {
    if (isUniqueViolation(err))
      return { ok: false, error: "That token was just taken — please retry." };
    if (err instanceof Error) return { ok: false, error: err.message };
    return { ok: false, error: "Could not reschedule the appointment." };
  }
  revalidatePath("/reception/queue");
  return { ok: true };
}
