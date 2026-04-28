# FMOS — Phase C: Outreach Board, Lead Profile Page, PDF Delivery Tracker
**Give this file to Antigravity. Execute after Phase B is complete.**

---

## 1. Who You Are and What You're Working On

You are Antigravity — a senior full-stack developer working on **FMOS** (FortuneMarq Operating System), a custom CRM for FortuneMarq Media & Marketing, Hubli, Karnataka.

**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Supabase (`@supabase/ssr v0.8.0`)

**Design:** bg-slate-50 backgrounds, bg-white cards, bg-slate-900 sidebar, `#42CA80` green accent

**App location:** `01_CRM_AND_TOOL/fmos/`

**Read first:**
- `01_CRM_AND_TOOL/fmos/CLAUDE.md`
- `01_CRM_AND_TOOL/fmos/UI_UX_GUIDELINES.md`

---

## 2. SQL Migrations — Run These FIRST

Run all of these in Supabase SQL Editor before writing any code.

```sql
-- Outreach tracking columns on leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS outreach_stage TEXT DEFAULT 'touch1_pending';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pdf_sent_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pdf_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_outreach_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_date DATE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_type TEXT CHECK (lead_type IN ('A','B','C','D'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS no_answer_count INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS search_volume INTEGER;

-- outreach_logs table (create if it doesn't exist)
CREATE TABLE IF NOT EXISTS outreach_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  touch_type TEXT NOT NULL,
  outcome TEXT,
  pdf_name TEXT,
  notes TEXT,
  actor_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_outreach_logs_lead_id ON outreach_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_outreach_logs_created_at ON outreach_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_outreach_stage ON leads(outreach_stage);

-- Verify all columns exist
SELECT column_name FROM information_schema.columns WHERE table_name = 'leads'
  AND column_name IN ('outreach_stage','pdf_sent_at','pdf_name','last_outreach_at','follow_up_date','lead_type');
SELECT table_name FROM information_schema.tables WHERE table_name = 'outreach_logs';
```

---

## 3. C1 — Outreach Sequence Board

### Route
`/admin/outreach` — Admin only

Also add a read-only view link from `/sales` for Afifa (she can see but not drag).

### What It Is
A horizontal Kanban board. Every lead in the system is a card in one of the 10 outreach stages. Jabeer sees the full pipeline at a glance. Afifa sees where her leads sit.

---

### 3a. The Stages (Columns)

Build in this order left to right:

| Column Header | outreach_stage DB value | Description |
|---|---|---|
| Touch 1 Pending | touch1_pending | Lead in system, first WhatsApp not sent yet |
| Curiosity Sent | curiosity_sent | WhatsApp curiosity message sent, waiting for reply |
| PDF Sent | pdf_sent | Market Intelligence PDF delivered |
| Follow-up Due | follow_up_due | Follow-up call scheduled or overdue |
| Meeting Booked | meeting_booked | Meeting with Jabeer scheduled |
| Proposal Sent | proposal_sent | Proposal sent, waiting for confirmation |
| Won | won | Agreement confirmed, became client |
| Lost | lost | Not interested or deal fell through |
| Dead | dead | Wrong number / unreachable |
| Revival | revival | Was dead/lost, being re-approached |

**Default visible view:** Show only the first 6 columns (Touch 1 Pending through Proposal Sent) by default.

Won / Lost / Dead / Revival: collapsed into a "Closed" section at the bottom of the page. A button/toggle "Show Closed (X)" expands it.

**Column width:** Fixed width (min-w-[280px]) so the board scrolls horizontally on smaller screens. Use `overflow-x-auto` on the board container.

---

### 3b. Lead Card Design

Each card: bg-white, rounded-xl, border border-slate-200, shadow-sm, p-3, cursor pointer.

**Card content:**
1. **Business name** — text-sm font-semibold text-slate-900
2. **Niche + City** — text-xs text-slate-500, e.g., "Dental Clinic · Hubli"
3. **Lead Type badge** — coloured chip (A = blue, B = amber, C = purple, D = slate)
4. **Days in current stage** — text-xs. Calculate as: today - last time outreach_stage was updated. If no tracking column, use `leads.updated_at`. If >5 days: text-red-500. Otherwise text-slate-400.
5. **Last outreach date** — from `outreach_logs` most recent entry for this lead, or `leads.last_outreach_at`. Show as "3d ago" or "Today".
6. **Assigned to** — small avatar circle with initials. "J" for Jabeer (admin), "A" for Afifa (telecaller).
7. **Stale badge** — if lead has been in the same stage for 7+ days: add `border-l-4 border-orange-400` to the card and a small "Stalled" badge in orange text-xs.
8. **Quick action button** — relevant to the stage:

