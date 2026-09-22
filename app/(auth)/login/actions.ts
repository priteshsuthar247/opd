"use server";

import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { normalizeUsername } from "@/lib/usernames";
import { takeLoginAttempt } from "@/lib/rate-limit";

// Password-first step of TOTP login. Auth.js v5 sanitizes errors thrown
// from authorize (no custom codes reach the client), so the form asks
// here whether an account needs its second factor — rate-limited and
// generic, like everything else on this surface.
export async function checkTotpRequired(
  input: unknown
): Promise<{ ok: true; totpRequired: boolean } | { ok: false; error: string }> {
  const parsed =
    typeof input === "object" && input !== null
      ? (input as { identifier?: unknown; password?: unknown })
      : {};
  const identifier =
    typeof parsed.identifier === "string" ? parsed.identifier : "";
  const password = typeof parsed.password === "string" ? parsed.password : "";
  if (!identifier || !password)
    return { ok: false, error: "Enter your username and password." };
  if (!takeLoginAttempt(`totp-check:${identifier}|unknown`, 3))
    return { ok: false, error: "Too many attempts. Try again later." };

  const user = identifier.includes("@")
    ? await db.query.users.findFirst({
        where: eq(users.email, identifier),
      })
    : await db.query.users.findFirst({
        where: eq(users.username, normalizeUsername(identifier)),
      });
  if (!user || user.status !== "active") return { ok: true, totpRequired: false };
  if (!(await compare(password, user.passwordHash)))
    return { ok: true, totpRequired: false };
  return { ok: true, totpRequired: user.totpEnabled };
}
