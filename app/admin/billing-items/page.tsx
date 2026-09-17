import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listBillingItems } from "@/db/queries/billing-items";
import { BillingItemDialog } from "@/components/admin/billing-item-dialog";
import { BillingItemsTable } from "@/components/admin/billing-items-table";

export default async function BillingItemsPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  const items = await listBillingItems();

  return (
    <main className="mx-auto w-full max-w-3xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Billing Items</h1>
          <p className="text-xs text-muted-foreground">
            {items.length} billing item{items.length === 1 ? "" : "s"}
          </p>
        </div>
        {items.length > 0 && <BillingItemDialog />}
      </div>
      <BillingItemsTable data={items} />
    </main>
  );
}
