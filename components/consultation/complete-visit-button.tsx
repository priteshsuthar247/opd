"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { completeVisit } from "@/app/doctor/(shell)/consultation/actions";

export function CompleteVisitButton({
  appointmentId,
}: {
  appointmentId: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    try {
      const result = await completeVisit({ appointmentId });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Visit completed.");
      router.push("/doctor/queue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button onClick={onClick} disabled={busy}>
      {busy ? "Completing…" : "Complete visit"}
    </Button>
  );
}
