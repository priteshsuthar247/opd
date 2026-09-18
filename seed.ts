import "dotenv/config";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./db/index";
import {
  users,
  departments,
  doctors,
  patients,
  medicines,
  categories,
  queueConfigurations,
  billingItems,
  settings,
  appointments,
  queueStatusLogs,
  consultations,
  prescriptions,
  prescriptionItems,
  invoices,
  invoiceItems,
  notifications,
} from "./db/schema";

async function main() {
  console.log("Seeding database...");

  /* ------------------------------------------------------------ */
  /* Departments                                                    */
  /* ------------------------------------------------------------ */
  await db
    .insert(departments)
    .values([
      { name: "General Medicine", code: "GEN" },
      { name: "Pediatrics", code: "PED" },
      { name: "ENT", code: "ENT" },
    ])
    .onConflictDoNothing();

  const allDepartments = await db.query.departments.findMany();
  const generalMedicine = allDepartments.find((d) => d.code === "GEN")!;
  const pediatrics = allDepartments.find((d) => d.code === "PED")!;

  /* ------------------------------------------------------------ */
  /* Users — one login per role, all sharing a demo password        */
  /* ------------------------------------------------------------ */
  const passwordHash = await hash("password123", 10);

  await db
    .insert(users)
    .values([
      { name: "Admin User", email: "admin@opdclinic.com", passwordHash, role: "admin" },
      { name: "Reception Desk", email: "reception@opdclinic.com", passwordHash, role: "receptionist" },
      { name: "Dr. Aisha Verma", email: "aisha.verma@opdclinic.com", passwordHash, role: "doctor" },
      { name: "Dr. Rohan Mehta", email: "rohan.mehta@opdclinic.com", passwordHash, role: "doctor" },
    ])
    .onConflictDoNothing();

  const allUsers = await db.query.users.findMany();
  const doctorUser1 = allUsers.find((u) => u.email === "aisha.verma@opdclinic.com")!;
  const doctorUser2 = allUsers.find((u) => u.email === "rohan.mehta@opdclinic.com")!;

  /* ------------------------------------------------------------ */
  /* Doctor profiles                                                */
  /* ------------------------------------------------------------ */
  await db
    .insert(doctors)
    .values([
      {
        userId: doctorUser1.id,
        departmentId: generalMedicine.id,
        qualification: "MBBS, MD (General Medicine)",
        registrationNo: "MCI-10234",
        consultationFee: "500",
        workingHours: {
          mon: { start: "09:00", end: "17:00" },
          tue: { start: "09:00", end: "17:00" },
          wed: { start: "09:00", end: "17:00" },
          thu: { start: "09:00", end: "17:00" },
          fri: { start: "09:00", end: "17:00" },
        },
      },
      {
        userId: doctorUser2.id,
        departmentId: pediatrics.id,
        qualification: "MBBS, DCH",
        registrationNo: "MCI-10567",
        consultationFee: "400",
        workingHours: {
          mon: { start: "10:00", end: "18:00" },
          tue: { start: "10:00", end: "18:00" },
          wed: { start: "10:00", end: "18:00" },
          thu: { start: "10:00", end: "18:00" },
          fri: { start: "10:00", end: "18:00" },
        },
      },
    ])
    .onConflictDoNothing();

  const allDoctors = await db.query.doctors.findMany();

  /* ------------------------------------------------------------ */
  /* Queue configuration — one per doctor                           */
  /* ------------------------------------------------------------ */
  if (allDoctors.length > 0) {
    await db
      .insert(queueConfigurations)
      .values(
        allDoctors.map((doc) => ({
          doctorId: doc.id,
          slotDurationMinutes: 15,
          maxTokensPerDay: 40,
        }))
      )
      .onConflictDoNothing();
  }

  /* ------------------------------------------------------------ */
  /* Patients                                                       */
  /* ------------------------------------------------------------ */
  await db
    .insert(patients)
    .values([
      { name: "Ramesh Patel", phone: "9800000001", gender: "male", dob: "1985-04-12" },
      { name: "Sunita Shah", phone: "9800000002", gender: "female", dob: "1990-09-23" },
      { name: "Karan Joshi", phone: "9800000003", gender: "male", dob: "2015-01-30" },
      { name: "Meera Nair", phone: "9810000001", gender: "female", dob: "1978-06-15", bloodGroup: "O+" },
      { name: "Arjun Singh", phone: "9810000002", gender: "male", dob: "1995-11-02", bloodGroup: "B+" },
      { name: "Divya Rao", phone: "9810000003", gender: "female", dob: "2001-03-19", bloodGroup: "A+" },
      { name: "Kishore Kumar", phone: "9810000004", gender: "male", dob: "1960-12-25", bloodGroup: "AB+" },
      { name: "Anita Desai", phone: "9810000005", gender: "female", dob: "1988-08-08", bloodGroup: "O-" },
    ])
    .onConflictDoNothing();

  /* ------------------------------------------------------------ */
  /* Medicines                                                      */
  /* ------------------------------------------------------------ */
  await db
    .insert(medicines)
    .values([
      { name: "Paracetamol 500mg", genericName: "Paracetamol", form: "Tablet" },
      { name: "Amoxicillin 250mg", genericName: "Amoxicillin", form: "Capsule" },
      { name: "Cetirizine 10mg", genericName: "Cetirizine", form: "Tablet" },
      { name: "Azithromycin 500mg", genericName: "Azithromycin", form: "Tablet" },
      { name: "ORS Sachet", genericName: "Oral Rehydration Salts", form: "Sachet" },
      { name: "Cough Syrup", genericName: "Dextromethorphan", form: "Syrup" },
    ])
    .onConflictDoNothing();

  /* ------------------------------------------------------------ */
  /* Categories — diagnosis / symptom / complaint                   */
  /* ------------------------------------------------------------ */
  await db
    .insert(categories)
    .values([
      { name: "Fever", type: "symptom" },
      { name: "Cough & Cold", type: "symptom" },
      { name: "Upper Respiratory Infection", type: "diagnosis" },
      { name: "Viral Fever", type: "diagnosis" },
      { name: "Routine Checkup", type: "complaint" },
      { name: "Follow-up Visit", type: "complaint" },
    ])
    .onConflictDoNothing();

  /* ------------------------------------------------------------ */
  /* Billing items                                                  */
  /* ------------------------------------------------------------ */
  await db
    .insert(billingItems)
    .values([
      { name: "Dressing", type: "Procedure", amount: "150" },
      { name: "Minor Procedure", type: "Procedure", amount: "300" },
      { name: "Injection Administration", type: "Procedure", amount: "100" },
    ])
    .onConflictDoNothing();

  /* ------------------------------------------------------------ */
  /* Settings — Spec Section 8 toggles                            */
  /* ------------------------------------------------------------ */
  await db
    .insert(settings)
    .values([
      { key: "no_show_minutes", value: { minutes: 30 } },
      { key: "no_show_token_gap", value: { gap: 3 } },
      { key: "auto_fee_enabled", value: { enabled: true } },
      {
        key: "notifications",
        value: {
          appointment_booked: true,
          turn_approaching: true,
          prescription_finalized: true,
          follow_up_due: true,
        },
      },
    ])
    .onConflictDoNothing();

  /* ------------------------------------------------------------ */
  /* Demo visits — a lived-in clinic across three days. Skipped   */
  /* entirely if any appointments already exist (re-runnable).   */
  /* ------------------------------------------------------------ */
  const existingVisits = await db.query.appointments.findMany({
    columns: { id: true },
  });
  if (existingVisits.length === 0) {
    await seedDemoVisits();
  } else {
    console.log("Appointments already present — skipping demo visits.");
  }

  console.log("\nSeed complete.");
  console.log("Demo accounts (all share the password below):");
  console.log("  password: password123");
  console.log("  admin@opdclinic.com        (admin)");
  console.log("  reception@opdclinic.com    (receptionist)");
  console.log("  aisha.verma@opdclinic.com  (doctor)");
  console.log("  rohan.mehta@opdclinic.com  (doctor)");

  process.exit(0);
}

