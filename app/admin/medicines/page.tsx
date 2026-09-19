import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listMedicines } from "@/db/queries/medicines";
import { MedicineDialog } from "@/components/admin/medicine-dialog";
import { MedicinesTable } from "@/components/admin/medicines-table";
import { PageHeader } from "@/components/ui/page-header";

export default async function MedicinesPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  const medicines = await listMedicines();

  return (
    <main className="w-full px-4 lg:px-6 py-4 md:py-6">
      <PageHeader
        title="Medicines"
        count={`${medicines.length} medicine${medicines.length === 1 ? "" : "s"}`}
        action={medicines.length > 0 && <MedicineDialog />}
      />
      <MedicinesTable data={medicines} />
    </main>
  );
}
