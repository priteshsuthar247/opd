"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { queueConfigurations } from "@/db/schema";
import {
  queueConfigSchema,
  queueConfigStatusSchema,
  queueConfigUpdateSchema,
} from "@/lib/validations/queue-config";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === "admin";
}

function invalid(): ActionResult {
  return { ok: false, error: "Invalid input." };
}

const PATH = "/admin/queue";

export async function createQueueConfig(input: unknown): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
  const parsed = queueConfigSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const existing = await db.query.queueConfigurations.findFirst({
    where: eq(queueConfigurations.doctorId, parsed.data.doctorId),
  });
  if (existing)
    return {
      ok: false,
      error: "This doctor already has a configuration — edit it instead.",
    };
  try {
    await db.insert(queueConfigurations).values(parsed.data);
  } catch {
    return { ok: false, error: "Could not create the configuration." };
  }
  revalidatePath(PATH);
  return { ok: true };
}

export async function updateQueueConfig(input: unknown): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
  const parsed = queueConfigUpdateSchema.safeParse(input);
  if (!parsed.success) return invalid();
  const { id, ...patch } = parsed.data;
  try {
    await db
      .update(queueConfigurations)
      .set(patch)
      .where(eq(queueConfigurations.id, id));
  } catch {
    return { ok: false, error: "Could not update the configuration." };
  }
  revalidatePath(PATH);
  return { ok: true };
}

export async function setQueueConfigStatus(
  input: unknown
): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
  const parsed = queueConfigStatusSchema.safeParse(input);
  if (!parsed.success) return invalid();
  await db
    .update(queueConfigurations)
    .set({ status: parsed.data.status })
    .where(eq(queueConfigurations.id, parsed.data.id));
  revalidatePath(PATH);
  return { ok: true };
}
