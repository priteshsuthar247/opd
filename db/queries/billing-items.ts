import { db } from "@/db";

export function listBillingItems() {
  return db.query.billingItems.findMany({
    orderBy: (t, { asc }) => [asc(t.name)],
  });
}

export type BillingItemRow = Awaited<
  ReturnType<typeof listBillingItems>
>[number];
