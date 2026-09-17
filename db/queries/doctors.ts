import { db } from "@/db";

export function listDoctors() {
  return db.query.doctors.findMany({
    with: { user: true, department: true },
    orderBy: (t, { asc }) => [asc(t.id)],
  });
}

export type DoctorRow = Awaited<ReturnType<typeof listDoctors>>[number];
