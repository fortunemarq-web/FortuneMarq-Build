> # ⚠️ HISTORICAL / SUPERSEDED — not the current state
> Old build-spec methodology (specs handed to the "Antigravity" tool). FMOS no longer uses spec files ("build directly" — see fmos/CLAUDE.md). Kept for history only; **proposed for deletion**. Live state: `00_MASTER/FMOS_System_Design_And_Tasks.md` + `01_CRM_AND_TOOL/fmos/CONTINUE_HERE.md`.

# FMOS Phase D — Proposal Generator, Agreement Flow, Onboarding Tab, WhatsApp Templates
**Execute after Phase C.**
**Reference:** `FORTUNEMARQ_APP_CONTEXT.md` + all data files in `/data` folder.
**DB migrations from MASTER_SPEC.md:** proposals + agreements tables must exist before starting.

---

## Goal

Build the deal-closing and client-onboarding features. After a meeting with Jabeer, he needs to generate a proposal inside FMOS, send it, confirm it as an agreement, then trigger onboarding — all in one system. Also seed the existing WhatsApp Template Engine with the 17 real FortuneMarq templates.

---

## D1 — Proposal Generator

### Route
Accessed from: Lead Profile page → "Create Proposal" button → opens a proposal creation modal or page.

**Route for proposal detail:** `/admin/proposals/[id]`
**Route for proposal list:** `/admin/proposals` (tab under Clients or standalone page)

### Proposal Creation Flow (inside FMOS)