| Stage | Button Label | Action |
|---|---|---|
| touch1_pending | Send WhatsApp | Opens WhatsApp template picker modal (see below) |
| curiosity_sent | Log Reply | Opens a simple outcome logging modal |
| pdf_sent | Log Call | Opens outcome logging modal |
| follow_up_due | Log Call | Opens outcome logging modal (red if follow_up_date < today) |
| meeting_booked | Open Lead | Links to `/admin/leads/[id]` |
| proposal_sent | Open Proposal | Links to `/admin/proposals/[id]` or `/admin/leads/[id]` |

---

### 3c. Filters (above the board)

A filter bar above the Kanban board:
- **Niche** — dropdown of all distinct niches from the leads table
- **City** — dropdown of all distinct cities
- **Lead Type** — chips: All / A / B / C / D
- **Assigned To** — All / Jabeer / Afifa
- **Search** — text input, filters cards by business name (client-side filter)

Filters are applied client-side on the already-loaded lead cards. No need to re-query Supabase per filter change.

---

### 3d. Drag and Drop

**Admin (Jabeer):** Can drag cards between any stage columns. On drop, update `leads.outreach_stage` in Supabase.

**Telecaller (Afifa):** Board is read-only. Cards are not draggable. She advances stages only through outcome logging in the Sales Cockpit.

**Implementation:** Use `@dnd-kit/sortable` if installed. Check `package.json` first. If not installed, ask about adding it or use a simple "Move to stage" button on each card that opens a stage selector modal.

---

### 3e. Navigation

Add "Outreach Board" to the admin sidebar nav under a "Leads" group. Link: `/admin/outreach`.

---

## 4. C2 — Lead Profile Page

### Route
`/admin/leads/[id]`

This route already exists. The page at `app/admin/leads/[id]/page.tsx` and `lead-profile-admin-client.tsx` were modified in Phase A. Read those files before starting.

### What It Is
The complete 360° view of a single lead. Everything about this lead in one place.

---

### 4a. Page Header

Full-width header section:
- **Business name** — text-3xl font-bold text-slate-900
- **Chips row:**
  - Niche chip (bg-slate-100 text-slate-700)
  - City chip (same style)
  - Lead Type badge: A/B/C/D (coloured — A=blue, B=amber, C=purple, D=slate)
  - Current outreach_stage badge (use a readable label, see stage label mapping in C1)
- **Phone number** — click-to-call (tel: link) with a phone icon + WhatsApp button (wa.me link)
- **"Edit Lead" button** — Jabeer only (role = admin). Opens an edit modal or navigates to edit page.
- **Assigned to** — avatar with name

---

### 4b. Two-Column Layout

Left column (~65%): Outreach History Timeline + Call Log + Proposals + Agreements

Right column (~35%): Lead Details + Quick Actions + Follow-up Info

---

### 4c. Left Column Content

#### Outreach History Timeline

**Query:** `outreach_logs` WHERE lead_id = this lead's id, ordered by created_at DESC

Each log entry is a timeline item:
- Date + time (formatted: "Apr 26, 2026 · 10:30 AM")
- Type label (map touch_type values to readable labels):
  - follow_up_call → "Call Made"
  - pdf_sent → "PDF Sent"
  - meeting_booked → "Meeting Booked"
  - whatsapp_sent → "WhatsApp Sent"
  - proposal_sent → "Proposal Sent"
- Outcome (if present) — shown as a coloured badge
- PDF name (if touch_type = pdf_sent and pdf_name is set)
- Notes
- Performed by: show profile name (join with profiles via actor_id)

Most recent at top. Use a vertical timeline design (left border line, dots/icons per entry).

If no logs: show "No outreach activity yet." in text-slate-400.

---

#### Proposals Section

