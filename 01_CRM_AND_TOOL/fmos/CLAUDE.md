# FMOS — FortuneMarq Agency OS · Claude Context File
# Auto-loaded at the start of every session. Read this fully before doing anything.
# Last updated: 2026-06-15 (build phase complete, committed+pushed, MID-DEPLOY on Vercel)
# ➤ CONTINUING WORK? Read COWORK_HANDOFF.md FIRST — full state + next steps.
#
# LATEST SESSION (2026-06-15): Build phase DONE + accounts consolidated + deploy started.
# - Marketing fixed: 9 fake widgets → real data/honest empty states; strategy→outcome loop;
#   new Marketing Hub (/admin/marketing-hub). Lead scoring wired into telecaller cockpit
#   (queue sorts hottest-first). Onboarding tightened into build-ready intake (GENERAL basics +
#   WEBSITE brief + WhatsApp/AI services + readiness badges). New Delivery Load dashboard
#   (/admin/delivery-load). GitHub-Actions cron scheduler (.github/workflows/cron.yml).
# - AUTH GATE: lives in proxy.ts (Next 16 convention, NOT middleware.ts). Rewritten FAIL-OPEN —
#   this was the historic lockout cause (unguarded getUser + .single()); fixed. Edit proxy.ts, not middleware.ts.
# - Daily AI WhatsApp report Phase 1 built (lib/reports/dailyReport.ts, wired into daily-digest cron).
# - SCHEMA: no pending SQL — all columns/tables exist (verify: supabase/2026-06-15_verify_schema.sql).
# - ACCOUNTS consolidated under company: GitHub fortunemarq-web (repo TRANSFERRED off personal
#   sayedjabeer), Supabase Owner via that GitHub, Vercel via that GitHub. Repo:
#   github.com/fortunemarq-web/FortuneMarq-Build (branch main). Committed+pushed: 169a14e. TypeScript: 0 errors.
# - HOSTING: Hostinger Business = shared (can't run Next SSR) → use for domain DNS + client sites.
#   FMOS deploys on Vercel free + Hostinger CNAME for fmos.fortunemarq.com.
# NEXT: finish Vercel deploy (Root Directory=01_CRM_AND_TOOL/fmos + 10 env vars → Deploy), then
#   post-deploy config (domain CNAME, Supabase redirect URLs, WhatsApp webhook, GitHub cron secrets).
#   New-feature ideas are parked in FUTURE_FEATURES.md (do NOT build mid-deploy). Details: COWORK_HANDOFF.md.
#
# KEY CONVENTIONS ADDED 2026-06-11 (evening — UI/UX session):
# - Design system lives in app/globals.css (@theme): green text/buttons use
#   brand-deep (#1E7A4F); raw brand #42CA80 is for accents/fills ONLY (contrast).
# - No emoji as UI chrome. Emoji in WhatsApp/script message content is fine.
# - App shell (layout-wrapper) is h-dvh; <main> is the ONLY scroll container.
#   Shell pages use min-h-full, NEVER min-h-screen (only public no-sidebar
#   routes keep min-h-screen).
# - Printable documents: wrap doc in .print-area, mark chrome print:hidden,
#   add <PrintButton /> (components/ui/print-button.tsx). Do NOT use the
#   visibility-hidden print isolation trick — it produced blank PDFs.
# - leadStageUpdate()/leadStatusUpdate() now auto-stamp last_activity_at
#   (+ meeting_booked_at when stage → meeting_booked).
# - leads has NO updated_at / assigned_to columns. Use last_activity_at,
#   assigned_sales_exec, meeting_booked_at.
#
# KEY CONVENTIONS ADDED 2026-06-11 (morning — hardening session):
# - lib/pipeline.ts is the SINGLE source of truth for lead stages.
#   NEVER write outreach_stage or status directly — use leadStageUpdate()
#   (stage-space) or leadStatusUpdate() (status-space).
# - Every Supabase mutation in client components must capture { error }
#   and show toast.error() from components/ui/toast — no silent awaits.
# - Cron routes: verifyCronSecret(req) + createAdminClient() only.
# - Server actions/API routes on behalf of a user: createServerClientWithCookies().
#   Service-role (createAdminClient) only for cron + public-by-design flows.
# - 4 migrations from 2026-06-11 must be run in Supabase before deploy
#   (RLS hardening, meeting columns, audit triggers, indexes) — see last_session.md.

---

## WHAT THIS PROJECT IS

