"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { settings } from "@/db/schema";
import {
  autoFeeSettingsSchema,
  noShowSettingsSchema,
  notificationSettingsSchema,
} from "@/lib/validations/settings";

export type ActionResult = { ok: true } | { ok: false; error: string };

const PATH = "/admin/settings";

async function requireAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === "admin";
}

function invalid(): ActionResult {
  return { ok: false, error: "Invalid input." };
}

async function setValue(key: string, value: Record<string, unknown>) {
  await db
    .update(settings)
    .set({ value, updatedAt: new Date() })
    .where(eq(settings.key, key));
}

export async function updateNoShowSettings(
  input: unknown
): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
  const parsed = noShowSettingsSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  await Promise.all([
    setValue("no_show_minutes", { minutes: parsed.data.minutes }),
    setValue("no_show_token_gap", { gap: parsed.data.gap }),
  ]);
  revalidatePath(PATH);
  return { ok: true };
}

export async function updateAutoFeeSettings(
  input: unknown
): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
  const parsed = autoFeeSettingsSchema.safeParse(input);
  if (!parsed.success) return invalid();
  await setValue("auto_fee_enabled", { enabled: parsed.data.enabled });
  revalidatePath(PATH);
  return { ok: true };
}

export async function updateNotificationSettings(
  input: unknown
): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
  const parsed = notificationSettingsSchema.safeParse(input);
  if (!parsed.success) return invalid();
  await setValue("notifications", { ...parsed.data });
  revalidatePath(PATH);
  return { ok: true };
}
