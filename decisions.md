# Decisions Log — OPD Management SaaS

Chronological log of every significant decision, grouped by date in the
order taken. All entries implemented unless marked otherwise.
Attribution: `[user]` = decided by the user (explicit choice, correction, or scope call); `[agent]` = implementation call inside approved direction; `[joint]` = agent-proposed, user-approved (every plan-mode go-ahead).

---

## 2026-09-17 — Grounding, core build, shell, first UX passes

### Planning (plan mode, before any code)
1. **Pooled DB driver over neon-http** — neon-http cannot do interactive
   transactions, which Spec §8 requires for concurrency-safe token
   assignment. [agent]
2. **Auth.js v5 (`next-auth@beta`)** — the scaffold was written in v5 API
   but v4 was installed (broken at runtime). Upgraded the package to match
   the code. [agent]
3. **Client-side PDFs over pdfcn/Takumi** — spec said client-side,
   `AGENTS.md` said server-side Takumi. User chose client-side: print
   views + browser Print-to-PDF, zero server files. [user]
4. **New tables allowed** — `settings` (Section 8 toggles) and
   `notifications` (in-app feed), plus a token uniqueness index. [user]
5. **Report exports: CSV + print-PDF first** — Excel deferred. [joint]
6. **Stacked logical commits** instead of one blob per phase, for
   rollback granularity. [agent]
7. **Conventional commit messages** (`feat/fix/chore/refactor/style`). [agent]
8. **Annotated phase tags** (`phase-0-grounded` …). Rollback via
   `git reset --hard <tag>`. [agent]
9. **Local-only git** — commit locally, never push (no remote configured). [agent]
10. **Vertical-slice phasing** — non-negotiable loop first
    (register → queue → consult → prescribe → history), then billing,
    reporting, automation, shell, UX passes. [joint]
11. **Verify through execution** — tsc + lint + browser smoke per slice;
    committed history stays green.

### Phase 0–1 — Grounding & auth [agent]
12. **Seed repaired** — fixed broken import paths, added `db:seed`
    (plus `tsx`/`dotenv`), seeded masters and four demo logins.

### Phase 2–4 — Masters, front desk, clinical [agent]
13. **TanStack v9 native API** (not the deprecated legacy layer) for all
    tables, after reading the package's own migration guide.

### Phase 5–7 — Billing, reports, automation [agent]
14. **Invoice skeleton auto-created at booking**, with the auto-fee
    toggle honored. [agent]
15. **No-show automation runs lazily** on queue renders (no cron infra);
    idempotent, with audit logs. [agent]
16. **Turn-approaching + follow-up notifications** written on Call Next /
    consult save; surfaced via bell and doctor-queue card.

### Shell & UX (still Sep 17) [agent]
17. **Role sidebar shell with sign-out** instead of per-page headers. [agent]
18. **Topbar pattern** — icon nav, breadcrumbs (later replaced), avatar
    user menu, **notifications bell** with unread badge over the existing
    feed table. [agent]
19. **Strict dropdowns everywhere** — fixed lists instead of free text,
    sourced from `lib/options.ts`. [agent]
20. **dashboard-01 template adopted app-wide** — layout system, theme, and
    component restyle accepted over the custom preset. [joint]
21. **Sigil as the visual reference** — cloned for study (then removed):
    theme toggle (`next-themes`), title header, stat cards + recent-list
    overviews on all three role homes. [joint]
22. **Settings moved into the user menu** (admin-only, above Log out),
    removed from the sidebar to avoid duplication. [agent]
23. **Confirmations only for destructive actions** — cancel, deactivate,
    remove, complete. Constructive actions submit directly. [agent]
24. **Table power on v9** — sorting, pagination, `Ctrl+K` palette,
    autofocus, `/` search, mobile scroll containers. [agent]
25. **Dev-server rule** — verify against the user's own `:3000`; never
    boot a competing server, never kill processes. (Adopted after two
    violations, on user complaint.)

--- [user]

## 2026-09-18 — Tables, data, shell fixes, settings, profile

26. **tablecn UX rebuilt on v9, not adopted** — tablecn pins TanStack v8
    + radix + nuqs; we run v9 + Base UI. Full swap was rejected as an
    order-of-magnitude more churn; toolbar, facets, and look ported
    instead. [agent]
27. **Single master DataTable** — one generic component (toolbar, search,
    facets, pagination, selection, export) replaces nine hand-rolled
    tables (~−460/+310 lines). [joint]
