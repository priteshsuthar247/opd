import { ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { patients } from "@/db/schema";

export function listPatients() {
  return db.query.patients.findMany({
    orderBy: (t, { asc }) => [asc(t.name)],
  });
}

export type PatientRow = Awaited<ReturnType<typeof listPatients>>[number];

export function findPatientByPhone(phone: string) {
  return db.query.patients.findFirst({
    where: (t, { eq }) => eq(t.phone, phone.trim()),
  });
}

// Reception search: match on name fragment or phone fragment, active first.
export async function searchPatients(q: string, limit = 8) {
  const needle = `%${q.trim()}%`;
  if (!needle) return [];
  return db
    .select()
    .from(patients)
    .where(or(ilike(patients.name, needle), ilike(patients.phone, needle)))
    .limit(limit);
}
