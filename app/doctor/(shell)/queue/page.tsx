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
import { QueueTable } from "@/components/queue/queue-table";
import { StatCard } from "@/components/shell/stat-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { todayStr } from "@/lib/dates";

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
      <QueueTable data={rows} variant="doctor" />
    </div>
  );
}
