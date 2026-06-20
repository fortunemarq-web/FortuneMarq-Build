# FMOS — Full E2E on a Staging Database

This is the runbook for the automated, "verify-the-row" end-to-end suite. It drives the real UI and then asserts the actual database row changed — on an **isolated staging database**, so it never touches production and never messages a real customer.

## Why staging (and not prod or a "preview")

The bulk of `FMOS_MANUAL_TESTING_GUIDE.md` is *mutation* tests (create invoice, log outcome, book meeting…). Running those automatically means writing real rows and firing real side-effects. A Vercel **preview** deployment does **not** make this safe — it still points at the same production Supabase unless you give it a separate database. So full E2E needs its own DB. The harness enforces this: every DB helper and the seed script **hard-refuse** to run if the Supabase URL is the prod ref `cnwooodktqwvpzkucskm`.

## What's already built (in the repo)

| File | Purpose |
|---|---|
| `playwright.e2e.config.ts` | E2E config; loads `.env.staging`, starts `next dev` wired to staging. |
| `tests/e2e/fixtures/db.ts` | Service-role staging client + assert helpers. Refuses prod. |
| `tests/e2e/fixtures/auth.ts` | `loginAdmin` / `loginTelecaller` + `expectNoCrash`. |
| `tests/e2e/route-health.e2e.ts` | Crawls every admin route, asserts no blank-screen / client-exception. |
| `tests/e2e/invoice.e2e.ts` | Exemplar **verify-the-row** spec (create invoice → assert `invoices` + line items). |
| `scripts/seed-staging.mjs` | Seeds staging: admin+telecaller users, a test client + lead. |
| `.env.staging.example` | Template for staging env (copy → `.env.staging`). |
| npm scripts | `seed:staging`, `test:e2e`, `test:e2e:ui`, `test:e2e:report`. |

`@playwright/test` and Chrome are already installed.

## Choose a staging database

This machine has **no Docker / Supabase CLI**, so a local Supabase isn't available without installing those. The two cloud options:

**Option A — Dedicated staging Supabase project (recommended).**
Most isolated and reproducible. A second project may fit the org's free tier. The schema is applied from `supabase/2026-06-12_full_schema_sync.sql` plus the dated patch files (`supabase/2026-06-17_*.sql`, `supabase/2026-06-19_audit_fix_columns.sql`).

**Option B — Supabase preview branch off prod.**
Ephemeral, billed per active hour, created via the Supabase MCP. It replays `supabase/migrations/*`; because this project has also applied schema via the consolidated SQL, the branch may need the consolidated SQL applied on top to fully match prod.

> Provisioning either one is the one step that needs your go-ahead (it creates a billable cloud resource). Once you pick, the schema + seed can be applied for you via the Supabase tooling.

## One-time setup

1. **Provision** the staging DB (Option A or B) and get its URL + anon key + service-role key.
2. **Apply the schema** to it (the consolidated SQL above) if not already present.
   - ⚠ **Then apply `supabase/2026-06-20_staging_fk_parity.sql`** — the consolidated SQL
     creates tables but NOT prod's foreign keys, and PostgREST needs them to resolve the
     embedded selects on `/admin/proposals` and `/admin/finance/invoices` (otherwise those
     lists error/empty on staging and the proposal/payment specs hang). Prod already has
     these FKs. For a fully faithful replica, prefer regenerating the schema from prod
     (`supabase db dump --schema-only`) over the hand-maintained consolidated SQL.
3. **Configure env:**
   ```bash
   cp .env.staging.example .env.staging
   # edit .env.staging → staging URL + anon + service-role keys (NOT prod)
   ```
4. **Seed test users + data:**
   ```bash
   npm run seed:staging
   ```
5. **Update the staging project's Auth redirect URLs** to include `http://localhost:3000` so the login form works locally.

## Run the suite

```bash
npm run test:e2e          # headless, full suite (route-health + verify-the-row)
npm run test:e2e:ui       # interactive runner — use this to confirm/adjust UI selectors
npm run test:e2e:report   # open the last HTML report
```

The config starts `next dev` against staging automatically. Route-health runs first (fast, read-only); verify-the-row specs run serially (they share seed data).

## Add more verify-the-row tests

Copy `tests/e2e/invoice.e2e.ts`. The pattern is always:

1. `loginAdmin(page)` (or telecaller).
2. Do the real UI action.
3. **Assert the DB** via `db` / `getOne` / `countRows` from `fixtures/db.ts` — the row, the column, the value.
4. Clean up the rows you created (staging only).

Mirror the **Verify (DB)** SQL already written for each action in `FMOS_MANUAL_TESTING_GUIDE.md` — every test there already tells you the exact table/column to assert. Highest-value specs to add next: log-call-outcome (`outreach_logs` + `leads.outreach_stage`), book-meeting (`scheduled_messages` + `leads.meeting_booked_at`), proposal→agreement (`proposals.status` → `agreements.status='pending'`), record-payment (`invoices.paid_amount/status`).

## Notes & guardrails

- **External calls stay inert on staging:** `.env.staging` sets `WHATSAPP_SEND_MODE=test` with an empty token (sends are logged/dropped, never delivered), blank Google Calendar creds (booking skips the real event), and an optional/empty `ANTHROPIC_API_KEY` (AI paths use deterministic fallbacks). Set a real Anthropic key only if you specifically want to test AI summaries/brief/strategy.
- **Selectors:** the route-health spec is robust. The `invoice.e2e.ts` UI selectors are best-effort from the code map; confirm them on the first run with `npm run test:e2e:ui` (the DB-assertion half is already correct).
- **The legacy `playwright.config.ts`** (the old `tests/*.spec.ts` page-loads smoke suite that points at whatever `.env.local` has) is left as-is. Prefer this E2E config for anything that mutates.
