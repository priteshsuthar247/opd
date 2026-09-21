import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Single status-color mapping for the whole app (see AGENTS.md design
// notes): waiting = outline neutral, in progress = filled primary,
// completed = secondary + check, cancelled = muted strikethrough,
// no-show = destructive.
export type QueueStatus =
  | "waiting"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

const labels: Record<QueueStatus, string> = {
  waiting: "Waiting",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

export function StatusBadge({ status }: { status: QueueStatus }) {
  if (status === "in_progress")
    return <Badge variant="default">{labels[status]}</Badge>;
  if (status === "completed")
    return (
      <Badge variant="secondary">
        <Check data-icon="inline-start" /> {labels[status]}
      </Badge>
    );
  if (status === "no_show")
    return <Badge variant="destructive">{labels[status]}</Badge>;
  if (status === "cancelled")
    return (
      <span className="text-xs text-muted-foreground line-through">
        {labels[status]}
      </span>
    );
  return <Badge variant="outline">{labels[status]}</Badge>;
}
