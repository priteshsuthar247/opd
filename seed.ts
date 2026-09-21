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
  // Demo data (known-password users, fake patients/visits) must never
  // land in production by accident. Prod gets a separate bootstrap
  // (admin user only) — this script refuses unless explicitly allowed.
  if (
    process.env.NODE_ENV === "production" &&
    process.env.SEED_DEMO !== "1"
  ) {
    throw new Error(
      "Refusing to seed demo data in production. Set SEED_DEMO=1 to override."
    );
  }
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
      { name: "Dermatology", code: "DERM" },
      { name: "Orthopedics", code: "ORTHO" },
      { name: "Ophthalmology", code: "OPH" },
      { name: "Dental", code: "DENT" },
      { name: "Physiotherapy", code: "PHYS" },
      { name: "Psychiatry", code: "PSY" },
      { name: "Cardiology", code: "CARD" },
      { name: "Neurology", code: "NEURO" },
      { name: "Gynecology", code: "GYN" },
    ])
    .onConflictDoNothing();

  const allDepartments = await db.query.departments.findMany();
  const generalMedicine = allDepartments.find((d) => d.code === "GEN")!;
  const pediatrics = allDepartments.find((d) => d.code === "PED")!;
  const deptByCode = (code: string) =>
    allDepartments.find((d) => d.code === code)!;

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
      { name: "Dr. Vikram Rao", email: "vikram.rao@opdclinic.com", passwordHash, role: "doctor" },
      { name: "Dr. Neha Kulkarni", email: "neha.kulkarni@opdclinic.com", passwordHash, role: "doctor" },
      { name: "Dr. Farhan Ali", email: "farhan.ali@opdclinic.com", passwordHash, role: "doctor" },
      { name: "Dr. Pooja Menon", email: "pooja.menon@opdclinic.com", passwordHash, role: "doctor" },
      { name: "Dr. Sanjay Gupta", email: "sanjay.gupta@opdclinic.com", passwordHash, role: "doctor" },
      { name: "Dr. Kavita Reddy", email: "kavita.reddy@opdclinic.com", passwordHash, role: "doctor" },
      { name: "Dr. Arvind Nair", email: "arvind.nair@opdclinic.com", passwordHash, role: "doctor" },
      { name: "Dr. Shalini Bose", email: "shalini.bose@opdclinic.com", passwordHash, role: "doctor" },
      // Inactive login: tests the deactivation lockout (users.status).
      { name: "Dr. Ex Doctor", email: "ex.doctor@opdclinic.com", passwordHash, role: "doctor", status: "inactive" },
      { name: "Dr. Old Account", email: "old.account@opdclinic.com", passwordHash, role: "doctor", status: "inactive" },
    ])
    .onConflictDoNothing();

  const allUsers = await db.query.users.findMany();
  const doctorUser1 = allUsers.find((u) => u.email === "aisha.verma@opdclinic.com")!;
  const doctorUser2 = allUsers.find((u) => u.email === "rohan.mehta@opdclinic.com")!;
  const extraDoctorUsers = [
    "vikram.rao@opdclinic.com",
    "neha.kulkarni@opdclinic.com",
    "farhan.ali@opdclinic.com",
    "pooja.menon@opdclinic.com",
    "sanjay.gupta@opdclinic.com",
    "kavita.reddy@opdclinic.com",
    "arvind.nair@opdclinic.com",
    "shalini.bose@opdclinic.com",
    "ex.doctor@opdclinic.com",
    "old.account@opdclinic.com",
  ].map((email) => allUsers.find((u) => u.email === email)!);

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
      // Generated profiles: one per extra login, spread across
      // departments with varied fees and hours. Unique per user, so
      // re-runs skip via onConflictDoNothing.
      ...[
        { dept: "DERM", qual: "MBBS, MD (Dermatology)", reg: "MCI-20101", fee: "600" },
        { dept: "ORTHO", qual: "MBBS, MS (Orthopedics)", reg: "MCI-20102", fee: "700" },
        { dept: "OPH", qual: "MBBS, MS (Ophthalmology)", reg: "MCI-20103", fee: "500" },
        { dept: "DENT", qual: "BDS, MDS", reg: "MCI-20104", fee: "400" },
        { dept: "PHYS", qual: "BPTh, MPTh", reg: "MCI-20105", fee: "300" },
        { dept: "PSY", qual: "MBBS, MD (Psychiatry)", reg: "MCI-20106", fee: "800" },
        { dept: "CARD", qual: "MBBS, MD, DM (Cardiology)", reg: "MCI-20107", fee: "900" },
        { dept: "NEURO", qual: "MBBS, MD, DM (Neurology)", reg: "MCI-20108", fee: "900" },
        { dept: "GYN", qual: "MBBS, MS (OBGY)", reg: "MCI-20109", fee: "600", inactive: true },
        { dept: "ENT", qual: "MBBS, MS (ENT)", reg: "MCI-20110", fee: "500", inactive: true },
      ].map((p, i) => ({
        userId: extraDoctorUsers[i].id,
        departmentId: deptByCode(p.dept).id,
        qualification: p.qual,
        registrationNo: p.reg,
        consultationFee: p.fee,
        workingHours: {
          mon: { start: "09:00", end: "17:00" },
          tue: { start: "09:00", end: "17:00" },
          wed: { start: "09:00", end: "17:00" },
          thu: { start: "09:00", end: "17:00" },
          fri: { start: "09:00", end: "17:00" },
          sat: { start: "10:00", end: "14:00" },
        },
        ...(p.inactive ? { status: "inactive" as const } : {}),
      })),
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
      { name: "Rahul Verma", phone: "9820000001", gender: "male", dob: "1992-05-14", bloodGroup: "A+" },
      { name: "Priya Iyer", phone: "9820000002", gender: "female", dob: "1987-11-30", bloodGroup: "B-", address: "14 MG Road" },
      { name: "Amitabh Rao", phone: "9820000003", gender: "male", dob: "1975-02-17" },
      { name: "Lakshmi Menon", phone: "9820000004", gender: "female", dob: "1999-07-08", bloodGroup: "O+", emergencyContact: "9820000005" },
      { name: "Vikash Yadav", phone: "9820000005", gender: "male", dob: "1983-09-21", bloodGroup: "AB-" },
      { name: "Sneha Kulkarni", phone: "9820000006", gender: "female", dob: "2005-12-03" },
      { name: "Rohit Sharma", phone: "9820000007", gender: "male", dob: "1990-04-25", bloodGroup: "B+", address: "7 Park Street" },
      { name: "Deepa Nair", phone: "9820000008", gender: "female", dob: "1970-06-19", bloodGroup: "A-" },
      { name: "Manoj Tiwari", phone: "9820000009", gender: "male", dob: "1965-10-11" },
      { name: "Kavya Reddy", phone: "9820000010", gender: "female", dob: "2010-01-28", bloodGroup: "O+" },
      { name: "Suresh Pillai", phone: "9830000001", gender: "male", dob: "1958-03-15", bloodGroup: "B+", emergencyContact: "9830000002" },
      { name: "Anjali Gupta", phone: "9830000002", gender: "female", dob: "1994-08-22" },
      { name: "Nikhil Bose", phone: "9830000003", gender: "male", dob: "1989-12-09", bloodGroup: "A+" },
      { name: "Pooja Singhania", phone: "9830000004", gender: "female", dob: "1997-05-06", address: "22 Lake View" },
      { name: "Rajesh Khanna", phone: "9830000005", gender: "male", dob: "1972-11-17", bloodGroup: "O-" },
      { name: "Fatima Sheikh", phone: "9830000006", gender: "female", dob: "1985-02-28", bloodGroup: "AB+" },
      { name: "Gopal Das", phone: "9830000007", gender: "male", dob: "1962-07-13" },
      { name: "Naina Kapoor", phone: "9830000008", gender: "female", dob: "2003-09-30", bloodGroup: "B-" },
      { name: "Tarun Malhotra", phone: "9830000009", gender: "male", dob: "1979-04-04", bloodGroup: "A+", emergencyContact: "9830000010" },
      { name: "Usha Rani", phone: "9830000010", gender: "female", dob: "1955-12-12", bloodGroup: "O+" },
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
      { name: "Ibuprofen 400mg", genericName: "Ibuprofen", form: "Tablet", defaultDosageNote: "After food" },
      { name: "Omeprazole 20mg", genericName: "Omeprazole", form: "Capsule", defaultDosageNote: "Before breakfast" },
      { name: "Salbutamol Inhaler", genericName: "Salbutamol", form: "Inhaler" },
      { name: "Vitamin D3 60k", genericName: "Cholecalciferol", form: "Sachet", defaultDosageNote: "Weekly with milk" },
      { name: "Metformin 500mg", genericName: "Metformin", form: "Tablet" },
      { name: "Atorvastatin 10mg", genericName: "Atorvastatin", form: "Tablet", defaultDosageNote: "At bedtime" },
      { name: "Betadine Ointment", genericName: "Povidone Iodine", form: "Ointment" },
      { name: "Eye Drops Refresh", genericName: "Carboxymethylcellulose", form: "Drops" },
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
      { name: "Hypertension", type: "diagnosis" },
      { name: "Type 2 Diabetes", type: "diagnosis" },
      { name: "Migraine", type: "diagnosis" },
      { name: "Skin Rash", type: "symptom" },
      { name: "Back Pain", type: "symptom" },
      { name: "New Prescription", type: "complaint" },
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
      { name: "X-Ray Chest", type: "Imaging", amount: "500" },
      { name: "ECG", type: "Imaging", amount: "350" },
      { name: "Blood Sugar (Fasting)", type: "Lab", amount: "120" },
      { name: "CBC", type: "Lab", amount: "250" },
      { name: "Nebulization", type: "Procedure", amount: "200" },
      { name: "Suture Removal", type: "Procedure", amount: "150" },
      { name: "Eye Checkup", type: "Consult", amount: "400" },
      { name: "Physiotherapy Session", type: "Therapy", amount: "450" },
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
  /* Demo visits — a lived-in clinic across five days. Each slot   */
  /* (doctor, date, token) is skipped individually if present, so  */
  /* re-runs only fill gaps (additive, idempotent).               */
  /* ------------------------------------------------------------ */
  await seedDemoVisits();

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
  const extraDocs = [];
  for (const email of [
    "vikram.rao@opdclinic.com",
    "neha.kulkarni@opdclinic.com",
    "farhan.ali@opdclinic.com",
    "pooja.menon@opdclinic.com",
    "sanjay.gupta@opdclinic.com",
    "kavita.reddy@opdclinic.com",
    "arvind.nair@opdclinic.com",
    "shalini.bose@opdclinic.com",
  ]) {
    try {
      extraDocs.push(await byEmail(email));
    } catch {
      // Profile missing (e.g. older DB) — skip its slots.
    }
  }
  const laneDoctors = [aisha, rohan, ...extraDocs];
  const paracetamol = await medId("Paracetamol 500mg");
  const cetirizine = await medId("Cetirizine 10mg");
  const amoxicillin = await medId("Amoxicillin 250mg");
  const dressing = await db.query.billingItems.findFirst({
    where: eq(billingItems.name, "Dressing"),
  });

  const patientRows = await db.query.patients.findMany({
    columns: { id: true },
    orderBy: (t, { asc }) => [asc(t.id)],
  });
  const patientIds = patientRows.map((r) => r.id);
  if (patientIds.length === 0) throw new Error("seed patients missing");

  const ibuprofen = await medId("Ibuprofen 400mg");
  const omeprazole = await medId("Omeprazole 20mg");
  const extraCharges = await db.query.billingItems.findMany({
    columns: { id: true, name: true, amount: true },
  });

  // Deterministic 5-day matrix. Past days cycle all five statuses;
  // today holds a live queue for the two flagship doctors.
  // [dayOffset, doctorIdx, token, status, diagnosis?, paid?]
  type GenVisit = [
    number,
    number,
    number,
    "waiting" | "in_progress" | "completed" | "cancelled" | "no_show",
    string | null,
    boolean,
  ];
  const pastStatuses = [
    "completed",
    "completed",
    "completed",
    "no_show",
    "cancelled",
    "completed",
  ] as const;
  const pastDiagnoses = [
    "Viral Fever",
    "Upper Respiratory Infection",
    "Cough & Cold",
    "Routine Checkup",
    "Hypertension",
    "Migraine",
  ];
  const visits: GenVisit[] = [];
  for (let off = 4; off >= 1; off--) {
    // Three doctor lanes per day, rotating so every doctor works most days.
    const laneIdx = [(off * 2) % laneDoctors.length, (off * 2 + 1) % laneDoctors.length, (off * 2 + 5) % laneDoctors.length];
    for (const di of laneIdx) {
      for (let token = 1; token <= 6; token++) {
        const status = pastStatuses[
          (token - 1) % pastStatuses.length
        ] as GenVisit[3];
        visits.push([
          off,
          di,
          token,
          status,
          status === "completed" || status === "in_progress"
            ? pastDiagnoses[(token - 1) % pastDiagnoses.length]
            : null,
          token % 2 === 0,
        ]);
      }
    }
  }
  // Today — live queue (waiting + one in progress per flagship doctor).
  const todayLanes = [
    { di: 0, tokens: [1, 2, 3, 4] as const, live: 5 },
    { di: 1, tokens: [1, 2, 3] as const, live: 4 },
  ];
  for (const lane of todayLanes) {
    for (const token of lane.tokens) {
      visits.push([0, lane.di, token, "waiting", null, false]);
    }
    visits.push([0, lane.di, lane.live, "in_progress", null, false]);
  }

  const rxLines: Record<string, { med: number; dosage: string; frequency: string; duration: string }[]> = {
    "Viral Fever": [
      { med: paracetamol, dosage: "500mg", frequency: "1-0-1", duration: "5 days" },
    ],
    "Upper Respiratory Infection": [
      { med: amoxicillin, dosage: "500mg", frequency: "1-0-1", duration: "5 days" },
      { med: cetirizine, dosage: "10mg", frequency: "0-0-1", duration: "5 days" },
    ],
    "Cough & Cold": [
      { med: cetirizine, dosage: "10mg", frequency: "0-0-1", duration: "3 days" },
    ],
    "Routine Checkup": [],
    "Hypertension": [
      { med: ibuprofen, dosage: "400mg", frequency: "1-0-0", duration: "7 days" },
    ],
    "Migraine": [
      { med: ibuprofen, dosage: "400mg", frequency: "1-0-1", duration: "3 days" },
      { med: omeprazole, dosage: "20mg", frequency: "1-0-0", duration: "3 days" },
    ],
  };

  let skipped = 0;
  for (const [off, di, token, status, diagnosis, paid] of visits) {
    const doctor = laneDoctors[di % laneDoctors.length];
    const doctorId = doctor.id;
    const date = dayStr(off);
    // Per-slot idempotency: skip slots already taken (re-runs, or the
    // developer's own test bookings from browser verification).
    const taken = await db.query.appointments.findFirst({
      where: (t, { and, eq }) =>
        and(
          eq(t.doctorId, doctorId),
          eq(t.date, date),
          eq(t.tokenNumber, token)
        ),
      columns: { id: true },
    });
    if (taken) {
      skipped++;
      continue;
    }
    const patientId = patientIds[(off * 7 + di * 6 + token) % patientIds.length];
    const type = token % 2 === 0 ? "scheduled" : "walk_in";
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
          : status === "cancelled"
            ? [
                { prev: null, next: "waiting", hm: "09:10" },
                { prev: "waiting", next: "cancelled", hm: "09:35" },
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

    const fee = String(doctor.consultationFee);
    const [invoice] = await db
      .insert(invoices)
      .values({
        appointmentId: appt.id,
        consultationFee: fee,
        discount: token % 5 === 0 ? "50" : "0",
        totalAmount: fee,
        paymentStatus: paid ? "paid" : "pending",
        paymentMode: paid ? (token % 4 === 0 ? "UPI" : "Cash") : null,
        paidAt: paid ? at(date, "10:00") : null,
      })
      .returning({ id: invoices.id });

    // Rotating extra charge on even tokens of completed visits.
    if (status === "completed" && token % 2 === 0 && extraCharges.length > 0) {
      const extra = extraCharges[token % extraCharges.length];
      await db.insert(invoiceItems).values({
        invoiceId: invoice.id,
        billingItemId: extra.id,
        name: extra.name,
        amount: extra.amount,
      });
      // Integer paise: decimal strings through Number() round wrong.
      const total = (
        Math.round(Number(fee) * 100) +
        Math.round(Number(extra.amount) * 100) -
        (token % 5 === 0 ? 5000 : 0)
      );
      await db
        .update(invoices)
        .set({ totalAmount: (total / 100).toFixed(2) })
        .where(eq(invoices.id, invoice.id));
    }

    if (status === "completed" || status === "in_progress") {
      const followUp = diagnosis === "Routine Checkup";
      const [con] = await db
        .insert(consultations)
        .values({
          appointmentId: appt.id,
          vitals: {
            bp: `${110 + (token % 4) * 5}/80`,
            tempC: 37 + (token % 3) * 0.5,
            pulse: 70 + token * 2,
            weightKg: 60 + token,
          },
          chiefComplaint:
            diagnosis === "Routine Checkup"
              ? "Annual checkup"
              : `${diagnosis} with fever`,
          diagnosis,
          notes: "Rest and fluids advised.",
          followUpRequired: followUp,
          followUpDate: followUp ? dayStr(0) : null,
        })
        .returning({ id: consultations.id });
      // Two in three completed prescriptions are finalized (read-only);
      // the rest stay draft. In-progress visits are always draft.
      const finalized = status === "completed" && token % 3 !== 0;
      const [rx] = await db
        .insert(prescriptions)
        .values({
          consultationId: con.id,
          status: finalized ? "finalized" : "draft",
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
      if (finalized) {
        await db.insert(notifications).values({
          patientId,
          appointmentId: appt.id,
          type: "prescription_finalized",
          message: "Prescription finalized.",
        });
      }
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
    if (off === 0 && status === "in_progress") {
      await db.insert(notifications).values({
        patientId,
        appointmentId: appt.id,
        type: "turn_approaching",
        message: `Token ${token} is next — please proceed for consultation.`,
      });
    }
  }

  console.log(`Demo visits seeded (5-day matrix). Skipped ${skipped} taken slots.`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