FMOS = FortuneMarq Marketing Operating System. A Next.js 16 CRM built by and for FortuneMarq — a digital marketing agency in Hubli, Karnataka. The owner is Jabeer (sayedjabir33@gmail.com). The system covers the full agency lifecycle: lead calling → outreach → meetings → proposals → client management → finance → team.

**App path (Windows):** `C:\Users\sayed\FortuneMarq-Build\01_CRM_AND_TOOL\fmos` · **Repo:** github.com/fortunemarq-web/FortuneMarq-Build (branch `main`; git root is `FortuneMarq-Build`, app in subdir `01_CRM_AND_TOOL/fmos`)
**Stack:** Next.js 16 App Router | TypeScript | Tailwind CSS v4 | Supabase (cnwooodktqwvpzkucskm.supabase.co) | Lucide React | Recharts
**Dev command:** `npm run dev` (binds `0.0.0.0` so mobile works on same Wi-Fi)
**Supabase client rules:**
- Server components / server actions → `createServerClientWithCookies()` from `@/lib/supabase-server`
- Client components → `createClient()` from `@/lib/supabase`
- Never use `createServerClient` directly — always the wrapper

---

## HOW WE WORK

- Build directly. No spec files needed anymore — Jabeer reviews code changes in conversation.
- Use `localLeads` state pattern for immediate UI updates after Supabase mutations (no page reload needed).
- TypeScript: use `as any` sparingly; `database.types.ts` is the source of truth for Supabase types.
- `outreach_stage` column is the single source of truth for where a lead sits in the pipeline.
- Short direct responses. No filler.

---

## CURRENT BUILD STATUS — Updated 2026-06-07

### ✅ /sales — Telecaller Cockpit
**File:** `app/sales/page.tsx` + `components/sales/telecaller-cockpit.tsx`

- Always shows `TelecallerCockpit` for ALL roles (removed role-based branching).
- **A/B/C/D filter** between niche/city filters and search bar. `getLeadScriptType(l)` derives type from `serp_ranked` + `has_website`.
- **`localLeads` state** initialized from `leads` prop. All mutations update `localLeads` immediately — UI reflects changes without page reload.
- **Follow-up tab** counts: `isFollowUp = l.outreach_stage === "follow_up_due" || l.outreach_stage === "no_answer" || l.outreach_stage === "follow_back"` — aligned with outreach board.
- **Manual add lead** modal: `showAddLead` state, `saveNewLead()` function, full form with datalists for niches/cities. `+` button in header.
- **9 log outcomes and where they go** (source of truth: `OUTCOMES` in telecaller-cockpit.tsx):
  | Outcome ID | Label | outreach_stage set to |
  |---|---|---|
  | INTERESTED_BOOK | Interested — Book Meeting Now | meeting_booked |
  | INTERESTED_FOLLOW_UP | Interested — Follow Up Later | follow_up_due |
  | INTERESTED_SEND_INFO | Interested — Send Info / PDF | pdf_sent |
  | NOT_INTERESTED | Not Interested | not_interested |
  | FOLLOW_BACK | Follow Back Later | follow_back |
  | WRONG_NUMBER | Wrong / Dead Number | dead |
  | NO_ANSWER | No Answer | no_answer |
  | GATEKEEPER | Gatekeeper — Owner Not Available | gatekeeper |
  | LANGUAGE_BARRIER | Language Barrier | language_barrier |
- **After `logOutcome` DB write:** `setLocalLeads((prev) => prev.map((l) => l.id === currentLead.id ? { ...l, ...leadUpdates } : l))` — keeps UI in sync.
- **Full multi-step follow-up scripts** based on `outreach_stage`: `follow_up_due` / `no_answer` / `follow_back` — each has 3 steps + objection handlers + progress bar.

### ✅ /admin/outreach — Outreach Board
**File:** `app/admin/outreach/outreach-board-client.tsx`

All 7 outcome stages now visible as columns:
```
ACTIVE_STAGES:
  touch1_pending | no_answer | follow_back | curiosity_sent | pdf_sent | follow_up_due | meeting_booked | proposal_sent

CLOSED_STAGES:
  not_interested | won | lost | dead | revival
```

### ✅ /admin/meetings — Meetings Page (BUILT THIS SESSION)
**Files:** `app/admin/meetings/page.tsx` + `app/admin/meetings/meetings-client.tsx`

Server page fetches leads with `outreach_stage = 'meeting_booked'` selecting:
`id, company_name, contact_person, phone, industry, city, follow_up_date, outreach_stage, last_outcome, notes, has_website, lead_type, website_link, gmb_link, serp_ranked, meeting_link, meeting_notes`

