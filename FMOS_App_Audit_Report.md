# FMOS App Audit Report
**Audited:** 2026-05-23 | Full codebase read — all pages, components, specs, migrations

> ⚠️ **SUPERSEDED (2026-06-12).** A newer 82-page audit was run on 2026-06-12 and its
> findings were FIXED the same day: all pending DB migrations executed (38 missing
> tables created), notifications repaired, team management built, alert()/prompt()
> eliminated, dead buttons wired, fake analytics replaced with real data, inbound
> engine Stage 0 shipped. Current state: `01_CRM_AND_TOOL/fmos/COWORK_HANDOFF.md`.

---

## What's Built and Working ✅

- **Admin Dashboard** — KPI bar, MRR progress, Today's Action List, Pipeline Snapshot, Revenue Forecast, Telecaller Activity widget
- **Outreach Board** — 6 stage columns, collapsible closed section, stalled badges, drag-and-drop, all 5 filters
- **PDF Log** — `/admin/outreach/pdf-log` — filters, date range, sort
- **Lead Profile** — header, outreach history timeline, proposals, agreements, quick actions
- **Proposal Creator** — service selection, fee inputs, running totals, saves as draft, "Send Proposal" flow
- **Agreement Generator** — confirmation checkbox, start date, creates client record on confirm
- **Finance Module** — 5 KPI cards, MRR trend chart, invoice list, expenses, P&L with three revenue lines
- **Telecaller Cockpit** — daily stats, script loading by lead type, outcome logger, filter panel, objection handler
- **Staff Task Board** — 4-column kanban, role-filtered, revision notes, submit for review
- **Sidebar nav** — role-configured correctly (admin/telecaller/staff/client)
- **Phase D migrations file** — `client_onboarding_tasks`, `client_asset_vault`, `agreements` table SQL written
- **Phase E migrations file** — `revenue_type` on invoices, `package_tier`, `services_active`, `upsell_eligible` on clients written
- **WhatsApp Template Picker** — built, stage-aware filtering, variable substitution, copy to clipboard
- **All 14 niche calling scripts** — loaded in `lib/scripts/`

---

## 🔴 Critical Issues (App-Breaking)

### ISSUE 1 — Admin dashboard reads `invoices.amount` — column doesn't exist
- **File:** `app/admin/page.tsx`, lines 56, 64, 87
- **Problem:** The real column is `total_amount`. All three queries use `.select("amount")` which returns null.
- **Result:** MRR KPI = ₹0, Outstanding KPI = ₹0, overdue invoice amounts = ₹0 on Jabeer's dashboard every morning.
- **Fix:** Change all `.select("amount")` to `.select("total_amount")` and update the sum reductions.

### ISSUE 2 — Admin dashboard reads `proposals.amount` — column doesn't exist
- **File:** `app/admin/page.tsx`, line 94
- **Problem:** `.select("id, amount, sent_at, lead:leads(...)")` — proposals table has `monthly_value` and `onetime_value`, not `amount`.
- **Fix:** Change to `.select("id, monthly_value, total_monthly, sent_at, lead:leads(company_name, phone)")`

### ISSUE 3 — `outreach_logs` table has NO migration file — likely doesn't exist in DB
- **File:** `supabase/migrations/` — no `phase_c_migrations.sql` found
- **Problem:** Every telecaller outcome log, every PDF send log, all admin dashboard telecaller stats, and the entire PDF Log page all write/read from `outreach_logs`. If the table doesn't exist in Supabase, all inserts silently fail. The PDF log page shows empty forever.
- **Fix:** Create `supabase/migrations/phase_c_migrations.sql` with:
  ```sql
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
  CREATE INDEX IF NOT EXISTS idx_outreach_logs_lead_id ON outreach_logs(lead_id);
  CREATE INDEX IF NOT EXISTS idx_outreach_logs_created_at ON outreach_logs(created_at);
  ```
  Run in Supabase SQL Editor. Then regenerate types.

