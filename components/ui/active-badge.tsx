import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// The active/inactive cell shared by every master table. (Queue and
// payment statuses keep their own StatusBadge — different semantics.)
export function ActiveBadge({ status }: { status: string }) {
  return status === "active" ? (
    <Badge variant="secondary">
      <Check className="size-3" /> Active
    </Badge>
  ) : (
    <Badge variant="outline">Inactive</Badge>
  );
}
