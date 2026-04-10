# Antigravity Prompt: Client Portal — Fix & Complete

**App**: FortuneMarq Agency OS (FMOS)
**Stack**: Next.js 16.1.6 App Router | TypeScript | Tailwind CSS v4 | Supabase
**Scope**: `app/client/dashboard/page.tsx`, `app/client/report/[token]/page.tsx`, `app/client-portal/[id]/page.tsx`

---

## Read These Files Before Making Any Changes

1. `app/client/dashboard/page.tsx` — read in full
2. `app/client/report/[token]/page.tsx` — read in full
3. `app/client-portal/[id]/page.tsx` — read in full
4. `types/database.types.ts` — check for `client_deliverables`, `client_reports`, `project_milestones`

---

## Fix 1 — Remove `as any` Table Name Casts

**File**: `app/client/dashboard/page.tsx`

Check which tables exist in `types/database.types.ts`:
```bash
grep -E "(client_deliverables|client_reports|project_milestones):" types/database.types.ts
```

For each table that exists in the types, remove the `as any` cast:

```typescript
// Before:
supabase.from("client_deliverables" as any).select("*")
supabase.from("client_reports" as any).select("*")
supabase.from("project_milestones").select("*")  // already no cast — verify

// After (for each table confirmed in types):
supabase.from("client_deliverables").select("*")
supabase.from("client_reports").select("*")
```

Also remove `as any` casts on update operations:
```typescript
// Before:
.update({ status: action, client_feedback: feedback || null, reviewed_at: ... } as any)

// After:
.update({ status: action, client_feedback: feedback || null, reviewed_at: new Date().toISOString() })
```

If any table is NOT in the types, keep the `as any` cast and note it in your report.

---

## Fix 2 — Fix `catch (err: any)` Pattern

**File**: `app/client/dashboard/page.tsx` (~line 152)

```typescript
// Before:
} catch (err: any) {
  console.error("Error fetching data:", err);
  setError(err.message || "An unexpected error occurred.");
}

// After:
} catch (err) {
  console.error("Error fetching data:", err);
  const message = err instanceof Error ? err.message : "An unexpected error occurred.";
  setError(message);
}
```

---

## Fix 3 — Replace `prompt()` with a Proper Revision Modal

**File**: `app/client/dashboard/page.tsx` (lines ~358–363)

The revision request button uses `prompt()` to collect feedback — this is a browser native dialog, inconsistent with the app's design and blocked in some environments:

```typescript
// BROKEN — using native browser prompt:
onClick={() => {
  const fb = prompt("Feedback for revision:");
  if (fb) handleDeliverableAction(item.id, 'revision_requested', fb);
}}
```

**Replace with an inline feedback state approach:**

Add state to track which item is in revision mode and the feedback text:

```typescript
const [revisionItem, setRevisionItem] = useState<string | null>(null);
const [revisionFeedback, setRevisionFeedback] = useState("");
```

Replace the prompt with a feedback input that appears inline on the card when revision is requested:

```tsx
{item.status === 'pending_review' && (
  <div>
    {revisionItem === item.id ? (
      <div className="mt-3 space-y-2">
        <textarea
          value={revisionFeedback}
          onChange={e => setRevisionFeedback(e.target.value)}
          placeholder="Describe the revision needed..."
          className="w-full p-3 text-sm rounded-xl border border-rose-200 bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
          rows={3}
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (revisionFeedback.trim()) {
                handleDeliverableAction(item.id, 'revision_requested', revisionFeedback);
                setRevisionItem(null);
                setRevisionFeedback("");
              }
            }}
            className="flex-1 py-2 bg-rose-500 text-white rounded-xl text-xs font-black hover:bg-rose-600 transition-all"
          >
            Submit Revision
          </button>
          <button
            onClick={() => { setRevisionItem(null); setRevisionFeedback(""); }}
            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    ) : (
      <div className="flex gap-2">
        <button
          onClick={() => handleDeliverableAction(item.id, 'approved')}
          disabled={processingId === item.id}
          className="p-2 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50"
        >
          <CheckCircle className="h-4 w-4" />
        </button>
        <button
          onClick={() => setRevisionItem(item.id)}
          className="p-2 bg-rose-100 text-rose-600 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
        >
          <AlertCircle className="h-4 w-4" />
        </button>
      </div>
    )}
  </div>
)}
```

