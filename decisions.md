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

## Open / Deferred

- Excel export, invoice print polish, §9 bonuses (portal, SMS,
  leaderboards, multi-branch).
- Reschedule click-through and finalized-guard direct tests (code
  reviewed, UI-enforced, not directly exercised).
- Production rebuild after the latest theme work.
