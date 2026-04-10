# FMOS Phase C — Outreach Sequence Board + Lead Profile + PDF Delivery Tracker
**Execute after Phase B.**
**Reference:** `FORTUNEMARQ_APP_CONTEXT.md`. Run DB migrations from MASTER_SPEC.md (outreach_logs + leads table additions) before starting.

---

## Goal

Build the two core operational views that don't exist yet: the Outreach Board (where every lead's journey through the 3-touch sequence is visible) and the Lead Profile Page (the complete history of every interaction with a lead). Also add the PDF Delivery Tracker.

---

## C1 — Outreach Sequence Board (New Page)

### Route
`/admin/outreach` (admin only) and linked from `/sales` for telecaller (read-only pipeline view)

### What It Is
A horizontal Kanban board where every lead is a card in one of the outreach stages. Jabeer and Afifa can see exactly where every lead sits in the 3-touch sequence at any time.

### The Stages (columns, left to right)

| Stage | `outreach_stage` value | Description |
|---|---|---|
| Touch 1 Pending | `touch1_pending` | Lead in system, first WhatsApp not sent yet |
| Curiosity Sent | `curiosity_sent` | WhatsApp curiosity message sent, waiting for reply |
| PDF Sent | `pdf_sent` | Market Intelligence PDF delivered to lead |
| Follow-up Due | `follow_up_due` | Follow-up call is scheduled or overdue |
| Meeting Booked | `meeting_booked` | Call happened, meeting with Jabeer scheduled |
| Proposal Sent | `proposal_sent` | Jabeer sent proposal, waiting for confirmation |
| Won | `won` | Agreement confirmed, lead becomes client |
| Lost | `lost` | Not interested or deal fell through |
| Dead | `dead` | Wrong number / unreachable / asked not to contact |
| Revival | `revival` | Was dead/lost, being re-approached |

**Default view:** Show only active stages (Touch 1 Pending through Proposal Sent). Won/Lost/Dead/Revival shown in a collapsible "Closed" section at the bottom.

### Lead Card in the Board
Each card shows:
- Business name (bold)
- Niche + City (small text, grey)
- Lead type badge (A / B / C / D) — coloured chip
- Days in current stage (e.g., "3 days" — red if >5 days)
- Last outreach date
- Assigned to (avatar — Afifa or Jabeer)
- Quick action button relevant to the stage:
  - Touch 1 Pending → "Send WhatsApp" (opens template panel)
  - Curiosity Sent → "Log Reply" or "Send PDF"
  - PDF Sent → "Log Call"
  - Follow-up Due → "Log Call" (red if overdue)
  - Meeting Booked → "Open Lead" (shows meeting date)
  - Proposal Sent → "Open Proposal"

### Filters
- Filter by Niche (dropdown — all niches from leads data)
- Filter by City (dropdown)
- Filter by Lead Type (A / B / C / D)
- Filter by Assigned To (Jabeer / Afifa)
- Search by business name

### Drag and Drop
Admin (Jabeer) can drag cards between stages. This updates `outreach_stage` on the lead.
Telecaller (Afifa) cannot drag — she advances stages only through logging outcomes in the Sales Cockpit.

### Stale Lead Detection
Any card where the lead has been in the same stage for 7+ days gets a subtle orange left border and a "Stalled" badge on the card.

### Niche Pipeline View (existing `/manager/pipeline` — replace with this)
The existing Niche Pipeline Kanban at `/manager/pipeline` can be repurposed as this Outreach Board. If the existing component is suitable to rebuild on, use it. Otherwise build fresh at `/admin/outreach`.

---

## C2 — Lead Profile Page (New)

### Route
`/admin/leads/[id]` — linked from: Outreach Board cards, Sales Cockpit, Admin action list

### What It Is
The complete 360° view of a single lead. Every interaction, every message, every proposal — in one place.

### Page Layout

#### Header
- Business name (large)
- Niche chip + City chip + Lead Type badge (A/B/C/D)
- Current outreach_stage (highlighted)
- Phone number (click to call) + WhatsApp button
- "Edit Lead" button (Jabeer only)
- Assigned to (avatar)

#### Left Column (main content)

**Outreach History Timeline**
A chronological activity feed pulled from `outreach_logs` for this lead. Each log entry shows:
- Date + time
- Type (WhatsApp Curiosity Sent / PDF Sent / Call Made / Meeting Booked / Proposal Sent)
- Outcome (if a call: INTERESTED / NOT INTERESTED / etc.)
- Template or PDF name used (if applicable)
- Notes
- Performed by (Jabeer or Afifa)

