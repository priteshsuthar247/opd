"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormSkeleton } from "@/components/shell/loading-blocks";
import {
  InvoiceManager,
  type ManagerBundle,
} from "@/components/reception/invoice-manager";
import { getInvoiceData } from "@/app/reception/invoices/actions";

// Sigil-style wide billing dialog: everything inline — charges, discount,
// payment and totals — opened straight from the queue row.
export function InvoiceDialog({
  appointmentId,
  open,
  onOpenChange,
}: {
  appointmentId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [bundle, setBundle] = useState<ManagerBundle | null>(null);
  const [master, setMaster] = useState<
    { id: number; name: string; amount: string }[]
  >([]);

  useEffect(() => {
    if (!open || appointmentId === null) return;
    let live = true;
    void getInvoiceData(appointmentId).then((data) => {
      if (!live || !data) return;
      setBundle(data.bundle as ManagerBundle);
      setMaster(data.master);
    });
    return () => {
      live = false;
    };
    // setBundle(null) intentionally omitted here (set-state-in-effect
    // rule): freshness across appointments comes from the key remount in
    // the queue table instead.
  }, [open, appointmentId]);

  function refetch() {
    if (appointmentId === null) return;
    void getInvoiceData(appointmentId).then((data) => {
      if (!data) return;
      setBundle(data.bundle as ManagerBundle);
      setMaster(data.master);
    });
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Billing"
      description="Charges, discount and payment for this visit."
      size="xl"
      footer={
        appointmentId !== null ? (
          <div className="mt-4 flex justify-start">
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <Link href={`/reception/invoices/${appointmentId}/print`}>
                  Print / PDF
                </Link>
              }
            />
          </div>
        ) : undefined
      }
    >
      {bundle === null ? (
        <FormSkeleton fields={5} />
      ) : (
        <InvoiceManager
          key={JSON.stringify(bundle.invoice)}
          bundle={bundle}
          masterItems={master}
          onChanged={refetch}
        />
      )}
    </FormDialog>
  );
}
