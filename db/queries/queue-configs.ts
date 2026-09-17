import { db } from "@/db";

export function listQueueConfigs() {
  return db.query.queueConfigurations.findMany({
    with: { doctor: { with: { user: true, department: true } } },
    orderBy: (t, { asc }) => [asc(t.id)],
  });
}

export type QueueConfigRow = Awaited<
  ReturnType<typeof listQueueConfigs>
>[number];