**Step 1: Auto-fill from lead**
When Jabeer clicks "Create Proposal" from a Lead Profile, the system pre-fills:
- Business name, owner name, city, niche from the lead record
- Proposal number (auto-generated: PRO-2026-001, incrementing)
- Proposal date (today)
- Meeting date (from lead's last meeting_booked log entry, if exists)
- Lead type (A/B/C/D) — determines which market data copy to use
- Search volume — from a static lookup table (niche + city → monthly searches)

**Step 2: Jabeer selects services and enters pricing**
Show a services selection panel. For each service, Jabeer toggles it on/off:

Services available (from `services_data.json`):
- Website Building
- GMB Optimization
- SEO (with tier: Starter ₹7K / Growth ₹10K / Dominate ₹15K)
- Google Ads Management
- Meta Ads Management
- WhatsApp Marketing
- AI Automations

For each selected service, show two input fields:
- Setup Fee (₹) — Jabeer types the amount
- Monthly Retainer (₹) — Jabeer types the amount

Below the services list, auto-calculate and display:
- Total Setup Fee: ₹XX,XXX
- Total Monthly Retainer: ₹XX,XXX/month

**Step 3: Start date**
Jabeer selects a proposed start date (date picker).

**Step 4: Preview and Generate**
"Preview Proposal" button → shows a clean preview of the proposal PDF (rendered in-browser using @react-pdf/renderer, same pattern as the invoice PDF component).

**Proposal PDF Structure** (based on `proposal_schema.json`):

| Page | Content |
|---|---|
| 1 — Cover | FortuneMarq logo, "Online Growth Proposal", Prepared for: [businessName], [city], Prepared by: Jabeer, Date, Proposal No |
| 2 — The Opportunity | Market research angle. "[Niche] businesses in [city] get [searchVolume] searches/month." Lead-type specific copy (A/B/C/D). Key stat: how much of this traffic is going to competitors. |
| 3 — The Solution | Short intro paragraph. Then for each selected service: service name, tagline, what we do (2-3 lines), deliverables list, timeline. |
| 4 — Investment | Services table: Service | Setup Fee | Monthly Retainer. Totals row. Ad spend note (for Ads services). |
| 5 — Next Steps | 4 steps: "Say yes → We send the agreement → Pay setup fee → We start." |
| 6 (optional) — About FortuneMarq | Brief agency bio, address, website, contact. Only include if space allows. |

**Generate PDF:** On confirmation, save to `proposals` table with status = 'draft'. Generate PDF using @react-pdf/renderer. Store PDF URL.

**Send:** "Send Proposal" button → changes status to 'sent', records `sent_at`. Shows Jabeer the WhatsApp message to send (pre-written, with the PDF attached). Jabeer sends manually — FMOS doesn't send automatically. Also updates the lead's `outreach_stage` to `proposal_sent`.

### Proposal List (`/admin/proposals`)
Table showing all proposals:
- Proposal No | Lead/Client | Services | Total | Status | Created | Sent | Action

Filters: Status (Draft / Sent / Confirmed / Rejected), Date range.

---

## D2 — Agreement Generator

### What It Is
After the client confirms the proposal (replies "Yes, confirmed" on WhatsApp), Jabeer logs this in FMOS and generates the 1-page agreement. The agreement is also sent as a PDF via WhatsApp/email.

### Flow

**Trigger:** From the Lead Profile or Proposal Detail page → "Generate Agreement" button. Only visible when proposal status = 'sent'.

**Step 1: Log confirmation**
Jabeer ticks a checkbox: "Client has confirmed the proposal verbally / by WhatsApp message."
This is a manual confirmation — Jabeer is logging that the client already replied, not sending anything to the client yet.

**Step 2: Agreement auto-fills from proposal**
The agreement pulls all data from the linked proposal:
- Agreement number: AGR-2026-001 (auto-increment)
- Ref: Proposal No (linked)
- Business name, owner name, city → from lead
- Services table → from proposal
- Total setup fee + total monthly → from proposal

**Step 3: Start date confirmation**
Jabeer confirms or adjusts the start date.

**Step 4: Generate Agreement PDF**
Based on `agreement_template.json`. One-page PDF with:
- Header: FortuneMarq logo, "Service Agreement", Agreement No, Proposal Ref, Date
- Parties: FortuneMarq details + Client business name/owner
- Services table (from proposal)
- Payment Terms (standard — from template)
- Start Date
- Confirmation section: "Please reply with 'Yes, confirmed' to get started."
- Footer

**Send:** "Send Agreement" button → Jabeer sends the PDF manually via WhatsApp. FMOS shows the pre-written WhatsApp message to accompany it.

**Confirm:** Once client replies, Jabeer clicks "Client Confirmed" → sets agreement status to 'confirmed', records `confirmed_at`. This triggers:
1. Lead status → "Won" (outreach_stage = 'won')
2. A new Client record is created (or linked) in the `clients` table
3. The Onboarding checklist is generated for this client (see D3)
4. A notification is sent to Jabeer: "[Business Name] is now a client. Onboarding started."

---

## D3 — Onboarding Tab Overhaul (Client Profile)

### Current State
The Client Profile at `/admin/clients/[id]` has an Onboarding tab with a generic 21-item checklist stored in `onboarding_checklists` table. This needs to be replaced with a service-specific, dynamic checklist.

### New Onboarding Tab

**DB Change:**
The existing `onboarding_checklists` table (21-item generic) still stays in DB for old clients. For new clients going forward, the checklist is generated from the JSON data and stored as JSONB on the client record or in a new structure:

```sql
CREATE TABLE IF NOT EXISTS client_onboarding_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL, -- WEBSITE, GMB, SEO, etc.
  task_id TEXT NOT NULL,
  task TEXT NOT NULL,
  owner TEXT NOT NULL, -- Jabeer, Zaid, Sufiyan
  due_by TEXT,
  notes TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING','IN_PROGRESS','DONE','BLOCKED')),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_asset_vault (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  required BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'NOT_COLLECTED' CHECK (status IN ('NOT_COLLECTED','REQUESTED','RECEIVED','STORED')),
  file_url TEXT,
  notes TEXT,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Data source:** `onboarding_checklists.json` in `/data` folder. Also see `onboarding.types.ts` and `onboarding_index.ts` for the TypeScript loader logic.

**How tasks are generated:** When a new client is created (from D2 — agreement confirmed), call the `generateClientOnboarding()` function from `onboarding_index.ts` with the client's signed services. This creates all the task and asset records.

### Onboarding Tab UI

**Progress header:**
- "Onboarding: X/Y tasks complete" — progress bar
- "X required assets outstanding" — red if any required assets missing

**Service sections:**
The tab is divided by service. If the client signed for Website + GMB, show two sections. Each section has:

Section header: service name (e.g., "Website Building") + completion chip (e.g., "3/12 done")

**Tasks sub-section:**
Table or card list of tasks for this service:
| Task | Owner | Due By | Status | Action |
|---|---|---|---|---|
| Send welcome message | Jabeer | Same day | ✅ Done | — |
| Share Brief Form | Jabeer | Day 1 | ⏳ Pending | Mark Done |
| Review Brief Form | Jabeer | Day 2–3 | 🔒 Not started | Mark Done |

Each task has a "Mark Done" button → sets status to DONE, records completed_at + completed_by.

**Assets sub-section:**
Table of assets to collect for this service:
| Asset | Required | Format | Status | Action |
|---|---|---|---|---|
| Logo (PNG) | ✅ Required | PNG transparent | 🔴 Not collected | Mark Received |
| Business Photos | ✅ Required | JPG min 10 | 🔴 Not collected | Mark Received |
| Domain Login | ✅ Required | Username + PW | 🟡 Requested | Mark Stored |

Status flow: Not Collected → Requested → Received → Stored

Asset vault file uploads: On "Mark Stored", optionally upload a file (credential, document, photo zip). This stores the URL in `file_url`.

**Onboarding Complete:**
When all tasks are DONE and all required assets are STORED → a green banner appears: "Onboarding Complete. Click to activate this client." Jabeer clicks → client status changes to ACTIVE. Monthly invoice schedule activates.

---

## D4 — WhatsApp Template Engine — Seed with Real Templates

### Current State
The WhatsApp Template Manager exists at `/admin/whatsapp-templates`. It currently has no FortuneMarq-specific templates seeded.

### Action
Seed the template engine with all 17 FortuneMarq templates from the 5 JSON data files.

**Data files to use:**
- `curiosity_templates.json` — 4 templates (one per lead type A/B/C/D)
- `bot_reply_templates.json` — templates for when lead replies to curiosity message
- `outcome_templates.json` — templates triggered by call outcomes
- `followback_reminder_templates.json` — reminder templates for scheduled follow-ups
- `post_meeting_templates.json` — templates sent after Jabeer's meeting

**How to seed:**
Create a seed script or a one-time admin action that reads these JSON files and inserts them into the existing WhatsApp templates table.

Check what columns the existing `whatsapp_templates` table has. The template data structure is:
```
id (from JSON: e.g., "CURIOSITY_TYPE_A")
category (CURIOSITY / BOT_REPLY / OUTCOME_TRIGGERED / FOLLOW_BACK_REMINDER / POST_MEETING)
label (human-readable name)
lead_type (A / B / C / D — nullable, some templates are universal)
variables (array of variable names: ["businessName", "city", "niche"])
message (the template text with {{variable}} placeholders)
requires_meta_approval (boolean)
meta_category (MARKETING / UTILITY — for Meta API classification)
sent_by (jabeer_manual / afifa / system)
```

**Map this to the existing template table columns.** If the existing table doesn't support all these fields, add the missing columns:
```sql
ALTER TABLE whatsapp_templates ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE whatsapp_templates ADD COLUMN IF NOT EXISTS lead_type TEXT;
ALTER TABLE whatsapp_templates ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '[]';
ALTER TABLE whatsapp_templates ADD COLUMN IF NOT EXISTS requires_meta_approval BOOLEAN DEFAULT TRUE;
ALTER TABLE whatsapp_templates ADD COLUMN IF NOT EXISTS meta_category TEXT;
ALTER TABLE whatsapp_templates ADD COLUMN IF NOT EXISTS sent_by TEXT;
```

**Template picker in Sales Cockpit:**
When Afifa clicks "Send WhatsApp" for a lead, the template picker should:
1. Filter templates by the lead's `lead_type` (show lead-type-specific templates first, then universal ones)
2. Filter by what's appropriate for the current `outreach_stage` (e.g., in Touch 1 Pending → show only CURIOSITY templates)
3. Auto-substitute variables from the lead record: `{{businessName}}`, `{{city}}`, `{{niche}}`, `{{searchVolume}}`
4. Show the substituted message for Afifa to copy into WhatsApp

**Note on sending:** FortuneMarq does not currently have WhatsApp Business API set up for its own outreach number. Templates are used as copy-paste scripts for Afifa to send manually from the business WhatsApp account. The template picker is a copy-paste helper, not an API sender. This is intentional for Phase 1 — API integration comes later.

---

## Checklist for Antigravity

**Proposal Generator:**
- [ ] Proposal creation flow accessible from Lead Profile
- [ ] Auto-fill from lead record working (business name, city, niche, lead type, search volume)
- [ ] Proposal number auto-increments (PRO-2026-001)
- [ ] Service selection panel with setup fee + monthly retainer inputs per service
- [ ] Total auto-calculates correctly
- [ ] Proposal PDF generated with all 5-6 pages (cover, opportunity, solution, investment, next steps)
- [ ] Lead-type specific copy in the Opportunity page (A/B/C/D)
- [ ] Proposal saved to `proposals` table with correct data
- [ ] Send button changes status to 'sent', updates lead stage to 'proposal_sent'
- [ ] Proposal list page at `/admin/proposals` working with filters

**Agreement Generator:**
- [ ] Agreement accessible from Lead Profile and Proposal Detail when proposal is 'sent'
- [ ] Agreement auto-fills from proposal data
- [ ] Agreement number auto-increments (AGR-2026-001)
- [ ] Agreement PDF generated (1-page, matches template)
- [ ] Client Confirmed button → creates client record, generates onboarding, sends notification
- [ ] Lead outreach_stage changes to 'won'

**Onboarding Tab:**
- [ ] `client_onboarding_tasks` table created
- [ ] `client_asset_vault` table created
- [ ] Onboarding tasks auto-generated when client created from agreement
- [ ] Onboarding Tab shows tasks by service section
- [ ] Task "Mark Done" button works — records completion
- [ ] Asset status flow (Not Collected → Requested → Received → Stored) works
- [ ] Asset file upload on "Mark Stored" works
- [ ] Progress bar and asset count accurate
- [ ] "Onboarding Complete" banner triggers when all done → client goes ACTIVE

**WhatsApp Templates:**
- [ ] All 17 templates seeded into the template table
- [ ] Template picker in Sales Cockpit filters by lead_type and outreach_stage
- [ ] Variable substitution working in the preview
- [ ] Template Manager at `/admin/whatsapp-templates` shows all 17 templates with categories
