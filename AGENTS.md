# agents.md — OPD Management SaaS

This file is the ground truth for any AI coding agent working in this repository. Read this in full before generating code for any feature. The full product spec lives in `OPD-SaaS-Spec.md` at the repo root — read that first for entities, workflows, and business rules; this file governs *how* to build, not *what* to build.

---

## 1. Stack

- **Framework:** Next.js (App Router). Use Server Actions for all data mutations — no separate REST API layer unless explicitly asked.
- **Language:** TypeScript everywhere. No `.js` files, no `any` unless justified with a comment explaining why.
- **Database:** PostgreSQL via Drizzle ORM. Schema lives in `db/schema.ts`. Never write raw SQL unless Drizzle cannot express the query — if you do, comment why.
- **Auth:** NextAuth, credentials provider, JWT session strategy. Role lives on the session token (`admin` / `doctor` / `receptionist`).
- **UI:** Tailwind CSS + shadcn/ui components only. Do not introduce another component library (no MUI, Ant, Chakra, etc.), and do not hand-roll a component shadcn already provides.
- **Forms:** React Hook Form + Zod for every form. No uncontrolled forms, no manual `useState`-per-field patterns.
- **Tables:** `@tanstack/react-table` for any list/grid view (patient lists, queue boards, report tables).
- **PDF generation:** `pdfcn` components (Takumi engine) — prescriptions and invoice/report PDFs are generated inside a Server Action using Takumi's `render()`, and the resulting bytes are streamed straight back to the browser for download. No temp file is ever written to disk or blob storage — generation and delivery happen in one request.

---

## 2. Folder Structure Conventions

```
app/
  (auth)/                → login, session-related routes
  admin/                 → admin-only routes (departments, doctors, medicines, categories, settings, reports)
  doctor/                → doctor-only routes (queue, consultation, prescription)
  reception/             → receptionist-only routes (patient registry, booking, queue board)
  api/                   → only for things Server Actions genuinely cannot do (e.g. webhooks)
db/
  schema.ts              → all Drizzle table definitions
  queries/                → reusable query functions, grouped by entity (patients.ts, appointments.ts, etc.)
components/
  ui/                    → shadcn primitives, do not hand-edit generated ones
  <feature>/             → feature-specific components (queue/, consultation/, prescription/, etc.)
lib/
  validations/           → Zod schemas, one file per entity, imported by both forms and Server Actions
  auth.ts                → NextAuth config
  utils.ts
```

New features should slot into this structure. Do not invent parallel structures (e.g. a second `services/` layer) without a stated reason.

---

## 3. shadcn/ui Usage

Do not assume a component is already installed. shadcn components are added one at a time via CLI (`npx shadcn add <component>`) — check `components/ui/` first; if the component isn't there, add it before importing it, don't hand-write a substitute.

Use shadcn primitives for these recurring OPD UI patterns rather than inventing custom markup:

| UI Need | shadcn Component(s) |
|---|---|
| Queue board, patient lists, report tables | `table`, paired with `@tanstack/react-table` for sorting/filtering |
| Patient/appointment quick-add, confirm actions | `dialog`, `alert-dialog` |
| All forms (patient, appointment, consultation, prescription) | `form` (wraps React Hook Form + Zod), `input`, `select`, `textarea`, `checkbox` |
| Queue status, appointment status, payment status | `badge` — use consistent color mapping per status value across the whole app, don't invent new colors per screen |
| Role-based nav (admin/doctor/reception) | `tabs` or `sidebar` (whichever the app-shell already uses — check before adding a second nav pattern) |
| Save/submit feedback, notification toasts | `sonner` (or `toast` if already scaffolded — don't mix both) |
| Patient search-and-select in booking flow | `command` (combobox pattern) |
| Consultation/patient summary cards | `card` |

Once a pattern is established for one feature (e.g. how the patient table handles empty state and pagination), reuse the exact same shadcn composition for the next similar table — don't re-derive it from scratch each time.

**Note on PDF components:** `@pdfcn/takumi/*` is a separate registry from the regular shadcn/ui components above — same CLI (`pnpm dlx shadcn add ...`), different namespace, and it's used only inside PDF-rendering code (prescriptions, invoice/report exports via Server Actions), never for regular page UI. Don't mix Takumi's `Table`/`Text`/`Section` primitives into normal app pages — those are PDF-document primitives, not screen components.

## 4. Naming Conventions

- **Tables:** snake_case, plural (`appointments`, `prescription_items`).
- **Drizzle table variables:** camelCase matching the table name (`appointments`, `prescriptionItems`).
- **Server Actions:** verb-first, colocated with the feature they act on (`createAppointment`, `assignNextToken`, `finalizePrescription`).
- **Routes:** kebab-case, role-prefixed as shown in Section 2 (`/doctor/queue`, `/reception/patients`).
- **Zod schemas:** `<entity>Schema` for create, `<entity>UpdateSchema` for partial updates.

---

## 5. Non-Negotiable Rules

These map directly to Section 8 of `OPD-SaaS-Spec.md`. Do not generate code that violates these, even if not explicitly asked for in a given prompt:

1. **Every Server Action must check the session role first**, before touching the database. Reject with a clear error if the role doesn't match what the action requires (see Section 8 role matrix in the spec).
2. **Token assignment must happen inside a database transaction** with row-level locking on the relevant doctor+date scope. Never assign a token by "read max, add 1, insert" without a lock — this is a known race condition, reject any AI-generated version that does this.
3. **Every database write must be validated with the matching Zod schema first.** No raw `db.insert()` calls fed directly from form input.
4. **Finalized Prescriptions are immutable.** A "finalize" action should be a separate Server Action from "edit," and once `status = 'finalized'`, no update action should be able to touch `prescription_items` for that prescription.
5. **Never build UI for an entity or workflow not listed in `OPD-SaaS-Spec.md`.** If a request seems to need something outside the spec, flag it rather than silently expanding scope.

---

## 6. Working With This Codebase (for the agent)

- Before writing a new feature, check `db/schema.ts` for existing tables/relations before proposing new ones.
- Before writing a new component, check `components/<feature>/` for an existing pattern to match (e.g. how an existing table/list component handles empty states, loading states, and pagination) — replicate that pattern rather than introducing a new one.
- When asked for a feature, break the work into this order and do not skip steps: **schema change (if any) → Zod schema → Server Action → UI → wire-up.** Do not generate all layers in a single undifferentiated diff — this repo is reviewed layer by layer.
- Always handle the empty state explicitly (no patients yet, empty queue, no prior visits) — do not assume data exists.
- When unsure whether a business rule applies, check Section 8 of `OPD-SaaS-Spec.md` before inventing a default.

---

## 7. What "Done" Means for a Feature

A feature is not done when it compiles. It is done when:
- It respects the role-access rule for who can call it.
- It validates all input before touching the database.
- It handles its relevant empty/error states.
- It matches the naming and folder conventions above.
- Any concurrency-sensitive operation (token assignment, stock/points-style balance changes) is transaction-safe.

If AI-generated code doesn't meet all of the above, it is not ready to merge — flag what's missing rather than accepting it as-is.

---

## 8. Design Notes

The custom shadcn preset lives in `app/globals.css` (`:root` and `.dark` CSS variable blocks) — use it as-is, don't override colors or fonts inline, and don't generate a new theme. This section covers the intent-level decisions the preset's tokens don't carry on their own.

- **Density over whitespace.** This is a tool clinic staff use all day under time pressure, not a marketing site. Default to compact table rows and tight form layouts over generous card-based spacing. If a screen feels "airy," it's probably wrong for this product.
- **Palette reality check — this preset has no dedicated info/warning token.** `primary` and `accent` are the same green (`oklch(0.508 0.118 165.612)`), `destructive` is red, and everything else is a warm, low-chroma neutral (`muted`, `secondary`). Don't invent a blue "info" color that doesn't exist in the theme — build the status system out of what's actually here:
  - **Waiting** → outline badge, neutral (`muted-foreground` border, no fill) — not yet active, shouldn't draw the eye.
  - **In Progress** → filled `primary` badge — this is the one row on the queue board that needs visual salience right now.
  - **Completed** → filled `secondary` badge + checkmark icon — done, should recede visually rather than compete with In Progress for attention. Do **not** reuse `primary` here even though it's the "positive" color — that collides with In Progress and defeats the point of a scannable queue.
  - **Cancelled** → `muted-foreground` text with strikethrough, no badge fill — negative but not urgent.
  - **No-show** → filled `destructive` badge — this is the one state that needs to visually flag as a problem.
  Apply the same underlying logic elsewhere, don't just copy these exact colors 1:1: **Payment status** — Pending = outline/neutral, Paid = `secondary` + checkmark (it's a "done" state, same as Completed). **Prescription status** — Draft = outline/neutral, Finalized = `secondary` + checkmark.
- **Radius is 0 — respect it.** The theme sets `--radius: 0`, meaning square corners everywhere (cards, buttons, badges, inputs) is an intentional aesthetic choice, not a bug. Don't hardcode `rounded-md`, `rounded-lg`, or similar Tailwind radius classes that bypass the theme variable. The one deliberate exception: if you use avatars/profile initials anywhere (e.g. doctor picker), `rounded-full` is fine there — that's a shape decision, not a corner-radius override, and it's fine for it to be the one round element in an otherwise square UI.
- **Dialog vs. full page vs. inline edit** — pick by weight of the action, not by default habit:
  - Quick, single-purpose actions (add patient, cancel appointment, add a billing item) → `dialog`.
  - Multi-section or multi-step flows (consultation, prescription authoring) → full page, not a dialog — these need room and shouldn't feel like a popup interruption mid-consultation.
  - Small field corrections on an existing record (edit patient phone number) → inline edit where feasible, to avoid a modal for a one-field change.
- **The queue board is the most-viewed screen in the app.** It should be scannable at a glance — token number, patient name, and status badge visible without scrolling or expanding a row. Anything else (phone number, appointment type) can go in a row-expand or side panel, not the primary row.
- **Consultation and prescription screens are doctor-facing and time-constrained.** Minimize clicks to save; avoid multi-step wizards for a single consultation — one page, logically grouped sections (vitals → complaint/diagnosis → notes → prescription), not a tabbed or paginated form.
