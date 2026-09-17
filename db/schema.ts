import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  numeric,
  boolean,
  timestamp,
  date,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* -------------------------------------------------------------------------- */
/*  Enums                                                                      */
/* -------------------------------------------------------------------------- */

export const roleEnum = pgEnum("role", ["admin", "doctor", "receptionist"]);
export const statusEnum = pgEnum("status", ["active", "inactive"]);
export const genderEnum = pgEnum("gender", ["male", "female", "other"]);
export const categoryTypeEnum = pgEnum("category_type", [
  "diagnosis",
  "symptom",
  "complaint",
]);
export const appointmentTypeEnum = pgEnum("appointment_type", [
  "walk_in",
  "scheduled",
]);
export const appointmentStatusEnum = pgEnum("appointment_status", [
  "waiting",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
]);
export const prescriptionStatusEnum = pgEnum("prescription_status", [
  "draft",
  "finalized",
]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid"]);
export const notificationStatusEnum = pgEnum("notification_status", [
  "unread",
  "read",
]);

/* -------------------------------------------------------------------------- */
/*  Master Data                                                                */
/* -------------------------------------------------------------------------- */

// Auth identity for every logged-in person (admin, doctor, or receptionist).
// A Doctor row extends this with clinical profile fields via user_id.
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  status: statusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  departmentId: integer("department_id")
    .notNull()
    .references(() => departments.id),
  qualification: varchar("qualification", { length: 255 }),
  registrationNo: varchar("registration_no", { length: 100 }),
  consultationFee: numeric("consultation_fee", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  // { mon: { start: "09:00", end: "17:00" }, tue: {...}, ... }
  workingHours: jsonb("working_hours").notNull().default({}),
  status: statusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  dob: date("dob"),
  gender: genderEnum("gender"),
  bloodGroup: varchar("blood_group", { length: 5 }),
  address: text("address"),
  emergencyContact: varchar("emergency_contact", { length: 20 }),
  status: statusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const medicines = pgTable("medicines", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  genericName: varchar("generic_name", { length: 255 }),
  form: varchar("form", { length: 100 }), // Tablet / Syrup / Injection / etc.
  defaultDosageNote: text("default_dosage_note"),
  status: statusEnum("status").default("active").notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: categoryTypeEnum("type").notNull(),
  status: statusEnum("status").default("active").notNull(),
});

export const queueConfigurations = pgTable("queue_configurations", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id")
    .notNull()
    .references(() => doctors.id, { onDelete: "cascade" }),
  slotDurationMinutes: integer("slot_duration_minutes").notNull().default(15),
  maxTokensPerDay: integer("max_tokens_per_day").notNull().default(40),
  status: statusEnum("status").default("active").notNull(),
});

export const billingItems = pgTable("billing_items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: statusEnum("status").default("active").notNull(),
});

/* -------------------------------------------------------------------------- */
/*  Transactional Data                                                         */
/* -------------------------------------------------------------------------- */

export const appointments = pgTable(
  "appointments",
  {
    id: serial("id").primaryKey(),
    patientId: integer("patient_id")
      .notNull()
      .references(() => patients.id),
    doctorId: integer("doctor_id")
      .notNull()
      .references(() => doctors.id),
    date: date("date").notNull(),
    tokenNumber: integer("token_number").notNull(),
    type: appointmentTypeEnum("type").notNull().default("walk_in"),
    status: appointmentStatusEnum("status").notNull().default("waiting"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    // Backs the per-doctor-per-day token transaction: the unique index is
    // the final guard against duplicate tokens under concurrent bookings,
    // the status index drives the live queue board queries.
    uniqueIndex("appointments_doctor_date_token_unique").on(
      t.doctorId,
      t.date,
      t.tokenNumber
    ),
    index("appointments_doctor_date_status_idx").on(
      t.doctorId,
      t.date,
      t.status
    ),
  ]
);

// Audit trail of every status change on an Appointment — drives wait-time
// reporting and the No-show auto-flag rule from Spec Section 8.
export const queueStatusLogs = pgTable("queue_status_logs", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id")
    .notNull()
    .references(() => appointments.id, { onDelete: "cascade" }),
  previousStatus: appointmentStatusEnum("previous_status"),
  newStatus: appointmentStatusEnum("new_status").notNull(),
  changedBy: integer("changed_by").references(() => users.id),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
});

