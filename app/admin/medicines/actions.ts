"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { medicines } from "@/db/schema";
import {
  medicineSchema,
  medicineStatusSchema,
  medicineUpdateSchema,
} from "@/lib/validations/medicine";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === "admin";
}

function invalid(): ActionResult {
  return { ok: false, error: "Invalid input." };
}

const PATH = "/admin/medicines";

export async function createMedicine(input: unknown): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
  const parsed = medicineSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  try {
    await db.insert(medicines).values(parsed.data);
  } catch {
    return { ok: false, error: "Could not create the medicine." };
  }
  revalidatePath(PATH);
  return { ok: true };
}

export async function updateMedicine(input: unknown): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
  const parsed = medicineUpdateSchema.safeParse(input);
  if (!parsed.success) return invalid();
  const { id, ...patch } = parsed.data;
  try {
    await db.update(medicines).set(patch).where(eq(medicines.id, id));
  } catch {
    return { ok: false, error: "Could not update the medicine." };
  }
  revalidatePath(PATH);
  return { ok: true };
}

export async function setMedicineStatus(input: unknown): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
  const parsed = medicineStatusSchema.safeParse(input);
  if (!parsed.success) return invalid();
  await db
    .update(medicines)
    .set({ status: parsed.data.status })
    .where(eq(medicines.id, parsed.data.id));
  revalidatePath(PATH);
  return { ok: true };
}
