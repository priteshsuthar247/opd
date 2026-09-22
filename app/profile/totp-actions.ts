"use server";

import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import {
  decryptTotpSecret,
  encryptTotpSecret,
  newBackupCodes,
  newTotpSecret,
  totpAuthUrl,
  verifyTotpCode,
} from "@/lib/totp";
import { z } from "zod";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function ownUser() {
  const session = await auth();
  if (!session?.user) return null;
  const user = await db.query.users.findFirst({
    where: eq(users.id, Number(session.user.id)),
  });
  if (!user || user.status !== "active") return null;
  return { session, user };
}

// Step 1: generate a seed (stored encrypted, disabled) + QR SVG for the
// authenticator app. Re-calling replaces the pending seed.
export async function beginTotpSetup(): Promise<
  | { ok: true; qrSvg: string; secret: string }
  | { ok: false; error: string }
> {
  const ctx = await ownUser();
  if (!ctx) return { ok: false, error: "Not authorized." };
  const secret = newTotpSecret();
  await db
    .update(users)
    .set({ totpSecret: encryptTotpSecret(secret), totpEnabled: false })
    .where(eq(users.id, ctx.user.id));
  const url = totpAuthUrl(secret, ctx.user.email);
  const qrSvg = await QRCode.toString(url, { type: "svg", margin: 1 });
  return { ok: true, qrSvg, secret };
}

// Step 2: confirm a code from the app → enable + issue backup codes
// (shown ONCE — hashed at rest, never retrievable again).
export async function confirmTotpSetup(input: unknown): Promise<
  | { ok: true; backupCodes: string[] }
  | { ok: false; error: string }
> {
  const ctx = await ownUser();
  if (!ctx) return { ok: false, error: "Not authorized." };
  const parsed = z.object({ code: z.string().regex(/^\d{6}$/) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter the 6-digit code." };
  if (!ctx.user.totpSecret)
    return { ok: false, error: "Start setup again — no pending seed." };
  const secret = decryptTotpSecret(ctx.user.totpSecret);
  if (!secret || !verifyTotpCode(secret, parsed.data.code))
    return { ok: false, error: "Code does not match. Try again." };
  const codes = newBackupCodes();
  await db
    .update(users)
    .set({
      totpEnabled: true,
      totpBackup: await Promise.all(codes.map((c) => hash(c, 10))),
    })
    .where(eq(users.id, ctx.user.id));
  await logActivity(ctx.user.id, "totp_enabled");
  revalidatePath("/profile", "layout");
  return { ok: true, backupCodes: codes };
}

// Disable 2FA (password required). Bumps the session marker so every
// device — including this one — re-authenticates.
export async function disableTotp(input: unknown): Promise<ActionResult> {
  const ctx = await ownUser();
  if (!ctx) return { ok: false, error: "Not authorized." };
  const parsed = z.object({ password: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter your password." };
  if (!(await compare(parsed.data.password, ctx.user.passwordHash)))
    return { ok: false, error: "Password is incorrect." };
  await db
    .update(users)
    .set({
      totpEnabled: false,
      totpSecret: null,
      totpBackup: null,
      passwordChangedAt: new Date(),
    })
    .where(eq(users.id, ctx.user.id));
  await logActivity(ctx.user.id, "totp_disabled");
  return { ok: true };
}

// Fresh backup codes (old ones die). Password required.
export async function regenerateBackupCodes(
  input: unknown
): Promise<{ ok: true; backupCodes: string[] } | { ok: false; error: string }> {
  const ctx = await ownUser();
  if (!ctx) return { ok: false, error: "Not authorized." };
  const parsed = z.object({ password: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter your password." };
  if (!ctx.user.totpEnabled)
    return { ok: false, error: "Two-factor is not enabled." };
  if (!(await compare(parsed.data.password, ctx.user.passwordHash)))
    return { ok: false, error: "Password is incorrect." };
  const codes = newBackupCodes();
  await db
    .update(users)
    .set({ totpBackup: await Promise.all(codes.map((c) => hash(c, 10))) })
    .where(eq(users.id, ctx.user.id));
  await logActivity(ctx.user.id, "backup_regenerated");
  return { ok: true, backupCodes: codes };
}

// "Sign out everywhere": bump the session marker; every JWT (including
// this browser's) dies at the next 5-minute revalidation. The caller
// signs out immediately client-side.
export async function signOutEverywhere(): Promise<ActionResult> {
  const ctx = await ownUser();
  if (!ctx) return { ok: false, error: "Not authorized." };
  await db
    .update(users)
    .set({ passwordChangedAt: new Date() })
    .where(eq(users.id, ctx.user.id));
  await logActivity(ctx.user.id, "sessions_revoked");
  return { ok: true };
}

// Self-deactivation (danger zone): locks the login, then the client
// signs out. Admins deactivate others from the doctors table.
export async function deactivateOwnAccount(
  input: unknown
): Promise<ActionResult> {
  const ctx = await ownUser();
  if (!ctx) return { ok: false, error: "Not authorized." };
  const parsed = z.object({ password: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter your password." };
  if (!(await compare(parsed.data.password, ctx.user.passwordHash)))
    return { ok: false, error: "Password is incorrect." };
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ status: "inactive", passwordChangedAt: new Date() })
      .where(eq(users.id, ctx.user.id));
  });
  await logActivity(ctx.user.id, "account_deactivated");
  return { ok: true };
}
