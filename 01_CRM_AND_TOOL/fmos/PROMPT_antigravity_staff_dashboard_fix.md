# Antigravity Prompt: Staff Dashboard — Production Mode + Type Fixes

**App**: FortuneMarq Agency OS (FMOS)
**Stack**: Next.js 16.1.6 App Router | TypeScript | Tailwind CSS v4 | Supabase
**Scope**: `app/staff/page.tsx`, `components/staff/staff-dashboard.tsx`, `components/staff/task-execution-modal.tsx`
**Spec**: `documentation/STAFF.md` — read this first

---

## Read These Files Before Making Any Changes

1. `documentation/STAFF.md` — the full feature spec
2. `app/staff/page.tsx`
3. `components/staff/staff-dashboard.tsx` — read the full file
4. `components/staff/task-execution-modal.tsx` — read the full file

---

## Fix 1 — Enable Production Mode: Filter Tasks by Assigned User

**File**: `app/staff/page.tsx`

Currently the task filter returns all tasks (dev mode leftover):

```typescript
// Line ~53 — BROKEN: shows everything to everyone
const staffTasks = tasks?.filter((task: any) => {
  // Show all tasks for development - in production, filter by user
  return true;
}) || [];
```

**Replace with:**

```typescript
const staffTasks = user
  ? (tasks?.filter(task => task.assigned_to === user.id) ?? [])
  : [];
```

This filters tasks to only those where `assigned_to` matches the logged-in user's UUID. RLS policies should enforce this at the DB level too, but this is the application-layer guard.

**Also add a redirect if not authenticated:**

After `const { data: { user } } = await supabase.auth.getUser();`, add:

```typescript
if (!user) {
  redirect("/login");
}
```

Import `redirect` from `next/navigation`.

---

## Fix 2 — Remove `as any` Casts

**File**: `app/staff/page.tsx`

### 2a — Profile name cast (lines ~19–20)
```typescript
// Before:
if ((profile as any)?.full_name) {
  staffName = (profile as any).full_name;

// After:
if (profile?.full_name) {
  staffName = profile.full_name;
```

### 2b — Tasks prop cast (line ~67)
```typescript
// Before:
<StaffDashboard tasks={staffTasks as any[]} staffName={staffName} />

// After:
<StaffDashboard tasks={staffTasks} staffName={staffName} />
```

TypeScript will validate these against the component prop types. Fix any type mismatches that arise.

---

## Fix 3 — Verify Task Execution Modal Saves to DB

**File**: `components/staff/task-execution-modal.tsx`

Read the full file. Per `documentation/STAFF.md`, when a staff member executes a task:

1. They can change status: `not_started` → `in_progress` → `in_review` → `completed`
2. They can add submission notes before marking complete
3. Status changes must be saved to the `tasks` table in Supabase

Verify the status update on save is wired to Supabase. If it uses local state only, fix it.

**If missing, the update call should be:**
```typescript
const { error } = await supabase
  .from("tasks")
  .update({
    status: newStatus,
    submission_notes: submissionNotes || null,
    ...(newStatus === "completed" ? { completed_at: new Date().toISOString() } : {}),
  })
  .eq("id", task.id);

if (error) {
  console.error("Task update failed:", error.message);
  alert("Failed to save. Please try again.");
  return;
}

// Refresh parent
router.refresh();
onClose();
```

---

## Fix 4 — Verify Task Sorting in `StaffDashboard`

**File**: `components/staff/staff-dashboard.tsx`

Per `documentation/STAFF.md`, sorting must be:
1. **Overdue** tasks first (due_date < today, status !== completed)
2. **High Priority** tasks second
3. **Due Today** tasks third
4. Everything else

Check the `useMemo` or sort logic in the component. If it doesn't follow this order, update it:

```typescript
const sortedTasks = useMemo(() => {
  const today = new Date().toISOString().split("T")[0];
  return [...tasks].sort((a, b) => {
    const aOverdue = a.due_date && a.due_date < today && a.status !== "completed";
    const bOverdue = b.due_date && b.due_date < today && b.status !== "completed";
    const aDueToday = a.due_date === today;
    const bDueToday = b.due_date === today;
    const aHigh = a.priority === "high";
    const bHigh = b.priority === "high";

    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    if (aHigh && !bHigh) return -1;
    if (!aHigh && bHigh) return 1;
    if (aDueToday && !bDueToday) return -1;
    if (!aDueToday && bDueToday) return 1;
    return 0;
  });
}, [tasks]);
```

---

## Fix 5 — Verify Personal Metrics (Top Row)

**File**: `components/staff/staff-dashboard.tsx`

Per `documentation/STAFF.md`, the top row must show 4 KPI cards:

| Card | Logic |
|---|---|
| My Load | Total tasks where `status !== 'completed'` |
| Due Today | Count where `due_date === today` |
| High Priority | Count where `priority === 'high'` and status !== 'completed' |
| Today's Rate | `completedToday / dueToday * 100` — percentage of today's tasks completed |

Verify these are calculated from the `tasks` prop. If any are hardcoded or missing, implement them using the task list.

**Today's Rate** logic:
```typescript
const today = new Date().toISOString().split("T")[0];
const dueToday = tasks.filter(t => t.due_date === today);
const completedToday = dueToday.filter(t => t.status === "completed");
const todaysRate = dueToday.length > 0
  ? Math.round((completedToday.length / dueToday.length) * 100)
  : 0;
```

---

## Fix 6 — Task Card Border Colors

**File**: `components/staff/staff-dashboard.tsx`

Per `documentation/STAFF.md`, task cards must have border colors:
- **Red** (`border-red-500`) — Overdue
- **Amber** (`border-amber-400`) — Due Today
- **Indigo** (`border-indigo-300`) — Normal

Verify the card rendering applies these. If not:

```typescript
const today = new Date().toISOString().split("T")[0];
const isOverdue = task.due_date && task.due_date < today && task.status !== "completed";
const isDueToday = task.due_date === today;

const borderClass = isOverdue
  ? "border-red-500"
  : isDueToday
  ? "border-amber-400"
  : "border-indigo-300";
```

---

## Fix 7 — Section Tags for Strategy Tasks (No Project)

**File**: `components/staff/staff-dashboard.tsx`

Per `documentation/STAFF.md`, tasks without a `project_id` (strategy prep tasks) should show their `section_tag` as the context label instead of a client/project name.

Verify the card renders this correctly. If not:

```tsx
{task.project_id
  ? (task.projects?.clients?.business_name ?? task.projects?.service_type ?? "Project")
  : (task.section_tag ?? "General")}
```

---

## Summary of Files to Touch

| File | Action |
|---|---|
| `app/staff/page.tsx` | Enable user filtering, add redirect on unauth, remove `as any` casts |
| `components/staff/staff-dashboard.tsx` | Verify/fix sort order, KPI metrics, card borders, section tags |
| `components/staff/task-execution-modal.tsx` | Verify/fix DB save on status update |

---

## Rules

1. Read every file fully before making changes
2. Read `documentation/STAFF.md` — match the spec exactly
3. Only add what is genuinely missing — do not rewrite working sections
4. The `return true` filter removal is CRITICAL — do this first
5. All Supabase calls must handle errors and call `router.refresh()` on success
6. Do not run git commit
7. Run `npx tsc --noEmit` at the end and report exit code
