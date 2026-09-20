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
// Column-pruned (picker needs id/name/phone only, not address/dob), and
// empty queries return nothing instead of the whole table. `name` has a
// pg_trgm GIN index for the leading-wildcard ILIKE.
export async function searchPatients(q: string, limit = 8) {
  const trimmed = q.trim();
  if (trimmed === "") return [];
  const needle = `%${trimmed}%`;
  return db
    .select({
      id: patients.id,
      name: patients.name,
      phone: patients.phone,
      status: patients.status,
    })
    .from(patients)
    .where(or(ilike(patients.name, needle), ilike(patients.phone, needle)))
    .limit(limit);
}
