import { db } from "@/db";

export function listDepartments() {
  return db.query.departments.findMany({
    orderBy: (t, { asc }) => [asc(t.name)],
  });
}

export type DepartmentRow = Awaited<ReturnType<typeof listDepartments>>[number];
