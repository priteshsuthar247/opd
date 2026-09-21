"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Downloads a server-rendered admin report PDF (GET /api/reports/pdf
// with the report query string) as a file. Sits next to Export CSV;
// same data, printable format.
export function DownloadReportButton({
  query,
  filename,
}: {
  query: string;
  filename: string;
}) {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const res = await fetch(`/api/reports/pdf?${query}`);
      if (!res.ok) throw new Error("Could not generate the PDF.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
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
