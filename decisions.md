# Decisions Log — OPD Management SaaS

Chronological log of every significant decision, grouped by date in the
order taken. All entries implemented unless marked otherwise.

---

## 2026-09-17 — Grounding, core build, shell, first UX passes

### Planning (plan mode, before any code)
1. **Pooled DB driver over neon-http** — neon-http cannot do interactive
   transactions, which Spec §8 requires for concurrency-safe token
   assignment.
2. **Auth.js v5 (`next-auth@beta`)** — the scaffold was written in v5 API
   but v4 was installed (broken at runtime). Upgraded the package to match
   the code.
3. **Client-side PDFs over pdfcn/Takumi** — spec said client-side,
   `AGENTS.md` said server-side Takumi. User chose client-side: print
   views + browser Print-to-PDF, zero server files.
4. **New tables allowed** — `settings` (Section 8 toggles) and
   `notifications` (in-app feed), plus a token uniqueness index.
5. **Report exports: CSV + print-PDF first** — Excel deferred.
6. **Stacked logical commits** instead of one blob per phase, for
   rollback granularity.
7. **Conventional commit messages** (`feat/fix/chore/refactor/style`).
8. **Annotated phase tags** (`phase-0-grounded` …). Rollback via
   `git reset --hard <tag>`.
9. **Local-only git** — commit locally, never push (no remote configured).
10. **Vertical-slice phasing** — non-negotiable loop first
    (register → queue → consult → prescribe → history), then billing,
    reporting, automation, shell, UX passes.
11. **Verify through execution** — tsc + lint + browser smoke per slice;
    committed history stays green.

### Phase 0–1 — Grounding & auth
12. **Seed repaired** — fixed broken import paths, added `db:seed`
    (plus `tsx`/`dotenv`), seeded masters and four demo logins.

### Phase 2–4 — Masters, front desk, clinical
13. **TanStack v9 native API** (not the deprecated legacy layer) for all
    tables, after reading the package's own migration guide.

### Phase 5–7 — Billing, reports, automation
14. **Invoice skeleton auto-created at booking**, with the auto-fee
    toggle honored.
15. **No-show automation runs lazily** on queue renders (no cron infra);
    idempotent, with audit logs.
16. **Turn-approaching + follow-up notifications** written on Call Next /
    consult save; surfaced via bell and doctor-queue card.

### Shell & UX (still Sep 17)
17. **Role sidebar shell with sign-out** instead of per-page headers.
18. **Topbar pattern** — icon nav, breadcrumbs (later replaced), avatar
    user menu, **notifications bell** with unread badge over the existing
    feed table.
19. **Strict dropdowns everywhere** — fixed lists instead of free text,
    sourced from `lib/options.ts`.
20. **dashboard-01 template adopted app-wide** — layout system, theme, and
    component restyle accepted over the custom preset.
21. **Sigil as the visual reference** — cloned for study (then removed):
    theme toggle (`next-themes`), title header, stat cards + recent-list
    overviews on all three role homes.
22. **Settings moved into the user menu** (admin-only, above Log out),
    removed from the sidebar to avoid duplication.
23. **Confirmations only for destructive actions** — cancel, deactivate,
    remove, complete. Constructive actions submit directly.
24. **Table power on v9** — sorting, pagination, `Ctrl+K` palette,
    autofocus, `/` search, mobile scroll containers.
25. **Dev-server rule** — verify against the user's own `:3000`; never
    boot a competing server, never kill processes. (Adopted after two
    violations, on user complaint.)

---

## 2026-09-18 — Tables, data, shell fixes, settings, profile

26. **tablecn UX rebuilt on v9, not adopted** — tablecn pins TanStack v8
    + radix + nuqs; we run v9 + Base UI. Full swap was rejected as an
    order-of-magnitude more churn; toolbar, facets, and look ported
    instead.
27. **Single master DataTable** — one generic component (toolbar, search,
    facets, pagination, selection, export) replaces nine hand-rolled
    tables (~−460/+310 lines).
28. **Row selection + export action bar** — select column on all tables;
    CSV export skips display-only and action columns.
29. **Rich demo dataset** — 8 patients, 11 visits across 3 days;
    idempotent re-runs.
30. **Dedupe + unique constraints** — repeated seeding had triplicated
    doctors, medicines, categories, billing items and queue configs.
    Remapped live references, deleted dupes, added unique indexes;
    proven with back-to-back seed runs.
31. **Badge anchored to bell** — absolute badge needs a relative trigger.
32. **Structural skeletons on every segment** — shared blocks matching
    page shapes; navigation feedback, while mutations keep button states
    + toasts.
33. **Selected dropdown labels via `items` maps** — Base UI resolves the
    closed-trigger text from mounted popup items and falls back to the
    raw id; every id/enum select now passes a static value→label map.
34. **Shared FormSelect** — one component owns options and labels so the
    id-display bug class is fixed for all current and future dropdowns.
35. **Settings rebuilt as grouped controls** — typed section cards
    (no-show rules, auto-fee switch, per-event notification switches)
    replacing the raw JSON table; old table/dialog deleted.
36. **Profile at top-level `/profile`** — account card, current-verified
    password change with **forced re-login**, linked from the user menu.
37. **Password visibility toggles** — shared `PasswordInput` in login,
    doctor, and profile forms.
38. **Profile renders inside the shell** — the top-level route initially
    shipped without a sidebar; given a role-aware layout.
39. **shadcn CLI overwrites theme files** — reviewed and reverted or
    accepted per case, never blindly committed.
40. **Theme files are user-owned** — agent does not touch `globals.css`,
    layout fonts, or `components.json` theme without explicit say-so.

