import { and, asc, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import { appointments, consultations, patients } from "@/db/schema";

export function findDoctorByUserId(userId: number) {
  return db.query.doctors.findFirst({
    where: (t, { eq }) => eq(t.userId, userId),
    with: { user: true, department: true },
  });
}

export function listDoctorQueue(doctorId: number, date: string) {
  // Includes the doctor relation (same doctor on every row) so the page
  // can reuse the shared QueueTable, which is typed on QueueRow.
  return db.query.appointments.findMany({
    where: and(
      eq(appointments.doctorId, doctorId),
      eq(appointments.date, date)
    ),
    with: {
      patient: true,
      consultation: true,
      doctor: { with: { user: true, department: true } },
    },
    orderBy: (t, { asc }) => [asc(t.tokenNumber)],
  });
}

export type DoctorQueueRow = Awaited<
  ReturnType<typeof listDoctorQueue>
>[number];

export function getConsultationBundle(appointmentId: number) {
  return db.query.appointments.findFirst({
    where: eq(appointments.id, appointmentId),
    with: {
      patient: true,
      doctor: { with: { user: true, department: true } },
      consultation: {
        with: {
          prescription: { with: { items: { with: { medicine: true } } } },
        },
      },
    },
  });
}

export type ConsultationBundle = Awaited<
  ReturnType<typeof getConsultationBundle>
>;

// Past visits for the history panel, newest first, excluding the visit
// currently being consulted.
export function listPatientHistory(patientId: number, excludeAppointmentId: number) {
  return db.query.appointments.findMany({
    where: (t, { and, eq, ne }) =>
      and(eq(t.patientId, patientId), ne(t.id, excludeAppointmentId)),
    with: {
      doctor: { with: { user: true } },
      consultation: {
        with: {
          prescription: { with: { items: { with: { medicine: true } } } },
        },
      },
    },
    orderBy: (t, { desc }) => [desc(t.date), desc(t.tokenNumber)],
  });
}

export async function findConsultationByAppointment(appointmentId: number) {
  return db.query.consultations.findFirst({
    where: eq(consultations.appointmentId, appointmentId),
  });
}

// Follow-ups due for a doctor's patients on or before today — surfaced on
// the doctor queue (Spec Section 8 follow-up reminder). The predicate runs
// in SQL (join + where), so history growth never loads the table into Node.
export async function listFollowUpsDue(doctorId: number, today: string) {
  const rows = await db
    .select({
      appointmentId: appointments.id,
      date: appointments.date,
      followUpDate: consultations.followUpDate,
      patientName: patients.name,
      patientPhone: patients.phone,
    })
    .from(consultations)
    .innerJoin(
      appointments,
      eq(consultations.appointmentId, appointments.id)
    )
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .where(
      and(
        eq(appointments.doctorId, doctorId),
        eq(consultations.followUpRequired, true),
        lte(consultations.followUpDate, today)
      )
    )
    .orderBy(asc(appointments.date));
  return rows.map((r) => ({
    ...r,
    followUpDate: r.followUpDate as string,
  }));
}
