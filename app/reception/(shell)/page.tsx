import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  CalendarPlusIcon,
  ListChecksIcon,
  CircleCheckIcon,
} from "lucide-react";
import { requireRole } from "@/lib/roles";
import { countAppointmentsByStatus } from "@/db/queries/reports";
import { DeskRecentSection } from "@/components/shell/desk-sections";
import { StatCard } from "@/components/shell/stat-card";
import { TableSkeleton } from "@/components/shell/loading-blocks";
import { todayStr } from "@/lib/dates";

export default async function ReceptionHome() {
  const session = await requireRole("receptionist", "admin");
  if (!session) redirect("/");

  // Light COUNT query: stat cards paint without the day bundle.
  const date = todayStr();
  const counts = await countAppointmentsByStatus(date);
  const booked =
    (counts.waiting ?? 0) +
    (counts.in_progress ?? 0) +
    (counts.completed ?? 0) +
    (counts.cancelled ?? 0) +
    (counts.no_show ?? 0);
  const waiting = counts.waiting ?? 0;
  const done = counts.completed ?? 0;

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Booked today" value={String(booked)} icon={CalendarPlusIcon} href="/reception/queue" />
        <StatCard title="Waiting" value={String(waiting)} icon={ListChecksIcon} />
        <StatCard title="Completed" value={String(done)} icon={CircleCheckIcon} />
      </div>

      <Suspense fallback={<TableSkeleton rows={5} />}>
        <DeskRecentSection date={date} />
      </Suspense>
    </div>
  );
}
