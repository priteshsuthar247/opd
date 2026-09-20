import { auth } from "@/lib/auth";

export type Role = "admin" | "doctor" | "receptionist";

export async function requireRole(...roles: Role[]) {
  const session = await auth();
  if (!session?.user || session.user.active === false) return null;
  if (!roles.includes(session.user.role)) return null;
  return session;
}
