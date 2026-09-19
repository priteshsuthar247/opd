import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { StatusBadge } from "@/components/queue/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { QueueStatus } from "@/components/queue/status-badge";

export type RecentVisit = {
  id: number;
  tokenNumber: number;
  patientName: string;
  doctorName: string;
  status: QueueStatus;
};

// The recent-visits card shared by the admin and reception overviews.
export function RecentVisits({
  title,
  viewAllHref,
  viewAllLabel = "View all",
  empty,
  visits,
}: {
  title: string;
  viewAllHref: string;
  viewAllLabel?: string;
  empty: string;
  visits: RecentVisit[];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={viewAllHref}>{viewAllLabel}</Link>}
        >
          {viewAllLabel}
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </CardHeader>
      <CardContent>
        {visits.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {visits.map((v) => (
              <div key={v.id} className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    Token {v.tokenNumber} · {v.patientName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {v.doctorName}
                  </span>
                </div>
                <StatusBadge status={v.status} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
