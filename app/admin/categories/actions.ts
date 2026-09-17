"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { categories } from "@/db/schema";
import {
  categorySchema,
  categoryStatusSchema,
  categoryUpdateSchema,
} from "@/lib/validations/category";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === "admin";
}

function invalid(): ActionResult {
  return { ok: false, error: "Invalid input." };
}

const PATH = "/admin/categories";

export async function createCategory(input: unknown): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  try {
    await db.insert(categories).values(parsed.data);
  } catch {
    return { ok: false, error: "Could not create the category." };
  }
  revalidatePath(PATH);
  return { ok: true };
}

export async function updateCategory(input: unknown): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
  const parsed = categoryUpdateSchema.safeParse(input);
  if (!parsed.success) return invalid();
  const { id, ...patch } = parsed.data;
  try {
    await db.update(categories).set(patch).where(eq(categories.id, id));
  } catch {
    return { ok: false, error: "Could not update the category." };
  }
  revalidatePath(PATH);
  return { ok: true };
}

export async function setCategoryStatus(input: unknown): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
  const parsed = categoryStatusSchema.safeParse(input);
  if (!parsed.success) return invalid();
  await db
    .update(categories)
    .set({ status: parsed.data.status })
    .where(eq(categories.id, parsed.data.id));
  revalidatePath(PATH);
  return { ok: true };
}