Client features:
- Meeting status: `overdue` / `today` / `upcoming` via `getMeetingStatus()`
- Script type A/B/C/D from `getScriptType()` on lead fields
- **Browser notifications**: `useEffect` + `setTimeout` for 1h and 15-min before meeting
- **WhatsApp templates**: 3 types (Confirmation, 1h Reminder, 15-min Reminder) → click expands dark preview panel → "Open in WhatsApp & Send" button. Meeting link embedded in templates via `buildMsg(m, type)`
- **Pre-meeting intel panel**: script type badge, website/GMB/ranking status, opening strategy tip, pre-call checklist
- **Meeting notes**: inline edit + save to `meeting_notes` column
- **Post-meeting attended flow**: notes capture → "Confirm & Move to Proposals" → "Create Proposal" link
- **Actions**: `handleAction`, `confirmAttended`, `handleReschedule`, `saveMeetingLink`, `saveMeetingNotes`
- Added to sidebar nav: `{ label: "Meetings", href: "/admin/meetings", icon: CalendarCheck }` between Outreach and Proposals

✅ **RESOLVED 2026-06-15** — `meeting_link` / `meeting_notes` (and the SLA columns
last_contacted_at / stale_flag / next_action_date) all exist in the live DB; confirmed
against generated types. The 2026-06-12 full sync already covered them. There is NO pending
SQL. Verify anytime with `supabase/2026-06-15_verify_schema.sql`.

### ✅ /admin/proposals — Proposals Page
**File:** `app/admin/proposals/page.tsx`

Added **"Awaiting Proposal" section** at the top:
- Fetches leads with `outreach_stage = 'proposal_sent'`
- Cross-checks against `proposals` table to find leads without a proposal record yet
- Shows amber cards with company, meeting notes preview, and "Create Proposal →" link to `/admin/leads/[id]/proposal/new`

### ✅ /admin/leads/[id]/proposal/new — Proposal Creator (REBUILT THIS SESSION)
**Files:**
- `app/admin/leads/[id]/proposal/new/page.tsx` — fetches `id, company_name, contact_person, city, industry, lead_type, phone`
- `components/proposals/proposal-creator.tsx` — fully rebuilt (v2)

**Proposal creator is a 3-step flow:**

**Step 1 — Service Selection:**
- Services grouped by layer (Foundation / Visibility / Engagement) with colour-coded headers
- Each service card: checkbox + tagline + expand chevron (shows the problem it solves, deliverables, timeline, ad spend warning)
- Selected services show setup fee + monthly retainer inputs
- Proposal meta: start date, validity (3/5/7/14/30 days), personal note to client
- Sticky right-hand summary panel with totals + commitment badges

**Step 2 — Proposal Preview (consultative document):**
1. **Branded cover** — gradient dark, headline tailored to lead type A/B/C/D, proposal metadata
2. **Understanding Your Situation** — 3 left-bordered panels: Where You Are Now, What This Is Costing You, Why Now (personalised per type A/B/C/D via `LEAD_TYPE_COPY`)
3. **Growth Funnel** — visual tapering funnel with 5 stages (Attract → Capture → Nurture → Convert → Retain), selected services tagged onto relevant stages. Below: 4-phase execution roadmap (Discovery → Strategy → Execution → Optimise & Scale)
4. **Why FortuneMarq** — 6 differentiators as Typical Agency vs FortuneMarq two-column side-by-side comparison
5. **Service deep-dives** — per selected service: Why You Need This + Our Approach (numbered steps) + What You Get In Detail (6-feature grid) + Why This Works + Timeline. Content from `SERVICE_DEEP` constant in the component
6. **Investment table** — dark header, alternating rows, green monthly total, ad spend disclaimer if Google/Meta Ads selected
7. **How We Get Started** — 5-step onboarding flow
8. **Dark footer** — contact details

**Step 3 — Done:**
- WhatsApp message styled as dark green chat bubble
- Copy button + "Open WhatsApp" deep link (pre-filled message + `wa.me/91[phone]`)
- "Mark as Sent → Move Stage" updates proposal status to `sent` and lead `outreach_stage` to `proposal_sent`

**Services data source:** `lib/data/services_data.json` — 7 services: WEBSITE, GMB, SEO, GOOGLE_ADS, META_ADS, WHATSAPP_MARKETING, AI_AUTOMATIONS

---

## ALL ROUTES

