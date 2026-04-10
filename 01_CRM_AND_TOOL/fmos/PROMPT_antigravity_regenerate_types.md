# Antigravity Prompt: Regenerate database.types.ts + Remove `as any` Casts

## Context

**App**: FortuneMarq Agency OS (FMOS)
**Stack**: Next.js 16 App Router, TypeScript, Supabase, Tailwind CSS v4
**Supabase project ID**: `cnwooodktqwvpzkucskm`
**Types file**: `types/database.types.ts`

## Problem

`types/database.types.ts` only contains 11 legacy tables:
`leads`, `market_insights`, `csv_uploads`, `outreach_sequences`, `pdf_deliveries`, `meetings`, `proposals`, `client_packages`, `upsell_attempts`, `lead_outcomes`, `activity_events`

The app now uses 30+ tables from Phases 1–5 migrations (all SQL files exist in `supabase/migrations/`). To work around missing types, `(supabase as any)` is used throughout the codebase — every Phase 1–5 file has these casts, disabling all type safety.

## What To Do

### Step 1 — Regenerate database.types.ts from Supabase

Run this command from the fmos root:

```bash
npx supabase gen types typescript --project-id cnwooodktqwvpzkucskm --schema public > types/database.types.ts
```

If `supabase` CLI is not installed, install it first:
```bash
npm install supabase --save-dev
```

If the command requires login, the user will need to run `npx supabase login` first and provide their access token.

**After running the command**, verify the new `types/database.types.ts` contains the following tables (non-exhaustive check):
- `build_tracker_modules`
- `agency_growth_metrics`
- `clients`
- `tasks`
- `profiles`
- `follow_ups`
- `projects`
- `alerts`
- `strategy_runs`
- `content_pieces`
- `gmb_snapshots`
- `acquisition_targets`

If any of these are missing, it means the migration hasn't been applied to Supabase yet (see Step 1b).

### Step 1b — If tables are missing from Supabase, apply migrations

For each missing table, run the corresponding migration SQL in the Supabase SQL editor (dashboard.supabase.com → SQL Editor).

Key migration files (in order):
1. `supabase/migrations/phase1_build_tracker.sql` — creates `build_tracker_modules`
2. `supabase/migrations/phase1_clients_and_metrics.sql` — creates `agency_growth_metrics`, enhances `clients`
3. `supabase/migrations/phase2_client_lifecycle.sql` — onboarding, assets, call logs
4. `supabase/migrations/phase3_agency_growth.sql` — content_pieces columns, gmb_snapshots, review_requests, acquisition_targets
5. `supabase/migrations/phase4_strategy_engine.sql` — strategy_runs, strategy_run_tasks
6. `supabase/migrations/phase5_finance_module.sql` — invoices, expenses

All migrations use `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` — they are safe to re-run.

After applying, re-run Step 1.

---

### Step 2 — Remove all `(supabase as any)` casts

Once `database.types.ts` has all tables, remove every `(supabase as any)` cast in the following files and replace with the typed `supabase` client:

**Priority files (all Server Actions and page data fetchers):**

| File | Pattern to Fix |
|---|---|
| `app/admin/actions.ts` | 3 occurrences |
| `app/admin/build-tracker/actions.ts` | 3 occurrences (lines 51, 80, 133) |
| `app/admin/clients/actions.ts` | all occurrences |
| `app/admin/clients/[id]/page.tsx` | all occurrences |
| `app/admin/clients/renewals/actions.ts` | all occurrences |
| `app/admin/growth/actions.ts` | all occurrences |
| `app/admin/growth/gmb/page.tsx` | all occurrences |
| `app/admin/growth/page.tsx` | all occurrences |
| `app/admin/finance/actions.ts` | all occurrences (if exists) |
| `app/admin/page.tsx` | all occurrences (lines 61, 69, 76, 95) |

**For each occurrence:**

Before:
```typescript
const { data } = await (supabase as any).from("some_table").select("*")
```

After:
```typescript
const { data } = await supabase.from("some_table").select("*")
```

Only remove the `as any` cast — do not change the query logic, filters, or ordering.

---

### Step 3 — Fix any type errors that emerge

After removing `as any` casts, run:
```bash
npx tsc --noEmit
```

Fix any errors:

**Common error patterns and fixes:**

1. **Column doesn't exist in type** — add the column to the Select string or check the table name is correct:
   ```typescript
   // Error: Property 'some_col' does not exist
   // Fix: update database.types.ts if column was added via migration but not in generated types
   ```

2. **Insert type mismatch** — check the Insert type in database.types.ts and ensure all required fields are provided

3. **Relation type unknown** — for joined queries like `.select("*, lead:leads(company_name)")`, cast the result:
   ```typescript
   const items = (data ?? []) as Array<YourType & { lead: { company_name: string } }>;
   ```

---

### Step 4 — Verify build is clean

```bash
npx tsc --noEmit
npm run build
```

Both must exit with 0 errors.

---

## Files To Touch

| File | Action |
|---|---|
| `types/database.types.ts` | REPLACE with generated output from Supabase CLI |
| `app/admin/actions.ts` | Remove `as any` casts |
| `app/admin/page.tsx` | Remove `as any` casts |
| `app/admin/build-tracker/actions.ts` | Remove `as any` casts |
| `app/admin/clients/actions.ts` | Remove `as any` casts |
| `app/admin/clients/[id]/page.tsx` | Remove `as any` casts |
| `app/admin/clients/renewals/actions.ts` | Remove `as any` casts |
| `app/admin/growth/actions.ts` | Remove `as any` casts |
| `app/admin/growth/gmb/page.tsx` | Remove `as any` casts |
| `app/admin/finance/actions.ts` | Remove `as any` casts |
| Any other file with `(supabase as any)` | Remove `as any` casts |

---

## Rules

1. **Do not change any query logic** — only remove `(supabase as any)` casts
2. **Do not change any component JSX** — this is a types-only cleanup
3. **Do not run git commit**
4. **Do not create new files** unless a migration file is needed
5. **Do not touch** `components/`, `app/sales/`, `app/lp/`, or `scripts/` — focus only on the admin Server Actions and page data fetchers
6. If `supabase gen types` fails for any reason, stop and report the error — do not try to write types manually
7. Run `npx tsc --noEmit` at the end and report the exit code
