# Antigravity Prompt: PM Dashboard — Audit & Complete

**App**: FortuneMarq Agency OS (FMOS)
**Stack**: Next.js 16.1.6 App Router | TypeScript | Tailwind CSS v4 | Supabase
**Scope**: `app/projects/page.tsx`, `components/projects/pm-dashboard.tsx`, `components/projects/create-project-modal.tsx`
**Spec**: `documentation/PROJECT_MANAGER.md` — read this first

---

## Read These Files Before Making Any Changes

1. `documentation/PROJECT_MANAGER.md` — the full feature spec
2. `app/projects/page.tsx`
3. `components/projects/pm-dashboard.tsx` — read the full file (not just the first 80 lines)
4. `components/projects/create-project-modal.tsx`
5. `types/database.types.ts` — check for `client_resources` table

---

## Fix 1 — Remove Remaining `as any` Casts in `app/projects/page.tsx`

**File**: `app/projects/page.tsx`

### 1a — `client_resources` table name cast (line ~65)

Check if `client_resources` exists in `types/database.types.ts`:
```bash
grep "client_resources:" types/database.types.ts
```

If it exists, remove the cast:
```typescript
// Before:
const { data: clientResources, error: resourcesError } = await supabase
  .from("client_resources" as any)
  .select("*");

// After:
const { data: clientResources, error: resourcesError } = await supabase
  .from("client_resources")
  .select("*");
```

If `client_resources` is NOT in the types, keep `"client_resources" as any` and note it — it means the table may not exist or was not included in the type generation.

### 1b — Remove `as any[]` prop casts (lines ~113–114)

```typescript
// Before:
tasks={(tasks || []) as any[]}
clientResources={(clientResources || []) as any[]}

// After:
tasks={tasks || []}
clientResources={clientResources || []}
```

TypeScript will validate these against the `PMDashboard` component's prop types. Fix any type errors that arise.

### 1c — Add error handling for `clientResources` query

```typescript
if (resourcesError) console.error("client_resources fetch failed:", resourcesError.message);
```

---

## Fix 2 — Add Missing Error Handling to All Page Queries

**File**: `app/projects/page.tsx`

Add error checks for `tasksError` and the deal/client enrichment queries:

```typescript
if (tasksError) console.error("tasks fetch failed:", tasksError.message);
```

The deal enrichment queries (`deals` and `clients`) already use optional chaining but don't log errors. Add:

```typescript
const { data: deals, error: dealsError } = await supabase...
if (dealsError) console.error("deals fetch failed:", dealsError.message);

const { data: clientsFromDeals, error: clientsEnrichError } = await supabase...
if (clientsEnrichError) console.error("clients enrichment fetch failed:", clientsEnrichError.message);
```

---

## Fix 3 — Verify Two View Modes in `PMDashboard`

**File**: `components/projects/pm-dashboard.tsx`

Read the full component. Per `documentation/PROJECT_MANAGER.md`, there must be two view modes toggled via tabs:

**A. Clients View (default):**
- Projects grouped by client
- Each client is an accordion that expands to show:
  - Client Resources (Drive links etc.) — with Add Link / Delete Link functionality
  - List of active projects for that client with status + progress

**B. All Projects View:**
- Flat grid of every active project card
- "Needs Attention" filter shows only projects with overdue tasks

Check if both views are implemented. If Clients View is missing or incomplete:

Add a view toggle at the top of the component:
```tsx
const [viewMode, setViewMode] = useState<"clients" | "all">("clients");
```

For Clients View, group projects by `clients.id`:
```typescript
const projectsByClient = useMemo(() => {
  const map = new Map<string, { client: Client; projects: Project[] }>();
  projects.forEach(project => {
    if (!project.clients) return;
    const clientId = project.clients.id;
    if (!map.has(clientId)) {
      map.set(clientId, { client: project.clients, projects: [] });
    }
    map.get(clientId)!.projects.push(project);
  });
  return Array.from(map.values());
}, [projects]);
```

---

## Fix 4 — Verify Client Resources Add/Delete Functionality

**File**: `components/projects/pm-dashboard.tsx`

Per spec, in Clients View, each client accordion must have:
- **"+ Add Link"** button that opens an inline form (title + URL)
- On save: inserts into `client_resources` table with `client_id`, `title`, `url`, `resource_type = "link"`
- Each resource chip has a **Trash icon** — on click, deletes from `client_resources` by `id`

Check if this is wired to Supabase. If it uses local state only (no DB writes), fix it.

