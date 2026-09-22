import { compare, hash } from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { passwordOtps } from "@/db/schema";

// Single home for every OTP in the app (password reset, email change,
// login second factor). Secrets are bcrypt-hashed; rows die on use,
// expiry, or too many guesses — never kept as history.
export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

export type OtpPurpose = "reset" | "email_change" | "login_2fa";

export function newOtpCode(): string {
  const { randomInt } = require("node:crypto");
  return String(randomInt(100000, 1000000));
}

// Issues a fresh code, replacing any live one for (user, purpose).
// Returns the PLAINTEXT code (caller mails it); only the hash persists.
export async function issueOtp(
  userId: number,
  purpose: OtpPurpose,
  payload?: string
): Promise<string> {
  const otp = newOtpCode();
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .delete(passwordOtps)
      .where(
        and(
          eq(passwordOtps.userId, userId),
          eq(passwordOtps.purpose, purpose)
        )
      );
    await tx.insert(passwordOtps).values({
      userId,
      purpose,
      payload,
      otpHash: await hash(otp, 10),
      expiresAt: new Date(now.getTime() + OTP_TTL_MS),
      attempts: 0,
    });
  });
  return otp;
}

// Checks a code: wrong guesses increment (5 burn it), success consumes
// the row. Returns the payload (e.g. pending email) on success.
export async function consumeOtp(
  userId: number,
  purpose: OtpPurpose,
  code: string
): Promise<{ ok: true; payload: string | null } | { ok: false }> {
  const row = await db.query.passwordOtps.findFirst({
    where: and(
      eq(passwordOtps.userId, userId),
      eq(passwordOtps.purpose, purpose),
      gt(passwordOtps.expiresAt, new Date())
    ),
  });
  if (!row) return { ok: false };
  const attempts = (row.attempts ?? 0) + 1;
  if (!(await compare(code.trim(), row.otpHash))) {
    if (attempts >= OTP_MAX_ATTEMPTS) {
      await db.delete(passwordOtps).where(eq(passwordOtps.id, row.id));
    } else {
      await db
        .update(passwordOtps)
        .set({ attempts })
        .where(eq(passwordOtps.id, row.id));
    }
    return { ok: false };
  }
  await db
    .delete(passwordOtps)
    .where(
      and(eq(passwordOtps.userId, userId), eq(passwordOtps.purpose, purpose))
    );
  return { ok: true, payload: row.payload };
}