Most recent at top. If no logs yet: "No outreach activity yet."

**Call Log**
Subset of the timeline — only call entries. Shows:
- Date, outcome, duration (if logged), notes, performed by
This is a filtered view, not a separate data source.

**Proposals**
List of proposals created for this lead. Each proposal shows:
- Proposal number, date, services, total setup + monthly fee, status (Draft / Sent / Confirmed / Rejected)
- "View Proposal" button → opens proposal detail (to be built in Phase D)

**Agreements**
If an agreement exists for this lead, show it:
- Agreement number, date, status (Pending / Confirmed)
- Start date
- "View Agreement" button

#### Right Column (sidebar)

**Lead Details**
- Business name
- Owner name (if captured)
- Phone
- City + Niche
- Lead Type (A/B/C/D) — editable dropdown
- Search Volume for their niche (static lookup or stored on lead)
- Has Website (Y/N)
- SERP Ranked (Y/N)
- Source (GBP scrape / inbound / referral)
- Uploaded at date

**Quick Actions**
- "Send WhatsApp" → opens template picker modal (filtered to templates matching lead_type)
- "Log Call Outcome" → opens outcome logging modal (same as in Sales Cockpit)
- "Create Proposal" → opens proposal creation (Phase D)
- "Mark as Dead" → confirmation dialog → changes stage to dead
- "Move to Revival" → changes stage to revival

**Follow-up Info**
- Follow-up date (editable)
- Follow-up count (how many times contacted)
- Last contact date

---

## C3 — PDF Delivery Tracker

### What It Is
A log of every Market Intelligence PDF that has been sent to any lead. Jabeer needs to know which PDFs were sent, to whom, and when. This prevents sending the same PDF twice and provides a delivery audit trail.

### DB: Already covered by `outreach_logs` table (touch_type = 'pdf_sent', pdf_name column)

### UI Location: Two places

**1. Inside Lead Profile (Phase C2)**
Under the Outreach History section, PDF entries are highlighted with a document icon and show the PDF name.

**2. Standalone PDF Log page (Admin only)**
Route: `/admin/outreach/pdf-log`

Table view with columns:
| Lead Name | Niche | City | PDF Name | Sent By | Sent At | Lead Stage |
|---|---|---|---|---|---|---|

Filters:
- By niche
- By city
- By PDF name
- Date range

**Purpose:** Before Afifa starts calling a batch of leads, Jabeer can check this log to make sure the curiosity message and PDF have already been sent for that batch.

### How PDFs Get Logged
When Afifa clicks "INTERESTED — Send Info" in the Sales Cockpit outcome panel:
1. Opens a modal: "Which PDF are you sending?"
2. Dropdown shows PDF options based on the lead's niche+city (static list from the 75 PDFs generated)
3. Afifa selects → the system logs an `outreach_logs` record with `touch_type = 'pdf_sent'`, `pdf_name = selected`
4. Also updates `leads.pdf_sent_at = NOW()` and `leads.pdf_name = selected`
5. Advances `outreach_stage` to `pdf_sent`

**PDF Name Format:** `[Niche]_[City]_[Type]_[Language]` — e.g., `Gyms_Hubli_Type2_EN`

---

## Checklist for Antigravity

- [ ] DB migrations run: outreach_logs table created, leads table columns added (outreach_stage, pdf_sent_at, pdf_name, last_outreach_at, follow_up_date, lead_type)
- [ ] Outreach Board page exists at `/admin/outreach`
- [ ] All 10 stages present as columns, Won/Lost/Dead/Revival collapsible
- [ ] Lead cards show: business name, niche+city, lead type badge, days in stage, last outreach, quick action button
- [ ] Stale lead detection: 7+ days → orange border + "Stalled" badge
- [ ] Filters working: niche, city, lead type, assigned to, search
- [ ] Admin can drag cards between stages; telecaller cannot
- [ ] Lead Profile page exists at `/admin/leads/[id]`
- [ ] Outreach History Timeline shows all outreach_logs entries for the lead
- [ ] Proposals section shows all proposals for the lead
- [ ] Quick Actions panel works (Send WhatsApp, Log Call, Create Proposal, Mark Dead, Move to Revival)
- [ ] Lead details editable by Jabeer (lead_type, follow_up_date, owner name)
- [ ] PDF Delivery modal in Sales Cockpit: dropdown of PDFs by niche+city, logs to outreach_logs, updates lead
- [ ] PDF Log page exists at `/admin/outreach/pdf-log` with table + filters
- [ ] Outreach Board linked from Admin nav under "Leads" section
- [ ] Lead Profile linked from Outreach Board cards
