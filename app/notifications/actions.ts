"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { notificationTypesForRole } from "@/db/queries/notifications";

export async function markAllNotificationsRead(): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  // Scoped to the caller's audience: clearing your feed must not clear
  // another role's (e.g. reception acknowledging bookings they own).
  const types = notificationTypesForRole(session.user.role);
  const where =
    types === null
      ? eq(notifications.status, "unread")
      : and(
          eq(notifications.status, "unread"),
          inArray(notifications.type, types)
        );
  await db.update(notifications).set({ status: "read" }).where(where);
  revalidatePath("/", "layout");
}