export const consultations = pgTable("consultations", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id")
    .notNull()
    .unique()
    .references(() => appointments.id, { onDelete: "cascade" }),
  // { bp: "120/80", tempC: 37.0, pulse: 72, weightKg: 68 }
  vitals: jsonb("vitals").default({}),
  chiefComplaint: text("chief_complaint"),
  diagnosis: text("diagnosis"),
  notes: text("notes"),
  followUpRequired: boolean("follow_up_required").notNull().default(false),
  followUpDate: date("follow_up_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  consultationId: integer("consultation_id")
    .notNull()
    .unique()
    .references(() => consultations.id, { onDelete: "cascade" }),
  status: prescriptionStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const prescriptionItems = pgTable("prescription_items", {
  id: serial("id").primaryKey(),
  prescriptionId: integer("prescription_id")
    .notNull()
    .references(() => prescriptions.id, { onDelete: "cascade" }),
  medicineId: integer("medicine_id").references(() => medicines.id),
  // Free-text fallback so the front desk isn't blocked if a medicine
  // isn't in the master list yet.
  freeTextName: varchar("free_text_name", { length: 255 }),
  dosage: varchar("dosage", { length: 100 }).notNull(),
  frequency: varchar("frequency", { length: 100 }).notNull(),
  duration: varchar("duration", { length: 100 }).notNull(),
  instructions: text("instructions"),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id")
    .notNull()
    .unique()
    .references(() => appointments.id, { onDelete: "cascade" }),
  consultationFee: numeric("consultation_fee", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  discount: numeric("discount", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  paymentMode: varchar("payment_mode", { length: 50 }),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Ad-hoc charges beyond the base consultation fee (dressing, minor
// procedure, etc.), sourced from the Billing Item master.
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  billingItemId: integer("billing_item_id").references(() => billingItems.id),
  name: varchar("name", { length: 255 }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
});

// Clinic-wide toggles from Spec Section 8: no-show thresholds, auto fee
// calculation, and per-event notification switches. One row per key.
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: jsonb("value").notNull().default({}),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// In-app notification feed (Spec Section 8: booked confirmation, turn
// approaching, prescription finalized, follow-up due). Email/SMS stays
// optional; this table is the minimum deliverable.
export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    patientId: integer("patient_id").references(() => patients.id),
    appointmentId: integer("appointment_id").references(() => appointments.id, {
      onDelete: "cascade",
    }),
    type: varchar("type", { length: 50 }).notNull(),
    message: text("message").notNull(),
    status: notificationStatusEnum("status").notNull().default("unread"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("notifications_appointment_idx").on(t.appointmentId)]
);

/* -------------------------------------------------------------------------- */
/*  Relations (enables db.query.<table>.findMany({ with: {...} }))            */
/* -------------------------------------------------------------------------- */

export const usersRelations = relations(users, ({ one }) => ({
  doctorProfile: one(doctors, {
    fields: [users.id],
    references: [doctors.userId],
  }),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  doctors: many(doctors),
}));

export const doctorsRelations = relations(doctors, ({ one, many }) => ({
  user: one(users, { fields: [doctors.userId], references: [users.id] }),
  department: one(departments, {
    fields: [doctors.departmentId],
    references: [departments.id],
  }),
  appointments: many(appointments),
  queueConfiguration: one(queueConfigurations, {
    fields: [doctors.id],
    references: [queueConfigurations.doctorId],
  }),
}));

export const patientsRelations = relations(patients, ({ many }) => ({
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  doctor: one(doctors, {
    fields: [appointments.doctorId],
    references: [doctors.id],
  }),
  consultation: one(consultations, {
    fields: [appointments.id],
    references: [consultations.appointmentId],
  }),
  invoice: one(invoices, {
    fields: [appointments.id],
    references: [invoices.appointmentId],
  }),
  statusLogs: many(queueStatusLogs),
  notifications: many(notifications),
}));

export const consultationsRelations = relations(consultations, ({ one }) => ({
  appointment: one(appointments, {
    fields: [consultations.appointmentId],
    references: [appointments.id],
  }),
  prescription: one(prescriptions, {
    fields: [consultations.id],
    references: [prescriptions.consultationId],
  }),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one, many }) => ({
  consultation: one(consultations, {
    fields: [prescriptions.consultationId],
    references: [consultations.id],
  }),
  items: many(prescriptionItems),
}));

export const prescriptionItemsRelations = relations(prescriptionItems, ({ one }) => ({
  prescription: one(prescriptions, {
    fields: [prescriptionItems.prescriptionId],
    references: [prescriptions.id],
  }),
  medicine: one(medicines, {
    fields: [prescriptionItems.medicineId],
    references: [medicines.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  appointment: one(appointments, {
    fields: [invoices.appointmentId],
    references: [appointments.id],
  }),
  items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  billingItem: one(billingItems, {
    fields: [invoiceItems.billingItemId],
    references: [billingItems.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  appointment: one(appointments, {
    fields: [notifications.appointmentId],
    references: [appointments.id],
  }),
  patient: one(patients, {
    fields: [notifications.patientId],
    references: [patients.id],
  }),
}));

export const queueConfigurationsRelations = relations(
  queueConfigurations,
  ({ one }) => ({
    doctor: one(doctors, {
      fields: [queueConfigurations.doctorId],
      references: [doctors.id],
    }),
  })
);
