import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listCategories } from "@/db/queries/categories";
import { CategoryDialog } from "@/components/admin/category-dialog";
import { CategoriesTable } from "@/components/admin/categories-table";

export default async function CategoriesPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  const categories = await listCategories();

  return (
    <main className="w-full px-4 lg:px-6 py-4 md:py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Categories</h1>
          <p className="text-xs text-muted-foreground">
            {categories.length} categor{categories.length === 1 ? "y" : "ies"}
          </p>
        </div>
        {categories.length > 0 && <CategoryDialog />}
      </div>
      <CategoriesTable data={categories} />
    </main>
  );
}
