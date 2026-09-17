import { redirect } from "next/navigation";
import { requireRole } from "@/lib/roles";
import { listPatients } from "@/db/queries/patients";
import { PatientDialog } from "@/components/reception/patient-dialog";
import { PatientsTable } from "@/components/reception/patients-table";

export default async function PatientsPage() {
  if (!(await requireRole("receptionist", "admin"))) redirect("/");

  const patients = await listPatients();

  return (
    <main className="mx-auto w-full max-w-4xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Patients</h1>
          <p className="text-xs text-muted-foreground">
            {patients.length} patient{patients.length === 1 ? "" : "s"}
          </p>
        </div>
        {patients.length > 0 && <PatientDialog />}
      </div>
      <PatientsTable data={patients} />
    </main>
  );
}
