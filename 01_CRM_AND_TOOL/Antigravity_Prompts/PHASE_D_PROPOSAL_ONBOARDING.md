> # ⚠️ HISTORICAL / SUPERSEDED — not the current state
> Old build-spec methodology (specs handed to the "Antigravity" tool). FMOS no longer uses spec files ("build directly" — see fmos/CLAUDE.md). Kept for history only; **proposed for deletion**. Live state: `00_MASTER/FMOS_System_Design_And_Tasks.md` + `01_CRM_AND_TOOL/fmos/CONTINUE_HERE.md`.

# FMOS — Phase D: Proposal Generator, Agreement Flow, Onboarding Tab, WhatsApp Template Seeding
**Give this file to Antigravity. Execute after Phase C is complete.**

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
-- Proposals table (create if it doesn't exist)
CREATE TABLE IF NOT EXISTS proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  proposal_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','confirmed','rejected')),
  services JSONB DEFAULT '[]',
  total_setup_fee NUMERIC(10,2) DEFAULT 0,
  total_monthly NUMERIC(10,2) DEFAULT 0,
  proposed_start_date DATE,
  pdf_url TEXT,
  notes TEXT,
  sent_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agreements table (create if it doesn't exist)
CREATE TABLE IF NOT EXISTS agreements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  agreement_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed')),
  services JSONB DEFAULT '[]',
  total_setup_fee NUMERIC(10,2) DEFAULT 0,
  total_monthly NUMERIC(10,2) DEFAULT 0,
  start_date DATE,
  pdf_url TEXT,
  confirmed_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client onboarding tasks (new structure for service-specific tasks)
CREATE TABLE IF NOT EXISTS client_onboarding_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  task TEXT NOT NULL,
  owner TEXT NOT NULL,
  due_by TEXT,
  notes TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING','IN_PROGRESS','DONE','BLOCKED')),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client asset vault
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

-- WhatsApp template columns (add if missing)
ALTER TABLE whatsapp_templates ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE whatsapp_templates ADD COLUMN IF NOT EXISTS lead_type TEXT;
ALTER TABLE whatsapp_templates ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '[]';
ALTER TABLE whatsapp_templates ADD COLUMN IF NOT EXISTS requires_meta_approval BOOLEAN DEFAULT TRUE;
ALTER TABLE whatsapp_templates ADD COLUMN IF NOT EXISTS meta_category TEXT;
ALTER TABLE whatsapp_templates ADD COLUMN IF NOT EXISTS sent_by TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_proposals_lead_id ON proposals(lead_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_agreements_lead_id ON agreements(lead_id);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_tasks_client_id ON client_onboarding_tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_client_asset_vault_client_id ON client_asset_vault(client_id);

-- Verify
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('proposals','agreements','client_onboarding_tasks','client_asset_vault');
```

---

## 3. D1 — Proposal Generator

### Routes
- Proposal creation: accessed via button on Lead Profile → opens modal or full page
- Proposal detail: `/admin/proposals/[id]`
- Proposal list: `/admin/proposals`

---

### 3a. Proposal Number Generation

Auto-generate proposal numbers in the format: `PRO-2026-001`

```typescript
// In your server action / API route:
async function generateProposalNumber(supabase: SupabaseClient): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('proposals')
    .select('*', { count: 'exact', head: true });
  const seq = String((count || 0) + 1).padStart(3, '0');
  return `PRO-${year}-${seq}`;
}
```

---

### 3b. Proposal Creation Flow

**Entry point:** Lead Profile page → "Create Proposal" button

**Step 1 — Auto-fill from lead:**
When the proposal creation form opens, pre-fill:
- Business name (from lead.business_name)
- City (from lead.city)
- Niche (from lead.industry)
- Lead type (from lead.lead_type)
- Proposal number (auto-generated)
- Proposal date (today)
- Meeting date (look up from outreach_logs WHERE lead_id = this lead AND touch_type = 'meeting_booked' ORDER BY created_at DESC LIMIT 1)
- Search volume (from lead.search_volume)

**Step 2 — Service selection:**
Show a services panel. For each service, a toggle (on/off):

| Service ID | Display Name |
|---|---|
| WEBSITE | Website Building |
| GMB | GMB Optimization |
| SEO | SEO |
| GOOGLE_ADS | Google Ads Management |
| META_ADS | Meta Ads Management |
| WHATSAPP_MARKETING | WhatsApp Marketing |
| AI_AUTOMATIONS | AI Automations |

For SEO specifically, show a tier selector when toggled on:
- Starter — ₹7,000/month
- Growth — ₹10,000/month
- Dominate — ₹15,000/month

For each toggled-on service, show two number inputs:
- Setup Fee (₹)
- Monthly Retainer (₹)

Pre-populate SEO monthly based on tier selection. Other services: Jabeer types the amounts.

Below the service list, show running totals:
- **Total Setup Fee: ₹XX,XXX**
- **Total Monthly Retainer: ₹XX,XXX/month**

Both totals auto-update as Jabeer types amounts.

**Step 3 — Start date:**
Date picker for proposed start date.

**Step 4 — Generate and Preview:**
"Preview Proposal" button → renders the proposal in-browser.

On confirmation → "Save as Draft" button:
- Insert into `proposals` table
- Store services as JSONB array: `[{ serviceId: "WEBSITE", name: "Website Building", setup_fee: 15000, monthly: 3000 }, ...]`
- Set status = 'draft'

---

### 3c. Proposal PDF

Use `@react-pdf/renderer` to generate the proposal PDF. Check if it's already installed: `cat package.json | grep react-pdf`. If not installed: `npm install @react-pdf/renderer`.

**PDF Structure (6 pages/sections):**

**Page 1 — Cover:**
- FortuneMarq logo (use a placeholder text "FORTUNEMARQ" in #42CA80 if no logo file is available)
- "Online Growth Proposal" as main heading
- "Prepared for: [businessName], [city]"
- "Prepared by: Jabeer — FortuneMarq Media & Marketing"
- Date, Proposal No

**Page 2 — The Opportunity:**
Lead-type specific opening paragraph:
- Type A: "[businessName] is already showing up online — but your competitors are appearing above you. [searchVolume] people search for [niche] in [city] every month. We can move you to the top."
- Type B: "[businessName] has a website but isn't ranking for the searches that matter. [searchVolume] people look for [niche] in [city] every month — none of them are finding you. We can change that."
- Type C: "[searchVolume] people search for [niche] in [city] every month. Right now, [businessName] has no online presence to capture any of them. We can build that from scratch."
- Type D: "The search volume for [niche] in [city] is currently low, but digital presence is a long-term asset. [businessName] can establish market-leading presence now, before the competition grows."

Below the paragraph: a simple stat box — "Monthly searches for [niche] in [city]: [searchVolume]"

**Page 3 — The Solution:**
For each selected service: service name as heading, a 2-line description of what FortuneMarq does, and a short deliverables list.

Use this static content per service:
- WEBSITE: "We build a fast, mobile-first website optimised to rank. Includes homepage, services pages, contact, and GMB integration. Delivered in 14–21 days."
- GMB: "We fully optimise your Google Business Profile — photos, categories, Q&A, posts, and review responses. You show up in the local map pack."
- SEO: "We publish targeted content, build local citations, and build backlinks month-on-month. Rankings improve over 3–6 months."
- GOOGLE_ADS: "We run and manage targeted Google Ads for high-intent searches in your city. Monthly ad budget is separate from our management fee."
- META_ADS: "We design and run Meta (Facebook + Instagram) ad campaigns for brand visibility and lead generation."
- WHATSAPP_MARKETING: "We set up and manage WhatsApp broadcast campaigns to your existing customer base."
- AI_AUTOMATIONS: "We automate repetitive workflows — lead follow-up, invoice reminders, appointment bookings."

**Page 4 — Investment:**
Table: Service | Setup Fee | Monthly Retainer
Totals row. Below the table: "Ad spend (for Google/Meta Ads) is separate from the above fees and is decided together based on your budget."

**Page 5 — Next Steps:**
Four numbered steps:
1. Say yes — reply to this message with "I'm in"
2. We send the agreement
3. Pay the setup fee
4. We start on [proposed_start_date]

**Page 6 (optional) — About FortuneMarq:**
- "FortuneMarq Media & Marketing — Hubli, Karnataka"
- "fmos.fortunemarq.com"
- Brief bio: "We help local businesses in Hubli and surrounding cities grow their online presence through website development, SEO, and digital advertising."

**PDF generation trigger:** "Generate PDF" button → generate and save PDF. Store URL in `proposals.pdf_url`. If PDF generation fails, allow Jabeer to still save the proposal as draft without the PDF.

---

### 3d. Sending the Proposal

**"Send Proposal" button** (only visible when status = 'draft'):
1. Changes `proposals.status = 'sent'` and records `proposals.sent_at = NOW()`
2. Updates `leads.outreach_stage = 'proposal_sent'`
3. Shows Jabeer a pre-written WhatsApp message to copy and send manually:
   ```
   Hi [ownerName], here is the Online Growth Proposal we discussed.
   Please go through it and let me know if you have any questions.
   Looking forward to working with you!
   — Jabeer, FortuneMarq
   ```
4. Shows a "Copy Message" button + the PDF download link so Jabeer can send both

---

### 3e. Proposal List Page (`/admin/proposals`)

A table showing all proposals. Add this to the admin sidebar nav.

**Columns:**
Proposal No | Lead/Business | Services | Total Setup | Total Monthly | Status | Created | Sent At | Action

**Filters:**
- Status: All / Draft / Sent / Confirmed / Rejected (dropdown or chips)
- Date range (created_at)

**Row action buttons:**
- View (links to `/admin/proposals/[id]`)
- If status = draft: Send, Edit
- If status = sent: Generate Agreement (see D2)

---

## 4. D2 — Agreement Generator

### What It Is
After a client confirms the proposal, Jabeer logs it in FMOS and generates the 1-page service agreement PDF.

### Entry Points
- From `/admin/proposals/[id]` → "Generate Agreement" button (visible only when status = 'sent')
- From Lead Profile → Agreements section → "Generate Agreement" button

---

### 4a. Agreement Flow

**Step 1 — Log confirmation:**
Show a confirmation checkbox: "Client has confirmed the proposal on WhatsApp / verbally."

This is a manual log — Jabeer is acknowledging that the client already said yes. Not an automated send.

**Step 2 — Auto-fill from proposal:**
Agreement auto-populates:
- Agreement number: `AGR-2026-001` (same incrementing pattern as proposals)
- Proposal ref number (linked)
- Business name, owner name, city (from leads table via proposal.lead_id)
- Services table (from proposal.services JSONB)
- Total setup fee + total monthly (from proposal)

**Step 3 — Start date:**
Date picker, pre-filled with `proposal.proposed_start_date`. Jabeer can adjust.

**Step 4 — Generate Agreement PDF:**

One-page PDF with:
- Header: FortuneMarq logo / name, "Service Agreement", Agreement No, Proposal Ref No, Date
- Parties: "FortuneMarq Media & Marketing, Hubli" + Client: "[businessName], [ownerName], [city]"
- Services table (from proposal): Service | Setup Fee | Monthly Retainer
- Totals row
- Payment Terms (static text): "Setup fee is due before work begins. Monthly retainer is billed on the 1st of each month. 30-day written notice required to pause or cancel any ongoing service."
- Start Date: [start_date]
- Confirmation: "Please reply with 'Confirmed' to this message to activate this agreement."
- Footer: FortuneMarq address and contact

**Step 5 — Send:**
"Send Agreement" button → shows Jabeer the pre-written WhatsApp message:
```
Hi [ownerName], here is your Service Agreement from FortuneMarq.
Please read through and reply 'Confirmed' to get started.
Once confirmed, we will send payment details for the setup fee.
— Jabeer, FortuneMarq
```
Copy button + PDF download link.

**Step 6 — Client Confirmed:**
"Client Confirmed" button → Jabeer clicks after the client replies. This triggers:
1. `agreements.status = 'confirmed'`, `agreements.confirmed_at = NOW()`
2. `leads.outreach_stage = 'won'`
3. Create (or link) a client record in `clients`:
   - If a client with the same business_name / phone already exists, link to it
   - If not, insert new client: business_name, owner_name, city, phone, status = 'onboarding', monthly_value = total_monthly from agreement
4. Generate onboarding tasks for this client (see D3 — call the onboarding generation logic)
5. Show success notification: "[businessName] is now a client. Onboarding has started."

---

## 5. D3 — Onboarding Tab (Client Profile)

### Route
`/admin/clients/[id]` → Onboarding tab

The client profile already exists. This section updates the Onboarding tab specifically.

---

### 5a. Onboarding Task Generation

When a new client is created from an agreement (D2 Step 6), call this function:

```typescript
// lib/onboarding/generateClientOnboarding.ts

interface ServiceTask {
  task_id: string;
  task: string;
  owner: string;
  due_by: string;
  notes?: string;
}

interface ServiceAsset {
  asset_id: string;
  asset_name: string;
  required: boolean;
  format?: string;
}

async function generateClientOnboarding(
  supabase: SupabaseClient,
  clientId: string,
  services: string[] // array of service IDs like ['WEBSITE', 'GMB', 'SEO']
): Promise<void> {
  // Load the onboarding data for each service from the JSON files or a static lookup
  // Insert tasks into client_onboarding_tasks
  // Insert assets into client_asset_vault
}
```

**Static onboarding data per service** (hardcode this in the function or load from a JSON file):

**WEBSITE service:**
Tasks:
- (Day 0, Jabeer) Send welcome message to client
- (Day 1, Jabeer) Share Website Brief Form link with client
- (Day 2–3, Jabeer) Review completed Brief Form
- (Day 3, Jabeer) Share Brief Form with Zaid/Sufiyan
- (Day 7, Zaid/Sufiyan) Complete wireframe / first draft
- (Day 10, Jabeer) Review draft with client
- (Day 14–21, Zaid/Sufiyan) Implement revisions and go live

Assets:
- Logo (PNG transparent) — Required
- Business photos (JPG, min 10) — Required
- Domain login (username + password) — Required
- Hosting login (if separate) — Required
- Existing content / copy — Optional
- Social media links — Optional

**GMB service:**
Tasks:
- (Day 0, Jabeer) Request GMB access from client
- (Day 1, Jabeer) Audit current GMB listing
- (Day 2, Jabeer) Optimise categories, description, hours
- (Day 3, Zaid/Sufiyan) Upload minimum 10 business photos
- (Day 7, ongoing) Schedule monthly GMB posts

Assets:
- GMB login or access — Required
- Business photos (min 10) — Required
- Business description (owner-written) — Optional

**SEO service:**
Tasks:
- (Day 0, Jabeer) Keyword research for niche + city
- (Day 2, Jabeer) Set up Google Search Console (if not already)
- (Day 3, Jabeer) Share keyword plan with client
- (Day 7, ongoing) Begin content publishing (monthly)

Assets:
- Google Search Console access — Required
- Google Analytics access — Optional

**GOOGLE_ADS service:**
Tasks:
- (Day 0, Jabeer) Get Google Ads account access or create new
- (Day 1, Jabeer) Set up campaigns, ad groups, keywords
- (Day 3, Jabeer) Share initial campaign structure with client
- (Day 5, ongoing) Monitor and optimise weekly

Assets:
- Google Ads login or manager access — Required
- Ad budget confirmation (email/WhatsApp) — Required

**META_ADS service:**
Tasks:
- (Day 0, Jabeer) Get Facebook Business Manager access
- (Day 1, Jabeer) Set up Pixel + audiences
- (Day 3, Jabeer) Design first ad creatives
- (Day 5, ongoing) Monitor and optimise weekly

Assets:
- Facebook Business Manager access — Required
- Instagram account access — Required
- Ad budget confirmation — Required

---

### 5b. Onboarding Tab UI

**Progress header:**
- "Onboarding: X/Y tasks complete" with a progress bar (green, Tailwind)
- "X required assets outstanding" — shown in red if count > 0

**Service sections:**
The tab is divided by service. If client has WEBSITE + GMB, show two sections. Each section:

**Section header:** "[Service Name]" + completion chip e.g., "3/7 done" (text-sm)

**Tasks sub-section:**
A table or card list:
| Task | Owner | Due By | Status | Action |
- Status chips: PENDING (slate), IN_PROGRESS (blue), DONE (green), BLOCKED (red)
- "Mark Done" button → sets status = 'DONE', records completed_at = NOW(), completed_by = current user ID

**Assets sub-section:**
A table:
| Asset Name | Required | Status | Action |
- Status icons: NOT_COLLECTED 🔴, REQUESTED 🟡, RECEIVED 🟠, STORED 🟢
- Action button cycles through the statuses:
  - NOT_COLLECTED → "Mark Requested" → status = REQUESTED
  - REQUESTED → "Mark Received" → status = RECEIVED
  - RECEIVED → "Mark Stored" → status = STORED (also shows a file upload input)
- On "Mark Stored": optionally upload a file to Supabase Storage. Store URL in `client_asset_vault.file_url`.
  - Storage bucket: `client-assets` (create if it doesn't exist)
  - File path: `[clientId]/[assetId]/[filename]`

**Onboarding Complete banner:**
When ALL tasks for ALL services have status = 'DONE' AND all required assets have status = 'STORED':
- Show a green banner at the top of the tab: "✅ Onboarding Complete. Click to activate this client."
- Button: "Activate Client" → sets `clients.status = 'active'` — confirmation dialog first

---

## 6. D4 — WhatsApp Template Seeding

### What It Is
Seed the existing WhatsApp templates table with the 17 real FortuneMarq templates.

### Template Data

Create a server action or a one-time seed route at `/admin/whatsapp-templates/seed` (admin only).

The 17 templates to seed are listed below. Insert them into the `whatsapp_templates` table. Before inserting, check if a template with the same `id` or `name` already exists — skip if it does (idempotent seed).

**CURIOSITY TEMPLATES (4 — one per lead type):**

```
id: CURIOSITY_TYPE_A
category: CURIOSITY
label: Curiosity Message — Type A (SERP Ranked)
lead_type: A
variables: ["businessName", "city", "niche", "searchVolume"]
message: |
  Hi! I came across {{businessName}} while researching {{niche}} businesses in {{city}}.
  
  I noticed you're showing up on Google, but you're not in the top 3 positions where most clicks go.
  
  {{searchVolume}} people search for {{niche}} in {{city}} every month.
  
  We help local businesses move up and capture more of that traffic.
  
  Would it be okay if I share a quick report on your online presence? Takes 2 minutes to read.
requires_meta_approval: false
meta_category: UTILITY
sent_by: afifa
```

```
id: CURIOSITY_TYPE_B
category: CURIOSITY
label: Curiosity Message — Type B (Has Website, Not Ranking)
lead_type: B
variables: ["businessName", "city", "niche", "searchVolume"]
message: |
  Hi! I came across {{businessName}} while looking at {{niche}} businesses in {{city}}.
  
  I see you have a website, but it's not appearing when people search for {{niche}} in {{city}}.
  
  {{searchVolume}} people make that search every month — and they're not finding you.
  
  We help businesses like yours start ranking and getting found.
  
  Can I share a quick report on what's happening and how to fix it? It's free.
requires_meta_approval: false
meta_category: UTILITY
sent_by: afifa
```

```
id: CURIOSITY_TYPE_C
category: CURIOSITY
label: Curiosity Message — Type C (No Website)
lead_type: C
variables: ["businessName", "city", "niche", "searchVolume"]
message: |
  Hi! I came across {{businessName}} on Google Maps.
  
  {{searchVolume}} people search for {{niche}} in {{city}} every month — but there's no website for your business when they search.
  
  That means those potential customers are going to your competitors who do have one.
  
  We build websites that rank and bring in calls. Can I share a quick overview of what that could look like for {{businessName}}?
requires_meta_approval: false
meta_category: UTILITY
sent_by: afifa
```

```
id: CURIOSITY_TYPE_D
category: CURIOSITY
label: Curiosity Message — Type D (Low Search Volume)
lead_type: D
variables: ["businessName", "city", "niche"]
message: |
  Hi! I came across {{businessName}} while researching {{niche}} businesses in {{city}}.
  
  Digital presence is becoming important for every local business — and the ones who build it early have a real advantage.
  
  We help businesses like yours get found online through their website, Google listing, and search rankings.
  
  Can I share what we do and how it works? It's a 2-minute read.
requires_meta_approval: false
meta_category: UTILITY
sent_by: afifa
```

**FOLLOW-BACK REMINDER TEMPLATES (2):**

```
id: FOLLOW_BACK_CALL
category: FOLLOW_BACK_REMINDER
label: Follow-Back Reminder — After Call
lead_type: null (universal)
variables: ["businessName"]
message: |
  Hi {{businessName}}, this is Afifa from FortuneMarq.
  
  I tried calling you but couldn't get through. I wanted to share a quick report about your online presence in your city.
  
  Is there a good time I can call you back?
requires_meta_approval: false
meta_category: UTILITY
sent_by: afifa
```

```
id: FOLLOW_BACK_REPORT_SENT
category: FOLLOW_BACK_REMINDER
label: Follow-Back After Report Sent
lead_type: null (universal)
variables: ["businessName"]
message: |
  Hi {{businessName}}, I had sent you a report on your online presence a few days back.
  
  Did you get a chance to go through it?
  
  Happy to answer any questions or explain anything in more detail.
requires_meta_approval: false
meta_category: UTILITY
sent_by: afifa
```

**SEND PORTFOLIO TEMPLATE (1):**

```
id: SEND_PORTFOLIO
category: OUTCOME_TRIGGERED
label: Send Portfolio
lead_type: null (universal)
variables: ["businessName"]
message: |
  Hi {{businessName}}, here is our portfolio of work — websites, GMB profiles, and ranking results we've done for similar businesses in your area.
  
  [Portfolio Link — add link here]
  
  Take a look and let me know your thoughts!
requires_meta_approval: false
meta_category: MARKETING
sent_by: jabeer_manual
```

**POST-MEETING TEMPLATES (3):**

```
id: POST_MEETING_FOLLOW_UP
category: POST_MEETING
label: Post-Meeting Follow-Up
lead_type: null
variables: ["businessName", "ownerName"]
message: |
  Hi {{ownerName}}, thank you for taking the time for our meeting today.
  
  I hope the presentation gave you a clear picture of the opportunity for {{businessName}} online.
  
  I'll be sending you the proposal shortly. Let me know if you have any questions in the meantime!
  
  — Jabeer, FortuneMarq
requires_meta_approval: false
meta_category: UTILITY
sent_by: jabeer_manual
```

```
id: POST_MEETING_PROPOSAL_SENT
category: POST_MEETING
label: Proposal Sent Message
lead_type: null
variables: ["ownerName", "businessName"]
message: |
  Hi {{ownerName}}, here is the Online Growth Proposal I promised for {{businessName}}.
  
  [Proposal PDF — attached]
  
  Please go through it and let me know if you'd like to adjust anything. Looking forward to working with you!
  
  — Jabeer, FortuneMarq
requires_meta_approval: false
meta_category: UTILITY
sent_by: jabeer_manual
```

```
id: POST_MEETING_PROPOSAL_REMINDER
category: POST_MEETING
label: Proposal Follow-Up Reminder
lead_type: null
variables: ["ownerName", "businessName"]
message: |
  Hi {{ownerName}}, just checking in on the proposal I sent for {{businessName}}.
  
  Did you get a chance to look through it? Happy to clarify anything.
  
  — Jabeer, FortuneMarq
requires_meta_approval: false
meta_category: UTILITY
sent_by: jabeer_manual
```

**UPSELL TEMPLATES (4):**

```
id: UPSELL_SUMMARY_SOCIAL
category: POST_MEETING
label: Upsell Summary — Social Media
lead_type: null
variables: ["ownerName", "businessName"]
message: |
  Hi {{ownerName}}, great speaking with you today!
  
  As discussed, here's a summary of what Social Media Management would look like for {{businessName}}:
  • Instagram + Facebook posts: 12/month
  • Custom branded creatives
  • Reply management
  • Monthly performance report
  
  Monthly Retainer: [Price]
  
  Let me know if you'd like to go ahead!
  
  — Jabeer, FortuneMarq
requires_meta_approval: false
meta_category: MARKETING
sent_by: jabeer_manual
```

```
id: UPSELL_SUMMARY_ADS
category: POST_MEETING
label: Upsell Summary — Google Ads
lead_type: null
variables: ["ownerName", "businessName"]
message: |
  Hi {{ownerName}}, following up on our conversation!
  
  Here's what Google Ads management would include for {{businessName}}:
  • Campaign setup and management
  • Weekly optimisation
  • Monthly performance report
  • Ad spend is separate (you decide the budget)
  
  Management Fee: [Price]/month
  
  Ready to start? Let me know!
  
  — Jabeer, FortuneMarq
requires_meta_approval: false
meta_category: MARKETING
sent_by: jabeer_manual
```

```
id: UPSELL_CLOSED_CONFIRMATION
category: POST_MEETING
label: Upsell Confirmed
lead_type: null
variables: ["ownerName", "businessName", "service"]
message: |
  Hi {{ownerName}}, great news — we're all set to add {{service}} for {{businessName}}!
  
  I'll send the updated agreement shortly. Once confirmed, we'll get everything set up within the week.
  
  Excited to take things to the next level for you!
  
  — Jabeer, FortuneMarq
requires_meta_approval: false
meta_category: UTILITY
sent_by: jabeer_manual
```

```
id: UPSELL_FOLLOWUP
category: POST_MEETING
label: Upsell Follow-Up
lead_type: null
variables: ["ownerName", "businessName"]
message: |
  Hi {{ownerName}}, just checking in on our conversation about expanding services for {{businessName}}.
  
  No pressure at all — just wanted to see if you had any questions or wanted to talk through the numbers again.
  
  — Jabeer, FortuneMarq
requires_meta_approval: false
meta_category: UTILITY
sent_by: jabeer_manual
```

**TOTAL: 17 templates** (4 curiosity + 2 follow-back + 1 portfolio + 3 post-meeting + 4 upsell + 3 already listed above — adjust count if needed based on what's in the actual data files).

---

### 6a. Seed Implementation

Create a server action at `app/admin/whatsapp-templates/actions.ts`:

```typescript
export async function seedWhatsAppTemplates() {
  const supabase = await createServerClientWithCookies();
  
  const templates = [ /* the 17 template objects above */ ];
  
  for (const template of templates) {
    const { data: existing } = await supabase
      .from('whatsapp_templates')
      .select('id')
      .eq('id', template.id)  // or match by name if id column isn't the template ID
      .single();
    
    if (!existing) {
      await supabase.from('whatsapp_templates').insert(template);
    }
  }
}
```

Add a "Seed Templates" button to the WhatsApp Templates admin page (`/admin/whatsapp-templates`) — visible only to admin role. Clicking it calls the seed action. Show a success toast when done.

---

### 6b. Template Picker Behaviour in Sales Cockpit

Update the WhatsApp template picker (built in Phase C) to filter intelligently:

1. **By lead_type:** Show templates matching `lead_type = lead.lead_type` first, then universal templates (`lead_type IS NULL`)
2. **By outreach_stage:** Show relevant categories first:
   - touch1_pending → CURIOSITY templates first
   - pdf_sent → FOLLOW_BACK_REMINDER templates first
   - meeting_booked → POST_MEETING templates first
   - All others → show all applicable templates

---

## 7. TypeScript Rules

- Run `npx tsc --noEmit` after all changes.
- `proposals`, `agreements`, `client_onboarding_tasks`, `client_asset_vault` are new tables — if not in `database.types.ts`, cast as `(supabase as any).from(...)` and add `// TODO: regenerate types` comment.
- All new component prop interfaces must be explicitly typed.
- `@react-pdf/renderer` types: install `@types/react-pdf` if needed, or check their bundled types.

---

## 8. Completion Checklist

**SQL:**
- [ ] proposals table created
- [ ] agreements table created
- [ ] client_onboarding_tasks table created
- [ ] client_asset_vault table created
- [ ] whatsapp_templates columns added (category, lead_type, variables, etc.)

**D1 — Proposal Generator:**
- [ ] "Create Proposal" button on Lead Profile page
- [ ] Auto-fill from lead record (business name, city, niche, lead type, search volume, meeting date)
- [ ] Proposal number auto-increments (PRO-2026-001)
- [ ] Service selection panel with per-service setup fee + monthly inputs
- [ ] SEO tier selector (Starter/Growth/Dominate) with auto-populated monthly
- [ ] Total auto-calculates correctly
- [ ] Proposal PDF generates with all sections (cover, opportunity, solution, investment, next steps)
- [ ] Lead-type specific copy in Opportunity page (A/B/C/D)
- [ ] Proposal saved to proposals table as 'draft'
- [ ] "Send Proposal" changes status to 'sent', updates lead stage, shows WhatsApp copy message
- [ ] Proposal list at `/admin/proposals` with status filter

**D2 — Agreement Generator:**
- [ ] "Generate Agreement" button visible on proposal when status = 'sent'
- [ ] Agreement auto-fills from proposal (number, services, totals, names)
- [ ] Agreement number auto-increments (AGR-2026-001)
- [ ] Agreement PDF generates (1-page)
- [ ] "Send Agreement" shows WhatsApp copy message
- [ ] "Client Confirmed" button: creates client, sets lead to 'won', triggers onboarding

**D3 — Onboarding Tab:**
- [ ] generateClientOnboarding() function creates tasks and assets for each signed service
- [ ] Onboarding tab shows tasks by service section
- [ ] Progress bar shows X/Y tasks complete
- [ ] Required assets outstanding count shown
- [ ] "Mark Done" button works on tasks (records completed_at, completed_by)
- [ ] Asset status flow works (NOT_COLLECTED → REQUESTED → RECEIVED → STORED)
- [ ] File upload on "Mark Stored" saves to Supabase Storage
- [ ] "Activate Client" banner shown when all done

**D4 — WhatsApp Templates:**
- [ ] "Seed Templates" button on `/admin/whatsapp-templates` page
- [ ] All 17 templates seeded (idempotent — no duplicates on re-run)
- [ ] Templates table shows category, lead_type, variables columns
- [ ] Template picker in Sales Cockpit filters by lead_type + outreach_stage context
- [ ] Variable substitution in template preview works

**General:**
- [ ] `npx tsc --noEmit` returns 0 errors

**Once all items checked: Phase D is complete. Proceed to Phase E.**