28. **Row selection + export action bar** — select column on all tables;
    CSV export skips display-only and action columns. [agent]
29. **Rich demo dataset** — 8 patients, 11 visits across 3 days;
    idempotent re-runs. [agent]
30. **Dedupe + unique constraints** — repeated seeding had triplicated
    doctors, medicines, categories, billing items and queue configs.
    Remapped live references, deleted dupes, added unique indexes;
    proven with back-to-back seed runs. [agent]
31. **Badge anchored to bell** — absolute badge needs a relative trigger. [agent]
32. **Structural skeletons on every segment** — shared blocks matching
    page shapes; navigation feedback, while mutations keep button states
    + toasts. [agent]
33. **Selected dropdown labels via `items` maps** — Base UI resolves the
    closed-trigger text from mounted popup items and falls back to the
    raw id; every id/enum select now passes a static value→label map. [agent]
34. **Shared FormSelect** — one component owns options and labels so the
    id-display bug class is fixed for all current and future dropdowns. [joint]
35. **Settings rebuilt as grouped controls** — typed section cards
    (no-show rules, auto-fee switch, per-event notification switches)
    replacing the raw JSON table; old table/dialog deleted. [joint]
36. **Profile at top-level `/profile`** — account card, current-verified
    password change with **forced re-login**, linked from the user menu. [joint]
37. **Password visibility toggles** — shared `PasswordInput` in login,
    doctor, and profile forms. [agent]
38. **Profile renders inside the shell** — the top-level route initially
    shipped without a sidebar; given a role-aware layout. [agent]
39. **shadcn CLI overwrites theme files** — reviewed and reverted or
    accepted per case, never blindly committed. [agent]
40. **Theme files are user-owned** — agent does not touch `globals.css`,
    layout fonts, or `components.json` theme without explicit say-so. [user]

## 2026-09-19 — Mobile tables, detail sheets, dialog margins

41. **Mobile tables become card lists + detail sheets** — under `md`,
    every table renders cards (title + summary + chevron); tapping opens
    a dialog with the full record (label/value data + action buttons).
    Desktop tables byte-identical. Screenshots from the user beat the
    expandable-row experiment, which was built, then removed (net −112). [user]
42. **Sheets must carry ALL row data** — first pass omitted phone, blood
    group, address, emergency contact, registration no., dosage note.
    Caught by reading `db/schema.ts` field-by-field against each panel. [joint]
43. **Desktop chevron removed** — expansion added controls without
    removing any; mobile is cards now, so the toggle had no job left.
    `rowExpandingFeature` and the factory deleted, not left dead. [user]
44. **Radius 0 applies to agent markup too** — cards shipped with
    `rounded-md` against the theme; fixed. Primitive's `rounded-4xl`
    flagged to the user (their theme territory, not touched). *Superseded by #57 — the preset's rounded look is intentional; see AGENTS.md.* [agent]
45. **FormDialog owns mobile margins** — wide forms (Edit doctor) went
    edge-to-edge because bare `max-w-*` beat the primitive's
    `calc(100%-2rem)`. Sizes now cap at full-minus-2rem on mobile;
    one shell fixes every form. Bottom-sheet detour on the detail
    sheet reverted — user said the centered card was already right. [user]
46. **agent-browser verifies UI work** — three compile-only rounds on
    mobile tables missed what screenshots caught instantly. Login,
    book, tap-through, nested dialogs, and cleanup now run against
    the user's `:3000` before commit. [agent]

## 2026-09-20 — Phase A launch blockers (audit remediation)

47. **Seed refuses production** — demo users/visits gated behind
    non-prod or `SEED_DEMO=1`; real `db/migrate.ts` runner replaces
    the no-op `drizzle-kit migrate` script; unused `date-fns`,
    `takumi-pdf`, `@takumi-rs/helpers` removed, `shadcn` to devDeps. [joint]
48. **Sessions expire, logins disable** — 8h JWT maxAge, `users.status`,
    role/status rechecked in the jwt callback (5-min throttle), enforced
    in `requireRole` + middleware; deactivating a doctor locks their
    login too. [joint]
49. **Login rate-limited** — 5 attempts/min per email+IP, failing exactly
    like bad credentials; in-memory (single-instance), Redis before
    multi-instance. [joint]
50. **Headers + healthz** — HSTS/nosniff/DENY/referrer/permissions via
    `next.config.ts`; `/api/healthz` checks DB reachability. [joint]
