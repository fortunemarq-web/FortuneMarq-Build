# FMOS Phase B — Role Views: Admin Dashboard, Telecaller View, Cousin View
**Execute after Phase A.**
**Reference:** `FORTUNEMARQ_APP_CONTEXT.md` + data files: `script_type_A.json`, `script_type_B.json`, `script_type_C.json`, `script_type_D.json`, `script.types.ts`, `scripts_index.ts`

---

## Goal

Rebuild the three role-based views so each person sees exactly what they need and nothing more. Admin gets a morning command view. Telecaller gets a simplified call-and-act view with scripts loaded. Cousins get a clean task-execution view.

---

## B1 — Admin Morning Dashboard (`/admin`)

### What It Is
The first thing Jabeer sees every morning. A command view that tells him exactly what needs action today. No decorative widgets. Pure operational intelligence.

### Layout
**Full-width page. Two columns on desktop. Single column on mobile.**

#### TOP ROW — 5 KPI Cards (horizontal)
| Card | Data Source | Format |
|---|---|---|
| MRR This Month | `invoices` WHERE revenue_type = 'mrr' AND status = 'paid' (current month) | ₹X,XXX |
| Outstanding | `invoices` WHERE status IN ('unpaid','overdue') | ₹X,XXX — count badge |
| Active Clients | `clients` WHERE status = 'active' | Count |
| Leads in Pipeline | `leads` WHERE outreach_stage NOT IN ('won','lost','dead') | Count |
| Meetings Today | `leads` WHERE outreach_stage = 'meeting_booked' AND follow_up_date = today | Count |

#### LEFT COLUMN (wider)

**Today's Action List** — Sorted by urgency. Each item is a card with a quick-action button.
Show these in priority order:
1. **Meetings Today** — each lead with `outreach_stage = meeting_booked` and `follow_up_date = today`. Shows: business name, niche, city, time. Button: "Open Lead"
2. **Follow-ups Due Today** — leads with `follow_up_date = today` and stage = `follow_up_due`. Shows: name, niche, last contact. Button: "Open Lead"
3. **Overdue Invoices** — `invoices` WHERE status = 'overdue'. Shows: client name, amount, days overdue. Button: "View Invoice". If 7+ days overdue, show red badge "PAUSE ADS".
4. **Proposals Not Replied (48h+)** — proposals sent more than 48 hours ago with status = 'sent'. Shows: client name, amount, sent date. Button: "Open Proposal"
5. **Tasks Due Today** — `tasks` WHERE due_date = today AND status != 'completed'. Shows: task title, assigned_to, project. Button: "Open Task"
6. **Onboarding Pending** — clients with status = 'onboarding' and at least one required asset NOT stored. Shows: client name, what's missing. Button: "Open Client"

If a category has no items, show a small green "All clear" line — do not show the section header at all.

**Empty state (everything clear):** Show a single message: *"Nothing urgent today. Good morning, Jabeer."*

#### RIGHT COLUMN (narrower)

**Pipeline Snapshot**
- Bar or simple list showing count of leads per `outreach_stage`
- Stages: Touch 1 Pending, Curiosity Sent, PDF Sent, Follow-up Due, Meeting Booked, Proposal Sent
- Each stage shows count. Click → goes to Outreach Board filtered to that stage.

**MRR vs Target**
- Simple progress bar: Current MRR / ₹50,000 target
- Show: ₹X,XXX / ₹50,000 (XX%)
- Green if >80%, amber if 50-80%, red if <50%

**Telecaller Activity Today** (only visible to Admin)
- Calls made today (count from `outreach_logs` WHERE created_at = today AND touch_type = 'follow_up_call')
- Meetings booked today (count from leads stage changed to meeting_booked today)
- PDFs sent today (count from `outreach_logs` WHERE touch_type = 'pdf_sent' AND created_at = today)

---

## B2 — Telecaller View (`/sales` — rebuilt)

### What It Is
Afifa's entire world in FMOS. Everything she does in a day happens here. The existing Sales Intelligence Cockpit has the right bones but needs to be simplified and loaded with the real FortuneMarq scripts.

### What to KEEP from current Sales Cockpit
- The call queue (leads assigned to telecaller, sorted by follow_up_date)
- The per-lead action panel (call button, WhatsApp button, outcome logging)
- The follow-up engine sidebar
- Personal stats (calls today, meetings booked, PDFs sent)

### What to REMOVE from current Sales Cockpit
- Manager Leaderboard panel (already gated in Phase A)
- "Turbo Mode" auto-advance (keep the UI but disable auto-advance — Afifa logs manually)
- AI Brain "Daily Brief" tab (keep script suggester and objection handler — remove daily brief)
- Strategist Deal Closing features
- Any reference to pipeline stage management — Afifa does not change pipeline stages, only logs outcomes

### Smart Pitch Engine — Load Real Scripts

**Current state:** The Smart Pitch Engine generates scripts from an AI prompt.
**Change:** Replace AI-generated scripts with the pre-built FortuneMarq scripts from the data files.