function dayStr(offsetDays: number): string {
  const d = new Date(Date.now() - offsetDays * 86400000);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function at(date: string, hm: string): Date {
  return new Date(`${date}T${hm}:00`);
}

async function seedDemoVisits() {
  const byPhone = async (phone: string) => {
    const p = await db.query.patients.findFirst({
      where: eq(patients.phone, phone),
    });
    if (!p) throw new Error(`seed patient missing: ${phone}`);
    return p.id;
  };
  const byEmail = async (email: string) => {
    const u = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (!u) throw new Error(`seed user missing: ${email}`);
    const d = await db.query.doctors.findFirst({
      where: eq(doctors.userId, u.id),
    });
    if (!d) throw new Error(`seed doctor missing: ${email}`);
    return d;
  };
  const medId = async (name: string) => {
    const m = await db.query.medicines.findFirst({
      where: eq(medicines.name, name),
    });
    if (!m) throw new Error(`seed medicine missing: ${name}`);
    return m.id;
  };

  const aisha = await byEmail("aisha.verma@opdclinic.com");
  const rohan = await byEmail("rohan.mehta@opdclinic.com");
  const paracetamol = await medId("Paracetamol 500mg");
  const cetirizine = await medId("Cetirizine 10mg");
  const amoxicillin = await medId("Amoxicillin 250mg");
  const dressing = await db.query.billingItems.findFirst({
    where: eq(billingItems.name, "Dressing"),
  });

  const ramesh = await byPhone("9800000001");
  const sunita = await byPhone("9800000002");
  const karan = await byPhone("9800000003");
  const meera = await byPhone("9810000001");
  const arjun = await byPhone("9810000002");
  const divya = await byPhone("9810000003");
  const kishore = await byPhone("9810000004");
  const anita = await byPhone("9810000005");

  // [dayOffset, doctorId, patientId, token, type, status, diagnosis?, feePaid?]
  type Visit = [
    number,
    number,
    number,
    number,
    "walk_in" | "scheduled",
    "waiting" | "in_progress" | "completed" | "no_show",
    string | null,
    boolean,
  ];
  const visits: Visit[] = [
    // Two days ago — a full completed day.
    [2, aisha.id, ramesh, 1, "walk_in", "completed", "Viral Fever", true],
    [2, aisha.id, sunita, 2, "scheduled", "completed", "Upper Respiratory Infection", false],
    [2, rohan.id, karan, 1, "walk_in", "completed", "Cough & Cold", true],
    // Yesterday — includes a no-show and a follow-up.
    [1, aisha.id, meera, 1, "scheduled", "completed", "Routine Checkup", true],
    [1, aisha.id, arjun, 2, "walk_in", "no_show", null, false],
    [1, rohan.id, divya, 1, "walk_in", "completed", "Viral Fever", false],
    // Today — live queue.
    [0, aisha.id, ramesh, 1, "walk_in", "waiting", null, false],
    [0, aisha.id, sunita, 2, "scheduled", "waiting", null, false],
    [0, aisha.id, kishore, 3, "walk_in", "in_progress", null, false],
    [0, rohan.id, anita, 1, "walk_in", "waiting", null, false],
    [0, rohan.id, karan, 2, "scheduled", "waiting", null, false],
  ];

  const rxLines: Record<string, { med: number; dosage: string; frequency: string; duration: string }[]> = {
    "Viral Fever": [
      { med: paracetamol, dosage: "500mg", frequency: "1-0-1", duration: "5 days" },
    ],
    "Upper Respiratory Infection": [
      { med: amoxicillin, dosage: "250mg", frequency: "1-0-1", duration: "5 days" },
      { med: cetirizine, dosage: "10mg", frequency: "0-0-1", duration: "5 days" },
    ],
    "Cough & Cold": [
      { med: cetirizine, dosage: "10mg", frequency: "0-0-1", duration: "3 days" },
    ],
    "Routine Checkup": [],
  };

  for (const [off, doctorId, patientId, token, type, status, diagnosis, paid] of visits) {
    const date = dayStr(off);
    const [appt] = await db
      .insert(appointments)
      .values({ patientId, doctorId, date, tokenNumber: token, type, status })
      .returning({ id: appointments.id });

    type ApptStatus = "waiting" | "in_progress" | "completed" | "cancelled" | "no_show";
    const logs: { prev: ApptStatus | null; next: ApptStatus; hm: string }[] =
      status === "completed"
        ? [
            { prev: null, next: "waiting", hm: "09:00" },
            { prev: "waiting", next: "in_progress", hm: "09:25" },
            { prev: "in_progress", next: "completed", hm: "09:40" },
          ]
        : status === "in_progress"
          ? [
              { prev: null, next: "waiting", hm: "09:05" },
              { prev: "waiting", next: "in_progress", hm: "09:30" },
            ]
          : [{ prev: null, next: "waiting", hm: "09:10" }];
    for (const l of logs) {
      await db.insert(queueStatusLogs).values({
        appointmentId: appt.id,
        previousStatus: l.prev,
        newStatus: l.next,
        changedBy: null,
        changedAt: at(date, l.hm),
      });
    }

    const doctor = doctorId === aisha.id ? aisha : rohan;
    const fee = String(doctor.consultationFee);
    const [invoice] = await db
      .insert(invoices)
      .values({
        appointmentId: appt.id,
        consultationFee: fee,
        discount: "0",
        totalAmount: fee,
        paymentStatus: paid ? "paid" : "pending",
        paymentMode: paid ? "Cash" : null,
        paidAt: paid ? at(date, "10:00") : null,
      })
      .returning({ id: invoices.id });

    // Dressing charge on Ramesh's completed visit from two days ago.
    if (diagnosis === "Viral Fever" && off === 2 && dressing) {
      await db.insert(invoiceItems).values({
        invoiceId: invoice.id,
        billingItemId: dressing.id,
        name: dressing.name,
        amount: dressing.amount,
      });
      const total = (Number(fee) + Number(dressing.amount)).toFixed(2);
      await db
        .update(invoices)
        .set({ totalAmount: total })
        .where(eq(invoices.id, invoice.id));
    }

    if (status === "completed" || status === "in_progress") {
      const followUp = diagnosis === "Routine Checkup";
      const [con] = await db
        .insert(consultations)
        .values({
          appointmentId: appt.id,
          vitals: { bp: "120/80", tempC: 37.5, pulse: 78, weightKg: 65 },
          chiefComplaint: diagnosis === "Routine Checkup" ? "Annual checkup" : "Fever and body ache",
          diagnosis,
          notes: "Rest and fluids advised.",
          followUpRequired: followUp,
          followUpDate: followUp ? dayStr(0) : null,
        })
        .returning({ id: consultations.id });
      const [rx] = await db
        .insert(prescriptions)
        .values({
          consultationId: con.id,
          status: status === "completed" ? "finalized" : "draft",
        })
        .returning({ id: prescriptions.id });
      for (const line of rxLines[diagnosis ?? ""] ?? []) {
        await db.insert(prescriptionItems).values({
          prescriptionId: rx.id,
          medicineId: line.med,
          dosage: line.dosage,
          frequency: line.frequency,
          duration: line.duration,
        });
      }
      await db.insert(notifications).values({
        patientId,
        appointmentId: appt.id,
        type: "prescription_finalized",
        message: "Prescription finalized.",
      });
      if (followUp) {
        await db.insert(notifications).values({
          patientId,
          appointmentId: appt.id,
          type: "follow_up_due",
          message: `Follow-up due on ${dayStr(0)}.`,
        });
      }
    }

    if (off === 0 && status === "waiting") {
      await db.insert(notifications).values({
        patientId,
        appointmentId: appt.id,
        type: "appointment_booked",
        message: `Token ${token} booked for ${date}.`,
      });
    }
  }

  console.log("Demo visits seeded (3 days, 11 appointments).");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
