import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRightIcon,
  CalendarPlusIcon,
  ListChecksIcon,
  CircleCheckIcon,
} from "lucide-react";
import { requireRole } from "@/lib/roles";
import { listAppointmentsInRange } from "@/db/queries/reports";
import { StatCard } from "@/components/shell/stat-card";
import { StatusBadge } from "@/components/queue/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Recent bookings</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/reception/queue">View all</Link>}
          >
            View all
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing booked today yet.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {recent.map((r) => (
                <div key={r.id} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      Token {r.tokenNumber} · {r.patient.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {r.doctor.user.name}
                    </span>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