**Query:** `proposals` WHERE lead_id = this lead's id, ordered by created_at DESC

Each proposal shows:
- Proposal number (PRO-2026-001 format)
- Date created
- Services included (if stored as text or JSON on the proposal record)
- Total monthly value (if column exists) or total amount
- Status chip: Draft / Sent / Confirmed / Rejected (coloured)
- "View Proposal" button → `/admin/proposals/[id]` (if route exists in Phase D) or show inline details

If no proposals: "No proposals created yet."

---

#### Agreements Section

**Query:** `agreements` WHERE lead_id = this lead's id (if agreements table exists)

Each agreement shows:
- Agreement number
- Date, status (Pending / Confirmed)
- Start date
- "View Agreement" button

If agreements table doesn't exist yet: skip this section with a `// TODO: built in Phase D` comment.

---

### 4d. Right Column Content

#### Lead Details Panel

A data card showing all lead fields. The following fields should be editable by Jabeer (inline edit or edit modal):

| Field | DB Column | Editable |
|---|---|---|
| Business Name | business_name | Yes |
| Owner Name | owner_name or contact_name | Yes |
| Phone | phone | Yes |
| City | city | Yes |
| Niche | industry (or niche) | Yes |
| Lead Type | lead_type | Yes — dropdown A/B/C/D |
| Search Volume | search_volume | Yes |
| Has Website | has_website | Yes — toggle |
| SERP Ranked | serp_ranked | Yes — toggle |
| Source | source | Read-only display |
| Uploaded At | created_at | Read-only display |

Non-editable fields shown as plain text. Editable fields: click to edit inline or "Edit" button opens a modal form. On save, update the leads record in Supabase.

---

#### Quick Actions Panel

A card with action buttons:
1. **Send WhatsApp** — opens template picker modal (filter templates by lead_type and outreach_stage)
2. **Log Call Outcome** — opens outcome logging modal (same UI as in Sales Cockpit)
3. **Create Proposal** — links to proposal creation (Phase D). Show this button even if Phase D isn't built yet — it can navigate to a "coming soon" route.
4. **Mark as Dead** — confirmation dialog → UPDATE leads SET outreach_stage = 'dead'
5. **Move to Revival** — confirmation dialog → UPDATE leads SET outreach_stage = 'revival'

---

#### Follow-up Info Panel

- **Follow-up date** — shown as a date display with an edit icon. Click to open date picker → saves to `leads.follow_up_date`.
- **Follow-up count** — count of outreach_logs WHERE lead_id = this lead AND touch_type = 'follow_up_call'
- **Last contact date** — most recent outreach_logs created_at for this lead, displayed as a relative date ("3 days ago")

---

### 4e. Navigation Back

At the top of the page, a "← Back to Outreach Board" breadcrumb/link that navigates to `/admin/outreach`.

Also linked from: Admin Dashboard action list cards, Sales Cockpit (when a lead card is opened).

---

## 5. C3 — PDF Delivery Tracker

### What It Is
A log of every PDF that has been sent to any lead. Prevents duplicate sends and gives Jabeer a delivery audit trail.

### PDF Log Page

**Route:** `/admin/outreach/pdf-log`

**Access:** Admin only

**Data source:** `outreach_logs` WHERE touch_type = 'pdf_sent', joined with leads table

**Table columns:**
| Lead Name | Niche | City | PDF Name | Sent By | Sent At | Lead Stage |
|---|---|---|---|---|---|---|

- Lead Name: from leads.business_name
- Niche: from leads.industry
- City: from leads.city
- PDF Name: from outreach_logs.pdf_name
- Sent By: from profiles.full_name (via outreach_logs.actor_id)
- Sent At: formatted date + time
- Lead Stage: current leads.outreach_stage (not the stage when PDF was sent)

**Filters above the table:**
- Niche dropdown
- City dropdown
- PDF name text search
- Date range picker (Sent At from/to)

**Default sort:** Sent At DESC (most recent first)

**Pagination:** 50 rows per page with simple prev/next.

Add "PDF Log" to the admin sidebar under the "Leads" navigation group, alongside "Outreach Board".

---

### 5b. PDF Delivery in the Lead Profile