51. **Races closed** — `callNextToken` selects `FOR UPDATE SKIP LOCKED`
    + conditional flip inside one tx; cancel uses conditional update;
    `assignToken` centralized in `lib/tokens.ts` so rescheduling gets
    the same cap; `23505` checked before `instanceof Error`. [joint]
52. **Notifications scoped by audience** — reception sees bookings/turns/
    recalls, doctors their queue/Rx/recalls, admins all; mark-read
    respects the same scope; unread count via SQL `count()`. [joint]

## 2026-09-20 — Phase B UI standard gaps (audit remediation)

53. **Payment/prescription badges** — shared `PaymentBadge` /
    `PrescriptionBadge` in `components/billing/` per the AGENTS.md
    color logic; replaced raw text in invoice, history, builder, and
    patient-visit report. Print views stay plain text (paper). [joint]
54. **Doctor queue reuses QueueTable** — `variant="doctor"` (Consult
    menu, phone-first mobile cards, no billing dialogs); empty
    RowActions/ExpandedActions render nothing; patient-visit report
    stays a narrative list by design (not tabular data). [joint]
55. **Custom report on DataTable** — new `ReportResultsTable` client
    wrapper: search, status facet, pagination, mobile cards + sheets. [joint]
56. **Booking picker is a cmdk combobox** — arrow/Enter/Esc from the
    primitive, no-results state with register link, blur-timer hack
    deleted. No new Popover dep. [joint]
57. **Radius truth resolved** — AGENTS.md now matches the shipped
    rounded preset instead of contradicting it; avatar overrides
    removed; `/` search lifted into the shared toolbar; invoice
    dialog uses FormSkeleton; tight grids go single-column on mobile. [joint]

## 2026-09-20 — Phase C hardening (audit remediation)

58. **Clinical history can't cascade away** — consultations, prescriptions,
    items, invoices, and logs are now `no action` on delete; identity-owned
    rows (users→doctors, queue configs) keep cascade deliberately. [joint]
59. **Instants are timestamptz** — all 12 timestamp columns converted;
    calendar days stay `date`. Verified via migration 0004 on dev. [joint]
60. **Hot-path indexes** — FK indexes on status logs, Rx/invoice items,
    notifications (+status/created), patient + department joins;
    pg_trgm GIN for patient search; follow-up composite. [joint]
61. **Follow-ups in SQL** — the full-table-scan + JS filter is now a
    3-table join with where/order; same rows verified in browser. [joint]
62. **Typed jsonb** — workingHours/vitals/settings carry `$type`
    mirroring the Zod shapes (including undefined-tolerant days). [joint]
63. **Bounded pool, pruned search** — Pool max 10 + timeouts; patient
    search returns id/name/phone/status only and nothing on empty query. [joint]
64. **No-show cron removed — lazy render is the mechanism** — the
    `*/15` Vercel cron broke the free-tier deploy check (1 cron/day
    allowed), and per-render flagging on both queue boards already
    covers the working day. `vercel.json`, the cron route, and
    `flagAllNoShows` deleted; revisit only if flags arrive late in
    practice. `app/global-error.tsx` last resort. [joint]

## 2026-09-20 — Phase D Playwright suite (audit remediation)

65. **E2E runs against the user's dev server** — no webServer in config
    (never boot a second Next on :3000); seeded DB required; specs that
    write cancel their own bookings so dev stays pristine. [joint]
66. **Role storage states per login** — one setup project saves
    admin/receptionist/doctor sessions; specs load them directly. [joint]
67. **Race spec proves the lock** — two contexts book the same
    doctor+day in one tick; asserts distinct tokens or retry message. [joint]
68. **FormSelect gained `label`** — the booking spec exposed that
    select triggers had no accessible name; now a supported prop.

## 2026-09-21 — Suspense streaming on slow pages

71. **Fast shell paints, slow sections stream** — consultation header
    from a light PK query while form/Rx (bundle join) and history
    stream in sibling boundaries; overview stats from a new
    `COUNT GROUP BY` query with recent/collected streaming behind
    (one cached fetch shared across boundaries); custom-report
    filters paint from masters while results stream. Queues untouched
    (single bounded query each). [joint]

72. **Picker restores input focus on results** — async arrival could
    drop focus so arrows did nothing until re-click; the debounced
    callback refocuses `#book-patient` (by id — a ref stops at the
    CommandInput wrapper). Verified ArrowDown+Enter with no re-click. [user]

## 2026-09-21 — Streaming for remaining pages

