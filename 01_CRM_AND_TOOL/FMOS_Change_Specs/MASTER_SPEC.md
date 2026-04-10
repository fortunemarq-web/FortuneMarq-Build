# FMOS — Master Change Specification
**Version:** 1.0 | **Created:** April 2026
**Purpose:** Complete blueprint for all FMOS changes before go-live at fmos.fortunemarq.com

---

## How to Use These Files

Each phase is a separate spec file. Give Antigravity:
1. `FORTUNEMARQ_APP_CONTEXT.md` (always — full app context)
2. The specific phase spec file
3. Any data files referenced in the spec (in the `/data` folder)

**Workflow:**
1. Give Antigravity the phase spec → it confirms what it will build
2. Paste confirmation here for review
3. Confirm → Antigravity executes
4. Run any SQL migrations in Supabase SQL Editor
5. Test in browser → fix bugs
6. Move to next phase

---

## What the App Currently Is (Summary)

- **Stack:** Next.js 16 + TypeScript + Tailwind v4 + Supabase
- **URL:** localhost:3000 → going to fmos.fortunemarq.com (Hostinger)
- **Auth:** @supabase/ssr v0.8.0, cookie-based sessions
- **Design:** SaaS Light — bg-slate-50, bg-white cards, bg-slate-900 sidebar, #42CA80 accent
- **Full context:** See `FORTUNEMARQ_APP_CONTEXT.md` in the same folder

---

## The Team Using FMOS

| Person | Role in App | What They Need |
|---|---|---|
| Jabeer | Admin | Full access — command view every morning, quick action on everything |
| Afifa | Telecaller | Simplified: call queue, scripts, WhatsApp templates, daily stats only |
| Zaid | Staff (Cousin) | Tasks only: what's assigned, brief link, stage, revision notes |
| Sufiyan | Staff (Cousin) | Same as Zaid |

---

## Phase Overview

| Phase | File | Focus | Priority |
|---|---|---|---|
| A | `PHASE_A_REMOVE_AND_CLEANUP.md` | Remove clutter, fix bugs, clean nav | Do first |
| B | `PHASE_B_ROLE_VIEWS.md` | Rebuild Telecaller view, Cousin view, Admin morning dashboard | Do second |
| C | `PHASE_C_OUTREACH_AND_LEADS.md` | Outreach Sequence Board, Lead Profile, PDF Tracker | Do third |
| D | `PHASE_D_PROPOSAL_ONBOARDING.md` | Proposal Generator, Agreement flow, Onboarding tab, WhatsApp template seeding | Do fourth |
| E | `PHASE_E_FINANCE_AND_FORECAST.md` | Finance MRR split, Revenue Forecast widget, Retainer Package System | Do fifth |

---

## New DB Tables Needed (across all phases)

Run these migrations in the Supabase SQL Editor before starting Phase C and D.

### outreach_logs
```sql
CREATE TABLE outreach_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  touch_number INTEGER NOT NULL, -- 1, 2, or 3
  touch_type TEXT NOT NULL CHECK (touch_type IN ('whatsapp_curiosity', 'pdf_sent', 'follow_up_call', 'meeting_booked', 'proposal_sent')),
  template_used TEXT, -- template ID from WhatsApp templates
  pdf_name TEXT,
  outcome TEXT, -- INTERESTED, NOT_INTERESTED, FOLLOW_BACK, WRONG_NUMBER, NO_ANSWER
  notes TEXT,
  performed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leads ADD COLUMN IF NOT EXISTS outreach_stage TEXT
  DEFAULT 'touch1_pending'
  CHECK (outreach_stage IN ('touch1_pending','curiosity_sent','pdf_sent','follow_up_due','meeting_booked','proposal_sent','won','lost','dead','revival'));

ALTER TABLE leads ADD COLUMN IF NOT EXISTS pdf_sent_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pdf_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_outreach_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_date DATE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_type TEXT CHECK (lead_type IN ('A','B','C','D'));
```