**Add to `app/projects/actions.ts`** (create the file if it doesn't exist):
```typescript
"use server";
import { createServerClientWithCookies } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function addClientResource(clientId: string, title: string, url: string) {
  const supabase = await createServerClientWithCookies();
  const { error } = await supabase
    .from("client_resources")
    .insert({ client_id: clientId, title, url, resource_type: "link" });
  if (error) return { error: error.message };
  revalidatePath("/projects");
  return { success: true };
}

export async function deleteClientResource(id: string) {
  const supabase = await createServerClientWithCookies();
  const { error } = await supabase
    .from("client_resources")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  return { success: true };
}
```

---

## Fix 5 — Verify Team Workload Section

**File**: `components/projects/pm-dashboard.tsx`

Per `documentation/PROJECT_MANAGER.md`, there must be a **Team Workload accordion** at the top showing:
- All team members with active task counts
- Sorted by highest active tasks first
- Each member shows their next deadline

Check if this section exists. If it is missing or non-functional, implement it:

```tsx
// Group tasks by assigned_to, filter status !== 'completed'
const workloadByMember = useMemo(() => {
  const map = new Map<string, { assignedTo: string; activeTasks: Task[]; nextDue: string | null }>();
  tasks.filter(t => t.status !== 'completed' && t.assigned_to).forEach(task => {
    const key = task.assigned_to!;
    if (!map.has(key)) map.set(key, { assignedTo: key, activeTasks: [], nextDue: null });
    map.get(key)!.activeTasks.push(task);
  });
  // Sort by active task count descending
  return Array.from(map.values())
    .map(m => ({
      ...m,
      nextDue: m.activeTasks
        .filter(t => t.due_date)
        .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())[0]?.due_date ?? null,
    }))
    .sort((a, b) => b.activeTasks.length - a.activeTasks.length);
}, [tasks]);
```

Display as a collapsible accordion section above the view toggle.

---

## Fix 6 — Verify "Needs Attention" Filter

**File**: `components/projects/pm-dashboard.tsx`

The `STATUS_FILTERS` array already has `{ key: "needs_attention", label: "Needs Attention" }`. Verify the filter logic correctly identifies projects with overdue tasks (tasks where `due_date < today` and `status !== 'completed'`):

```typescript
const filteredProjects = useMemo(() => {
  if (activeFilter === "needs_attention") {
    const today = new Date().toISOString().split("T")[0];
    return projects.filter(project => {
      const projectTasks = tasks.filter(t => t.project_id === project.id);
      return projectTasks.some(t =>
        t.due_date && t.due_date < today && t.status !== "completed"
      );
    });
  }
  if (activeFilter === "all") return projects;
  return projects.filter(p => p.status === activeFilter);
}, [projects, tasks, activeFilter]);
```

If this logic is missing or incorrect, replace it with the above.

---

## Fix 7 — Search Functionality

**File**: `components/projects/pm-dashboard.tsx`

Per spec, search filters by Client Name or Email. Verify the search input is wired to actual filtering logic:

```typescript
const searchedProjects = useMemo(() => {
  if (!searchQuery.trim()) return filteredProjects;
  const q = searchQuery.toLowerCase();
  return filteredProjects.filter(p =>
    p.clients?.business_name?.toLowerCase().includes(q) ||
    p.clients?.primary_email?.toLowerCase().includes(q) ||
    p.name?.toLowerCase().includes(q)
  );
}, [filteredProjects, searchQuery]);
```

---

## Fix 8 — Remove Orphaned Projects Warning Banner

**File**: `app/projects/page.tsx`

The yellow warning banner (lines ~102–109) reads:
> "These projects were created before a bug fix. Delete them in Supabase and re-close the deals."

This is a development note that should not be visible in production. Remove the entire banner block.

---

## Summary of Files to Touch

| File | Action |
|---|---|
| `app/projects/page.tsx` | Remove `as any` casts, add error handling, remove orphan banner |
| `app/projects/actions.ts` | CREATE — addClientResource, deleteClientResource |
| `components/projects/pm-dashboard.tsx` | Verify/add Clients View, Team Workload, Needs Attention filter, search logic, wire Add/Delete resource to server actions |

---

## Rules

1. Read `components/projects/pm-dashboard.tsx` in full before making any changes
2. Read `documentation/PROJECT_MANAGER.md` — match the spec exactly
3. Only add what is genuinely missing — do not rewrite working code
4. Match existing design patterns (white cards, `rounded-2xl`, `#42CA80` green, slate-900 sidebar)
5. All new server actions in `app/projects/actions.ts` with `"use server"`
6. Do not run git commit
7. Run `npx tsc --noEmit` at the end and report exit code
