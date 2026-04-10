# Antigravity Prompt: Global Error Handling Pass

**App**: FortuneMarq Agency OS (FMOS)
**Stack**: Next.js 16.1.6 App Router | TypeScript | Supabase
**Scope**: All server components and server actions with missing error handling

---

## Context

After the type safety overhaul, `(supabase as any)` global casts are gone. However several pages still have:
- `Promise.all()` queries with no individual error checks
- `as any` casts on `.count` results and `.data` results
- Remaining table name `as any` casts that slipped through
- `catch (err: any)` patterns that should be `catch (err)`

This prompt fixes all of the above across the remaining files.

---

## Read These Files Before Making Any Changes

1. `app/sales/page.tsx`
2. `app/admin/page.tsx` (lines 1–150)
3. `app/admin/clients/actions.ts`
4. `app/admin/growth/actions.ts`
5. `app/admin/finance/actions.ts`
6. `app/admin/strategy/actions.ts`
7. `types/database.types.ts` — check for `follow_ups`, `outreach_sequences`

---

## Fix 1 — `app/sales/page.tsx`

### 1a — Move `leadsResult.error` check BEFORE data is used

**CRITICAL BUG**: The current code uses `leadsResult.data` on line 37 before checking `leadsResult.error` on line 47. If the query fails, `leadsResult.data` is `null` and this crashes.

```typescript
// CURRENT BROKEN ORDER:
const leads = (leadsResult.data as any[]) || [];  // Line 37 — used before error check
// ...
if (leadsResult.error) { return <ErrorUI /> }     // Line 47 — too late
```

**Fix — check error immediately after Promise.all:**

```typescript
const [leadsResult, marketInsightsResult, userResult, followUpsResult, callsYesterdayResult, priorityQueueResult] = await Promise.all([...]);

// Check critical errors FIRST — before any .data access
if (leadsResult.error) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="text-center">
        <p className="text-red-500">Error loading leads: {leadsResult.error.message}</p>
      </div>
    </div>
  );
}

// Log non-critical errors
if (marketInsightsResult.error) console.error("market_insights fetch failed:", marketInsightsResult.error.message);
if (followUpsResult.error) console.error("follow_ups fetch failed:", followUpsResult.error.message);
if (callsYesterdayResult.error) console.error("lead_outcomes fetch failed:", callsYesterdayResult.error.message);
if (priorityQueueResult.error) console.error("outreach_sequences fetch failed:", priorityQueueResult.error.message);

// Now safe to access .data
const leads = leadsResult.data ?? [];
```

Remove the duplicate `if (leadsResult.error)` block that currently appears after the data usage.

### 1b — Remove remaining `as any` casts

```typescript
// Before:
const leads = (leadsResult.data as any[]) || [];

// After:
const leads = leadsResult.data ?? [];
```

```typescript
// Before:
const followUpCount = (followUpsResult as any).count || 0;
const callsYesterday = (callsYesterdayResult as any).count || 0;

// After — count queries return it directly on the result object:
const followUpCount = followUpsResult.count ?? 0;
const callsYesterday = callsYesterdayResult.count ?? 0;
```

```typescript
// Before:
const priorityQueue = (priorityQueueResult as any).data ?? [];

// After:
const priorityQueue = priorityQueueResult.data ?? [];
```

### 1c — Remove table name `as any` casts

Check if `follow_ups` and `outreach_sequences` are now in `database.types.ts`:
```bash
grep -E "(follow_ups|outreach_sequences):" types/database.types.ts
```

If they exist, remove the casts:
```typescript
// Before:
supabase.from("follow_ups" as any).select("id", { count: 'exact', head: true })
supabase.from("outreach_sequences" as any).select(...)

// After:
supabase.from("follow_ups").select("id", { count: 'exact', head: true })
supabase.from("outreach_sequences").select(...)
```

---

## Fix 2 — All Server Action Files: Fix `catch (err: any)`

**Pattern to find and fix in ALL action files:**