### proposals
```sql
CREATE TABLE proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_number TEXT UNIQUE NOT NULL, -- auto: PRO-2026-001
  lead_id UUID REFERENCES leads(id),
  client_id UUID REFERENCES clients(id),
  services JSONB NOT NULL, -- array of selected service objects with pricing
  total_setup_fee INTEGER NOT NULL,
  total_monthly INTEGER NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','confirmed','rejected','expired')),
  meeting_date DATE,
  sent_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agreements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agreement_number TEXT UNIQUE NOT NULL, -- auto: AGR-2026-001
  proposal_id UUID REFERENCES proposals(id),
  lead_id UUID REFERENCES leads(id),
  start_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  confirmation_method TEXT DEFAULT 'whatsapp_reply',
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### clients table additions
```sql
ALTER TABLE clients ADD COLUMN IF NOT EXISTS package_tier TEXT
  CHECK (package_tier IN ('starter','growth','pro','custom'));
ALTER TABLE clients ADD COLUMN IF NOT EXISTS services_active JSONB DEFAULT '[]';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS upsell_eligible BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS setup_fee_paid INTEGER DEFAULT 0;
```

### invoices table additions (for MRR split)
```sql
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS revenue_type TEXT
  DEFAULT 'mrr'
  CHECK (revenue_type IN ('mrr','one_time','setup_fee'));
```

---

## Data Files in `/data` Folder

These are the JSON and TypeScript data files built in the content preparation phases. Reference them when building the features that display or use this data.

| File | Used In |
|---|---|
| `script_type_A.json` | Phase B — Telecaller view, Smart Pitch Engine |
| `script_type_B.json` | Phase B — Telecaller view, Smart Pitch Engine |
| `script_type_C.json` | Phase B — Telecaller view, Smart Pitch Engine |
| `script_type_D.json` | Phase B — Telecaller view, Smart Pitch Engine |
| `script.types.ts` | Phase B — TypeScript types for scripts |
| `scripts_index.ts` | Phase B — Loader utility |
| `curiosity_templates.json` | Phase D — WhatsApp Template Engine seeding |
| `bot_reply_templates.json` | Phase D — WhatsApp Template Engine seeding |
| `outcome_templates.json` | Phase D — WhatsApp Template Engine seeding |
| `followback_reminder_templates.json` | Phase D — WhatsApp Template Engine seeding |
| `post_meeting_templates.json` | Phase D — WhatsApp Template Engine seeding |
| `whatsapp.types.ts` | Phase D — TypeScript types |
| `whatsapp_index.ts` | Phase D — Loader utility |
| `proposal_schema.json` | Phase D — Proposal Generator |
| `services_data.json` | Phase D — Proposal Generator |
| `agreement_template.json` | Phase D — Agreement Generator |
| `proposal.types.ts` | Phase D — TypeScript types |
| `proposal_index.ts` | Phase D — Loader utility |
| `onboarding_checklists.json` | Phase D — Onboarding Tab |
| `onboarding.types.ts` | Phase D — TypeScript types |
| `onboarding_index.ts` | Phase D — Loader utility |

---

## Known Bugs to Fix (do in Phase A)

1. All profiles showing "New User" — need first_name/last_name set in profiles table
2. `project_status` enum issue causing fetch error on tasks page — investigate and fix
3. "2 Issues" indicator in bottom left of app — investigate and resolve
4. Austin Dental Spa and OM SAI TRAVELS need real data entered (do after deployment)

---

## After All Phases: Pre-Deployment Checklist

- [ ] Add `OPENROUTER_API_KEY` to Hostinger environment variables
- [ ] Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Hostinger env vars
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to Hostinger env vars
- [ ] Create Afifa's user account → role: telecaller
- [ ] Create Zaid's user account → role: staff
- [ ] Create Sufiyan's user account → role: staff
- [ ] Update all profile names (no more "New User")
- [ ] Point fmos.fortunemarq.com subdomain DNS to Hostinger
- [ ] Upload Hubli leads CSV (11 files — 7,298 leads)
- [ ] Seed WhatsApp templates from the 5 JSON files
- [ ] Enter Austin Dental Spa and OM SAI TRAVELS as real clients
- [ ] Activate GST invoice settings (add GSTIN to invoice template)
- [ ] Run end-to-end test: create lead → outreach → proposal → agreement → onboarding
