# FMOS Fix Master Plan
**Last updated:** May 2026
**Status:** Ready for Antigravity execution
**App:** FortuneMarq Marketing OS (FMOS) — Next.js 16, Supabase, TypeScript, Tailwind v4

---

## What This App Is

FMOS is a custom CRM and operations tool for FortuneMarq, a digital marketing agency targeting small businesses across 9 cities in Karnataka, India. It manages the full outreach-to-client lifecycle:

**Lead → Outreach (WhatsApp + Call + PDF) → Meeting → Proposal → Agreement → Active Client → Invoice**

**Four users:**
- **Jabeer (admin)** — runs the business, sees all data, morning dashboard
- **Afifa (telecaller)** — makes cold calls, logs outcomes, sends PDFs
- **Zaid & Sufiyan (staff)** — website builders, see only their own tasks

**Tech stack:** Next.js 16 App Router · TypeScript · Supabase (PostgreSQL + RLS + Auth) · Tailwind CSS v4 · Recharts · shadcn/ui components

---

## Phase Execution Order

**Run phases in order. Each phase can depend on earlier ones.**

| Phase | File | Focus | Effort | Status |
|---|---|---|---|---|
| 1 | `PHASE_1_DATABASE_MIGRATIONS.md` | SQL migrations + type regen | 30–60 min | 🔴 DO FIRST |
| 2 | `PHASE_2_DASHBOARD_FIXES.md` | Admin dashboard bugs | 2–3 hrs | 🔴 CRITICAL |
| 3 | `PHASE_3_TELECALLER_FIXES.md` | Telecaller cockpit bugs | 3–4 hrs | 🔴 CRITICAL |
| 4 | `PHASE_4_CLIENT_ONBOARDING.md` | Agreement + onboarding | 2–3 hrs | 🟠 HIGH |
| 5 | `PHASE_5_PROPOSALS_AND_CLIENTS.md` | Proposals + client profile | 2–3 hrs | 🟠 HIGH |
| 6 | `PHASE_6_WHATSAPP_AND_UI.md` | WhatsApp logs + UI polish | 2–3 hrs | 🟡 MEDIUM |

**Total estimated effort: 12–19 hours of focused development**

---

## Critical Context for Antigravity

### Supabase project
- Project ID: `cnwooodktqwvpzkucskm`
- URL is in `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`
- Anon key is in `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### DB types file
- Location: `types/database.types.ts`
- After running Phase 1 migrations, regenerate with:
  ```bash
  npx supabase gen types typescript --project-id cnwooodktqwvpzkucskm > types/database.types.ts
  ```

### Key column name facts (common source of bugs)
- Invoices use `total_amount` NOT `amount`
- Leads use `company_name` NOT `company`, `contact_person` NOT `first_name`/`last_name`
- Lead pipeline state is `outreach_stage` NOT `status` (both exist; board reads `outreach_stage`)
- Clients use `business_name` NOT `name` or `company`

### Design system rules
- Brand green: `#42CA80` (only hardcoded hex allowed)
- All other colors: use Tailwind slate/green/blue/red classes
- Page headings: `text-2xl font-bold text-slate-900`
- KPI numbers: `text-3xl font-bold text-slate-900`
- No `font-mono` on non-code text
- No emojis in headings

### After every phase
Run `npm run build` and fix any TypeScript errors before moving to the next phase.

---

## Summary of All Issues Being Fixed

### 🔴 App-Breaking (Phase 1–3)
1. `outreach_logs` table doesn't exist → all call logging fails silently
2. `invoices.amount` column doesn't exist → dashboard shows ₹0 for all KPIs
3. Phase D + E migrations not run → onboarding tables, agreement table, revenue_type column all missing
4. Telecaller writes to `leads.status`, board reads `leads.outreach_stage` → completely decoupled
5. "Send PDF" outcome sets stage to "nurture" not "pdf_sent" → lead goes to wrong column
6. `proposals.amount` doesn't exist → pipeline forecast always ₹0

### 🟠 Wrong Behaviour (Phase 2–5)
7. "Follow-ups Due Today" section missing from dashboard
8. Meetings query uses wrong column
9. Overdue invoice days calculated from created_at not due_date
10. Telecaller has 9 outcomes, spec requires 7
11. No PDF selection modal when "Send Info" selected
12. WhatsApp picker has no "Mark as Sent" → no audit trail
13. Client profile uses old onboarding tab
14. `generateClientOnboarding()` never called → empty onboarding tabs
15. Agreement marks proposal confirmed too early
16. Briefing page queries non-existent lead columns
17. Two broken route links in admin dashboard
18. "Clients in Onboarding" section queries wrong status

### 🟡 Missing Features (Phase 4–6)
19. New clients don't get `package_tier` or `services_active` set
20. Upsell eligible toggle missing from client profile
21. Services_active chips missing from renewals page
22. My-stats page reads non-existent DB tables
23. `no_answer_count` not tracked
24. Outreach timeline missing WhatsApp event type
25. Various heading/color design violations

---

## How to Verify the App Is Fixed

After all 6 phases:

1. **Jabeer's dashboard** — Open `/admin`. MRR KPI shows a real number. Outstanding KPI shows a real number. "Follow-ups Due Today" section visible. All links navigate correctly.

2. **Telecaller cockpit** — Log a call with outcome "Interested — Send Info". A PDF selection list appears. After logging, the lead moves to the "PDF Sent" column on the outreach board. `outreach_logs` table has a new row.

3. **WhatsApp picker** — Open any lead profile. Click "Send WhatsApp". Pick a template. Click "Mark as Sent". The outreach timeline on the lead shows a "WhatsApp Sent" entry.

4. **Agreement flow** — Send a proposal → Generate Agreement (proposal stays "sent"). Client Confirms → proposal becomes "confirmed", client created with `status = 'onboarding'`, `package_tier` set, `services_active` populated, onboarding tasks generated, redirected to Onboarding tab.

5. **Client profile** — Onboarding tab shows tasks grouped by service. Upsell toggle present and saves. Active services chips visible.

6. **`npm run build`** — Zero errors.
