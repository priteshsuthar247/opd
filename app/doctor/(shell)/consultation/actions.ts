"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  appointments,
  consultations,
  doctors,
  notifications,
  prescriptionItems,
  prescriptions,
  queueStatusLogs,
  settings,
} from "@/db/schema";
import { consultationSchema, completeVisitSchema } from "@/lib/validations/consultation";
import {
  finalizePrescriptionSchema,
  prescriptionItemRemoveSchema,
  prescriptionItemSchema,
} from "@/lib/validations/prescription";
import { todayStr } from "@/lib/dates";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type CallNextResult =
  | { ok: true; appointmentId: number; token: number }
  | { ok: false; error: string };

async function requireDoctor() {
  const session = await auth();
  if (session?.user?.role !== "doctor") return null;
  const doctor = await db.query.doctors.findFirst({
    where: eq(doctors.userId, Number(session.user.id)),
  });
  if (!doctor) return null;
  return { session, doctor };
}

async function loadOwnAppointment(tx: Tx, appointmentId: number, doctorId: number) {
  const appt = await tx.query.appointments.findFirst({
    where: and(
      eq(appointments.id, appointmentId),
      eq(appointments.doctorId, doctorId)
    ),
  });
  return appt ?? null;
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function callNextToken(): Promise<CallNextResult> {
  const ctx = await requireDoctor();
  if (!ctx) return { ok: false, error: "Not authorized." };
  const changedBy = Number(ctx.session.user.id);
  const today = todayStr();

  // Select and flip inside one transaction: SKIP LOCKED lets a concurrent
  // caller take the next token instead of blocking, and the conditional
  // update (WHERE status='waiting') is the final guard — zero updated
  // rows means someone else took it, so we retry once with the next row.
  // (Raw SQL because Drizzle cannot express SELECT ... FOR UPDATE.)
  const taken = await db.transaction(async (tx) => {
    const locked = await tx.execute(sql`
      select id, token_number from appointments
      where doctor_id = ${ctx.doctor.id}
        and date = ${today}
        and status = 'waiting'
      order by token_number
      limit 1
      for update skip locked
    `);
    const row = locked.rows[0] as
      | { id: number; token_number: number }
      | undefined;
    if (!row) return null;
    const flipped = await tx
      .update(appointments)
      .set({ status: "in_progress" })
      .where(
        and(
          eq(appointments.id, row.id),
          eq(appointments.status, "waiting")
        )
      )
      .returning({ id: appointments.id, tokenNumber: appointments.tokenNumber });
    return flipped[0] ?? null;
  });
  if (!taken) return { ok: false, error: "No waiting patients in queue." };

  await db.transaction(async (tx) => {
    await tx.insert(queueStatusLogs).values({
      appointmentId: taken.id,
      previousStatus: "waiting",
      newStatus: "in_progress",
      changedBy: Number.isInteger(changedBy) ? changedBy : null,
    });
    // Turn-approaching nudge for the token now on deck (in-app minimum
    // per Spec Section 8), honoring the notification toggle.
    const notifyRow = await tx.query.settings.findFirst({
      where: eq(settings.key, "notifications"),
    });
    const toggles =
      notifyRow && typeof notifyRow.value === "object" && notifyRow.value !== null
        ? (notifyRow.value as Record<string, unknown>)
        : null;
    if (toggles?.turn_approaching !== false) {
      const onDeck = await tx.query.appointments.findFirst({
        where: and(
          eq(appointments.doctorId, ctx.doctor.id),
          eq(appointments.date, todayStr()),
          eq(appointments.status, "waiting")
        ),
        orderBy: (t, { asc }) => [asc(t.tokenNumber)],
      });
      if (onDeck) {
        await tx.insert(notifications).values({
          patientId: onDeck.patientId,
          appointmentId: onDeck.id,
          type: "turn_approaching",
          message: `Token ${onDeck.tokenNumber} is next — please proceed for consultation.`,
        });
      }
    }
  });
  revalidatePath("/doctor/queue");
  return { ok: true, appointmentId: taken.id, token: taken.tokenNumber };
}

export async function saveConsultation(input: unknown): Promise<ActionResult> {
  const ctx = await requireDoctor();
  if (!ctx) return { ok: false, error: "Not authorized." };
  const parsed = consultationSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;

  try {
    await db.transaction(async (tx) => {
      const appt = await loadOwnAppointment(tx, data.appointmentId, ctx.doctor.id);
      if (!appt) throw new Error("Appointment not found.");
      if (appt.status !== "in_progress")
        throw new Error("Call the token next before consulting.");

      const existing = await tx.query.consultations.findFirst({
        where: eq(consultations.appointmentId, appt.id),
      });
      const payload = {
        vitals: data.vitals ?? {},
        chiefComplaint: data.chiefComplaint,
        diagnosis: data.diagnosis,
        notes: data.notes,
        followUpRequired: data.followUpRequired,
        followUpDate: data.followUpDate,
      };
      let consultationId: number;
      if (existing) {
        await tx
          .update(consultations)
          .set(payload)
          .where(eq(consultations.id, existing.id));
        consultationId = existing.id;
      } else {
        const [created] = await tx
          .insert(consultations)
          .values({ appointmentId: appt.id, ...payload })
          .returning({ id: consultations.id });
        consultationId = created.id;
        // A draft prescription rides along from the first save so items
        // can be added without a separate step.
        await tx.insert(prescriptions).values({ consultationId });
      }

      if (data.followUpRequired && data.followUpDate) {
        await tx.insert(notifications).values({
          patientId: appt.patientId,
          appointmentId: appt.id,
          type: "follow_up_due",
          message: `Follow-up due on ${data.followUpDate}.`,
        });
      }
    });
  } catch (err) {
    if (err instanceof Error) return { ok: false, error: err.message };
    return { ok: false, error: "Could not save the consultation." };
  }
  revalidatePath(`/doctor/consultation/${data.appointmentId}`);
  return { ok: true };
}

async function loadDraftPrescription(
  tx: Tx,
  consultationId: number,
  doctorId: number
) {
  const consultation = await tx.query.consultations.findFirst({
    where: eq(consultations.id, consultationId),
    with: { prescription: true },
  });
  if (!consultation) throw new Error("Consultation not found.");
  const appt = await loadOwnAppointment(
    tx,
    consultation.appointmentId,
    doctorId
  );
  if (!appt) throw new Error("Not authorized.");
  if (!consultation.prescription) throw new Error("Prescription not found.");
  if (consultation.prescription.status === "finalized")
    throw new Error("Finalized prescriptions are read-only.");
  return consultation.prescription;
}

export async function addPrescriptionItem(input: unknown): Promise<ActionResult> {
  const ctx = await requireDoctor();
  if (!ctx) return { ok: false, error: "Not authorized." };
  const parsed = prescriptionItemSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  try {
    await db.transaction(async (tx) => {
      const draft = await loadDraftPrescription(
        tx,
        parsed.data.consultationId,
        ctx.doctor.id
      );
      const data = parsed.data;
      await tx.insert(prescriptionItems).values({
        prescriptionId: draft.id,
        medicineId: data.medicineId,
        freeTextName: data.freeTextName,
        dosage: data.dosage,
        frequency: data.frequency,
        duration: data.duration,
        instructions: data.instructions,
      });
    });
  } catch (err) {
    if (err instanceof Error) return { ok: false, error: err.message };
    return { ok: false, error: "Could not add the medicine." };
  }
  return { ok: true };
}

export async function removePrescriptionItem(
  input: unknown
): Promise<ActionResult> {
  const ctx = await requireDoctor();
  if (!ctx) return { ok: false, error: "Not authorized." };
  const parsed = prescriptionItemRemoveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  try {
    await db.transaction(async (tx) => {
      const item = await tx.query.prescriptionItems.findFirst({
        where: eq(prescriptionItems.id, parsed.data.id),
        with: { prescription: true },
      });
      if (!item) throw new Error("Item not found.");
      const consultation = await tx.query.consultations.findFirst({
        where: eq(consultations.id, item.prescription.consultationId),
      });
      if (!consultation) throw new Error("Consultation not found.");
      const appt = await loadOwnAppointment(
        tx,
        consultation.appointmentId,
        ctx.doctor.id
      );
      if (!appt) throw new Error("Not authorized.");
      if (item.prescription.status === "finalized")
        throw new Error("Finalized prescriptions are read-only.");
      await tx
        .delete(prescriptionItems)
        .where(eq(prescriptionItems.id, item.id));
    });
  } catch (err) {
    if (err instanceof Error) return { ok: false, error: err.message };
    return { ok: false, error: "Could not remove the medicine." };
  }
  return { ok: true };
}

export async function finalizePrescription(
  input: unknown
): Promise<ActionResult> {
  const ctx = await requireDoctor();
  if (!ctx) return { ok: false, error: "Not authorized." };
  const parsed = finalizePrescriptionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  try {
    await db.transaction(async (tx) => {
      const draft = await loadDraftPrescription(
        tx,
        parsed.data.consultationId,
        ctx.doctor.id
      );
      const items = await tx.query.prescriptionItems.findMany({
        where: eq(prescriptionItems.prescriptionId, draft.id),
        columns: { id: true },
      });
      if (items.length === 0)
        throw new Error("Add at least one medicine before finalizing.");
      await tx
        .update(prescriptions)
        .set({ status: "finalized" })
        .where(eq(prescriptions.id, draft.id));
      const consultation = await tx.query.consultations.findFirst({
        where: eq(consultations.id, parsed.data.consultationId),
      });
      const appt = consultation
        ? await tx.query.appointments.findFirst({
            where: eq(appointments.id, consultation.appointmentId),
          })
        : null;
      await tx.insert(notifications).values({
        patientId: appt?.patientId ?? null,
        appointmentId: appt?.id ?? null,
        type: "prescription_finalized",
        message: "Prescription finalized.",
      });
    });
  } catch (err) {
    if (err instanceof Error) return { ok: false, error: err.message };
    return { ok: false, error: "Could not finalize the prescription." };
  }
  return { ok: true };
}

export async function completeVisit(input: unknown): Promise<ActionResult> {
  const ctx = await requireDoctor();
  if (!ctx) return { ok: false, error: "Not authorized." };
  const parsed = completeVisitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const changedBy = Number(ctx.session.user.id);

  try {
    await db.transaction(async (tx) => {
      const appt = await loadOwnAppointment(
        tx,
        parsed.data.appointmentId,
        ctx.doctor.id
      );
      if (!appt) throw new Error("Appointment not found.");
      if (appt.status !== "in_progress")
        throw new Error("Only the patient in consultation can be completed.");
      const consultation = await tx.query.consultations.findFirst({
        where: eq(consultations.appointmentId, appt.id),
      });
      if (!consultation)
        throw new Error("Save the consultation before completing the visit.");
      await tx
        .update(appointments)
        .set({ status: "completed" })
        .where(eq(appointments.id, appt.id));
      await tx.insert(queueStatusLogs).values({
        appointmentId: appt.id,
        previousStatus: "in_progress",
        newStatus: "completed",
        changedBy: Number.isInteger(changedBy) ? changedBy : null,
      });
    });
  } catch (err) {
    if (err instanceof Error) return { ok: false, error: err.message };
    return { ok: false, error: "Could not complete the visit." };
  }
  revalidatePath("/doctor/queue");
  return { ok: true };
}
