> # ⚠️ HISTORICAL / SUPERSEDED — not the current state
> Dated plan/audit/handoff log, kept for history. **Live build state:** `00_MASTER/FMOS_System_Design_And_Tasks.md` (newest dated entries) + `01_CRM_AND_TOOL/fmos/CONTINUE_HERE.md` (canonical handoff). As of **2026-06-17**: FMOS is **deployed \& live**; Stages 1/3/4 + the AI bot (6.1) + messaging safety/inbox (6.2–6.4) are built; WhatsApp Cloud API live with **33 Meta-approved templates**; the "curiosity" teaser was replaced by the **Direct Report**; team = **Jabeer + Afifa** (delivery via freelancers).

# FMOS — Phase B: Role Views (Admin Dashboard, Telecaller View, Staff View)
**Give this file to Antigravity. Execute after Phase A is complete.**

---

## 1. Who You Are and What You're Working On

You are Antigravity — a senior full-stack developer working on **FMOS** (FortuneMarq Operating System), a custom CRM built for FortuneMarq Media & Marketing, a digital marketing agency in Hubli, Karnataka.

**Stack:**
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Supabase (auth + database), `@supabase/ssr v0.8.0`
- Design: bg-slate-50 backgrounds, bg-white cards, bg-slate-900 sidebar, `#42CA80` green accent

**App location:** `01_CRM_AND_TOOL/fmos/`

**Read these files first before touching any code:**
- `01_CRM_AND_TOOL/fmos/CLAUDE.md` — full app context, all routes, all DB tables
- `01_CRM_AND_TOOL/fmos/UI_UX_GUIDELINES.md` — design rules

---

## 2. The Team Using This App

| Person | Role in App | What They Need |
|---|---|---|
| Jabeer | `admin` | Full access — morning command view |
| Afifa | `telecaller` | Call queue + scripts + outcome logging only |
| Zaid | `staff` | Tasks only — assigned to them |
| Sufiyan | `staff` | Same as Zaid |

Roles are stored in `profiles.role`.

---

## 3. SQL Migrations — Run These FIRST in Supabase SQL Editor

Run these before writing any code. The UI depends on these columns.

```sql
-- Staff task revision tracking
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS revision_notes TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 0;

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'tasks' AND column_name IN ('revision_notes', 'revision_count');
```

---

## 4. Script Data Files — Copy Into Project

The Telecaller view needs the real FortuneMarq scripts. Copy all 6 files from the scripts folder into the app:

**Source:** `03_SALES_SYSTEM/Telecaller_Scripts/FMOS_Script_Data/`

**Files to copy:**
- `script_type_A.json`
- `script_type_B.json`
- `script_type_C.json`
- `script_type_D.json`
- `script.types.ts`
- `index.ts` (rename to `scripts_index.ts` when copying)

**Destination:** `01_CRM_AND_TOOL/fmos/lib/data/scripts/`

Create the `lib/data/scripts/` folder if it doesn't exist. Do not modify the JSON files — copy them as-is.

---

## 5. B1 — Admin Morning Dashboard (`/admin`)

### What It Is
The first screen Jabeer sees every morning. A pure operational view — what needs action today. No decorative widgets.

### File to Edit
`app/admin/page.tsx` (and any client components it renders)

### Layout Structure
- **Full-width page**
- Top row: 5 KPI cards (horizontal, single row)
- Below: two-column layout on desktop, single column on mobile
  - Left column (wider, ~65%): Today's Action List
  - Right column (narrower, ~35%): Pipeline Snapshot + MRR vs Target + Telecaller Activity

---

### 5a. Top Row — 5 KPI Cards

Build these as a `<KPICards>` server component. Data is fetched server-side. Cards are horizontal across the full width.

| Card Label | Query | Display Format |
|---|---|---|
| MRR This Month | `invoices` WHERE revenue_type = 'mrr' AND status = 'paid' AND created_at is in current month | ₹X,XXX |
| Outstanding | `invoices` WHERE status IN ('unpaid', 'overdue') — sum of amount | ₹X,XXX + count badge showing number of invoices |
| Active Clients | `clients` WHERE status = 'active' — count | Number |
| Leads in Pipeline | `leads` WHERE outreach_stage NOT IN ('won','lost','dead') — count | Number |
| Meetings Today | `leads` WHERE outreach_stage = 'meeting_booked' AND follow_up_date = today — count | Number |