| Route | Component | Status |
|---|---|---|
| `/` | Root redirect | ✅ |
| `/login` | Auth page | ✅ |
| `/sales` | TelecallerCockpit (all roles) | ✅ |
| `/admin` | Admin dashboard | ✅ |
| `/admin/outreach` | Outreach Kanban board | ✅ |
| `/admin/meetings` | Meetings page | ✅ |
| `/admin/proposals` | Proposals list + Awaiting section | ✅ |
| `/admin/leads/[id]` | Lead profile | ✅ |
| `/admin/leads/[id]/proposal/new` | Proposal creator | ✅ |
| `/admin/clients` | Client list | ✅ |
| `/admin/clients/[id]` | Client profile (6 tabs) | ✅ |
| `/admin/finance` | Finance dashboard | ✅ |
| `/admin/team` | Team management | ✅ |
| `/admin/growth` | Growth hub | ✅ |
| `/admin/strategy` | Strategy-to-task engine | ✅ |
| `/tasks` | Task list | ✅ |
| `/projects` | Project board | ✅ |
| `/strategist` | Strategist pipeline Kanban | ✅ |
| `/telecaller/my-stats` | Telecaller stats | ✅ |
| `/client/dashboard` | Client portal | ✅ |

---

## KEY FILES

| File | What it does |
|---|---|
| `components/sales/telecaller-cockpit.tsx` | Main sales cockpit — dialer, scripts, log outcome, A/B/C/D filter, localLeads, add lead |
| `app/admin/outreach/outreach-board-client.tsx` | Outreach Kanban — all 17 stages (3 groups: active/parked/closed) |
| `app/admin/meetings/meetings-client.tsx` | Meetings client — WhatsApp templates, intel, notes, post-meeting flow |
| `app/admin/meetings/page.tsx` | Meetings server page |
| `app/admin/proposals/page.tsx` | Proposals list + Awaiting Proposal section |
| `components/proposals/proposal-creator.tsx` | Full consultative proposal builder (v2) |
| `app/admin/leads/[id]/proposal/new/page.tsx` | New proposal server page |
| `lib/data/services_data.json` | 7 services with full details (deliverables, timeline, etc.) |
| `lib/supabase-server.ts` | `createServerClientWithCookies()` — use in all server components |
| `lib/supabase.ts` | `createClient()` — use in all client components |
| `lib/notifications.ts` | `sendNotification()` helper |
| `types/database.types.ts` | All Supabase type definitions |
| `components/ui/app-sidebar.tsx` | Navigation sidebar — includes Meetings nav item |
| `app/sales/page.tsx` | Sales server page — always renders TelecallerCockpit |

---

## SUPABASE TABLES (KEY ONES)

```
leads:
  id, company_name, phone, industry, city, status
  lead_type (text: inbound | outbound — set from source; A/B/C/D is a
    DERIVED script type via getLeadScriptType(), NOT stored in this column)
  has_website (bool), website_link, gmb_link
  serp_ranked (bool), serp_source, tags (text[])
  outreach_stage (text) — SOURCE OF TRUTH for pipeline position
    (17 stages / 3 groups — see lib/pipeline.ts PIPELINE_STAGES)
  last_outcome, last_outreach_at, follow_up_date
  notes, contact_person
  meeting_link (TEXT — exists in live DB)
  meeting_notes (TEXT — exists in live DB)

proposals:
  id, lead_id, proposal_number, services (jsonb), total_setup, total_monthly
  status (draft/sent/confirmed/rejected), created_by, created_at, sent_at, start_date

profiles:
  id, full_name, email, role (admin/telecaller/strategist/pm/staff)

clients:
  id, business_name, primary_email, ...

activity_events:
  id, lead_id, user_id, event_type, stage_from, stage_to, notes, created_at
```

---

## PENDING TASKS (do these next)

### ✅ DONE 2026-06-12 — DATABASE FULLY SYNCED
All pending migrations (the four 20260611* files PLUS ~15 older unrun ones) were executed
in Supabase as `supabase/2026-06-12_full_schema_sync.sql`. 38 missing tables created;
RLS hardened; audit triggers + indexes live; smoke-tested. Any new DDL: append to that
file and run via the dashboard SQL editor (method in COWORK_HANDOFF.md).