### ISSUE 4 — Phase D and Phase E migrations NOT in `supabase/migrations/` folder and NOT run
- **Files:** `supabase/phase_d_migrations.sql`, `supabase/phase_e_migrations.sql`
- **Problem:** These files exist but are NOT in the tracked `supabase/migrations/` folder. The DB types do NOT show `client_onboarding_tasks`, `client_asset_vault`, `agreements`, `proposals.total_setup`, `proposals.services`, `invoices.revenue_type`, `clients.package_tier`. All code using these columns either fails silently or uses `as any` casts.
- **Fix:** Run both SQL files in the Supabase SQL Editor. Then regenerate: `npx supabase gen types typescript --project-id cnwooodktqwvpzkucskm > types/database.types.ts`

### ISSUE 5 — Telecaller cockpit writes outcomes to `leads.status` instead of `leads.outreach_stage`
- **File:** `components/sales/telecaller-cockpit.tsx`, line 272
- **Problem:** `status: outcome.stage` — the outreach board reads `leads.outreach_stage`. The telecaller cockpit and the outreach board are completely decoupled. Afifa can log 100 calls and the outreach board won't move a single card.
- **Fix:** Change `status: outcome.stage` → `outreach_stage: outcome.stage`. For `"disqualified"` map to `"dead"`.

### ISSUE 6 — "INTERESTED — Send PDF" sets `stage: "nurture"` instead of `"pdf_sent"`
- **File:** `components/sales/telecaller-cockpit.tsx`, line 88
- **Problem:** Lead stays in "Nurture" column on the outreach board instead of moving to "PDF Sent".
- **Fix:** Change `stage: "nurture"` → `stage: "pdf_sent"`

---

## 🟠 High Priority Issues (Wrong Behaviour)

### ISSUE 7 — "Follow-ups Due Today" section missing from admin dashboard
- **File:** `app/admin/page.tsx`
- **Problem:** The spec requires a section showing leads where `outreach_stage = 'follow_up_due'` AND `follow_up_date = today`. Entire section missing. Jabeer can't see who needs a follow-up call today.
- **Fix:** Add query + `ActionSection` between Meetings Today and Overdue Invoices.

### ISSUE 8 — Meetings query uses `leads.status` not `leads.outreach_stage`
- **File:** `app/admin/page.tsx`, lines 79–82
- **Problem:** `.eq("status", "meeting_booked" as any)` — after fixing Issue 5, this won't find meetings booked by the telecaller.
- **Fix:** Change to `.eq("outreach_stage", "meeting_booked")`, remove `as any`.

### ISSUE 9 — Telecaller cockpit has 9 outcomes, spec requires 7
- **File:** `components/sales/telecaller-cockpit.tsx`, lines 67–138
- **Problem:** `GATEKEEPER` and `LANGUAGE_BARRIER` are not in the spec. Outcome label names don't match spec exactly.
- **Fix:** Remove `GATEKEEPER` and `LANGUAGE_BARRIER`. Rename `INTERESTED_CALLBACK` → `INTERESTED_FOLLOW_UP_LATER` and `INTERESTED_SEND_PDF` → `INTERESTED_SEND_INFO`.

### ISSUE 10 — "INTERESTED — Send Info" outcome has no PDF selection modal
- **File:** `components/sales/telecaller-cockpit.tsx`
- **Problem:** When Afifa selects "Send Info", no modal appears to pick which PDF to send. `pdf_name` is never stored in `outreach_logs`. PDF Log page will show blank PDF names.
- **Fix:** Add a PDF selection modal (filtered by niche/city) that opens when this outcome is selected, then stores `pdf_name` in the log entry.

### ISSUE 11 — WhatsApp template picker has no "Mark as Sent" button
- **File:** `components/sales/whatsapp-template-picker.tsx`
- **Problem:** Only "Copy Message" button exists. No audit trail created in `outreach_logs` when a WhatsApp is sent.
- **Fix:** Add "Mark as Sent" button that inserts to `outreach_logs` with `touch_type = 'whatsapp_sent'` and template name.

### ISSUE 12 — Client profile Onboarding tab uses old `onboarding_checklists` table
- **File:** `components/admin/clients/ClientProfileTabs.tsx`, line 14
- **Problem:** The new Phase D onboarding component (`components/clients/onboarding-tab.tsx`) is built but not wired in. Client profile still shows the old simple checklist.
- **Fix:** Replace the import with the new onboarding tab component. Update parent page to fetch `client_onboarding_tasks` and `client_asset_vault`.