In the Outreach History Timeline (C2), PDF entries (`touch_type = 'pdf_sent'`) should be highlighted:
- Show a document icon (FileText from lucide-react) next to the entry
- Show the `pdf_name` in a light blue chip below the entry

This is already covered by the Timeline design above — just make sure PDF entries get the document icon + pdf_name chip treatment.

---

## 6. WhatsApp Template Picker Modal

This modal is used in two places: the Outreach Board (C1) "Send WhatsApp" button, and the Lead Profile (C2) "Send WhatsApp" Quick Action.

Build it as a shared modal component: `components/shared/WhatsAppTemplatePicker.tsx`

**Props:**
```typescript
interface WhatsAppTemplatePickerProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSent: (logEntry: OutreachLogInsert) => void;
}
```

**Modal behaviour:**
1. Fetch templates from `whatsapp_templates` table WHERE lead_type = lead.lead_type OR lead_type IS NULL
2. Also filter by outreach_stage appropriateness if a `category` column exists on the templates table (e.g., for leads in touch1_pending, show only CURIOSITY category templates first)
3. Show a list of template cards. Each card shows the template name + a preview of the message text with variables substituted from the lead record
4. When Jabeer/Afifa clicks a template: show the full substituted message in a read-only text area with a "Copy Message" button
5. A "Mark as Sent" button logs to `outreach_logs` with touch_type = 'whatsapp_sent', template name, and actor_id
6. On "Mark as Sent": close modal + call `onSent` callback

If `whatsapp_templates` table is empty (no templates seeded yet): show a message "No templates available yet. Templates will be seeded in Phase D."

---

## 7. TypeScript Rules

- Run `npx tsc --noEmit` after all changes. Fix all TypeScript errors.
- The `outreach_logs` table is new — if it's not in `database.types.ts`, cast with `(supabase as any).from("outreach_logs")` and add `// TODO: regenerate types after outreach_logs migration`.
- All new components need typed prop interfaces. No implicit `any`.

---

## 8. Completion Checklist

**SQL Migrations:**
- [ ] outreach_stage, pdf_sent_at, pdf_name, last_outreach_at, follow_up_date, lead_type columns added to leads table
- [ ] outreach_logs table created with all columns
- [ ] Indexes created on outreach_logs

**C1 — Outreach Board:**
- [ ] Page exists at `/admin/outreach`
- [ ] 6 active stage columns visible by default
- [ ] Won/Lost/Dead/Revival in collapsible "Closed" section
- [ ] Each lead card shows: business name, niche+city, lead type badge, days in stage, last outreach, assigned to
- [ ] Stale lead: 7+ days → orange left border + "Stalled" badge
- [ ] Quick action button per stage (Send WhatsApp / Log Call / Open Lead / Open Proposal)
- [ ] Filters: niche, city, lead type, assigned to, search — all working
- [ ] Admin can drag cards; telecaller board is read-only
- [ ] Outreach Board added to admin sidebar nav

**C2 — Lead Profile:**
- [ ] Page at `/admin/leads/[id]` shows header with business name, chips, stage badge, phone, WhatsApp
- [ ] Outreach History Timeline shows all outreach_logs entries, most recent first
- [ ] PDF entries in timeline highlighted with document icon + pdf_name chip
- [ ] Proposals section shows all proposals for this lead
- [ ] Lead Details panel editable by admin (lead_type, follow_up_date, owner name etc.)
- [ ] Quick Actions: Send WhatsApp, Log Call, Create Proposal, Mark Dead, Move to Revival — all wired up
- [ ] Follow-up Info: date editable, contact count, last contact date
- [ ] "← Back to Outreach Board" breadcrumb works

**C3 — PDF Log:**
- [ ] Page at `/admin/outreach/pdf-log`
- [ ] Table shows all pdf_sent outreach_logs joined with lead data
- [ ] Filters: niche, city, PDF name search, date range — working
- [ ] Sort: most recent first
- [ ] PDF Log added to admin sidebar

**Shared:**
- [ ] WhatsAppTemplatePicker component built and used in Outreach Board + Lead Profile
- [ ] Template picker does variable substitution from lead data
- [ ] "Mark as Sent" creates outreach_logs record
- [ ] `npx tsc --noEmit` returns 0 errors

**Once all items checked: Phase C is complete. Proceed to Phase D.**
