import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listDoctors } from "@/db/queries/doctors";
import { listDepartments } from "@/db/queries/departments";
import { DoctorDialog } from "@/components/admin/doctor-dialog";
import { DoctorsTable } from "@/components/admin/doctors-table";

export default async function DoctorsPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  const [doctors, departments] = await Promise.all([
    listDoctors(),
    listDepartments(),
  ]);
  const activeDepartments = departments.filter((d) => d.status === "active");

  return (
    <main className="mx-auto w-full max-w-4xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Doctors</h1>
          <p className="text-xs text-muted-foreground">
            {doctors.length} doctor{doctors.length === 1 ? "" : "s"}
          </p>
        </div>
        {doctors.length > 0 && activeDepartments.length > 0 && (
          <DoctorDialog departments={activeDepartments} />
        )}
      </div>
      {activeDepartments.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Add an active department first — doctors belong to one.
          </p>
        </div>
      ) : (
        <DoctorsTable data={doctors} departments={activeDepartments} />
      )}
    </main>
  );
}
