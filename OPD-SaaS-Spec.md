# OPD Management SaaS

## 1. Background

Outpatient departments (OPD) at small and mid-sized clinics are still largely run on paper registers, verbal queue calls, and WhatsApp messages. A patient walks in, a receptionist writes their name in a register, the doctor sees them in whatever order they arrived, writes a diagnosis and prescription by hand, and none of it is searchable the next time that patient returns. There is no record of how long patients wait, no way for a doctor to pull up a patient's history mid-consultation, and no way for clinic management to see, at a glance, how the day is going across doctors.

EcoSphere-style platforms exist for ERP and ESG because operational data is scattered — OPD workflows have the same problem at a smaller, human scale: the data exists (in someone's handwriting), it's just disconnected, unsearchable, and invisible until something goes wrong.

## 2. Challenge Statement

Build an **OPD Management SaaS** that digitizes the full outpatient loop — from walk-in registration to prescription — for a clinic with multiple doctors across departments. The platform should let a receptionist register and queue patients, let a doctor consult and prescribe against a live queue, and give clinic administrators a real-time view of the day's operations. The core loop (register → queue → consult → prescribe → history) must work end-to-end before anything else is built.

- **Front Desk (Reception):** Patient registration, appointment/token booking, live queue management.
- **Clinical (Doctor):** Queue-driven consultations, vitals and diagnosis capture, prescription authoring, patient history lookup.
- **Administration:** Doctor/department setup, medicine and category masters, queue configuration, reporting.
- **Engagement (Bonus):** Patient self-service history view, wait-time notifications.

## 3. Core Modules

- **Front Desk:** Patient registration, appointment booking, token/queue assignment, walk-in vs scheduled handling.
- **Clinical:** Consultation capture (vitals, complaint, diagnosis, notes), prescription authoring, patient visit history.
- **Administration:** Department and doctor management, medicine master, category master, queue/slot configuration, notification settings.
- **Reporting:** Daily OPD summary, doctor performance, patient visit trends, diagnosis trends, custom report builder.
- **Billing (in scope, not optional):** Consultation fee capture and payment status per visit — every consultation produces a billable record even if payment is collected outside the system initially.

## 4. Suggested Data Model

### Master Data

| Model | Purpose | Key Fields |
|---|---|---|
| **Department** | Clinical department/specialty a doctor belongs to | Name, Code, Status |
| **Doctor** | Doctor profile, schedule, and fee | Name, Department (fk), Qualification, Registration No., Consultation Fee, Working Hours (per weekday), Status |
| **Patient** | Core patient record, reused across every visit | Name, Phone (unique), DOB/Age, Gender, Blood Group, Address, Emergency Contact, Status |
| **Medicine** | Reusable medicine catalog used when building prescriptions | Name, Generic Name, Form (Tablet/Syrup/Injection/etc.), Default Dosage Note, Status |
| **Category** | Shared category values used across Clinical and Reporting (e.g. Diagnosis Category, Symptom Category) | Name, Type (Diagnosis / Symptom / Complaint), Status |
| **Queue Configuration** | Per-doctor slot rules that drive token assignment | Doctor (fk), Slot Duration (min), Max Tokens/Day, Status |
| **Billing Item** | Reusable fee line items beyond the base consultation fee (e.g. dressing, minor procedure) | Name, Type, Amount, Status |

### Transactional Data

| Model | Purpose | Key Fields |
|---|---|---|
| **Appointment** | A single patient's visit slot for a given doctor and date — the spine of the whole workflow | Patient (fk), Doctor (fk), Date, Token Number, Type (Walk-in / Scheduled), Status (Waiting / In Progress / Completed / Cancelled / No-show), Created At |
| **Queue Status Log** | Audit trail of every status change on an Appointment (for wait-time reporting and disputes) | Appointment (fk), Previous Status, New Status, Changed By, Timestamp |
| **Consultation** | Clinical record for one Appointment | Appointment (fk), Vitals (BP, Temp, Pulse, Weight), Chief Complaint, Diagnosis, Notes, Follow-up Required (bool), Follow-up Date, Created At |
| **Prescription** | One prescription per Consultation | Consultation (fk), Status (Draft / Finalized), Created At |
| **Prescription Item** | Individual medicine line within a Prescription | Prescription (fk), Medicine (fk or free text), Dosage, Frequency, Duration, Instructions |
| **Invoice** | Billing record tied to an Appointment | Appointment (fk), Consultation Fee, Additional Charges (Billing Items), Discount, Total Amount, Payment Status (Pending / Paid), Payment Mode, Paid At |
| **Doctor Daily Summary** *(computed, not stored)* | Aggregated per-doctor, per-day stats surfaced in Reporting | Doctor, Date, Patients Seen, Avg. Wait Time, No-show Count |

## 5. Business Workflow

```
Master Configuration
│
▼
Departments · Doctors · Medicines · Categories · Queue Configuration · Billing Items
│
▼
Front Desk Operations
(Patient Registration → Appointment Booking → Token Assignment)
│
▼
Live Queue
(Waiting → In Progress → Completed / Cancelled / No-show)
│
▼
Clinical Consultation
(Vitals → Chief Complaint → Diagnosis → Notes)
│
▼
Prescription (Medicine Items) ──▶ Invoice (Fee + Billing Items)
│
▼
Visit Closed → Patient History Updated → Queue Status Log Finalized
│
▼
Doctor Daily Summary  ·  Department Aggregates
│
▼
Organization Dashboard & Reports
```

## 6. Expected Features

**Front Desk**
- Register new patient / search existing patient by phone (dedupe on phone number)
- Book walk-in or scheduled appointment against a doctor
- Auto-generate token number per doctor, per day (must be concurrency-safe — no duplicate tokens under simultaneous bookings)
- Live queue board per doctor: Waiting / In Progress / Completed / Cancelled / No-show
- Cancel or reschedule an appointment

**Clinical**
- Doctor's queue view: "Call Next" moves the next Waiting token to In Progress
- Consultation form: vitals, chief complaint, diagnosis, clinical notes
- Inline access to the patient's full past visit history while consulting
- Mark follow-up required + follow-up date
- Prescription builder: add/remove medicine line items, each with dosage/frequency/duration/instructions
- Finalize prescription → generate printable/downloadable PDF

**Administration**
- Department management (CRUD)
- Doctor management: profile, department, consultation fee, working hours, status
- Medicine master and Category master management
- Queue configuration: slot duration and max tokens/day per doctor
- Notification settings (see Section 8)

**Reporting**
- Daily OPD Summary: patients seen, average wait time, doctor-wise load
- Doctor Performance Report: patients/day trend, no-show rate
- Patient Visit Report: full visit and prescription history for a given patient
- Diagnosis/Symptom Trend Report: most common diagnoses across a date range
- Custom Report Builder: combine filters and export (PDF / Excel / CSV)

**Billing**
- Auto-populate invoice amount from the doctor's configured consultation fee
- Add ad-hoc billing items to an invoice
- Track payment status per visit (Pending / Paid) and payment mode

Each report should support filtering by: **Department, Doctor, Date Range, Patient, Diagnosis Category, Appointment Status.**

## 7. Reports

The platform should generate:
- Daily OPD Summary Report
- Doctor Performance Report
- Patient Visit Report
- Diagnosis/Symptom Trend Report
- Custom Report Builder — combine the filters in Section 6 and export as PDF / Excel / CSV

## 8. Core Configuration & Business Rules

The following are in scope, not optional, since they directly support the core loop:

- **Token Assignment Rule:** Token numbers auto-increment per doctor, per day, and must be assigned inside a database transaction (row-level lock) so two simultaneous bookings can never receive the same token.
- **No-show Handling (Settings toggle):** If a token is not moved to "In Progress" within a configurable time or token-gap threshold, the appointment is auto-flagged "No-show."
- **Prescription Immutability:** Once a Prescription is marked Finalized, its medicine items become read-only. Any correction requires a new prescription version, not an edit — preserving a clean clinical audit trail.
- **Auto Fee Calculation (Settings toggle):** When enabled, an Invoice's Consultation Fee auto-populates from the Doctor's configured fee — no manual entry required.
- **Follow-up Reminder:** If a Consultation sets Follow-up Required with a Follow-up Date, the system flags it on that date (feeds the Notification System below).
- **Role-Based Access:**
  - **Receptionist:** can create/edit Patients and Appointments; cannot edit Consultations or Prescriptions.
  - **Doctor:** can create/edit Consultations and Prescriptions for their own queue; can view but not edit patient demographic data.
  - **Admin:** full access, including all master data and reports.
- **Notification System:** The platform sends notifications (in-app minimum, email/SMS optional) for at least: appointment booked confirmation, patient's turn approaching, prescription finalized, and follow-up due. Configurable via Settings → Notification Settings.

## 9. Bonus Ideas (Optional)

- Patient self-service portal: view own visit history and prescriptions via phone-number + OTP link (no password)
- SMS/WhatsApp notification when a patient's token is next or near-next
- Doctor-wise and department-wise leaderboard/analytics visualizations
- Multi-branch/multi-clinic support under one organization
- Mobile-responsive interface as a first-class requirement, not an afterthought

## 10. Suggested Tech Stack

- **Framework:** Next.js (App Router, Server Actions)
- **Database / ORM:** PostgreSQL + Drizzle ORM
- **Auth:** NextAuth (credentials provider), JWT sessions, role field on User (`admin` / `doctor` / `receptionist`)
- **UI:** Tailwind CSS + shadcn/ui, React Hook Form + Zod for all form validation
- **Tables:** `@tanstack/react-table` for queue boards and patient/report lists
- **PDF Generation:** client-side, for prescriptions and report exports — no server-side file storage required
- **Deployment:** Vercel (app) + Neon or Supabase (managed Postgres)

## 11. Build Priority (for scoping, not sequencing detail)

If time is constrained, the **non-negotiable vertical slice** is: Patient Registration → Appointment Booking → Token Queue → Consultation → Prescription → Patient History. Billing, Reporting beyond the Daily OPD Summary, and everything in Section 9 are additive and should be cut before any part of that slice is compromised.
