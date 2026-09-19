import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { listCategories } from "@/db/queries/categories";
import { CategoryDialog } from "@/components/admin/category-dialog";
import { CategoriesTable } from "@/components/admin/categories-table";

export default async function CategoriesPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  const categories = await listCategories();

  return (
    <main className="w-full px-4 lg:px-6 py-4 md:py-6">
      <PageHeader
        title="Categories"
        count={`${categories.length} categor${categories.length === 1 ? "y" : "ies"}`}
        action={categories.length > 0 && <CategoryDialog />}
      />
      <CategoriesTable data={categories} />
    </main>
  );
}