**Card design:** bg-white, rounded-xl, border border-slate-200, shadow-sm, p-4. Top border 3px solid with accent color per card. Icon in slate-400, label text-xs text-slate-500, value text-2xl font-bold text-slate-900.

**If the `invoices` table does not have a `revenue_type` column yet:** Show ₹0 for MRR and Outstanding and add a `// TODO: revenue_type column added in Phase E` comment. Do not crash.

---

### 5b. Left Column — Today's Action List

This is the core of the dashboard. Shows everything that needs action today in priority order. Each section below is a separate subsection.

**Section display rule:** If a section has no items, show a small one-line green "All clear ✓" message in that section slot — do NOT hide the section entirely (Jabeer should see that he checked).

**Empty state (all sections clear):** Show a single centered message card: *"Nothing urgent today. Good morning, Jabeer."*

---

#### Section 1: Meetings Today
**Query:** `leads` WHERE outreach_stage = 'meeting_booked' AND follow_up_date = current date

**Each item shows:**
- Business name (bold)
- Niche + City (text-sm text-slate-500)
- Follow-up time if stored (show "—" if no time set)
- Button: "Open Lead" → links to `/admin/leads/[id]`

---

#### Section 2: Follow-ups Due Today
**Query:** `leads` WHERE outreach_stage = 'follow_up_due' AND follow_up_date = current date

**Each item shows:**
- Business name + niche
- Last contact date (from outreach_logs — most recent entry for this lead)
- Button: "Open Lead" → `/admin/leads/[id]`

---

#### Section 3: Overdue Invoices
**Query:** `invoices` WHERE status = 'overdue'

**Each item shows:**
- Client name
- Amount (₹X,XXX)
- Days overdue (calculate from due_date to today)
- If 7+ days overdue: show a red badge labelled "PAUSE ADS"
- Button: "View Invoice" → links to `/admin/finance/invoices`

---

#### Section 4: Proposals Not Replied (48h+)
**Query:** `proposals` WHERE status = 'sent' AND sent_at < (now - 48 hours)

