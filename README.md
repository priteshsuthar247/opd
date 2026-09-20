# OPD Clinic — Outpatient Management

Digitizes the full outpatient loop for a multi-doctor clinic: walk-in
registration → token queue → consultation → prescription → billing →
reporting. See `OPD-SaaS-Spec.md` for the product spec and `AGENTS.md`
for build conventions.

## Stack

Next.js 16 (App Router, Server Actions) · TypeScript · PostgreSQL (Neon)
via Drizzle ORM · Auth.js v5 (credentials, JWT) · Tailwind + shadcn/ui ·
React Hook Form + Zod · TanStack Table v9.

## Getting started

```bash
pnpm install
cp .env.example .env   # fill in DATABASE_URL + AUTH_SECRET + AUTH_URL
pnpm db:generate       # create a migration from db/schema.ts
pnpm db:migrate        # apply migrations (tsx runner, not drizzle-kit)
pnpm db:seed           # masters + demo accounts (dev only; refused in prod)
pnpm dev               # http://localhost:3000
```

Other scripts: `pnpm build`, `pnpm start`, `pnpm lint`.
`pnpm tsc --noEmit` type-checks (no dedicated script).

## Demo accounts (password: `password123`)

- `admin@opdclinic.com` — admin
- `reception@opdclinic.com` — receptionist
- `aisha.verma@opdclinic.com` — doctor (General Medicine)
- `rohan.mehta@opdclinic.com` — doctor (Pediatrics)

## Key behaviors

- Tokens assign per doctor per day inside a transaction with a
  `SELECT ... FOR UPDATE` row lock (pooled driver required), backed by a
  unique index as a final guard.
- Finalized prescriptions are immutable; corrections need a new version.
- Every Server Action checks the session role first and validates input
  with Zod before touching the database.
- Prescription PDFs are client-side: print view → browser Print to PDF.
  Report exports are CSV downloads.
- No-show auto-flag runs lazily on queue renders (minutes + token-gap
  thresholds in Settings).

## Deploying

- App: Vercel (or any Node host). Set `AUTH_SECRET` + `AUTH_URL` in the
  host env. `trustHost` is enabled in `lib/auth.ts`.
- Database: Neon (pooled driver with WebSocket is required — plain
  `pg` cannot run the `SELECT ... FOR UPDATE` transactions). Point
  `DATABASE_URL` at the **-pooler** host and run `pnpm db:migrate`.
  Do NOT run `pnpm db:seed` in production (it refuses unless
  `SEED_DEMO=1`); create the first admin directly in the database.
- Sessions last 8h; deactivating a user (doctors table) locks their
  login within ~5 minutes.

## Versioning

Phase tags mark verified checkpoints (`phase-0-grounded` …
`phase-8-shell`). Roll back with `git reset --hard <tag>`.
Conventional commits, local-only (no remote configured).
