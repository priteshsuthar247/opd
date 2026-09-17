import "dotenv/config";
import { hash } from "bcryptjs";
import { db } from "./index";
import {
  users,
  departments,
  doctors,
  patients,
  medicines,
  categories,
  queueConfigurations,
  billingItems,
} from "./schema";

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

  console.log("\nSeed complete.");
  console.log("Demo accounts (all share the password below):");
  console.log("  password: password123");
  console.log("  admin@opdclinic.com        (admin)");
  console.log("  reception@opdclinic.com    (receptionist)");
  console.log("  aisha.verma@opdclinic.com  (doctor)");
  console.log("  rohan.mehta@opdclinic.com  (doctor)");

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
