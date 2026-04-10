# Antigravity Prompt: Team Management — Wire Up Missing Features

**App**: FortuneMarq Agency OS (FMOS)
**Stack**: Next.js 16.1.6 App Router | TypeScript | Tailwind CSS v4 | Supabase
**Scope**: `app/admin/team/` and `components/team/`

---

## Problem

The Team Management section (`/admin/team`) has several UI elements that exist as buttons/inputs but are completely disconnected — they show in the UI but do nothing. Additionally, the SOP creation flow is broken because the create route is missing.

---

## What Needs to Be Fixed

### Fix 1 — "Set Targets" Button on Team Overview (`/admin/team`)

**File**: `app/admin/team/page.tsx`

The "Set Targets" button (line ~149) is a `<button>` with no `onClick` and no functionality. It should open an inline modal or panel that lets the admin set daily/weekly targets per team member.

**What to build:**

Create a `SetTargetsModal` client component at `components/team/set-targets-modal.tsx`.

**Modal behaviour:**
- Opens as a centered overlay modal
- Shows a table with one row per team member (from `profiles` passed as prop)
- Columns: Member Name | Target Type (dropdown: `calls` / `tasks` / `revenue`) | Daily Target (number input) | Weekly Target (number input)
- Pre-populates from existing `team_targets` rows if they exist for that user
- Save button: upserts all rows into `team_targets` table — one row per member per target type. Upsert key: `(user_id, target_type)`.
- Cancel button: closes modal without saving

**DB schema for `team_targets`** (already exists):
```
id, user_id (uuid), target_type (text), daily_target (int), weekly_target (int), created_at
```

**Server Action**: Create `app/admin/team/actions.ts` with `"use server"` and this action:
```typescript
export async function upsertTeamTargets(targets: Array<{
  user_id: string;
  target_type: string;
  daily_target: number;
  weekly_target: number;
}>) {
  // upsert into team_targets, onConflict: "user_id,target_type"
}
```

**Wiring**: In `app/admin/team/page.tsx`, convert the "Set Targets" button to open the modal. The page is a server component — add a client wrapper div around the targets section, or convert the "Today's Targets" section into a client component that holds modal state.

---

### Fix 2 — "Assign Task" Button on Team Overview (`/admin/team`)

**File**: `app/admin/team/page.tsx`

The "Assign Task" button (line ~79) does nothing. It should open a quick modal to assign a task to a team member.

**What to build:**

Create `components/team/assign-task-modal.tsx` as a client component.

**Modal behaviour:**
- Opens as a centered overlay modal
- Fields:
  - **Assign To**: Dropdown of team members (from `profiles`)
  - **Task Title**: text input (required)
  - **Description**: textarea (optional)
  - **Due Date**: date picker input
  - **Priority**: dropdown (low / medium / high)
- On Save: inserts into `tasks` table with `status = "not_started"`, `assigned_to = selected_user_id`, `section_tag = "Team"`, no `project_id`
- On success: close modal, refresh page (`router.refresh()`)

**Add to `app/admin/team/actions.ts`:**
```typescript
export async function createAssignedTask(task: {
  title: string;
  description?: string;
  assigned_to: string;
  due_date: string;
  priority: string;
}) {
  // insert into tasks table
}
```

**Wiring**: The "Assign Task" button in `app/admin/team/page.tsx` should open this modal. Convert the header button section to a client component.

---

### Fix 3 — SOP Search Not Functional (`/admin/team/sops`)

**File**: `app/admin/team/sops/page.tsx`

The search input (line ~95) is an uncontrolled `<input>` that has no `onChange`, no form submission, and no connection to the URL. It filters nothing.

**What to fix:**

Convert the search input into a form that submits to the same URL with a `search` query param:

```tsx
<form method="GET" action="/admin/team/sops" className="relative flex-1 group">
  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
  <input
    type="text"
    name="search"
    defaultValue={searchQuery ?? ""}
    placeholder="Search templates, scripts, or instructions..."
    className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
  />
</form>
```

Then in the Supabase query, apply the search filter when `searchQuery` is set:

