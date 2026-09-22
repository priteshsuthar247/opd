# OPD Clinic — Outpatient Management SaaS

Digitizes the full outpatient loop for a multi-doctor clinic: walk-in registration → token queue → consultation → prescription → billing → reporting. Spec and conventions live in `OPD-SaaS-Spec.md` and `AGENTS.md`.

## Stack

Next.js 16 App Router with Server Actions · TypeScript · PostgreSQL (Neon) via Drizzle ORM · Auth.js v5 credentials + JWT · Tailwind + shadcn/ui + Base UI · React Hook Form + Zod · TanStack Table v9 · pdfcn/Takumi for PDFs.

## Getting started

```bash
pnpm install
cp .env.example .env   # DATABASE_URL, AUTH_SECRET, AUTH_URL, SMTP_* optional
pnpm db:generate
pnpm db:migrate        # tsx runner, not drizzle-kit
pnpm db:seed           # masters + demo accounts, dev only
pnpm dev               # http://localhost:3000
```

Scripts: `pnpm build`, `pnpm start`, `pnpm lint`, `pnpm tsc --noEmit`.

## Demo accounts

Password `password123`

- `admin@opdclinic.com` — admin
- `reception@opdclinic.com` — receptionist
- `aisha.verma@opdclinic.com` — doctor
- `rohan.mehta@opdclinic.com` — doctor

## Key behaviors

- Tokens assign per doctor per day inside a transaction with `SELECT ... FOR UPDATE SKIP LOCKED` + unique index.
- Finalized prescriptions are immutable; corrections require a new version.
- Every Server Action checks session role first and validates with Zod.
- PDFs generated server-side with pdfcn/Takumi via Server Actions, streamed for download.
- Reports export CSV + PDF.
- No-show auto-flag runs on queue render per Settings thresholds.
- Sessions 8h, `users.status` enforced, password change kills sessions.

## Deploying

Vercel + Neon pooled WebSocket. Set `AUTH_SECRET`, `AUTH_URL`, `DATABASE_URL` to the `-pooler` host. Run `pnpm db:migrate`. Never seed in production.

## Versioning

Phase tags mark verified checkpoints. Conventional commits, local-only git.

## Planned vs Implemented

### Planned features — OPD-SaaS-Spec.md

**Front Desk**
- Register new patient / search by phone with dedupe
- Book walk-in / scheduled appointment
- Auto token per doctor per day, concurrency-safe
- Live queue board per doctor
- Cancel / reschedule appointment

**Clinical**
- Doctor queue view with Call Next
- Consultation form: vitals, complaint, diagnosis, notes
- Patient history inline
- Follow-up required + date
- Prescription builder with finalize → PDF

**Administration**
- Department, doctor, medicine, category masters
- Queue configuration
- Notification settings

**Reporting**
- Daily OPD summary, doctor performance, patient visit, diagnosis/symptom trend
- Custom report builder with PDF/CSV/Excel export

**Billing**
- Auto consultation fee from doctor config
- Ad-hoc billing items
- Payment status tracking

**Bonus**
- Patient self-service portal
- SMS/WhatsApp notifications
- Leaderboards/analytics
- Multi-branch support

### Implemented

**Front Desk — Implemented**
- Patient registration and search, dedupe on phone
- Walk-in and scheduled booking
- Concurrency-safe token assignment with row lock
- Live queue boards for reception and doctor, status badges
- Cancel and reschedule with confirm dialogs

**Clinical — Implemented**
- Doctor queue, Call Next, status transitions
- Consultation form with vitals, complaint, diagnosis, notes, follow-up
- Patient visit history timeline
- Prescription builder, items CRUD, finalize immutability
- pdfcn prescription PDFs, invoice PDFs, report PDFs

**Administration — Implemented**
- Departments, doctors, medicines, categories CRUD
- Queue configuration per doctor
- Settings: no-show rules, auto-fee, notifications, appearance
- Profile with identity edit, email change OTP, 2FA via email OTP

**Reporting — Implemented**
- Daily OPD Summary, Doctor Performance, Patient Visit, Diagnosis Trend
- Custom report builder with filters
- CSV and PDF exports

**Billing — Implemented**
- Auto fee from doctor config, ad-hoc billing items
- Invoice creation, payment status, PDF download

**Platform**
- Role-based access: admin / doctor / receptionist
- In-app notifications with unread badge
- Mobile-responsive tables as cards + detail sheets
- Audit logs for status changes
- Streaming Suspense for heavy pages
- Playwright E2E for role matrix, booking, token race

**Not implemented**
- Patient self-service portal
- SMS/WhatsApp notifications
- Leaderboards/analytics visualizations
- Multi-branch/multi-clinic support
- Excel export (CSV + PDF available)

## Notes

- Seed is additive and idempotent. `SEED_DEMO=1` required for demo data in non-prod.
- Theme tokens live in `app/globals.css`; do not override inline.
- See `decisions.md` for chronological architecture and UX decisions.
