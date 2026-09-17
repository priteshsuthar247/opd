import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments, consultations } from "@/db/schema";

export function findDoctorByUserId(userId: number) {
  return db.query.doctors.findFirst({
    where: (t, { eq }) => eq(t.userId, userId),
    with: { user: true, department: true },
  });
}

export function listDoctorQueue(doctorId: number, date: string) {
  return db.query.appointments.findMany({
    where: and(
      eq(appointments.doctorId, doctorId),
      eq(appointments.date, date)
    ),
    with: { patient: true, consultation: true },
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
// the doctor queue (Spec Section 8 follow-up reminder). Filtered in code:
// the predicate spans the consultation join and clinic-scale volumes.
export async function listFollowUpsDue(doctorId: number, today: string) {
  const rows = await db.query.appointments.findMany({
    where: eq(appointments.doctorId, doctorId),
    with: { patient: true, consultation: true },
    orderBy: (t, { asc }) => [asc(t.date)],
  });
  return rows
    .filter(
      (a) =>
        a.consultation?.followUpRequired === true &&
        a.consultation.followUpDate !== null &&
        a.consultation.followUpDate <= today
    )
    .map((a) => ({
      appointmentId: a.id,
      date: a.date,
      followUpDate: a.consultation!.followUpDate as string,
      patientName: a.patient.name,
      patientPhone: a.patient.phone,
    }));
}