---

## Fix 4 — Show All Active Projects, Not Just One

**File**: `app/client/dashboard/page.tsx`

Currently only fetches 1 project with `.limit(1).maybeSingle()`. Clients may have multiple active projects (e.g., SEO + Web Dev running in parallel):

```typescript
// Before:
const { data: projectData, error: projectError } = await supabase
  .from("projects")
  .select("*")
  .eq("client_id", clientData.id)
  .in("status", ["not_started", "in_progress"])
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

// After:
const { data: projectsData, error: projectError } = await supabase
  .from("projects")
  .select("*")
  .eq("client_id", clientData.id)
  .in("status", ["not_started", "in_progress"])
  .order("created_at", { ascending: false });
```

Update state to hold an array: `const [projects, setProjects] = useState<Project[]>([])`.

For the milestones, deliverables, and PM fetches — keep them tied to the **first/primary project** (index 0) for now. Add a project selector tab if there are multiple:

```tsx
{projects.length > 1 && (
  <div className="flex gap-2 mb-6">
    {projects.map((p, i) => (
      <button
        key={p.id}
        onClick={() => setActiveProjectIndex(i)}
        className={clsx(
          "px-4 py-2 rounded-xl text-sm font-bold transition-all",
          activeProjectIndex === i
            ? "bg-slate-900 text-white"
            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
        )}
      >
        {p.service_type?.replace("_", " ") ?? `Project ${i + 1}`}
      </button>
    ))}
  </div>
)}
```

Add `const [activeProjectIndex, setActiveProjectIndex] = useState(0)` and replace all `project` references with `projects[activeProjectIndex]`.

---

## Fix 5 — Replace `alert()` with Inline Error State

**File**: `app/client/dashboard/page.tsx` (~line ~200)

```typescript
// Before:
alert("Failed to update deliverable.");

// After:
setError("Failed to update. Please try again.");
```

The existing `error` state will show it at the top of the page. No alert() calls should remain.

---

## Fix 6 — Verify Client Report Page

**File**: `app/client/report/[token]/page.tsx`

Read the full file. Verify:
1. It fetches the report by `magic_link_token` from `client_reports`
2. It displays the report content (HTML or structured data)
3. No `as any` casts remain after type regeneration

If the page is a stub, implement it:

```typescript
import { createServerClientWithCookies } from "@/lib/supabase-server";
import { notFound } from "next/navigation";

export default async function ClientReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createServerClientWithCookies();

  const { data: report, error } = await supabase
    .from("client_reports")
    .select("*, client:clients(business_name)")
    .eq("magic_link_token", token)
    .eq("is_published", true)
    .single();

  if (error || !report) notFound();

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Performance Report</h1>
        <p className="text-slate-500 mb-8">
          {(report as any).client?.business_name} —{" "}
          {new Date((report as any).report_month).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </p>
        {(report as any).content && (
          <div
            className="prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: (report as any).content }}
          />
        )}
      </div>
    </div>
  );
}
```

---

## Fix 7 — Verify `client-portal/[id]` Page

**File**: `app/client-portal/[id]/page.tsx`

Read the full file. Verify:
1. It's a properly authenticated page (not public)
2. No `as any` casts remain
3. Uses `createServerClientWithCookies()`

If it uses the old `createServerClient()`, fix it.

---

## Summary of Files to Touch

| File | Action |
|---|---|
| `app/client/dashboard/page.tsx` | Remove `as any` casts, fix catch type, replace `prompt()` with inline textarea, show all active projects, replace `alert()` |
| `app/client/report/[token]/page.tsx` | Verify and implement if stub |
| `app/client-portal/[id]/page.tsx` | Verify auth client and `as any` casts |

---

## Rules

1. Read every file fully before making any changes
2. Check `types/database.types.ts` before removing any `as any` table name casts
3. Do not change any UI layout, colors, or design — only fix logic and type issues
4. No `alert()` or `prompt()` calls — use state-based UI instead
5. Do not run git commit
6. Run `npx tsc --noEmit` at the end and report exit code and any remaining errors
