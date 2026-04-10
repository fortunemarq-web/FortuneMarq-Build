# Antigravity Prompt: Full Codebase Audit — Fixes & Upgrades

**App**: FortuneMarq Agency OS (FMOS)
**Stack**: Next.js 16.1.6 App Router | TypeScript 5.x | Tailwind CSS v4 | Supabase | Framer Motion
**Supabase Project ID**: `cnwooodktqwvpzkucskm`
**Audit Date**: 2026-03-25
**App Version**: v4.1
**Current Build Status**: ✅ Builds clean — but with deep type safety issues

---

## Audit Summary

| Category | Count | Priority |
|---|---|---|
| `(supabase as any)` casts to remove | ~176 across 72 files | CRITICAL |
| Supabase queries with no error handling | ~22 | HIGH |
| Unawaited async inserts | 1 file | MEDIUM |
| `catch (err: any)` patterns | 5+ | MEDIUM |
| Missing `"use client"` on client-only imports | 2 | LOW |
| Missing auth role check | 1 | LOW |
| Missing error check in cron route | 1 | MEDIUM |

**All routes are present. Next.js 16 async params are already correctly implemented. Tailwind v4 is clean. No deprecated APIs.**

---

## STEP 1 — Regenerate `database.types.ts` (MUST DO FIRST)

All other fixes depend on this step. The current types file only covers 11 legacy tables. 30+ tables added via migrations are untyped, causing 176 `(supabase as any)` casts across the codebase.

### Action

Run from the fmos root:

```bash
npx supabase gen types typescript --project-id cnwooodktqwvpzkucskm --schema public > types/database.types.ts
```

If CLI login is required:
```bash
npx supabase login
# then re-run the gen command
```

### Verify the generated file contains ALL of these tables:

- `leads`, `profiles`, `clients`, `deals`
- `projects`, `tasks`, `follow_ups`
- `build_tracker_modules`, `agency_growth_metrics`
- `content_pieces`, `seo_keywords`, `seo_pages`, `gmb_snapshots`
- `onboarding_checklists`, `client_assets`, `client_call_logs`
- `strategy_runs`, `strategy_run_tasks`
- `sops`, `team_targets`, `audit_logs`
- `outreach_sequences`, `pdf_deliveries`, `meetings`, `proposals`
- `client_packages`, `upsell_attempts`, `lead_outcomes`, `activity_events`
- `ai_usage_logs`, `notifications`, `alerts`, `invoices`, `expenses`
- `acquisition_targets`, `market_insights`, `csv_uploads`

If any are missing, apply the missing migration SQL via the Supabase dashboard SQL editor first, then regenerate.

**Key migration files (all use IF NOT EXISTS — safe to re-run):**
1. `supabase/migrations/phase1_build_tracker.sql`
2. `supabase/migrations/phase1_clients_and_metrics.sql`
3. `supabase/migrations/phase2_client_lifecycle.sql`
4. `supabase/migrations/phase3_agency_growth.sql`
5. `supabase/migrations/phase4_strategy_engine.sql`
6. `supabase/migrations/phase5_finance_module.sql`
7. `supabase/migrations/rules_engine.sql`

---

## STEP 2 — Remove All `(supabase as any)` Casts

Once `database.types.ts` is regenerated, remove every `(supabase as any)` cast in the codebase.

### Pattern to fix everywhere

**Before:**
```typescript
const { data, error } = await (supabase as any).from("some_table").select("*")
```

**After:**
```typescript
const { data, error } = await supabase.from("some_table").select("*")
```

Also fix these variants:
```typescript
// Before:
(supabase.from("leads") as any).select(...)
// After:
supabase.from("leads").select(...)

// Before:
const result = await (supabase as any).rpc("increment_package_value", {...})
// After:
const result = await supabase.rpc("increment_package_value", {...})
```

**Only remove the cast. Do not change query logic, filters, selects, or ordering.**

### Files to fix (every occurrence):

| File | Approx. Cast Count |
|---|---|
| `app/admin/page.tsx` | 4 (lines ~52, 61, 69, 76) |
| `app/admin/clients/actions.ts` | 5+ |
| `app/admin/clients/client-actions.ts` | 3+ |
| `app/admin/build-tracker/actions.ts` | 3 (lines ~51, 80, 133) |
| `app/admin/clients/[id]/page.tsx` | all occurrences |
| `app/admin/clients/renewals/actions.ts` | all occurrences |
| `app/admin/growth/actions.ts` | all occurrences |
| `app/admin/growth/gmb/page.tsx` | all occurrences |
| `app/admin/growth/page.tsx` | all occurrences |
| `app/admin/finance/actions.ts` | all occurrences |
| `app/admin/strategy/actions.ts` | all occurrences |
| `app/api/cron/sla/route.ts` | 3 (lines ~24, 37, 57) |
| `app/api/leads/duplicates/scan/route.ts` | 2 (lines ~15, 51) |
| `components/strategist/close-deal-modal.tsx` | 10+ |
| `components/sales/outreach/outreach-actions.ts` | all occurrences |
| Any other file matching `(supabase as any)` | all occurrences |