```bash
grep -rn "catch (err: any)" app/ --include="*.ts" --include="*.tsx"
```

For every match, replace with:

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

**Files confirmed to have this pattern — fix all of them:**
- `app/admin/clients/actions.ts`
- `app/admin/clients/client-actions.ts`
- `app/admin/finance/actions.ts`
- `app/admin/strategy/actions.ts`
- `app/admin/growth/actions.ts`
- `components/strategist/close-deal-modal.tsx`
- Any other file returned by the grep command above

---

## Fix 3 — Verify `app/admin/page.tsx` Error Handling

**File**: `app/admin/page.tsx`

The admin page already had error handling added in the previous audit pass. Verify it still looks correct by reading the current file. Confirm:
1. All 5 `Promise.all` queries have individual `if (result.error) console.error(...)` checks
2. All `.data` accesses use `?? []` not `|| []`
3. No `(supabase as any)` global casts remain

If any of the above are missing, add them.

---

## Fix 4 — Find and Fix Remaining `as any` Casts Globally

Run this grep to find any remaining `as any` patterns that shouldn't be there:

```bash
grep -rn "as any" app/ components/ actions/ lib/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v ".next"
```

For each result, evaluate:

- **`(supabase as any)`** — should be 0. If any remain, remove them.
- **`"tableName" as any`** — keep only if the table genuinely isn't in `database.types.ts`. For each instance, verify with `grep "tableName:" types/database.types.ts`. Remove the cast if the table exists in types.
- **`data as any[]`** — remove if the data is now typed via the generated types.
- **`result as any`** — remove if result type is now known.
- **`catch (err: any)`** — fix using the pattern in Fix 2.
- **`{ ...fields } as any`** — on insert/update objects — remove. Let TypeScript validate the shape.
- **`profile as any`**, **`task as any`**, **`lead as any`** — remove if the variable has a proper type. If the variable is typed as `any` due to a query result, the real fix is ensuring the query result is properly typed.

**Do not remove** casts that are genuinely needed as a last resort (e.g., Supabase joined relation results that can't be typed automatically). Instead note them in your report.

---

## Fix 5 — Verify All API Route Files Are Clean

Run:
```bash
grep -rn "(supabase as any)" app/api/ --include="*.ts"
```

If any remain, remove them using the same pattern. API routes are server-side and must use `createServerClientWithCookies()` or the service role client — never the public anon client without cookies.

---

## Fix 6 — Final Build Verification

After all fixes, run both:

```bash
npx tsc --noEmit
npm run build
```

Both must exit with 0 errors. If type errors appear, fix them before reporting done.

Also run the final `as any` check:
```bash
grep -r "supabase as any" app/ components/ actions/ --include="*.ts" --include="*.tsx"
```

Expected: 0 matches.

---

## Summary of Files to Touch

| File | Action |
|---|---|
| `app/sales/page.tsx` | Move error check before data access, remove `as any` casts, remove table name casts |
| `app/admin/clients/actions.ts` | Fix `catch (err: any)` |
| `app/admin/clients/client-actions.ts` | Fix `catch (err: any)` |
| `app/admin/finance/actions.ts` | Fix `catch (err: any)` |
| `app/admin/strategy/actions.ts` | Fix `catch (err: any)` |
| `app/admin/growth/actions.ts` | Fix `catch (err: any)` |
| `components/strategist/close-deal-modal.tsx` | Fix `catch (err: any)` |
| Any file returned by grep | Fix remaining `as any` patterns |

---

## Rules

1. Read each file before editing
2. The `leadsResult.error` order fix in `app/sales/page.tsx` is CRITICAL — do it first
3. Only remove `as any` casts where the type is now genuinely known — do not remove casts that would cause type errors
4. Do not change any UI, query logic, or business logic — this is error handling and type cleanup only
5. Do not run git commit
6. Report: list every file changed, every `as any` pattern remaining (with reason it was kept), and the final `tsc` exit code
