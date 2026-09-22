import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { consumeOtp } from "@/lib/otp";

// Login-time second-factor check used by authorize (lives in lib — not
// in an actions file — so lib/auth.ts can import it without a cycle).
// Email OTP issued by checkOtpRequired; consumed here. Missing or wrong
// codes fail exactly like a wrong password.
export async function checkLoginOtp(
  userId: number,
  code: string | undefined
): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { emailOtp2fa: true },
  });
  if (!user?.emailOtp2fa) return true;
  if (!code) return false;
  const checked = await consumeOtp(userId, "login_2fa", code);
  return checked.ok;
}
