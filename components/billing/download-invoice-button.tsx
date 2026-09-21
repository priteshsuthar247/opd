"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Downloads the pdfcn invoice PDF (GET /api/invoices/[id]) as a file.
// Busy state on the button, toast on failure.
export function DownloadInvoiceButton({
  appointmentId,
  tokenNumber,
}: {
  appointmentId: number;
  tokenNumber: number;
}) {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const res = await fetch(`/api/invoices/${appointmentId}`);
      if (!res.ok) throw new Error("Could not generate the PDF.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-token-${tokenNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not generate the PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="outline" size="sm" disabled={busy} onClick={download}>
      {busy ? "Preparing…" : "Download PDF"}
    </Button>
  );
}
