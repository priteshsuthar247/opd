"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Billing</DialogTitle>
          <DialogDescription>
            Charges, discount and payment for this visit.
          </DialogDescription>
        </DialogHeader>
        {bundle === null ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading invoice…
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <InvoiceManager
              key={JSON.stringify(bundle.invoice)}
              bundle={bundle}
              masterItems={master}
              onChanged={refetch}
            />
            {appointmentId !== null && (
              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                nativeButton={false}
                render={
                  <Link href={`/reception/invoices/${appointmentId}/print`}>
                    Print / PDF
                  </Link>
                }
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