**Grep command to find all remaining occurrences after fixing:**
```bash
grep -r "(supabase as any)" app/ components/ actions/ --include="*.ts" --include="*.tsx" -l
```
This must return 0 files when done.

---

## STEP 3 — Fix Type Errors After Cast Removal

After removing casts, run:
```bash
npx tsc --noEmit
```

Fix every error. Common patterns and their fixes:

### 3.1 Column not found on type
```typescript
// Error: Property 'health_score' does not exist on type...
// Fix: Verify column name in database.types.ts. If the column exists in the DB
// but not the generated type, re-run the gen types command.
```

### 3.2 Insert type mismatch
```typescript
// Error: Argument of type '{ client_id: string; ... }' is not assignable to...
// Fix: Check the Insert type for that table in database.types.ts.
// Make sure all required (non-nullable, no default) columns are provided.
```

### 3.3 Joined relation type unknown
```typescript
// Error on: .select("*, lead:leads(company_name)")
// Fix:
const items = (data ?? []) as Array<TableRow & { lead: { company_name: string } }>;
```

### 3.4 `catch (err: any)` — fix across all action files
```typescript
// Before:
} catch (err: any) {
  return { error: err.message || "Unknown error" };
}

// After:
} catch (err) {
  const message = err instanceof Error ? err.message : "Unknown error";
  return { error: message };
}
```

**Files to fix this pattern in:**
- `app/admin/clients/client-actions.ts` (~line 42)
- `app/admin/clients/actions.ts` (any catch block)
- `app/admin/finance/actions.ts` (any catch block)
- `app/admin/strategy/actions.ts` (any catch block)
- `components/strategist/close-deal-modal.tsx` (any catch block)

Also fix `} as any` casts used for insert objects:
```typescript
// Before:
await supabase.from("deals").insert({ ... } as any)
// After:
await supabase.from("deals").insert({ ... })
// Let TypeScript validate the shape against the Insert type
```

---

## STEP 4 — Add Error Handling to Supabase Queries

Many data-fetching pages run `Promise.all()` with no individual error checks. Silent failures lead to partial UI with no user feedback.

### Pattern to apply everywhere

**Before (no error check):**
```typescript
const { data } = await supabase.from("clients").select("*");
const clients = data || [];
```

**After (with error check):**
```typescript
const { data, error } = await supabase.from("clients").select("*");
if (error) {
  console.error("Failed to fetch clients:", error.message);
  // For page data fetchers: return empty array and let UI handle it
  // For Server Actions: return { error: error.message }
}
const clients = data ?? [];
```

### Files requiring error handling additions

#### `app/admin/page.tsx` (~lines 44–85)
Wraps multiple queries in `Promise.all()`. Add individual destructuring and error checks:

```typescript
// Before:
const [meetingsResult, proposalsResult, packagesResult] = await Promise.all([
  (supabase as any).from("meetings").select("*"),
  (supabase as any).from("proposals").select("*"),
  (supabase as any).from("client_packages").select("*"),
]);

// After:
const [meetingsResult, proposalsResult, packagesResult] = await Promise.all([
  supabase.from("meetings").select("*"),
  supabase.from("proposals").select("*"),
  supabase.from("client_packages").select("*"),
]);
if (meetingsResult.error) console.error("meetings fetch failed:", meetingsResult.error.message);
if (proposalsResult.error) console.error("proposals fetch failed:", proposalsResult.error.message);
if (packagesResult.error) console.error("client_packages fetch failed:", packagesResult.error.message);

const meetings = meetingsResult.data ?? [];
const proposals = proposalsResult.data ?? [];
const packages = packagesResult.data ?? [];
```

#### `app/sales/page.tsx` (~lines 11–31)
Same pattern — 6 queries in `Promise.all()` with no error checks. Apply the same fix.

#### `app/api/cron/sla/route.ts` (~lines 23–72)
```typescript
// After the initial auth/service client setup, every .from() call needs:
const { data, error } = await supabase.from("leads").select("...");
if (error) {
  return NextResponse.json({ error: error.message }, { status: 500 });
}
```

---