## 2026-09-19 — Mobile tables, detail sheets, dialog margins

41. **Mobile tables become card lists + detail sheets** — under `md`,
    every table renders cards (title + summary + chevron); tapping opens
    a dialog with the full record (label/value data + action buttons).
    Desktop tables byte-identical. Screenshots from the user beat the
    expandable-row experiment, which was built, then removed (net −112).
42. **Sheets must carry ALL row data** — first pass omitted phone, blood
    group, address, emergency contact, registration no., dosage note.
    Caught by reading `db/schema.ts` field-by-field against each panel.
43. **Desktop chevron removed** — expansion added controls without
    removing any; mobile is cards now, so the toggle had no job left.
    `rowExpandingFeature` and the factory deleted, not left dead.
44. **Radius 0 applies to agent markup too** — cards shipped with
    `rounded-md` against the theme; fixed. Primitive's `rounded-4xl`
    flagged to the user (their theme territory, not touched).
45. **FormDialog owns mobile margins** — wide forms (Edit doctor) went
    edge-to-edge because bare `max-w-*` beat the primitive's
    `calc(100%-2rem)`. Sizes now cap at full-minus-2rem on mobile;
    one shell fixes every form. Bottom-sheet detour on the detail
    sheet reverted — user said the centered card was already right.
46. **agent-browser verifies UI work** — three compile-only rounds on
    mobile tables missed what screenshots caught instantly. Login,
    book, tap-through, nested dialogs, and cleanup now run against
    the user's `:3000` before commit.

## 2026-09-20 — Phase A launch blockers (audit remediation)

47. **Seed refuses production** — demo users/visits gated behind
    non-prod or `SEED_DEMO=1`; real `db/migrate.ts` runner replaces
    the no-op `drizzle-kit migrate` script; unused `date-fns`,
    `takumi-pdf`, `@takumi-rs/helpers` removed, `shadcn` to devDeps.
48. **Sessions expire, logins disable** — 8h JWT maxAge, `users.status`,
    role/status rechecked in the jwt callback (5-min throttle), enforced
    in `requireRole` + middleware; deactivating a doctor locks their
    login too.
49. **Login rate-limited** — 5 attempts/min per email+IP, failing exactly
    like bad credentials; in-memory (single-instance), Redis before
    multi-instance.
50. **Headers + healthz** — HSTS/nosniff/DENY/referrer/permissions via
    `next.config.ts`; `/api/healthz` checks DB reachability.
51. **Races closed** — `callNextToken` selects `FOR UPDATE SKIP LOCKED`
    + conditional flip inside one tx; cancel uses conditional update;
    `assignToken` centralized in `lib/tokens.ts` so rescheduling gets
    the same cap; `23505` checked before `instanceof Error`.
52. **Notifications scoped by audience** — reception sees bookings/turns/
    recalls, doctors their queue/Rx/recalls, admins all; mark-read
    respects the same scope; unread count via SQL `count()`.

## 2026-09-20 — Phase B UI standard gaps (audit remediation)

53. **Payment/prescription badges** — shared `PaymentBadge` /
    `PrescriptionBadge` in `components/billing/` per the AGENTS.md
    color logic; replaced raw text in invoice, history, builder, and
    patient-visit report. Print views stay plain text (paper).
54. **Doctor queue reuses QueueTable** — `variant="doctor"` (Consult
    menu, phone-first mobile cards, no billing dialogs); empty
    RowActions/ExpandedActions render nothing; patient-visit report
    stays a narrative list by design (not tabular data).
55. **Custom report on DataTable** — new `ReportResultsTable` client
    wrapper: search, status facet, pagination, mobile cards + sheets.
56. **Booking picker is a cmdk combobox** — arrow/Enter/Esc from the
    primitive, no-results state with register link, blur-timer hack
    deleted. No new Popover dep.
57. **Radius truth resolved** — AGENTS.md now matches the shipped
    rounded preset instead of contradicting it; avatar overrides
    removed; `/` search lifted into the shared toolbar; invoice
    dialog uses FormSkeleton; tight grids go single-column on mobile.

## 2026-09-20 — Phase C hardening (audit remediation)

58. **Clinical history can't cascade away** — consultations, prescriptions,
    items, invoices, and logs are now `no action` on delete; identity-owned
    rows (users→doctors, queue configs) keep cascade deliberately.
59. **Instants are timestamptz** — all 12 timestamp columns converted;
    calendar days stay `date`. Verified via migration 0004 on dev.
60. **Hot-path indexes** — FK indexes on status logs, Rx/invoice items,
    notifications (+status/created), patient + department joins;
    pg_trgm GIN for patient search; follow-up composite.
61. **Follow-ups in SQL** — the full-table-scan + JS filter is now a
    3-table join with where/order; same rows verified in browser.
62. **Typed jsonb** — workingHours/vitals/settings carry `$type`
    mirroring the Zod shapes (including undefined-tolerant days).
63. **Bounded pool, pruned search** — Pool max 10 + timeouts; patient
    search returns id/name/phone/status only and nothing on empty query.
64. **No-show cron + global error** — `/api/cron/no-show` every 15 min
    (CRON_SECRET-guarded) with `flagAllNoShows` sweep; lazy per-render
    call stays as fallback; `app/global-error.tsx` last resort.

## Open / Deferred

- Excel export, invoice print polish, §9 bonuses (portal, SMS,
  leaderboards, multi-branch).
- Reschedule click-through and finalized-guard direct tests (code
  reviewed, UI-enforced, not directly exercised).
- Production rebuild after the latest theme work.
