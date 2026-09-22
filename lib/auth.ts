import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { normalizeUsername } from "@/lib/usernames";
import { takeLoginAttempt } from "@/lib/rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Required outside Vercel hosting (Auth.js v5); harmless on localhost.
  trustHost: true,
  // 8h sessions: shared clinic terminals must not stay logged in for the
  // 30-day Auth.js default.
  session: { strategy: "jwt", maxAge: 8 * 60 * 60, updateAge: 60 * 60 },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "Username or email", type: "text" },
        password: { label: "Password", type: "password" },
        otpCode: { label: "Authenticator code", type: "text" },
      },
      // Returning null (not throwing) on any failure is deliberate —
      // never leak whether it was the identifier or the password that was wrong.
      authorize: async (credentials, request) => {
        if (!credentials?.identifier || !credentials?.password) return null;

        const identifier = credentials.identifier as string;
        // 5 attempts/minute per identifier+IP. Throttled attempts fail
        // exactly like bad credentials so attackers learn nothing.
        const ip =
          request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          "unknown";
        if (!takeLoginAttempt(`${identifier}|${ip}`)) return null;

        // An @ means email, otherwise a username handle.
        const user = identifier.includes("@")
          ? await db.query.users.findFirst({
              where: eq(users.email, identifier),
            })
          : await db.query.users.findFirst({
              where: eq(users.username, normalizeUsername(identifier)),
            });

        if (!user) return null;

        // Deactivated logins are locked out even with a valid password.
        if (user.status !== "active") return null;

        const isValid = await compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        // Second factor: accounts with email-OTP 2FA need the code
        // mailed by checkOtpRequired in the same call. The form
        // pre-checks via that action (Auth.js v5 sanitizes thrown
        // errors, so no typed error can travel back); a missing or
        // wrong code fails exactly like a wrong password. Lazily
        // imported: otp pulls node:crypto-adjacent paths the Edge
        // middleware importing this module cannot evaluate. authorize
        // only runs server-side.
        const { checkLoginOtp } = await import("@/lib/login-otp");
        if (
          !(await checkLoginOtp(
            user.id,
            credentials.otpCode as string | undefined
          ))
        )
          return null;

        // Fire-and-forget login audit + stamp; neither blocks sign-in.
        const { logActivity } = await import("@/lib/activity");
        void logActivity(user.id, "login").then(() =>
          db
            .update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, user.id))
        );

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
          active: true,
          pwdTs: user.passwordChangedAt
            ? new Date(user.passwordChangedAt).getTime()
            : 0,
        };
      },
    }),
  ],
  callbacks: {
    // Runs on sign-in and on every session read — `user` is only present
    // on the initial sign-in, so this is where the role gets baked into
    // the token for every request after. Role/status are rechecked from
    // the DB at most every 5 minutes so demoting or deactivating a user
    // takes effect without waiting for session expiry.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: "admin" | "doctor" | "receptionist" }).role;
        token.active = true;
        token.pwdTs = user.pwdTs;
        token.checkedAt = Date.now();
        return token;
      }
      const stale =
        typeof token.checkedAt !== "number" ||
        Date.now() - token.checkedAt > 5 * 60 * 1000;
      if (stale && typeof token.id === "string") {
        const fresh = await db.query.users.findFirst({
          where: eq(users.id, Number(token.id)),
          columns: { role: true, status: true, passwordChangedAt: true },
        });
        token.checkedAt = Date.now();
        const freshTs = fresh?.passwordChangedAt
          ? new Date(fresh.passwordChangedAt).getTime()
          : 0;
        // Password changed elsewhere (e.g. forgot-password reset) — kill
        // this session along with every other live one.
        if (!fresh || fresh.status !== "active" || freshTs !== token.pwdTs) {
          token.active = false;
        } else {
          token.role = fresh.role;
          token.active = true;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "admin" | "doctor" | "receptionist";
        session.user.active = token.active !== false;
      }
      return session;
    },
  },
});