## STEP 5 — Fix Unawaited Inserts in Outreach Actions

**File**: `components/sales/outreach/outreach-actions.ts`

In the `advanceOutreachStage` server action, some `.insert()` calls inside `switch` cases may not be properly awaited. Audit every insert/update in this file:

```typescript
// Ensure every DB operation is awaited:
const { error: insertError } = await supabase.from("pdf_deliveries").insert({...});
if (insertError) throw new Error(`pdf_deliveries insert failed: ${insertError.message}`);

const { error: updateError } = await supabase.from("outreach_sequences").update({...}).eq("id", seqId);
if (updateError) throw new Error(`outreach_sequences update failed: ${updateError.message}`);
```

Go through every `case` in the switch statement and confirm each Supabase call is `await`ed before moving to the next.

---

## STEP 6 — Add Missing `"use client"` Directive

**File**: `components/admin/clients/tabs/FinanceTab.tsx`

This file imports `PDFDownloadLink` from `@react-pdf/renderer`, which is a browser-only library. Add the directive at the top:

```typescript
"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
// ... rest of imports
```

**Check these files too** — if they use any hooks (`useState`, `useEffect`, `useRouter`, event handlers), add `"use client"`:
- `components/admin/clients/tabs/ProjectsTab.tsx`
- `components/admin/dashboard/PriorityList.tsx`
- `components/admin/dashboard/PipelineSnapshot.tsx`

If they are purely presentational (no hooks, no event handlers, no browser APIs), no directive is needed.

---

## STEP 7 — Fix Missing Auth Role Check on Upload Page

**File**: `app/admin/upload/page.tsx` (~line 6)

There is a `// TODO: Add proper authentication/authorization check for Admin role` comment. Implement the check:

```typescript
import { createServerClientWithCookies } from "@/lib/supabase";
import { redirect } from "next/navigation";

export default async function UploadPage() {
  const supabase = await createServerClientWithCookies();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/admin");

  // ... rest of page
}
```

Remove the TODO comment after implementing.

---

## STEP 8 — Verify Build Is Clean

Run both commands. Both must exit with zero errors:

```bash
npx tsc --noEmit
npm run build
```

If type errors remain after Step 3, fix each one before running the build.

After build passes, run the grep command to confirm zero remaining `as any` casts:

```bash
grep -r "supabase as any\|as any)" app/ components/ actions/ --include="*.ts" --include="*.tsx"
```

Expected output: empty (no matches).

---

## Rules

1. **Do not change any query logic** — only remove casts, add awaits, add error checks
2. **Do not change any component JSX or UI** — this is a type safety and error handling cleanup only
3. **Do not restructure files or move code**
4. **Do not run git commit**
5. **Do not touch** `components/sales/` intelligence cockpit UI, `app/lp/`, or `scripts/`
6. **If `supabase gen types` fails**, stop and report the error — do not write types manually
7. **Fix type errors one file at a time** — run `npx tsc --noEmit` between files to isolate errors
8. **Report at the end**: list every file changed and the final `tsc` exit code

---

## Files To Touch (Complete List)

| File | Action |
|---|---|
| `types/database.types.ts` | REPLACE with generated output |
| `app/admin/page.tsx` | Remove `as any`, add error handling |
| `app/admin/clients/actions.ts` | Remove `as any`, fix catch types |
| `app/admin/clients/client-actions.ts` | Remove `as any`, fix catch types |
| `app/admin/clients/[id]/page.tsx` | Remove `as any` |
| `app/admin/clients/renewals/actions.ts` | Remove `as any` |
| `app/admin/build-tracker/actions.ts` | Remove `as any` |
| `app/admin/growth/actions.ts` | Remove `as any` |
| `app/admin/growth/gmb/page.tsx` | Remove `as any` |
| `app/admin/growth/page.tsx` | Remove `as any` |
| `app/admin/finance/actions.ts` | Remove `as any`, fix catch types |
| `app/admin/strategy/actions.ts` | Remove `as any`, fix catch types |
| `app/admin/upload/page.tsx` | Add role auth check, remove TODO |
| `app/api/cron/sla/route.ts` | Remove `as any`, add error handling |
| `app/api/leads/duplicates/scan/route.ts` | Remove `as any` |
| `app/sales/page.tsx` | Add error handling to Promise.all queries |
| `components/strategist/close-deal-modal.tsx` | Remove `as any`, fix catch types |
| `components/sales/outreach/outreach-actions.ts` | Remove `as any`, ensure all inserts are awaited |
| `components/admin/clients/tabs/FinanceTab.tsx` | Add `"use client"` directive |
| Any other file matched by the grep command | Remove `as any` |