### 🟡 DEPLOY TO VERCEL (next infrastructure step)
- Push to GitHub first
- Set these env vars in Vercel dashboard:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (required — cron + public lead capture run on it)
  - `ANTHROPIC_API_KEY`
  - `CRON_SECRET` (required — all /api/cron/* routes 503 without it; use the value from .env.local)
  - `INBOUND_WEBHOOK_SECRET` (required — /api/inbound/* webhooks; value in .env.local)
- `vercel.json` already schedules daily-digest + admin-alerts crons
- After deploy: update Supabase auth redirect URLs to include the Vercel domain

### 🟡 PHASE F STAGE 1 — in progress (plan: PHASE_F_INBOUND_MARKETING.md)
- ✅ 2026-06-12 night: WhatsApp Cloud API FMOS side BUILT — webhook
  app/api/webhooks/whatsapp (handshake + signature + CTWA attribution +
  known-lead logging + button replies + auto-greeting toggle), lib/whatsapp/send.ts.
  See COWORK_HANDOFF.md PART 0 for full state + pending SQL run.
- ✅ WABA decision: Option A — NEW Jio number 79759 18980 (never install WhatsApp on it)
- ⏳ Meta side in progress: BM verify → App → WABA → token → templates submission
- ⏳ Run "PHASE F STAGE 1" SQL block (end of supabase/2026-06-12_full_schema_sync.sql)
- ⏳ After deploy: configure webhook URL in Meta App + subscribe `messages`
- Meta Lead Ads `leadgen` webhook → Graph API pull → `/api/inbound/meta_lead_ad`
- Google Ads lead-form webhook URL configured in Google Ads
- SLA cron wiring (speed-to-lead alerts)
- Still needs from Jabeer: Google Ads ID, CPL targets/niche

### 🟢 USER TESTING OPEN
- CSV spend import on /admin/marketing → Inbound & Funnel (with a real Meta/Google daily export)
- PDF downloads re-test (invoice/proposal/agreement)
- Team management flows (add member, role change, deactivate)

---

## LEAD TYPE SYSTEM

| Type | Condition | Script focus |
|---|---|---|
| A | `serp_ranked = true` + `has_website = true` | Protect ranking, grow from strong position |
| B | `serp_ranked = false` + `has_website = true` | Website exists but not ranking — SEO |
| C | `has_website = false` | No website — build foundation first |
| D | `serp_ranked = false` + `has_website = false` (low-search niche) | Visibility in low-search market |

`getLeadScriptType(lead)` in telecaller-cockpit.tsx derives the type from these fields.

---

## OUTREACH STAGE → UI LOCATION MAPPING

| outreach_stage | Outreach Board column | Follow-up queue? |
|---|---|---|
| touch1_pending | Touch 1 Pending | No |
| no_answer | No Answer | YES |
| follow_back | Follow Back | YES |
| curiosity_sent | Curiosity Sent | No |
| pdf_sent | PDF Sent | No |
| follow_up_due | Follow-up Due | YES |
| meeting_booked | Meeting Booked | No (→ /admin/meetings) |
| proposal_sent | Proposal Sent | No (→ /admin/proposals) |
| not_interested | Closed: Not Interested | No |
| won | Closed: Won | No |
| lost | Closed: Lost | No |
| dead | Closed: Dead | No |
| revival | Closed: Revival | No |

---

## PROPOSAL CREATOR — CONTENT STRUCTURE

The `SERVICE_DEEP` constant in `proposal-creator.tsx` holds deep-dive content for all 7 services:
- `problem` — why the client needs this service
- `ourApproach` — step-by-step array of what we do
- `whyItWorks` — the strategic reason
- `features` — array of `{ title, detail }` — 6 per service

The `LEAD_TYPE_COPY` constant holds A/B/C/D personalised content:
- `headline` — proposal cover title
- `situation` — where the client is now (uses `{company}` placeholder)
- `consequence` — what it's costing them
- `urgency` — why now

The `DIFFERENTIATORS` constant holds 6 typical-agency vs FortuneMarq comparisons.

The `FUNNEL_STAGES` constant maps services to funnel stages (Attract/Capture/Nurture/Convert/Retain).

---

## RECENT SESSION SUMMARY (2026-06-07)

Built in this session:
1. Made `/sales` always show TelecallerCockpit for all roles
2. Added A/B/C/D filter to telecaller cockpit
3. Added manual lead creation modal to cockpit
4. Fixed follow-up count (was showing all leads with a date, now only correct `outreach_stage` values)
5. Fixed no_answer leads not appearing in follow-up queue
6. Added full multi-step follow-up scripts per outreach_stage
7. Added no_answer, follow_back, not_interested stages to outreach board (all 7 outcomes now have a column)
8. Built /admin/meetings page from scratch — full featured with WhatsApp templates, browser notifications, pre-meeting intel, inline notes, post-meeting flow
9. Added Meetings to sidebar nav
10. Added "Awaiting Proposal" section to proposals page
11. Rebuilt proposal creator (v2) — full consultative document: Situation → Growth Funnel → Why We're Different → Service Deep-Dives → Investment → Next Steps
