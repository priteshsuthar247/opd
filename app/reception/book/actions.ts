"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  appointments,
  doctors,
  invoices,
  notifications,
  patients,
  queueStatusLogs,
  settings,
} from "@/db/schema";
import { requireRole } from "@/lib/roles";
import { assignToken, type DbTx } from "@/lib/tokens";
import { appointmentSchema } from "@/lib/validations/appointment";

export type BookResult =
  | { ok: true; token: number; appointmentId: number }
  | { ok: false; error: string };

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
    // Unique-violation first: a 23505 IS an Error, so the instanceof
    // check below would swallow it and leak raw DB text to the toast.
    if (isUniqueViolation(err))
      return { ok: false, error: "That token was just taken — please retry." };
    if (err instanceof Error) return { ok: false, error: err.message };
    return { ok: false, error: "Could not book the appointment." };
  }
}
