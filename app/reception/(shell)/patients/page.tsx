import { redirect } from "next/navigation";
import { requireRole } from "@/lib/roles";
import { listPatients } from "@/db/queries/patients";
import { PatientDialog } from "@/components/reception/patient-dialog";
import { PatientsTable } from "@/components/reception/patients-table";
import { PageHeader } from "@/components/ui/page-header";

export default async function PatientsPage() {
  if (!(await requireRole("receptionist", "admin"))) redirect("/");

  const patients = await listPatients();

  return (
    <main className="w-full px-4 lg:px-6 py-4 md:py-6">
      <PageHeader
        title="Patients"
        count={`${patients.length} patient${patients.length === 1 ? "" : "s"}`}
        action={patients.length > 0 && <PatientDialog />}
      />
      <PatientsTable data={patients} />
    </main>
  );
}
