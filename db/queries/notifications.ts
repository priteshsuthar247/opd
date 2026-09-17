import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";

export function listRecentNotifications(limit = 8) {
  return db.query.notifications.findMany({
    orderBy: (t, { desc: d }) => [d(t.createdAt)],
    limit,
  });
}

export type NotificationRow = Awaited<
  ReturnType<typeof listRecentNotifications>
>[number];

export async function countUnreadNotifications(): Promise<number> {
  const rows = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(eq(notifications.status, "unread"));
  return rows.length;
}
