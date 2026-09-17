import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRightIcon,
  ListChecksIcon,
  CircleXIcon,
  CircleCheckIcon,
  WalletIcon,
} from "lucide-react";
import { auth } from "@/lib/auth";
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Recent visits today
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/admin/reports/daily">View all</Link>}
          >
            View all
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No visits today yet.
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
