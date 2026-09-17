"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { completeVisit } from "@/app/doctor/(shell)/consultation/actions";

export function CompleteVisitButton({
  appointmentId,
  tokenNumber,
}: {
  appointmentId: number;
  tokenNumber: number;
}) {
  const router = useRouter();

  async function onComplete() {
    const result = await completeVisit({ appointmentId });
    if (!result.ok) {
      toast.error(result.error);
      throw new Error(result.error);
    }
    toast.success("Visit completed.");
    router.push("/doctor/queue");
  }

  return (
    <ConfirmButton
      label="Complete visit"
      title={`Complete token ${tokenNumber}?`}
      description="The visit closes and leaves the live queue. Make sure the consultation is saved."
      confirmLabel="Complete visit"
      onConfirm={onComplete}
    />
  );
}
