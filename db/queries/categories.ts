import { db } from "@/db";

export function listCategories() {
  return db.query.categories.findMany({
    orderBy: (t, { asc }) => [asc(t.type), asc(t.name)],
  });
}

export type CategoryRow = Awaited<ReturnType<typeof listCategories>>[number];
