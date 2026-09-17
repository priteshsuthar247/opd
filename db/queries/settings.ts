import { db } from "@/db";

export function listSettings() {
  return db.query.settings.findMany({
    orderBy: (t, { asc }) => [asc(t.key)],
  });
}

export type SettingRow = Awaited<ReturnType<typeof listSettings>>[number];
