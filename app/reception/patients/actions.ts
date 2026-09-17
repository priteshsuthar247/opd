"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { patients } from "@/db/schema";
import { requireRole } from "@/lib/roles";
import { searchPatients } from "@/db/queries/patients";
import {
  patientSchema,
  patientStatusSchema,
  patientUpdateSchema,
} from "@/lib/validations/patient";

export type ActionResult = { ok: true } | { ok: false; error: string };

function invalid(): ActionResult {
  return { ok: false, error: "Invalid input." };
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === "23505"
  );
}

const PATH = "/reception/patients";

export async function createPatient(input: unknown): Promise<ActionResult> {
  if (!(await requireRole("receptionist", "admin")))
    return { ok: false, error: "Not authorized." };
  const parsed = patientSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  try {
    await db.insert(patients).values(parsed.data);
  } catch (err) {
    if (isUniqueViolation(err))
      return { ok: false, error: "A patient with this phone number already exists." };
    return { ok: false, error: "Could not register the patient." };
  }
  revalidatePath(PATH);
  return { ok: true };
}

export async function updatePatient(input: unknown): Promise<ActionResult> {
  if (!(await requireRole("receptionist", "admin")))
    return { ok: false, error: "Not authorized." };
  const parsed = patientUpdateSchema.safeParse(input);
  if (!parsed.success) return invalid();
  const { id, ...patch } = parsed.data;
  try {
    await db.update(patients).set(patch).where(eq(patients.id, id));
  } catch (err) {
    if (isUniqueViolation(err))
      return { ok: false, error: "A patient with this phone number already exists." };
    return { ok: false, error: "Could not update the patient." };
  }
  revalidatePath(PATH);
  return { ok: true };
}

export async function setPatientStatus(input: unknown): Promise<ActionResult> {
  if (!(await requireRole("receptionist", "admin")))
    return { ok: false, error: "Not authorized." };
  const parsed = patientStatusSchema.safeParse(input);
  if (!parsed.success) return invalid();
  await db
    .update(patients)
    .set({ status: parsed.data.status })
    .where(eq(patients.id, parsed.data.id));
  revalidatePath(PATH);
  return { ok: true };
}

export type PatientOption = { id: number; name: string; phone: string };

// Booking-flow picker: name/phone fragment search for front-desk staff.
export async function searchPatientOptions(q: string): Promise<PatientOption[]> {
  if (!(await requireRole("receptionist", "admin"))) return [];
  if (q.trim().length < 2) return [];
  const rows = await searchPatients(q.trim());
  return rows.map((r) => ({ id: r.id, name: r.name, phone: r.phone }));
}
