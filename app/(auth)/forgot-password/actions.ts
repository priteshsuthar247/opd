"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { compare, hash } from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { passwordOtps, passwordResets, users } from "@/db/schema";
import { issueOtp, consumeOtp } from "@/lib/otp";
import { normalizeUsername } from "@/lib/usernames";
import { takeLoginAttempt } from "@/lib/rate-limit";
import { sendOtpEmail } from "@/lib/mailer";
import {
  otpVerifySchema,
  passwordResetSchema,
  resetRequestSchema,
} from "@/lib/validations/password-reset";

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  );
}

const RESET_TTL_MS = 15 * 60 * 1000;
// Tighter than login: unauthenticated account-touching endpoints.
const RESET_RATE_MAX = 3;

export type OtpRequestResult = { ok: true } | { ok: false; error: string };
export type OtpVerifyResult =
  | { ok: true; resetToken: string }
  | { ok: false; error: string };
export type PasswordResetResult = { ok: true } | { ok: false; error: string };

async function findUser(identifier: string) {
  const id = identifier.trim();
  return id.includes("@")
    ? db.query.users.findFirst({ where: eq(users.email, id) })
    : db.query.users.findFirst({
        where: eq(users.username, normalizeUsername(id)),
      });
}

// Step 1: issue an OTP. Always answers success-shaped for unknown or
// inactive accounts (no enumeration); rate-limited per identifier+IP.
export async function requestOtp(input: unknown): Promise<OtpRequestResult> {
  const parsed = resetRequestSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const identifier = parsed.data.identifier;
  if (!takeLoginAttempt(`otp:${identifier}|${await clientIp()}`, RESET_RATE_MAX))
    return { ok: false, error: "Too many attempts. Try again later." };

  const user = await findUser(identifier);
  // Silent no-op keeps unknown/inactive accounts indistinguishable.
  if (!user || user.status !== "active") return { ok: true };

  const otp = await issueOtp(user.id, "reset");
  const sent = await sendOtpEmail(user.email, otp);
  if (!sent.ok) return sent;
  return { ok: true };
}

// Step 2: verify the OTP. Five wrong guesses burn it. Returns a
// single-use reset token (never the OTP) for step 3.
export async function verifyOtp(input: unknown): Promise<OtpVerifyResult> {
  const parsed = otpVerifySchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const { identifier, otp } = parsed.data;
  if (!takeLoginAttempt(`otp-verify:${identifier}|${await clientIp()}`, RESET_RATE_MAX))
    return { ok: false, error: "Too many attempts. Try again later." };

  const user = await findUser(identifier);
  if (!user || user.status !== "active")
    return { ok: false, error: "Invalid or expired code." };
  const checked = await consumeOtp(user.id, "reset", otp);
  if (!checked.ok) return { ok: false, error: "Invalid or expired code." };

  const resetToken = randomBytes(32).toString("hex");
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.delete(passwordResets).where(eq(passwordResets.userId, user.id));
    await tx.insert(passwordResets).values({
      userId: user.id,
      tokenHash: await hash(resetToken, 10),
      expiresAt: new Date(now.getTime() + RESET_TTL_MS),
    });
  });
  return { ok: true, resetToken };
}

// Step 3: set the new password. Consumes the reset token, bumps the
// session-invalidation marker so all logins re-authenticate.
export async function resetPassword(
  input: unknown
): Promise<PasswordResetResult> {
  const parsed = passwordResetSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const { resetToken, password } = parsed.data;
  if (!takeLoginAttempt(`pwd-reset|${await clientIp()}`, RESET_RATE_MAX))
    return { ok: false, error: "Too many attempts. Try again later." };

  const candidates = await db.query.passwordResets.findMany({
    where: gt(passwordResets.expiresAt, new Date()),
  });
  let userId: number | null = null;
  for (const c of candidates) {
    if (c.usedAt) continue;
    if (await compare(resetToken, c.tokenHash)) {
      userId = c.userId;
      await db
        .update(passwordResets)
        .set({ usedAt: new Date() })
        .where(eq(passwordResets.id, c.id));
      break;
    }
  }
  if (userId === null)
    return { ok: false, error: "Invalid or expired reset link." };

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        passwordHash: await hash(password, 10),
        passwordChangedAt: new Date(),
      })
      .where(eq(users.id, userId));
    await tx.delete(passwordResets).where(eq(passwordResets.userId, userId));
    await tx.delete(passwordOtps).where(eq(passwordOtps.userId, userId));
  });
  return { ok: true };
}
