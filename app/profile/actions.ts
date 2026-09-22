"use server";

import { compare, hash } from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { passwordOtps, users } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { sendOtpEmail } from "@/lib/mailer";
import { isUsernameTaken, suggestUsernames } from "@/lib/usernames";
import { usernameSchema } from "@/lib/validations/user";
import {
  avatarColorSchema,
  emailChangeConfirmSchema,
  emailChangeRequestSchema,
  passwordChangeSchema,
  profileNameSchema,
  profileUsernameSchema,
} from "@/lib/validations/profile";

export type ActionResult = { ok: true } | { ok: false; error: string };

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === "23505"
  );
}

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
  await logActivity(Number(session.user.id), "name_changed");
  revalidatePath("/profile", "layout");
  return { ok: true };
}

export async function updateProfileUsername(
  input: unknown
): Promise<ActionResult> {  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not authorized." };
  const parsed = profileUsernameSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  try {
    await db
      .update(users)
      .set({ username: parsed.data.username })
      .where(eq(users.id, Number(session.user.id)));
  } catch (err) {
    if (isUniqueViolation(err))
      return { ok: false, error: "Username just taken — pick another." };
    return { ok: false, error: "Could not update the username." };
  }
  await logActivity(Number(session.user.id), "username_changed");
  revalidatePath("/profile", "layout");
  return { ok: true };
}

export async function updateAvatarColor(
  input: unknown
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not authorized." };
  const parsed = avatarColorSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  await db
    .update(users)
    .set({ avatarColor: parsed.data.avatarColor })
    .where(eq(users.id, Number(session.user.id)));
  revalidatePath("/profile", "layout");
  return { ok: true };
}

// Step 1: send a verification OTP to the NEW address. The address must
// not belong to another account; the code proves ownership.
export async function requestEmailChange(
  input: unknown
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not authorized." };
  const parsed = emailChangeRequestSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const userId = Number(session.user.id);
  const email = parsed.data.email.trim();
  const clash = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true },
  });
  if (clash) return { ok: false, error: "Email is already in use." };

  const otp = String(randomInt(100000, 1000000));
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.delete(passwordOtps).where(eq(passwordOtps.userId, userId));
    await tx.insert(passwordOtps).values({
      userId,
      purpose: "email_change",
      payload: email,
      otpHash: await hash(otp, 10),
      expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
      attempts: 0,
    });
  });
  const sent = await sendOtpEmail(email, otp);
  if (!sent.ok) return sent;
  return { ok: true };
}

// Step 2: verify the code sent to the new address, then switch the
// login email. A switch bumps the session marker (see passwordChangedAt
// semantics) so other devices re-authenticate.
export async function confirmEmailChange(
  input: unknown
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not authorized." };
  const parsed = emailChangeConfirmSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const userId = Number(session.user.id);
  const row = await db.query.passwordOtps.findFirst({
    where: and(
      eq(passwordOtps.userId, userId),
      eq(passwordOtps.purpose, "email_change"),
      gt(passwordOtps.expiresAt, new Date())
    ),
  });
  if (!row || !row.payload)
    return { ok: false, error: "Invalid or expired code." };
  const attempts = (row.attempts ?? 0) + 1;
  if (!(await compare(parsed.data.otp, row.otpHash))) {
    if (attempts >= 5) {
      await db.delete(passwordOtps).where(eq(passwordOtps.id, row.id));
    } else {
      await db
        .update(passwordOtps)
        .set({ attempts })
        .where(eq(passwordOtps.id, row.id));
    }
    return { ok: false, error: "Invalid or expired code." };
  }
  try {
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ email: row.payload as string, passwordChangedAt: new Date() })
        .where(eq(users.id, userId));
      await tx.delete(passwordOtps).where(eq(passwordOtps.userId, userId));
    });
  } catch (err) {
    if (isUniqueViolation(err))
      return { ok: false, error: "Email was just taken by another account." };
    return { ok: false, error: "Could not change the email." };
  }
  await logActivity(userId, "email_changed");
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
    .set({
      passwordHash: await hash(parsed.data.newPassword, 10),
      passwordChangedAt: new Date(),
    })
    .where(eq(users.id, user.id));
  await logActivity(user.id, "password_changed");
  return { ok: true };
}

// Self-service availability check (any signed-in role; the admin-only
// check in doctors/actions would 403 here). Same shape, own row
// excluded so keeping your handle reads as available.
export async function checkOwnUsername(
  input: unknown
): Promise<
  | { ok: true; available: boolean; suggestions: string[] }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not authorized." };
  const parsed = usernameSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid username." };
  const me = await db.query.users.findFirst({
    where: eq(users.id, Number(session.user.id)),
    columns: { username: true },
  });
  if (me && me.username === parsed.data) {
    return { ok: true, available: true, suggestions: [] };
  }
  const available = !(await isUsernameTaken(parsed.data));
  return {
    ok: true,
    available,
    suggestions: available ? [] : await suggestUsernames(parsed.data),
  };
}
