import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments } from "@/db/schema";

export function listQueue(date: string, doctorId?: number) {
  return db.query.appointments.findMany({
    where:
      doctorId !== undefined
        ? and(
            eq(appointments.date, date),
            eq(appointments.doctorId, doctorId)
          )
        : eq(appointments.date, date),
    with: {
      patient: true,
      doctor: { with: { user: true, department: true } },
    },
    orderBy: (t, { asc }) => [asc(t.tokenNumber)],
  });
}

export type QueueRow = Awaited<ReturnType<typeof listQueue>>[number];
