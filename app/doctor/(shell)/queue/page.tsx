import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { doctors } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  DoctorFollowUpsSection,
  DoctorQueueSection,
} from "@/components/queue/queue-sections";
import { TableSkeleton } from "@/components/shell/loading-blocks";
import { todayStr } from "@/lib/dates";

// Live board: never serve a stale CDN copy in production.
export const dynamic = 'force-dynamic';

export default async function DoctorQueuePage() {
  const session = await auth();
  if (session?.user?.role !== "doctor") redirect("/");
  const doctor = await db.query.doctors.findFirst({
    where: eq(doctors.userId, Number(session.user.id)),
    with: { department: true },
  });
  if (!doctor) redirect("/");

  const date = todayStr();

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
      <Suspense fallback={<TableSkeleton rows={3} />}>
        <DoctorFollowUpsSection doctorId={doctor.id} date={date} />
      </Suspense>
      <Suspense fallback={<TableSkeleton rows={8} />}>
        <DoctorQueueSection doctorId={doctor.id} date={date} />
      </Suspense>
    </div>
  );
}
