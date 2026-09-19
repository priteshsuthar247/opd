import { redirect } from "next/navigation";
import {
  ListChecksIcon,
  CircleXIcon,
  CircleCheckIcon,
  WalletIcon,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { listAppointmentsInRange } from "@/db/queries/reports";
import { RecentVisits } from "@/components/shell/recent-visits";
import { StatCard } from "@/components/shell/stat-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { todayStr } from "@/lib/dates";

export default async function AdminHome() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  const date = todayStr();
  const rows = await listAppointmentsInRange({ from: date, to: date });
  const seen = rows.filter((r) => r.status === "completed").length;
  const inQueue = rows.filter(
    (r) => r.status === "waiting" || r.status === "in_progress"
  ).length;
  const noShows = rows.filter((r) => r.status === "no_show").length;

  const recent = [...rows]
    .sort((a, b) => b.tokenNumber - a.tokenNumber)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Seen today" value={String(seen)} icon={CircleCheckIcon} />
        <StatCard title="In queue" value={String(inQueue)} icon={ListChecksIcon} />
        <StatCard title="No-shows" value={String(noShows)} icon={CircleXIcon} />
      </div>

      <RecentVisits
        title="Recent visits today"
        viewAllHref="/admin/reports/daily"
        empty="No visits today yet."
        visits={recent.map((r) => ({
          id: r.id,
          tokenNumber: r.tokenNumber,
          patientName: r.patient.name,
          doctorName: r.doctor.user.name,
          status: r.status,
        }))}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Collected today</CardTitle>
          <WalletIcon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₹
            {rows
              .reduce((s, r) => s + Number(r.invoice?.totalAmount ?? 0), 0)
              .toFixed(2)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