**Each item shows:**
- Business / client name (join with leads table via lead_id)
- Proposal amount (total_monthly or total value)
- Sent date
- Button: "Open Proposal" → `/admin/proposals/[id]` (if route doesn't exist yet, link to `/admin/leads/[lead_id]`)

---

#### Section 5: Tasks Due Today
**Query:** `tasks` WHERE due_date = current date AND status != 'completed'

**Each item shows:**
- Task title
- Assigned to (join profiles.full_name via assigned_to)
- Project / client name if available
- Button: "Open Task" → `/tasks` (staff task page)

---

#### Section 6: Onboarding Pending
**Query:** `clients` WHERE status = 'onboarding'

For each onboarding client, check `client_onboarding_tasks` WHERE client_id = client.id AND status != 'DONE' — count the pending tasks.

**Each item shows:**
- Client name
- "X tasks pending" or "X required assets missing"
- Button: "Open Client" → `/admin/clients/[id]`

**If `client_onboarding_tasks` table doesn't exist yet:** Skip this section with a `// TODO: built in Phase D` comment. Do not crash.

---

### 5c. Right Column — Three Widgets

#### Widget 1: Pipeline Snapshot

**Query:** Count of leads per `outreach_stage` for these stages:
- touch1_pending
- curiosity_sent
- pdf_sent
- follow_up_due
- meeting_booked
- proposal_sent

**Display:** A vertical list. Each row shows the stage label (human-readable) + a count badge. Clicking any row navigates to `/admin/leads` (or `/admin/outreach` if that page exists) filtered to that stage.

**Stage label mapping:**
- touch1_pending → "Touch 1 Pending"
- curiosity_sent → "Curiosity Sent"
- pdf_sent → "PDF Sent"
- follow_up_due → "Follow-up Due"
- meeting_booked → "Meeting Booked"
- proposal_sent → "Proposal Sent"

---

#### Widget 2: MRR vs Target

**Target:** ₹50,000/month (hardcoded for now)

**Display:**
- Label: "MRR vs Target"
- Progress bar showing current MRR / ₹50,000
- Text below: "₹X,XXX / ₹50,000 (XX%)"
- Bar colour: green if >80%, amber if 50–80%, red if <50%

**Current MRR:** Same query as the KPI card — sum of invoices where revenue_type = 'mrr' and status = 'paid' in current month. If revenue_type column doesn't exist yet, show ₹0 with a note.

---

#### Widget 3: Telecaller Activity Today (Admin-only)

Show only when the logged-in user has role = 'admin'.

**Three stats (fetch from outreach_logs WHERE created_at is today):**
- Calls Made Today: count WHERE touch_type = 'follow_up_call'
- Meetings Booked Today: count of leads WHERE outreach_stage changed to 'meeting_booked' today (if an `updated_at` column exists on leads) — if not trackable, count from outreach_logs WHERE touch_type = 'meeting_booked'
- PDFs Sent Today: count WHERE touch_type = 'pdf_sent'

**Display as:** Three small stats in a row inside a bg-white card. Label text-xs text-slate-500, value text-xl font-bold.

---

## 6. B2 — Telecaller View (`/sales` — Rebuild)

### What It Is
Afifa's complete world in FMOS. She does everything from this page: see her call queue, read the script for each lead, log what happened.

### Files to Edit
- `app/sales/page.tsx`
- `components/sales/telecaller-cockpit.tsx` (main component)
- Any sub-components used by the cockpit

---

### 6a. What to KEEP (do not remove)
- The call queue panel (leads assigned to telecaller, sorted by follow_up_date)
- The per-lead action panel (call button, WhatsApp button, outcome logging)
- The follow-up engine / sidebar
- Personal daily stats (calls today, meetings booked, PDFs sent)
- The Script Suggester panel (Smart Pitch Engine) — we are REPLACING its data source, not removing it
- The Objection Handler (uses Claude/Anthropic via `lib/anthropic.ts`) — keep as-is

### 6b. What to REMOVE
- Manager Leaderboard panel — remove entirely (it was already gated in Phase A; now fully remove the component from the telecaller view)
- "Turbo Mode" auto-advance — keep the UI toggle but set auto-advance to permanently disabled. Afifa logs manually. The toggle can visually exist but should not auto-advance leads.
- "Daily Brief" tab in the AI Brain section — remove this tab. Keep "Script Suggester" and "Objection Handler" tabs.
- Any strategist deal-closing features (close rate suggestions, deal size estimators)
- Any pipeline stage management controls — Afifa does not change pipeline stages directly. Only logging outcomes changes stages.

---

### 6c. Smart Pitch Engine — Load Real Scripts

**Current behaviour:** The Smart Pitch Engine generates scripts from an AI/LLM prompt.

**New behaviour:** Replace with pre-built FortuneMarq scripts loaded from JSON files.

**Logic:**
1. When Afifa opens a lead in the cockpit, read `lead.lead_type` (value: "A", "B", "C", or "D")
2. Load the matching script file:
   - lead_type = "A" → `lib/data/scripts/script_type_A.json`
   - lead_type = "B" → `lib/data/scripts/script_type_B.json`
   - lead_type = "C" → `lib/data/scripts/script_type_C.json`
   - lead_type = "D" → `lib/data/scripts/script_type_D.json`
3. Parse the JSON using the types from `lib/data/scripts/script.types.ts`
4. Display the script in sections. Each section is a card with a section heading and the script text.
5. Before displaying, substitute variables in the script text:
   - `{{businessName}}` → `lead.business_name`
   - `{{city}}` → `lead.city`
   - `{{niche}}` → `lead.industry` (or `lead.niche` — check which column name is used in the leads table)
   - `{{searchVolume}}` → `lead.search_volume` if it exists, otherwise leave as `{{searchVolume}}` (Afifa will read from context)

**If `lead.lead_type` is null or empty:**
- Do not show the script
- Instead show a dropdown: "Select lead type to load script: A / B / C / D"
- When Afifa selects a type, save it to `lead.lead_type` via a Supabase update, then load the script
- The script sections should be displayed as readable cards (not a wall of text). Each section = one card with:
  - Section name as heading (e.g., "Introduction", "Opening Hook", "Objection: Not Interested")
  - Section text below

**Variable substitution implementation:**
Create a simple helper function in the cockpit component:
```typescript
function substituteVariables(text: string, lead: Lead): string {
  return text
    .replace(/\{\{businessName\}\}/g, lead.business_name || '{{businessName}}')
    .replace(/\{\{city\}\}/g, lead.city || '{{city}}')
    .replace(/\{\{niche\}\}/g, lead.industry || lead.niche || '{{niche}}')
    .replace(/\{\{searchVolume\}\}/g, lead.search_volume?.toString() || '{{searchVolume}}');
}
```

Apply this function to every string value in the loaded script JSON before rendering.

---

### 6d. Call Outcome Logging

After each call, Afifa logs an outcome. Replace any existing outcome options with EXACTLY these 7 options:

| Outcome Label | Action |
|---|---|
| INTERESTED — Book Now | Open date+time picker → save follow_up_date → change outreach_stage to 'meeting_booked' |
| INTERESTED — Follow Up Later | Date picker → save follow_up_date → stage stays 'follow_up_due' |
| INTERESTED — Send Info | Open PDF modal (see below) → log outreach_logs → stage → 'pdf_sent' |
| NOT INTERESTED | Show reason dropdown: "Too expensive / Using someone else / Not interested in digital / Other" → change stage to 'dead' |
| FOLLOW BACK | Date + time picker → save follow_up_date → stage stays as-is or 'follow_up_due' |
| WRONG NUMBER / DEAD NUMBER | Confirm dialog → change stage to 'dead' |
| NO ANSWER | Increment no_answer_count (if column exists) → do not change stage |

**All outcomes must create a record in `outreach_logs` with:**
- `lead_id`
- `touch_type` (map: call outcomes → 'follow_up_call', meeting booked → 'meeting_booked', pdf sent → 'pdf_sent')
- `outcome` (the outcome label, stored as a string)
- `notes` (optional text field Afifa can fill in)
- `actor_id` (current user's id)
- `created_at`

**PDF Selection Modal (for "INTERESTED — Send Info"):**
When Afifa selects this outcome, show a modal:
1. Heading: "Which PDF are you sending?"
2. Dropdown: list of PDF names filtered by lead's niche + city
   - PDF name format: `[Niche]_[City]_[Type]_[Language]`
   - For now, populate this dropdown from a static array of the 75 known PDF names (list them in a constant in the component — see PDF naming convention above)
   - If the exact match for the lead's niche+city isn't in the list, show "Other" and a text input
3. On confirm:
   - Log to `outreach_logs` with `touch_type = 'pdf_sent'`, `pdf_name = selectedPDF`
   - Update `leads` SET `pdf_sent_at = NOW()`, `pdf_name = selectedPDF` WHERE id = lead.id
   - Change `outreach_stage` to `'pdf_sent'`

---

### 6e. Afifa's Daily Stats Bar

A permanently visible strip at the TOP of the Sales page (above everything else).

**Four stats:**
- Calls Today: count of outreach_logs WHERE actor_id = current_user AND touch_type = 'follow_up_call' AND created_at is today
- PDFs Sent: count WHERE touch_type = 'pdf_sent' AND created_at is today AND actor_id = current_user
- Meetings Booked: count WHERE touch_type = 'meeting_booked' AND created_at is today AND actor_id = current_user
- Follow-ups Logged: count WHERE touch_type = 'follow_up_call' AND outcome IN ('INTERESTED — Follow Up Later', 'FOLLOW BACK') AND created_at is today

**Design:** bg-slate-900 strip, white text, text-sm. Each stat has a label + bold number. Full width of the page. Do not allow this strip to scroll away.

---

## 7. B3 — Staff (Cousin) View (`/tasks`)

### What It Is
When Zaid or Sufiyan logs in, they see ONLY their own tasks. Nothing else in the app is visible.

### File to Edit
`app/tasks/page.tsx` and its child components.

The sidebar already shows only "My Tasks" and "My Profile" for staff role (confirmed in Phase A). This section is about rebuilding the tasks page itself.

---

### 7a. Task Data

**Query:** `tasks` WHERE assigned_to = current_user.id

Join with:
- `clients` (via client_id) to get client name
- `profiles` (via assigned_to) to get assignee name (for display)

Show only tasks where `assigned_to = current_user.id`. Do not show tasks assigned to others even if the staff member can see them in DB.

---

### 7b. Kanban Layout (4 Columns)

| Column | Status Value | Tasks Shown |
|---|---|---|
| To Do | not_started | All not_started tasks for this user |
| In Progress | in_progress | All in_progress tasks |
| Submitted | in_review | All in_review tasks |
| Done | completed | Only completed tasks from the last 7 days |

**Drag and drop:**
- Staff CAN drag: To Do → In Progress only
- Staff CANNOT drag: anything to In Review or Done — those columns do not accept drops
- Dragging To Do → In Progress updates `tasks.status = 'in_progress'` in Supabase

Use `@dnd-kit/core` if it is already installed in the project. If not, check `package.json` first — if a different DnD library is installed, use that. If no DnD library is installed, implement with simple click-to-move buttons instead ("Start Task" button on To Do cards).

---

### 7c. Task Card Design

Each task card (bg-white, rounded-xl, border border-slate-200, shadow-sm, p-4) shows:

1. **Task title** — text-base font-semibold text-slate-900
2. **Client name** — text-sm text-slate-500 (from clients join)
3. **Service type** — small chip (e.g., "WEBSITE BUILD") if the tasks table has a service_type or category column
4. **Status chip** — coloured pill: not_started = slate, in_progress = blue, in_review = amber, completed = green
5. **Due date** — text-sm. If overdue: red text + clock icon
6. **Description / Jabeer's notes** — text-sm text-slate-600, truncated to 2 lines with "Read more" expand
7. **Revision Notes box** — ONLY shown if `revision_notes` is not null/empty. Show as:
   ```
   [Orange bordered box]
   Revision Needed — Jabeer's Notes:
   [revision_notes text]
   ```
   Use: border-l-4 border-orange-400 bg-orange-50 rounded-r-lg p-3 text-sm text-orange-800
8. **"View Brief" button** — only shown if `client_id` is set on the task. Links to `/admin/clients/[client_id]` (or a dedicated brief page if it exists). Opens in a new tab.
9. **"Submit for Review" button** — shown in "In Progress" column only. On click:
   - Confirm dialog: "Submit this task for Jabeer's review?"
   - On confirm: UPDATE tasks SET status = 'in_review' WHERE id = task.id
   - Show a success toast: "Task submitted. Jabeer will review it."
   - Move card to the Submitted column

---

### 7d. Empty State

If a staff member has no tasks at all, show:
```
[Centered, text-slate-500, icon of a checkmark]
"No tasks assigned yet. Check back soon."
```

---

## 8. TypeScript Rules

- Run `npx tsc --noEmit` after all changes. Fix all TypeScript errors before marking Phase B complete.
- Do not use `any` unless the table is genuinely not in database.types.ts. In that case, cast and add a `// TODO: regenerate types` comment.
- All new components should be typed with explicit prop interfaces.

---

## 9. Completion Checklist

Before marking Phase B complete, verify every item:

**SQL:**
- [ ] `revision_notes` and `revision_count` columns added to tasks table

**Script Files:**
- [ ] All 6 script files copied to `lib/data/scripts/`

**B1 — Admin Dashboard:**
- [ ] 5 KPI cards render with correct data
- [ ] Today's Action List: all 6 sections present (with "All clear" when empty)
- [ ] Meetings Today section shows leads with meeting_booked + follow_up_date = today
- [ ] Follow-ups Due Today section shows leads with follow_up_due + follow_up_date = today
- [ ] Overdue Invoices: days overdue calculated + "PAUSE ADS" badge at 7+ days
- [ ] Proposals Not Replied: 48h filter working
- [ ] Tasks Due Today: shows tasks with due_date = today
- [ ] Onboarding Pending: shows clients with status = 'onboarding' (or skips gracefully if table missing)
- [ ] Right column: Pipeline Snapshot with stage counts + links
- [ ] Right column: MRR vs Target progress bar with colour logic
- [ ] Right column: Telecaller Activity (admin-only) — 3 stats

**B2 — Telecaller View:**
- [ ] Manager Leaderboard removed
- [ ] Daily Brief tab removed; Script Suggester + Objection Handler tabs kept
- [ ] Real scripts load from JSON files based on lead_type
- [ ] Variable substitution working (businessName, city, niche, searchVolume)
- [ ] lead_type null state: dropdown for Afifa to select and save
- [ ] All 7 call outcome options present
- [ ] Each outcome creates an outreach_logs record
- [ ] Each outcome updates outreach_stage correctly
- [ ] PDF selection modal opens for "INTERESTED — Send Info"
- [ ] Afifa's daily stats bar at top of page, always visible

**B3 — Staff View:**
- [ ] Tasks page shows only tasks assigned to current logged-in user
- [ ] 4 Kanban columns: To Do, In Progress, Submitted, Done (last 7 days)
- [ ] Drag: To Do → In Progress only (or click-to-move if no DnD library)
- [ ] "Submit for Review" button moves task to in_review
- [ ] Revision notes shown as orange box when present
- [ ] "View Brief" button shows on cards with client_id
- [ ] Empty state shown when no tasks

**General:**
- [ ] `npx tsc --noEmit` returns 0 errors
- [ ] App loads without errors on `/admin`, `/sales`, `/tasks`

**Once all items checked: Phase B is complete. Proceed to Phase C.**
