# Antigravity Prompt: Auth Client Standardization + Strategist Bug Fix

**App**: FortuneMarq Agency OS (FMOS)
**Stack**: Next.js 16.1.6 App Router | TypeScript | Supabase | `@supabase/ssr` v0.8.0
**Priority**: HIGH — Auth bug affects session reading across multiple pages

---

## Problem

There are two Supabase server client functions in this codebase:

| Function | File | Use Case |
|---|---|---|
| `createServerClientWithCookies()` | `lib/supabase-server.ts` | **Correct** — reads auth session from cookies. All server components and server actions that need user context must use this. |
| `createServerClient()` | `lib/supabase.ts` | **Legacy / unauthenticated** — does NOT read cookies. For unauthenticated public queries only. |

Many page.tsx files are using `createServerClient()` when they should use `createServerClientWithCookies()`. This means:
- RLS (Row Level Security) policies run as anonymous, not as the logged-in user
- User-scoped data may fail silently or return empty
- Auth checks like `supabase.auth.getUser()` return null even when logged in

**Additionally**: `app/strategist/page.tsx` queries a table called `call_activities` that does not exist in the database. The correct table is `lead_outcomes`.

---

## STEP 1 — Fix `createServerClient` → `createServerClientWithCookies` in Page Files

For each file below, make two changes:
1. Change the import from `"@/lib/supabase"` to `"@/lib/supabase-server"`
2. Change `createServerClient()` to `await createServerClientWithCookies()`

Make the function `async` if it isn't already (required to `await` the client).

**Files to fix:**

### `app/strategist/page.tsx`
```typescript
// Before:
import { createServerClient } from "@/lib/supabase";
// ...
const supabase = createServerClient();

// After:
import { createServerClientWithCookies } from "@/lib/supabase-server";
// ...
const supabase = await createServerClientWithCookies();
```

### `app/strategist/deals/page.tsx`
Same fix as above.

### `app/sales/page.tsx`
Same fix as above.

### `app/admin/financials/page.tsx`
Same fix as above.

### `app/admin/sales/page.tsx`
Same fix as above.

### `app/admin/sales/leads/page.tsx`
Same fix as above.

### `app/admin/sales/strategy-page.tsx`
Same fix as above.

### `app/admin/data-management/page.tsx`
Same fix as above.

### `app/admin/niche-kits/page.tsx`
Same fix as above.

### `app/admin/operations/page.tsx`
Same fix as above.

### `app/admin/alerts/page.tsx`
Same fix as above.

### `app/admin/briefing/page.tsx`
Same fix as above.

### `app/admin/automations/page.tsx`
Same fix as above.

### `app/admin/upload/history/page.tsx`
Same fix as above.

**Do NOT touch API route files** (`app/api/**/*.ts`) — those may intentionally use the service role client. Only fix `page.tsx` files listed above.

---

## STEP 2 — Fix `call_activities` → `lead_outcomes` in Strategist Page

**File**: `app/strategist/page.tsx`

The page fetches from a table called `call_activities` which does not exist. The correct table is `lead_outcomes`.

**Before:**
```typescript
const { data: activities } = await supabase
  .from("call_activities")
  .select("*")
  .order("created_at", { ascending: false })
  .limit(200);
```

**After:**
```typescript
const { data: activities } = await supabase
  .from("lead_outcomes")
  .select("id, lead_id, outcome, notes, created_at")
  .order("created_at", { ascending: false })
  .limit(200);
```

The `callActivities` prop passed to `<StrategistPipeline>` uses the same data shape — `{ id, lead_id, outcome, notes, created_at }` — so no component changes are needed.

Also remove the `as any[]` cast on the prop:

**Before:**
```typescript
callActivities={(activities || []) as any[]}
```

**After:**
```typescript
callActivities={activities || []}
```

---

## STEP 3 — Add Error Handling to Strategist Page Queries

**File**: `app/strategist/page.tsx`

The `closedWonLeads` and `closedLostLeads` queries have no error checks. Add them:

```typescript
const { data: closedWonLeads, error: wonError } = await supabase
  .from("leads")
  .select("*")
  .eq("status", "closed_won")
  .order("created_at", { ascending: false })
  .limit(50);
if (wonError) console.error("closed_won fetch failed:", wonError.message);

const { data: closedLostLeads, error: lostError } = await supabase
  .from("leads")
  .select("*")
  .eq("status", "closed_lost")
  .order("created_at", { ascending: false })
  .limit(50);
if (lostError) console.error("closed_lost fetch failed:", lostError.message);

const { data: activities, error: activitiesError } = await supabase
  .from("lead_outcomes")
  .select("id, lead_id, outcome, notes, created_at")
  .order("created_at", { ascending: false })
  .limit(200);
if (activitiesError) console.error("lead_outcomes fetch failed:", activitiesError.message);
```

---

## STEP 4 — Verify Build

Run:
```bash
npx tsc --noEmit
npm run build
```

Both must exit with 0 errors. Report the output.

---

## Rules

1. **Only change imports and the client instantiation line** in each file — do not touch query logic or UI
2. **Do not touch API routes** — only `page.tsx` files listed above
3. **Do not run git commit**
4. If `createServerClientWithCookies` is already imported in a file, don't add a duplicate import — just fix the instantiation
5. Report which files were changed and the final tsc exit code
