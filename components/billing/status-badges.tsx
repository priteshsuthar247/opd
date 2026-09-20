import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Payment mapping mirrors the queue logic (AGENTS.md design notes):
// Pending = outline/neutral (not yet done), Paid = secondary + check
// (a "done" state, same visual language as Completed).
export function PaymentBadge({ status }: { status: string }) {
  if (status === "paid")
    return (
      <Badge variant="secondary">
        <Check className="size-3" /> Paid
      </Badge>
    );
  return <Badge variant="outline">Pending</Badge>;
}

// Prescription mapping: Draft = outline/neutral, Finalized =
// secondary + check (immutable "done" state).
export function PrescriptionBadge({ status }: { status: string }) {
  if (status === "finalized")
    return (
      <Badge variant="secondary">
        <Check className="size-3" /> Finalized
      </Badge>
    );
  return <Badge variant="outline">Draft</Badge>;
}
