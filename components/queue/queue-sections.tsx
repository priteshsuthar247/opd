import { cache } from "react";
import {
  CircleCheckIcon,
  ListChecksIcon,
  StethoscopeIcon,
} from "lucide-react";
import { flagNoShows } from "@/lib/no-show";
import { listDoctors } from "@/db/queries/doctors";
import { listQueue } from "@/db/queries/appointments";
import { listDoctorQueue, listFollowUpsDue } from "@/db/queries/clinical";
import { QueueTable } from "@/components/queue/queue-table";
import { QueueRefresh } from "@/components/queue/queue-refresh";
import { CallNextButton } from "@/components/consultation/call-next-button";
import { StatCard } from "@/components/shell/stat-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Streaming sections for the reception queue board: title + doctor/date
// filters paint from the cheap masters query while the no-show flag pass
// (a write, stays blocking inside the boundary) and the queue table
// stream behind a skeleton. Doctors are cached per request so the page
// filter and this section share one fetch.
export const getActiveDoctors = cache(async () => {
  const doctors = await listDoctors();
  return doctors.filter((d) => d.status === "active");
});

export async function ReceptionQueueSection({
  date,
  doctorId,
}: {
  date: string;
  doctorId?: number;
}) {
  const activeDoctors = await getActiveDoctors();
  // Lazy no-show pass over the visible scope before rendering.
  const flagged = (
    await Promise.all(
      (doctorId !== undefined
        ? activeDoctors.filter((d) => d.id === doctorId)
        : activeDoctors
      ).map((d) => flagNoShows(d.id, date))
    )
  ).reduce((s, n) => s + n, 0);
  // Re-read after flagging so the board never shows a stale status.
  // (The pre-flag rows are discarded — correctness over one saved query.)
  const rows = await listQueue(date, doctorId);

  return (
    <>
      <p className="mb-4 text-xs text-muted-foreground">
        {rows.length} appointment{rows.length === 1 ? "" : "s"} · {date}
        {flagged > 0 && ` · ${flagged} marked no-show`}
      </p>
      <div aria-live="polite" aria-atomic="false">
        <QueueRefresh />
        <QueueTable data={rows} />
      </div>
    </>
  );
}

// Doctor queue board: stat cards derive from the rows, so cards + table
// stream as one unit (no fake-instant numbers). Follow-ups stream as a
// sibling — separate query, separate boundary.
export async function DoctorQueueSection({
  doctorId,
  date,
}: {
  doctorId: number;
  date: string;
}) {
  const flagged = await flagNoShows(doctorId, date);
  const rows = await listDoctorQueue(doctorId, date);
  const waiting = rows.filter((r) => r.status === "waiting").length;
  const inProgress = rows.find((r) => r.status === "in_progress");
  const completed = rows.filter((r) => r.status === "completed").length;

  return (
    <>
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
      <QueueRefresh />
      <div aria-live="polite" aria-atomic="false">
        <QueueTable data={rows} variant="doctor" />
      </div>
    </>
  );
}

export async function DoctorFollowUpsSection({
  doctorId,
  date,
}: {
  doctorId: number;
  date: string;
}) {
  const followUps = await listFollowUpsDue(doctorId, date);
  if (followUps.length === 0) return null;
  return (
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
  );
}
