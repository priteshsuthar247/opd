"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { callNextToken } from "@/app/doctor/consultation/actions";

export function CallNextButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    try {
      const result = await callNextToken();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Token ${result.token} is now in consultation.`);
      router.push(`/doctor/consultation/${result.appointmentId}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button onClick={onClick} disabled={disabled || busy}>
      {busy ? "Calling…" : "Call Next"}
    </Button>
  );
}
