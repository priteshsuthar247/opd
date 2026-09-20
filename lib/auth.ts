import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
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
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // Returning null (not throwing) on any failure is deliberate —
      // never leak whether it was the email or the password that was wrong.
      authorize: async (credentials, request) => {
        if (!credentials?.email || !credentials?.password) return null;

        // 5 attempts/minute per email+IP. Throttled attempts fail exactly
        // like bad credentials so attackers learn nothing.
        const ip =
          request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          "unknown";
        if (!takeLoginAttempt(`${credentials.email as string}|${ip}`))
          return null;

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email as string),
        });

        if (!user) return null;

        // Deactivated logins are locked out even with a valid password.
        if (user.status !== "active") return null;

        const isValid = await compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
          active: true,
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
        token.checkedAt = Date.now();
        return token;
      }
      const stale =
        typeof token.checkedAt !== "number" ||
        Date.now() - token.checkedAt > 5 * 60 * 1000;
      if (stale && typeof token.id === "string") {
        const fresh = await db.query.users.findFirst({
          where: eq(users.id, Number(token.id)),
          columns: { role: true, status: true },
        });
        token.checkedAt = Date.now();
        if (!fresh || fresh.status !== "active") {
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