### ISSUE 13 — Agreement confirmation doesn't call `generateClientOnboarding()`
- **File:** `components/proposals/agreement-generator.tsx`, lines 80–113
- **Problem:** New clients are created but their onboarding tasks are never generated. Every new client has an empty onboarding tab.
- **Fix:** After creating the client, call `generateClientOnboarding(supabase, clientId, proposal.services.map(s => s.id))` before redirecting.

### ISSUE 14 — Admin briefing page queries wrong column names on leads table
- **File:** `app/admin/briefing/page.tsx`, lines 23–26
- **Problem:** Queries `first_name`, `last_name`, `company` — actual columns are `contact_person`, `company_name`. Page shows blank lead names.
- **Fix:** Change to `.select('id, company_name, contact_person, next_action_date')`, update display code.

### ISSUE 15 — New client from agreement doesn't set `package_tier` or `services_active`
- **File:** `components/proposals/agreement-generator.tsx`
- **Problem:** `package_tier` is never auto-set. `services_active` is never populated from agreement services. Clients show "—" in package column on the clients list.
- **Fix:** After creating client, call `calculatePackageTier()` with the proposal total and store result. Map proposal services to `services_active` array.

### ISSUE 16 — Agreement generator sets proposal to `"confirmed"` too early
- **File:** `components/proposals/agreement-generator.tsx`, lines 68–70
- **Problem:** Proposal status updates to `"confirmed"` on `generateAgreement()` (Step 1). Should only update when the client confirms (Step 2).
- **Fix:** Move the proposal status update into `confirmClientAgreement()`.

### ISSUE 17 — Overdue invoice days calculated from `created_at` not `due_date`
- **File:** `app/admin/page.tsx`, line 362
- **Problem:** `daysSince(inv.created_at)` — a 30-day-old invoice with a 28-day due date shows as "30 days overdue" instead of "2 days overdue".
- **Fix:** Change to `daysSince(inv.due_date)`. Update invoice query to include `due_date`.

### ISSUE 18 — "Open Proposal" button links to `/sales/outreach` (wrong route)
- **File:** `app/admin/page.tsx`, line 395
- **Problem:** Route `/sales/outreach` doesn't exist for admin. Should link to `/admin/proposals` or the specific lead.
- **Fix:** Change to `href={"/admin/proposals"}` or `href={\`/admin/leads/${p.lead?.id}\`}`.

### ISSUE 19 — Meetings "Open Lead" links to `/sales/leads/[id]` (wrong route for admin)
- **File:** `app/admin/page.tsx`, line 352
- **Problem:** `/sales/leads/${lead.id}` doesn't exist. Admin lead profile is at `/admin/leads/[id]`.
- **Fix:** Change to `href={\`/admin/leads/${lead.id}\`}`.

### ISSUE 20 — Telecaller my-stats page reads non-existent tables
- **File:** `app/telecaller/my-stats/page.tsx`
- **Problem:** Queries `telecaller_stats` and `call_logs` — neither table exists. Page shows all-zero stats.
- **Fix:** Rewrite to query `outreach_logs WHERE actor_id = current_user.id AND created_at = today`.

### ISSUE 21 — "Clients in Onboarding" dashboard section queries wrong status
- **File:** `app/admin/page.tsx`, lines 108–112
- **Problem:** Queries `status = 'active' AND onboarding_completed = false`. Agreement generator sets new clients to `status = 'onboarding'`. They will never appear in this section.
- **Fix:** Change to `.eq("status", "onboarding")`, remove the `onboarding_completed` filter.

---

## 🟡 Medium Issues

### ISSUE 22 — `profiles.full_name` column may not exist in DB (Phase A migration unconfirmed)
- **File:** `types/database.types.ts`
- **Problem:** If Phase A SQL was never run, the sidebar shows "New User" for all users.
- **Fix:** Run `SELECT full_name FROM profiles LIMIT 1` in Supabase to verify. If it fails, run the Phase A SQL.

### ISSUE 23 — Telecaller cockpit daily stats bar uses wrong background color
- **File:** `components/sales/telecaller-cockpit.tsx`, line 306
- **Problem:** `bg-white border-b` — spec says `bg-slate-900` dark strip with white text.
- **Fix:** Change to `bg-slate-900 text-white`.

