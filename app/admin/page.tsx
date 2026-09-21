import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  ListChecksIcon,
  CircleXIcon,
  CircleCheckIcon,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { countAppointmentsByStatus } from "@/db/queries/reports";
import {
  CollectedSection,
  RecentVisitsSection,
} from "@/components/shell/overview-sections";
import { StatCard } from "@/components/shell/stat-card";
import { TableSkeleton } from "@/components/shell/loading-blocks";
import { todayStr } from "@/lib/dates";

export default async function AdminHome() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  // Light COUNT query: stat cards paint without the day bundle.
  const date = todayStr();
  const counts = await countAppointmentsByStatus(date);
  const seen = counts.completed ?? 0;
  const inQueue = (counts.waiting ?? 0) + (counts.in_progress ?? 0);
  const noShows = counts.no_show ?? 0;

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Seen today" value={String(seen)} icon={CircleCheckIcon} />
        <StatCard title="In queue" value={String(inQueue)} icon={ListChecksIcon} />
        <StatCard title="No-shows" value={String(noShows)} icon={CircleXIcon} />
      </div>

      <Suspense fallback={<TableSkeleton rows={5} />}>
        <RecentVisitsSection date={date} />
      </Suspense>

      <Suspense fallback={<TableSkeleton rows={2} />}>
        <CollectedSection date={date} />
      </Suspense>
    </div>
  );
}
