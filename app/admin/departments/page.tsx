import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listDepartments } from "@/db/queries/departments";
import { DepartmentDialog } from "@/components/admin/department-dialog";
import { DepartmentsTable } from "@/components/admin/departments-table";

export default async function DepartmentsPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  const departments = await listDepartments();

  return (
    <main className="w-full px-4 lg:px-6 py-4 md:py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Departments</h1>
          <p className="text-xs text-muted-foreground">
            {departments.length} department{departments.length === 1 ? "" : "s"}
          </p>
        </div>
        {departments.length > 0 && <DepartmentDialog />}
      </div>
      <DepartmentsTable data={departments} />
    </main>
  );
}
