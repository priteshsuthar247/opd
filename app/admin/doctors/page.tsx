import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
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
    <main className="w-full px-4 lg:px-6 py-4 md:py-6">
      <PageHeader
        title="Doctors"
        count={`${doctors.length} doctor${doctors.length === 1 ? "" : "s"}`}
        action={
          doctors.length > 0 && activeDepartments.length > 0 && (
            <DoctorDialog departments={activeDepartments} />
          )
        }
      />
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
