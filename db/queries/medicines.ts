import { db } from "@/db";

export function listMedicines() {
  return db.query.medicines.findMany({
    orderBy: (t, { asc }) => [asc(t.name)],
  });
}

export type MedicineRow = Awaited<ReturnType<typeof listMedicines>>[number];
