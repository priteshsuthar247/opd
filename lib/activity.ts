import { db } from "@/db";
import { userActivity } from "@/db/schema";

// Fire-and-forget account audit. Never throws — activity recording must
// not break the action it records (login, password change, ...).
export async function logActivity(
  userId: number,
  action: string,
  meta?: string
): Promise<void> {
  try {
    await db.insert(userActivity).values({ userId, action, meta });
  } catch {
    // Intentionally silent.
  }
}

export function recentActivity(userId: number, limit = 20) {
  return db.query.userActivity.findMany({
    where: (t, { eq }) => eq(t.userId, userId),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    limit,
  });
}