```typescript
let query = supabase.from("sops" as any).select("*").order("updated_at", { ascending: false });

if (selectedCategory) {
  query = query.eq("category", selectedCategory);
}

if (searchQuery) {
  query = query.ilike("title", `%${searchQuery}%`);
}

const { data: sops, error } = await query;
```

---

### Fix 4 — Create SOP Route Missing (`/admin/team/sops/new`)

The SOP list page has a `Link` pointing to `/admin/team/sops/new` (the "+ Create SOP" button). This route does not exist.

**`components/team/sop-editor.tsx` already exists** — it contains the editor component. Use it.

**Create**: `app/admin/team/sops/new/page.tsx`

```tsx
import { createServerClientWithCookies } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import SopEditor from "@/components/team/sop-editor";

export default async function NewSopPage() {
  const supabase = await createServerClientWithCookies();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 lg:p-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-black text-slate-900 mb-8">Create SOP</h1>
        <SopEditor mode="create" />
      </div>
    </div>
  );
}
```

**Check `components/team/sop-editor.tsx`** — if it doesn't already have a save server action, add one to `app/admin/team/actions.ts`:

```typescript
export async function createSop(data: {
  title: string;
  category: string;
  description?: string;
  steps: Array<{ step: number; instruction: string; tools?: string; time_estimate?: string }>;
}) {
  // insert into sops table
  // on success: redirect to /admin/team/sops
}
```

Read `components/team/sop-editor.tsx` fully before writing this action to understand the exact fields it uses.

---

### Fix 5 — `/admin/team/sops/[id]` — Verify Edit Mode Works

**File**: `app/admin/team/sops/[id]/page.tsx`

Read this file. Verify:
1. It fetches the SOP by ID from the `sops` table
2. It passes the SOP data to `SopEditor` or similar component in edit mode
3. There is a save action that updates the row

If any of these are missing or broken, fix them. If it's a stub/empty page, implement it using the same pattern as the new SOP page above but with `mode="edit"` and passing existing data.

---

### Fix 6 — Remove Remaining `as any` Table Name Casts in Team Pages

After the main type regeneration, two table name casts remain:

**`app/admin/team/sops/page.tsx` (~line 26):**
```typescript
// Before:
let query = supabase.from("sops" as any).select("*")
// After:
let query = supabase.from("sops").select("*")
```
(Only valid after verifying `sops` is in `database.types.ts`. If it's not, keep the cast and note it.)

**`app/admin/team/scorecards/page.tsx` (~line 45):**
```typescript
// Before:
supabase.from("call_logs" as any).select("*")
// After:
supabase.from("call_logs").select("*")
```
(Same caveat — only remove if `call_logs` is in `database.types.ts`.)

---

## Files To Create or Edit

| File | Action |
|---|---|
| `app/admin/team/page.tsx` | Wire "Assign Task" + "Set Targets" buttons to open modals |
| `app/admin/team/actions.ts` | CREATE — server actions for upsertTeamTargets, createAssignedTask, createSop |
| `app/admin/team/sops/page.tsx` | Fix search form submission and query filter |
| `app/admin/team/sops/new/page.tsx` | CREATE — new SOP creation page |
| `app/admin/team/sops/[id]/page.tsx` | Verify and fix edit mode |
| `app/admin/team/scorecards/page.tsx` | Remove `as any` table cast |
| `components/team/set-targets-modal.tsx` | CREATE — modal for setting targets |
| `components/team/assign-task-modal.tsx` | CREATE — modal for assigning tasks |

---

## Rules

1. Read every file before editing it
2. Read `components/team/sop-editor.tsx` fully before writing the save action — match its exact field names
3. Do not change any existing UI styling — match the existing design (white cards, rounded-2xl, slate-900 sidebar accent, `#42CA80` green for primary actions)
4. All new server actions go in `app/admin/team/actions.ts` with `"use server"` at the top
5. All new client components need `"use client"` at the top
6. Do not run git commit
7. Run `npx tsc --noEmit` at the end and report exit code
