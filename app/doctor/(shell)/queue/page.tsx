import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CircleCheckIcon,
  ListChecksIcon,
  StethoscopeIcon,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { doctors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { listDoctorQueue, listFollowUpsDue } from "@/db/queries/clinical";
import { flagNoShows } from "@/lib/no-show";
import { CallNextButton } from "@/components/consultation/call-next-button";
import { StatusBadge } from "@/components/queue/status-badge";
import { StatCard } from "@/components/shell/stat-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export default async function DoctorQueuePage() {
  const session = await auth();
  if (session?.user?.role !== "doctor") redirect("/");
  const doctor = await db.query.doctors.findFirst({
    where: eq(doctors.userId, Number(session.user.id)),
    with: { department: true },
  });
  if (!doctor) redirect("/");

  const date = todayStr();
  const flagged = await flagNoShows(doctor.id, date);
  const [rows, followUps] = await Promise.all([
    listDoctorQueue(doctor.id, date),
    listFollowUpsDue(doctor.id, date),
  ]);
  const waiting = rows.filter((r) => r.status === "waiting").length;
  const inProgress = rows.find((r) => r.status === "in_progress");
  const completed = rows.filter((r) => r.status === "completed").length;

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Waiting" value={String(waiting)} icon={ListChecksIcon} />
        <StatCard
          title="In consultation"
          value={inProgress ? `Token ${inProgress.tokenNumber}` : "—"}
          icon={StethoscopeIcon}
        />
        <StatCard title="Completed" value={String(completed)} icon={CircleCheckIcon} />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {date}
          {flagged > 0 && ` · ${flagged} marked no-show`}
        </p>
        <CallNextButton disabled={waiting === 0} />
      </div>
      {followUps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Follow-ups due ({followUps.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-xs">
              {followUps.map((f) => (
                <li key={f.appointmentId} className="flex justify-between gap-2">
                  <span className="font-medium">
                    {f.patientName} · {f.patientPhone}
                  </span>
                  <span className="text-muted-foreground">
                    due {f.followUpDate} (visit {f.date})
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      {rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No appointments today. New bookings appear here live.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.tokenNumber}</TableCell>
                <TableCell>
                  <span className="font-medium">{r.patient.name}</span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>
                <TableCell className="text-right">
                  {r.status === "in_progress" && (
                    <Button
                      size="sm"
                      render={
                        <Link href={`/doctor/consultation/${r.id}`}>
                          Consult
                        </Link>
                      }
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
            </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
