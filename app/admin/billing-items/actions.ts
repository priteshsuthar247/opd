"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { billingItems } from "@/db/schema";
import {
  billingItemSchema,
  billingItemStatusSchema,
  billingItemUpdateSchema,
} from "@/lib/validations/billing-item";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === "admin";
}

function invalid(): ActionResult {
  return { ok: false, error: "Invalid input." };
}

const PATH = "/admin/billing-items";

export async function createBillingItem(input: unknown): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
  const parsed = billingItemSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  try {
    await db.insert(billingItems).values(parsed.data);
  } catch {
    return { ok: false, error: "Could not create the billing item." };
  }
  revalidatePath(PATH);
  return { ok: true };
}

export async function updateBillingItem(input: unknown): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
  const parsed = billingItemUpdateSchema.safeParse(input);
  if (!parsed.success) return invalid();
  const { id, ...patch } = parsed.data;
  try {
    await db.update(billingItems).set(patch).where(eq(billingItems.id, id));
  } catch {
    return { ok: false, error: "Could not update the billing item." };
  }
  revalidatePath(PATH);
  return { ok: true };
}

export async function setBillingItemStatus(
  input: unknown
): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
  const parsed = billingItemStatusSchema.safeParse(input);
  if (!parsed.success) return invalid();
  await db
    .update(billingItems)
    .set({ status: parsed.data.status })
    .where(eq(billingItems.id, parsed.data.id));
  revalidatePath(PATH);
  return { ok: true };
}
