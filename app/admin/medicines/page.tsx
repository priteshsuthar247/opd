import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listMedicines } from "@/db/queries/medicines";
import { MedicineDialog } from "@/components/admin/medicine-dialog";
import { MedicinesTable } from "@/components/admin/medicines-table";

export default async function MedicinesPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  const medicines = await listMedicines();

  return (
    <main className="w-full px-4 lg:px-6 py-4 md:py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Medicines</h1>
          <p className="text-xs text-muted-foreground">
            {medicines.length} medicine{medicines.length === 1 ? "" : "s"}
          </p>
        </div>
        {medicines.length > 0 && <MedicineDialog />}
      </div>
      <MedicinesTable data={medicines} />
    </main>
  );
}
