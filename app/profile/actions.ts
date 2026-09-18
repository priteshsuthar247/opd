"use server";

import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  passwordChangeSchema,
  profileNameSchema,
} from "@/lib/validations/profile";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateProfileName(
  input: unknown
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not authorized." };
  const parsed = profileNameSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  await db
    .update(users)
    .set({ name: parsed.data.name })
    .where(eq(users.id, Number(session.user.id)));
  revalidatePath("/profile", "layout");
  return { ok: true };
}

export async function changePassword(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not authorized." };
  const parsed = passwordChangeSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const user = await db.query.users.findFirst({
    where: eq(users.id, Number(session.user.id)),
  });
  if (!user) return { ok: false, error: "Account not found." };
  const matches = await compare(parsed.data.currentPassword, user.passwordHash);
  // Generic message on purpose — same as the login form.
  if (!matches) return { ok: false, error: "Current password is incorrect." };
  await db
    .update(users)
    .set({ passwordHash: await hash(parsed.data.newPassword, 10) })
    .where(eq(users.id, user.id));
  return { ok: true };
}