**Logic:**
1. When a lead is opened in the cockpit, read the lead's `lead_type` field (A, B, C, or D)
2. Load the matching script from: `script_type_A.json`, `script_type_B.json`, `script_type_C.json`, `script_type_D.json`
3. Display the script in the Smart Pitch Engine panel with variables substituted:
   - `{{businessName}}` → lead's business_name
   - `{{city}}` → lead's city
   - `{{niche}}` → lead's industry/niche
   - `{{searchVolume}}` → lead's niche search volume (from lead data or a static lookup by niche+city)
4. The script should be displayed as sections (Introduction, Opening Hook, Data Hook, etc.) — each section is a readable card
5. The objection handler still uses AI (OpenRouter) — keep this

**If `lead_type` is null:** Show a dropdown for Afifa to select A/B/C/D before the script appears. Save the selection to the lead record.

**Script data files to import into the project:**
- Copy `script_type_A.json`, `script_type_B.json`, `script_type_C.json`, `script_type_D.json` into `lib/data/scripts/`
- Copy `script.types.ts` and `scripts_index.ts` into `lib/data/scripts/`

### Call Outcome Logging
After each call, Afifa logs an outcome. Simplify to these options only:
- **INTERESTED — Book Now:** Open a date/time picker → saves `follow_up_date` + changes `outreach_stage` to `meeting_booked`
- **INTERESTED — Follow Up Later:** Date picker → saves `follow_up_date` + stage stays `follow_up_due`
- **INTERESTED — Send Info:** Immediately opens WhatsApp template panel to send PDF message. Logs in `outreach_logs`
- **NOT INTERESTED:** Requires a reason (dropdown: too expensive / using someone else / not interested in digital / other). Changes stage to `dead`
- **FOLLOW BACK:** Date + time picker. Sets `follow_up_date`
- **WRONG NUMBER / DEAD NUMBER:** Changes stage to `dead`
- **NO ANSWER:** Increments a no_answer_count. Does not change stage.

All outcomes create a record in `outreach_logs`.

### Afifa's Daily Stats Bar (top of page)
Always visible strip at the top:
- Calls Today: X
- PDFs Sent: X
- Meetings Booked: X
- Follow-ups Logged: X

---

## B3 — Cousin (Staff) View (`/tasks` — rebuilt for staff role)

### What It Is
When Zaid or Sufiyan logs in, they see one thing: their task list. Nothing else.

### The Task View for Staff Role
**Show only tasks where `assigned_to = current_user_id`**

**Task Card — each task shows:**
- Task title
- Client / Project name
- Service type (WEBSITE build, etc.)
- Current stage (not_started / in_progress / in_review)
- Due date — red if overdue
- Description / notes from Jabeer
- **"View Brief" button** → opens a modal or link to the Website Brief Form for this client (client_id stored on task)
- **"Submit for Review" button** → changes task status to `in_review`, sends a notification to Jabeer

**Columns (simple Kanban):**
1. **To Do** — status: not_started
2. **In Progress** — status: in_progress
3. **Submitted** — status: in_review (Jabeer reviewing)
4. **Done** — status: completed (last 7 days only)

**Drag and drop between To Do → In Progress only.** Staff cannot drag to In Review or Done — those are triggered by the Submit button and Jabeer's approval.

### Revision Notes
When Jabeer rejects a submission (changes status back from in_review to in_progress), he adds revision notes. These notes appear as a highlighted orange box on the task card with the heading "Revision Needed — Jabeer's Notes:".

**DB change needed:**
```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS revision_notes TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 0;
```

### Staff Navigation
The sidebar for staff role shows:
- My Tasks (current page)
- My Profile (to see their name, change password)

Nothing else. No access to Leads, Clients, Finance, or any Admin page.

---

## Checklist for Antigravity

- [ ] Admin dashboard rebuilt with morning action view (5 KPI cards + action list + right column)
- [ ] Admin dashboard shows correct data from Supabase for each section
- [ ] Empty state ("All clear") works correctly when no urgent items
- [ ] Telecaller view: Manager Leaderboard removed/gated
- [ ] Telecaller view: Real scripts loaded from JSON files based on lead_type
- [ ] Variable substitution working (businessName, city, niche, searchVolume)
- [ ] lead_type null state shows dropdown for Afifa to select
- [ ] Call outcome logging creates record in outreach_logs
- [ ] Call outcomes update lead outreach_stage correctly
- [ ] Afifa's daily stats bar visible and accurate
- [ ] Staff view: only shows tasks assigned to current user
- [ ] Staff Kanban: 4 columns, drag limited to To Do → In Progress
- [ ] "Submit for Review" button changes status to in_review + notifies Jabeer
- [ ] Revision notes shown as orange highlighted box when present
- [ ] `revision_notes` and `revision_count` columns added to tasks table
- [ ] Staff sidebar: only My Tasks + My Profile
