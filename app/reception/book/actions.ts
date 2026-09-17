"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  appointments,
  doctors,
  invoices,
  notifications,
  patients,
  queueConfigurations,
  queueStatusLogs,
  settings,
} from "@/db/schema";
import { requireRole } from "@/lib/roles";
import { appointmentSchema } from "@/lib/validations/appointment";

export type BookResult =
  | { ok: true; token: number; appointmentId: number }
  | { ok: false; error: string };

// Transaction handle type, derived from the driver so booking and
// rescheduling share one lock-and-assign implementation.
type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === "23505"
  );
}

async function readSetting(tx: DbTx, key: string): Promise<Record<string, unknown> | null> {
  const row = await tx.query.settings.findFirst({
    where: eq(settings.key, key),
  });
  if (!row || typeof row.value !== "object" || row.value === null) return null;
  return row.value as Record<string, unknown>;
}

// Locks the doctor row, then assigns max+1 for the doctor+day scope.
// Drizzle cannot express SELECT ... FOR UPDATE, so the lock is raw SQL
// (repo convention allows raw SQL with a why-comment). The unique index on
// (doctor, date, token) underneath is the final backstop.
async function assignToken(
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

export async function createAppointment(input: unknown): Promise<BookResult> {
  const session = await requireRole("receptionist", "admin");
  if (!session) return { ok: false, error: "Not authorized." };
  const parsed = appointmentSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const { patientId, doctorId, date, type } = parsed.data;
  const changedBy = Number(session.user.id);

  try {
    const booked = await db.transaction(async (tx) => {
      const patient = await tx.query.patients.findFirst({
        where: eq(patients.id, patientId),
      });
      if (!patient || patient.status !== "active")
        throw new Error("Patient is not available for booking.");
      const doctor = await tx.query.doctors.findFirst({
        where: eq(doctors.id, doctorId),
        with: { user: true },
      });
      if (!doctor || doctor.status !== "active")
        throw new Error("Doctor is not available for booking.");

      const { token } = await assignToken(tx, doctorId, date);

      const [appt] = await tx
        .insert(appointments)
        .values({ patientId, doctorId, date, tokenNumber: token, type })
        .returning({ id: appointments.id });

      await tx.insert(queueStatusLogs).values({
        appointmentId: appt.id,
        previousStatus: null,
        newStatus: "waiting",
        changedBy: Number.isInteger(changedBy) ? changedBy : null,
      });

      const feeSetting = await readSetting(tx, "auto_fee_enabled");
      const fee =
        feeSetting?.enabled === false ? "0" : doctor.consultationFee;
      await tx.insert(invoices).values({
        appointmentId: appt.id,
        consultationFee: fee,
        discount: "0",
        totalAmount: fee,
      });

      const notifySetting = await readSetting(tx, "notifications");
      const notifyValue = notifySetting as {
        appointment_booked?: boolean;
      } | null;
      if (notifyValue?.appointment_booked !== false) {
        await tx.insert(notifications).values({
          patientId,
          appointmentId: appt.id,
          type: "appointment_booked",
          message: `Token ${token} booked with ${doctor.user.name} on ${date}.`,
        });
      }

      return { token, appointmentId: appt.id };
    });
    revalidatePath("/reception/queue");
    return { ok: true, ...booked };
  } catch (err) {
    if (err instanceof Error) return { ok: false, error: err.message };
    if (isUniqueViolation(err))
      return { ok: false, error: "That token was just taken — please retry." };
    return { ok: false, error: "Could not book the appointment." };
  }
}
