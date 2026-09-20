import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import type { Role } from "@/lib/roles";

// The feed is one table for all staff. Scoping is by event audience:
// reception owns bookings and recalls, doctors own their queue and
// prescriptions, admins see everything. Mark-read respects the same
// scope, so one role can no longer clear another's feed.
export function notificationTypesForRole(role: Role): string[] | null {
  switch (role) {
    case "receptionist":
      return ["appointment_booked", "turn_approaching", "follow_up_due"];
    case "doctor":
      return ["turn_approaching", "follow_up_due", "prescription_finalized"];
    case "admin":
      return null;
  }
}

export function listRecentNotifications(role: Role, limit = 8) {
  const types = notificationTypesForRole(role);
  return db.query.notifications.findMany({
    where:
      types === null ? undefined : inArray(notifications.type, types),
    orderBy: (t, { desc: d }) => [d(t.createdAt)],
    limit,
  });
}

export type NotificationRow = Awaited<
  ReturnType<typeof listRecentNotifications>
>[number];

export async function countUnreadNotifications(role: Role): Promise<number> {
  const types = notificationTypesForRole(role);
  const where =
    types === null
      ? eq(notifications.status, "unread")
      : and(
          eq(notifications.status, "unread"),
          inArray(notifications.type, types)
        );
  const [row] = await db
    .select({ n: count() })
    .from(notifications)
    .where(where);
  return row?.n ?? 0;
}
