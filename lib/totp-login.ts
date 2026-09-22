import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { decryptTotpSecret, verifyTotpCode } from "@/lib/totp";

// Login-time code check used by authorize (lives in lib — not in an
// actions file — so lib/auth.ts can import it without a cycle).
// Returns "ok" | "required" | "invalid" so authorize can throw
// TOTP_REQUIRED (code missing) vs return null (code wrong).
export async function checkLoginTotp(
  userId: number,
  code: string | undefined
): Promise<"ok" | "required" | "invalid"> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { totpSecret: true, totpBackup: true, totpEnabled: true },
  });
  if (!user?.totpEnabled) return "ok";
  if (!code) return "required";
  const secret = user.totpSecret ? decryptTotpSecret(user.totpSecret) : null;
  if (secret && verifyTotpCode(secret, code)) return "ok";
  const backups = Array.isArray(user.totpBackup) ? user.totpBackup : [];
  for (const b of backups) {
    if (await compare(code.replace(/[^A-Za-z0-9]/g, ""), b)) {
      await db
        .update(users)
        .set({ totpBackup: backups.filter((x) => x !== b) })
        .where(eq(users.id, userId));
      await logActivity(userId, "backup_used");
      return "ok";
    }
  }
  return "invalid";
}
