import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listBillingItems } from "@/db/queries/billing-items";
import { BillingItemDialog } from "@/components/admin/billing-item-dialog";
import { BillingItemsTable } from "@/components/admin/billing-items-table";
import { PageHeader } from "@/components/ui/page-header";

export default async function BillingItemsPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  const items = await listBillingItems();

  return (
    <main className="w-full px-4 lg:px-6 py-4 md:py-6">
      <PageHeader
        title="Billing Items"
        count={`${items.length} billing item${items.length === 1 ? "" : "s"}`}
        action={items.length > 0 && <BillingItemDialog />}
      />
      <BillingItemsTable data={items} />
    </main>
  );
}