### ISSUE 24 — Automations page uses hardcoded `#222` color (violates design system)
- **File:** `app/admin/automations/page.tsx`, line 27
- **Problem:** `border border-[#222]` — UI guidelines ban all `#HEX` except `#42CA80`.
- **Fix:** Change to `border-slate-800`.

### ISSUE 25 — Admin dashboard KPI cards use `text-2xl` not `text-3xl` per guidelines
- **File:** `app/admin/page.tsx`, line 265
- **Fix:** Change `text-2xl font-bold` to `text-3xl font-bold` for KPI number values.

---

## ❌ Missing Features (In Spec — Not Built At All)

| Module | Feature |
|---|---|
| Phase C | `outreach_logs` SQL migration file |
| Phase B | PDF Selection Modal when "Send Info" is chosen |
| Phase B | "Follow-ups Due Today" section in admin dashboard |
| Phase C | "Mark as Sent" on WhatsApp template picker → `outreach_logs` |
| Phase D | `generateClientOnboarding()` called on agreement confirmation |
| Phase D | New OnboardingTab wired to client profile |
| Phase D | Proposal PDF generation (`@react-pdf/renderer`) — in-browser preview only |
| Phase D | Agreement PDF generation |
| Phase E | `calculatePackageTier()` auto-called when client created |
| Phase E | `services_active` populated from proposal services on client creation |
| Phase E | Upsell eligible toggle on Client Profile Overview tab |
| Phase E | `services_active` chips on Renewals page cards |
| Phase B | Follow-ups tab in telecaller queue wired to actual `outreach_stage = 'follow_up_due'` data |
| Phase A | Empty sections show "All clear ✓" message instead of disappearing |

---

## 🗄️ Database / Schema Gaps

| Column / Table | Problem |
|---|---|
| `outreach_logs` (entire table) | No migration file. Almost certainly missing from production DB. |
| `invoices.amount` | Doesn't exist — should be `total_amount` throughout |
| `invoices.revenue_type` | Phase E migration not run/tracked |
| `proposals.total_setup`, `total_monthly`, `services` (JSONB), `start_date`, `created_by` | Phase D migration not run/tracked |
| `clients.package_tier`, `services_active`, `upsell_eligible` | Phase E migration not run/tracked |
| `agreements` (table) | Phase D migration not run/tracked |
| `client_onboarding_tasks` (table) | Phase D migration not run/tracked |
| `client_asset_vault` (table) | Phase D migration not run/tracked |
| `leads.follow_up_date` | In meetings table types, NOT leads table — reads/writes may silently fail |
| `leads.no_answer_count` | Spec requires incrementing on NO_ANSWER outcome — column and logic both missing |
| `profiles.full_name` | Phase A migration may not have been run |
| `whatsapp_templates.category`, `lead_type`, `variables` | Phase D migration not run/tracked |

---

## 🎯 Top 10 Priority Fix Order

| # | Fix | File(s) |
|---|---|---|
| 1 | Run `outreach_logs` table migration in Supabase | New `supabase/migrations/phase_c_migrations.sql` |
| 2 | Fix `invoices.amount` → `invoices.total_amount` in dashboard | `app/admin/page.tsx` lines 56, 64, 87 |
| 3 | Run Phase D + Phase E migrations in Supabase + regenerate DB types | `supabase/phase_d_migrations.sql`, `supabase/phase_e_migrations.sql` |
| 4 | Fix telecaller outcome: write to `outreach_stage` not `leads.status` | `components/sales/telecaller-cockpit.tsx` line 272 |
| 5 | Wire `generateClientOnboarding()` into agreement confirmation | `components/proposals/agreement-generator.tsx` |
| 6 | Wire new Phase D OnboardingTab into client profile | `components/admin/clients/ClientProfileTabs.tsx` |
| 7 | Add "Follow-ups Due Today" section to admin dashboard | `app/admin/page.tsx` |
| 8 | Fix overdue invoice days to use `due_date` not `created_at` | `app/admin/page.tsx` line 362 |
| 9 | Fix admin briefing page lead column names | `app/admin/briefing/page.tsx` lines 23–26 |
| 10 | Add "Mark as Sent" to WhatsApp template picker | `components/sales/whatsapp-template-picker.tsx` |

---

*Generated by Cowork audit · May 2026*
