import { redirect } from "next/navigation";
import {
  CalendarPlusIcon,
  ListChecksIcon,
  CircleCheckIcon,
} from "lucide-react";
import { requireRole } from "@/lib/roles";
import { listAppointmentsInRange } from "@/db/queries/reports";
import { RecentVisits } from "@/components/shell/recent-visits";
import { StatCard } from "@/components/shell/stat-card";
import { todayStr } from "@/lib/dates";

export default async function ReceptionHome() {
  const session = await requireRole("receptionist", "admin");
  if (!session) redirect("/");

  const date = todayStr();
  const rows = await listAppointmentsInRange({ from: date, to: date });
  const waiting = rows.filter((r) => r.status === "waiting").length;
  const done = rows.filter((r) => r.status === "completed").length;

  const recent = [...rows]
    .sort((a, b) => b.tokenNumber - a.tokenNumber)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Booked today" value={String(rows.length)} icon={CalendarPlusIcon} />
        <StatCard title="Waiting" value={String(waiting)} icon={ListChecksIcon} />
        <StatCard title="Completed" value={String(done)} icon={CircleCheckIcon} />
      </div>

      <RecentVisits
        title="Recent bookings"
        viewAllHref="/reception/queue"
        empty="Nothing booked today yet."
        visits={recent.map((r) => ({
          id: r.id,
          tokenNumber: r.tokenNumber,
          patientName: r.patient.name,
          doctorName: r.doctor.user.name,
          status: r.status,
        }))}
      />
    </div>
  );
}
