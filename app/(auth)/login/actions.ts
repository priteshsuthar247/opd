"use server";

import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { normalizeUsername } from "@/lib/usernames";
import { takeLoginAttempt } from "@/lib/rate-limit";
import { issueOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mailer";

// Password-first step of email-OTP login. Auth.js v5 sanitizes errors
// thrown from authorize (no custom codes reach the client), so the form
// asks here whether an account needs its second factor — and the code
// goes out in the same call. Rate-limited and generic, like everything
// else on this surface.
export async function checkOtpRequired(
  input: unknown
): Promise<{ ok: true; otpRequired: boolean } | { ok: false; error: string }> {
  const parsed =
    typeof input === "object" && input !== null
      ? (input as { identifier?: unknown; password?: unknown })
      : {};
  const identifier =
    typeof parsed.identifier === "string" ? parsed.identifier : "";
  const password = typeof parsed.password === "string" ? parsed.password : "";
  if (!identifier || !password)
    return { ok: false, error: "Enter your username and password." };
  if (!takeLoginAttempt(`otp-check:${identifier}|unknown`, 3))
    return { ok: false, error: "Too many attempts. Try again later." };

  const user = identifier.includes("@")
    ? await db.query.users.findFirst({
        where: eq(users.email, identifier),
      })
    : await db.query.users.findFirst({
        where: eq(users.username, normalizeUsername(identifier)),
      });
  if (!user || user.status !== "active") return { ok: true, otpRequired: false };
  if (!(await compare(password, user.passwordHash)))
    return { ok: true, otpRequired: false };
  if (!user.emailOtp2fa) return { ok: true, otpRequired: false };

  const otp = await issueOtp(user.id, "login_2fa");
  const sent = await sendOtpEmail(user.email, otp);
  if (!sent.ok) return sent;
  return { ok: true, otpRequired: true };
}