73. **Same Suspense pattern everywhere left** — desk home (COUNT stats
    + cached recent), daily/trend/performance/patient-visit reports
    (filters/headers instant, aggregations stream), both queues
    (filter shells instant; no-show flag stays blocking inside the
    boundary), invoice page (header instant, manager streams).
    Masters/patients/book/settings/print excluded (cheap or all-or-
    nothing). One cached fetch shared per page, no duplicate heavy
    queries. [joint] [joint]

## 2026-09-20 — Audit program close-out

69. **All four audit phases shipped** (`phase-34` security, `phase-35`
    UI standards, `phase-36` DB hardening, `phase-37` E2E) — every
    finding either fixed with a browser-verified commit or moved below
    with a reason. E2E covers 3 of the 5 audit targets (role matrix,
    booking smoke, token race); prescription immutability and the
    no-show business rule stay code-reviewed only. [agent]

## 2026-09-21 — Full-coverage seed

74. **Every table paginates** — 12 depts/doctors/configs/categories,
    28 patients, 14 medicines, 11 billing items; ~90 visits over 5 days
    covering all 5 appointment statuses (cancelled was uncovered),
    draft + finalized Rx, paid (Cash/UPI) + pending invoices with
    extras, all 4 notification types. Deterministic generator, no
    random. [joint]
75. **Seed is additive and idempotent** — per-slot
    (doctor,date,token) skip instead of the old all-or-nothing gate;
    second run inserts ~0 rows. Crashed-run forensics: a splice had
    swallowed the status-log block, nesting the slot body inside the
    logs loop (duplicate invoices) — fixed and verified by rerun. [agent]
70. **Single-tenant launch posture** — one pooled DB role, no RLS,
    app-level `requireRole` + 5-min JWT revalidation. Multi-clinic
    needs tenant-id + RLS design before onboarding clinic two. [agent]

## 2026-09-21 — Bugfix batch (audit leftovers)

76. **Menu, picker, select states [fix(a11y)]** — Clear-filter is a
    real `DropdownMenuItem`; report picker rebuilt as the booking
    cmdk combobox; `FormSelect` takes `label` + `invalid` (wired on
    booking + queue-config). [joint]
77. **shadcn conformance [refactor(ui)]** — `PasswordInput` on
    `InputGroup`; `data-icon` on Button/Badge icons (standalone
    brand/card/row icons keep sizing); `SelectGroup`+labels
    (+separator before free-text); `Separator` for invoice totals.
    ToggleGroup rejected for 2-option sets: the installed primitive
    is multi-select, FormSelect has correct single-select semantics. [agent]
78. **Dead code + money math [chore(hygiene)]** — removed `drawer`,
    `toggle-group`, `breadcrumb` primitives and `statusLabels`;
    de-exported file-local table types; invoice recompute + seed
    totals in integer paise. `serial`→identity skipped: sequence
    conversion on populated tables is risk without benefit (ids are
    opaque). [agent]

## 2026-09-21 — Combobox for all entry selects

79. **One `FormCombobox` parent** (`components/ui/form-combobox.tsx`)
    owns the whole contract — filter, pick, Esc, blur-reconcile,
    invalid, accessible name. Nine files swapped 1:1; `FormSelect`
    stays only for toolbar chrome (rows-per-page); URL filter bars
    stay native `Select` (server GET forms). E2E green; dialog
    keyboard pick verified live. [user]

## 2026-09-21 — Username login + availability

80. **Username-or-email login** — `users.username` (unique, NOT NULL,
    migration 0006 backfills from email prefixes with numeric-suffix
    collision handling); `@` decides the lookup column; same
    silent-failure + rate-limit contract. [user]
81. **Social-style availability** — `usernameSchema` (3–30,
    `[a-z0-9._-]`), `checkUsernameAvailability` action, deterministic
    server-side suggestions (repaired base + numbered variants, one
    query); doctor dialog shows live status + clickable chips;
    creation still guarded by the DB unique constraint. [joint]

## Open / Deferred

- Excel export, invoice print polish, §9 bonuses (portal, SMS,
  leaderboards, multi-branch).
- Prescription-immutability and no-show-rule E2E (code reviewed,
  UI-enforced, not directly exercised).
- Sentry/structured logging, `serial`→identity, money-math decimal
  handling, seed `target:` args — low value/churn, post-launch.
- Production rebuild + first deploy (Neon pooler URL, AUTH_SECRET,
  AUTH_URL, no seed).
