import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listDepartments } from "@/db/queries/departments";
import { DepartmentDialog } from "@/components/admin/department-dialog";
import { DepartmentsTable } from "@/components/admin/departments-table";
import { PageHeader } from "@/components/ui/page-header";

export default async function DepartmentsPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  const departments = await listDepartments();

  return (
    <main className="w-full px-4 lg:px-6 py-4 md:py-6">
      <PageHeader
        title="Departments"
        count={`${departments.length} department${departments.length === 1 ? "" : "s"}`}
        action={departments.length > 0 && <DepartmentDialog />}
      />
      <DepartmentsTable data={departments} />
    </main>
  );
}
