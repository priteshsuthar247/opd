"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";

export async function markAllNotificationsRead(): Promise<void> {
  const session = await auth();
  // Any signed-in staff may clear the feed; there is no per-user scoping
  // on notification rows in v1.
  if (!session?.user) return;
  await db
    .update(notifications)
    .set({ status: "read" })
    .where(eq(notifications.status, "unread"));
  revalidatePath("/", "layout");
}
