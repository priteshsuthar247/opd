import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { doctors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { listDoctorQueue, listFollowUpsDue } from "@/db/queries/clinical";
import { flagNoShows } from "@/lib/no-show";
import { CallNextButton } from "@/components/consultation/call-next-button";
import { StatusBadge } from "@/components/queue/status-badge";
import { Button } from "@/components/ui/button";
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

  return (
    <main className="mx-auto w-full max-w-4xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">My Queue · {date}</h1>
          <p className="text-xs text-muted-foreground">
            {waiting} waiting
            {inProgress ? ` · token ${inProgress.tokenNumber} in consultation` : ""}
            {flagged > 0 && ` · ${flagged} marked no-show`}
          </p>
        </div>
        <CallNextButton disabled={waiting === 0} />
      </div>
      {followUps.length > 0 && (
        <div className="mb-4 border p-3">
          <h2 className="mb-2 text-sm font-semibold">
            Follow-ups due ({followUps.length})
          </h2>
          <ul className="flex flex-col gap-1 text-xs">
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
        </div>
      )}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No appointments today. New bookings appear here live.
          </p>
        </div>
      ) : (
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
      )}
    </main>
  );
}
