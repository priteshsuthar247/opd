"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { settingSchema } from "@/lib/validations/settings";

export type ActionResult = { ok: true } | { ok: false; error: string };

const PATH = "/admin/settings";

export async function updateSetting(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "admin")
    return { ok: false, error: "Not authorized." };
  const parsed = settingSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  // Keys are a fixed enum and the JSON shape was validated above.
  const value: Record<string, unknown> = JSON.parse(parsed.data.valueJson);
  await db
    .update(settings)
    .set({ value, updatedAt: new Date() })
    .where(eq(settings.key, parsed.data.key));
  revalidatePath(PATH);
  return { ok: true };
}
