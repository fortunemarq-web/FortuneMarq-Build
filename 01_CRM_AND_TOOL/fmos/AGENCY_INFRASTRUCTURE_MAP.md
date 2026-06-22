# FortuneMarq — Complete Agency Infrastructure Map
**A hierarchical map of the entire operation: what happens OUTSIDE FMOS, what happens INSIDE FMOS, and how every piece connects.**
**Last updated:** 2026-06-22

---

## HOW TO READ THIS MAP

Every item is tagged:
- 🌐 **OUT** — happens *outside* FMOS (real world, phone, ad platforms, content tools, bank, Meta/Google dashboards)
- 🖥️ **IN** — happens *inside* FMOS (the app)
- 🔗 **FLOW** — how the two connect (webhook, manual entry, auto-write, API)

The structure is **3 layers → 11 lifecycle phases → supporting systems → automation → data backbone**.

```
┌─────────────────────────────────────────────────────────────┐
│ LAYER 1 — OUTSIDE TOOLS (phone, WhatsApp, ads, content, bank) │
│        ↕ (webhooks · manual entry · APIs)                     │
│ LAYER 2 — FMOS  (the operating system: pipeline, CRM, finance)│
│        ↕ (server actions · RLS)                               │
│ LAYER 3 — DATA BACKBONE (Supabase DB · cron · webhooks · AI)  │
└─────────────────────────────────────────────────────────────┘
```

---

# LAYER 1 — THE THREE LAYERS (the foundation everything sits on)

## 1.1 Outside Services (accounts you own — see EXTERNAL_SETUP_GUIDE.md)
- 🌐 **Supabase** — database + auth + file storage (project `cnwooodktqwvpzkucskm`)
- 🌐 **Vercel** — hosts the live app + runs scheduled cron jobs
- 🌐 **Domain** — `fmos.fortunemarq.com` (Hostinger DNS)
- 🌐 **Anthropic (Claude)** — AI for strategy engine + reports + weekly briefs
- 🌐 **WhatsApp Cloud API** (Meta) — number +91 79759 18980 — send + receive
- 🌐 **Meta Business / Ads** — Facebook/Instagram ads + Lead Ads
- 🌐 **Google Ads** — search/display + lead-form ads
- 🌐 **Google Search Console + Analytics** — organic SEO data (not yet connected)
- 🌐 **Bank / UPI / payment** — actual money movement (FMOS only *records* it)

## 1.2 FMOS Core (inside)
- 🖥️ **Auth & roles** — login; roles: admin / telecaller / strategist / pm / staff / client
- 🖥️ **Pipeline engine** (`lib/pipeline.ts`) — the single source of truth for lead stage
- 🖥️ **Database** — 38+ tables (leads, proposals, agreements, clients, invoices, tasks, …)
- 🖥️ **Cron jobs** — scheduled background tasks (digests, alerts, SLA, follow-ups)
- 🖥️ **Webhooks** — inbound lead capture + WhatsApp messages
- 🖥️ **Automations engine** — rule-based trigger → condition → action

## 1.3 The connection rules (how layers talk — never break these)
- 🔗 Server components/actions → `createServerClientWithCookies()`
- 🔗 Client components → `createClient()`
- 🔗 Cron + webhooks (no user) → `createAdminClient()` (service role)
- 🔗 Lead stage changes ONLY via `leadStageUpdate()` / `leadStatusUpdate()` in `lib/pipeline.ts`

---

# LAYER 2 — THE AGENCY LIFECYCLE (the main spine)

A lead's journey: **Generate → Outreach → Meet → Propose → Close → Onboard → Deliver → Retain**, wrapped by **Finance**, **Team**, and your own **Agency Marketing**.

---

## PHASE A — LEAD GENERATION (getting prospects into FMOS)

Three sources feed the same `leads` table:

### A1 · Outbound / Cold (you go find them)
- 🌐 **OUT:** Build a target list — scrape/collect businesses by niche + city (GMB, JustDial, Google Maps), note phone, website, whether they rank.
- 🌐 **OUT:** Prepare CSV in the required column format.
- 🖥️ **IN:** Upload CSV → `/admin/upload` (or `/admin/bulk-import`). Validation + dedupe on import.
- 🖥️ **IN:** Or add a single lead manually in the Telecaller Cockpit (`+` button).
- 🔗 **FLOW:** CSV → import action → `leads` rows created with `outreach_stage = touch1_pending`, `source = manual/cold`. Upload history at `/admin/upload/history`.
- 🖥️ **IN:** Lead type auto-derived A/B/C/D from `serp_ranked` + `has_website`.

### A2 · Inbound / Paid (ads bring them)
- 🌐 **OUT:** Run Meta (FB/IG) + Google ads. Build the ad's destination link with FMOS's **UTM Builder** (Marketing → Inbound tab) so attribution works.
- 🌐 **OUT:** Ad lead-forms collect name/phone/etc.
- 🔗 **FLOW (Meta):** Meta `leadgen` webhook → `POST /api/inbound/meta_lead_ad` → `lib/inbound/capture.ts` → dedupe → assign → `leads` row (`source = meta_lead_ad`).
- 🔗 **FLOW (Google):** Google lead-form webhook → `POST /api/inbound/google_lead_form` (parses Google's native payload, auth via `INBOUND_WEBHOOK_SECRET`).
- 🔗 **FLOW (Landing page):** Public LP `/lp/[niche]/[city]` form → `POST /api/inbound/lp`.
- 🖥️ **IN:** Spend tracking — export daily report from Meta/Google → upload CSV in Marketing → Inbound tab → `ad_insights_daily` (auto-creates `ad_campaigns`).
- 🖥️ **IN:** Inbound events logged to `inbound_events` (visible in Marketing → Inbound).

### A3 · Inbound / Organic (content + reputation bring them)
- 🌐 **OUT:** Post content on IG/LinkedIn/FB/GMB; maintain SEO; collect referrals.
- 🖥️ **IN:** Plan + track content in Growth Hub + Content Calendar.
- 🔗 **FLOW:** Organic leads enter via WhatsApp/DM/referral/walk-in → captured manually or via WhatsApp webhook (`source = whatsapp/ctwa/referral/dm/gbp/walk_in`).

**▶ Connection out of Phase A:** every new lead lands in `leads` with an `outreach_stage` → appears in the **Outreach Board** and **Telecaller Cockpit**.

---

## PHASE B — OUTREACH & QUALIFICATION (the telecaller's job)

- 🖥️ **IN:** Telecaller opens **Cockpit** (`/sales`) — sees assigned leads, filtered by niche/city/type A-B-C-D, with follow-up queue.
- 🖥️ **IN:** Cockpit shows the **right script** for the lead's type + stage (cold open, follow-up steps, objection handlers) from `lib/FMOS_Script_Data`.
- 🌐 **OUT:** Telecaller **calls the lead on a real phone**. (FMOS does not dial — it scripts + logs.)
- 🌐 **OUT:** Telecaller sends WhatsApp/PDF from the business phone, or sends the Direct Report straight from FMOS (WhatsApp Cloud API live, send UI wired — `/admin/direct-report`).
- 🖥️ **IN:** Log the outcome → one of the cockpit outcomes: Sent Direct Report / Sent PDF / Follow-up Booked / Will Call Back / No Answer / Not Interested / Meeting Booked.
- 🔗 **FLOW:** Logging an outcome calls `leadStageUpdate()` → writes `outreach_stage`, stamps `last_activity_at`, writes to `outreach_logs` (the call record: `actor_id`, `outcome_id`, `touch_type`).
- 🖥️ **IN:** Stage change moves the lead's card on the **Outreach Board** (`/admin/outreach`) automatically.
- 🖥️ **IN:** PDF delivery tracking at `/admin/outreach/pdf-log`.
- 🖥️ **IN (intelligence):** Lead score (`lib/lead-scoring.ts`) ranks Hot/Warm/Cold from phone, interest, follow-up, recency. *(Logic exists; wiring into the cockpit list is a pending feature.)*

**▶ Connection:** outcome `meeting_booked` → lead leaves the outreach queue and appears in **Meetings**.

---

## PHASE C — MEETING

- 🖥️ **IN:** `/admin/meetings` lists all `meeting_booked` leads, sorted overdue/today/upcoming.
- 🖥️ **IN:** Pre-meeting **intel panel** — lead type, website/GMB/ranking status, opening strategy, checklist.
- 🖥️ **IN:** **WhatsApp reminder templates** (confirmation, 1h, 15-min) — preview + open in WhatsApp.
- 🖥️ **IN:** Browser notifications fire 1h + 15-min before.
- 🌐 **OUT:** You hold the actual meeting (call/in-person/video via `meeting_link`).
- 🖥️ **IN:** Capture `meeting_notes` inline; mark **Attended → Move to Proposals**.
- 🔗 **FLOW:** "Confirm & Move to Proposals" advances stage; lead appears in the **Proposals → Awaiting Proposal** section.
  - ✅ Schema note: `meeting_link` + `meeting_notes` columns exist in the live DB (the 2026-06-12 full sync covered them — no pending migration).

---

## PHASE D — PROPOSAL

- 🖥️ **IN:** `/admin/proposals` shows "Awaiting Proposal" (meetings done, no proposal yet).
- 🖥️ **IN:** Build proposal at `/admin/leads/[id]/proposal/new` — 3-step consultative builder:
  - Step 1: pick services (from `lib/data/services_data.json`), set setup fee + monthly retainer, validity, note.
  - Step 2: auto-generated consultative document (situation → growth funnel → why FortuneMarq → service deep-dives → investment table → next steps), personalised by lead type A/B/C/D.
  - Step 3: send — WhatsApp message + `wa.me` deep link.
- 🔗 **FLOW:** Saves to `proposals` table (`services` jsonb, `total_setup`, `total_monthly`, `status`). "Mark as Sent" → `status = sent` + lead `outreach_stage = proposal_sent`.
- 🌐 **OUT:** You send the proposal to the client via WhatsApp (sends as a WhatsApp document).

---

## PHASE E — AGREEMENT & CLOSE

- 🖥️ **IN:** From an accepted proposal → generate agreement at `/admin/leads/[id]/proposal/[proposalId]/agreement`.
- 🖥️ **IN:** Agreement detail `/admin/agreements/[id]` — review terms.
- 🌐 **OUT:** Client signs/agrees (verbal/WhatsApp/physical). Agreements send as a WhatsApp document.
- 🖥️ **IN:** Click **"Mark as Confirmed"** → `agreements.status = confirmed`, `confirmed_at` stamped.
- 🔗 **FLOW:** Confirmation is the trigger to convert the lead into a **Client**.

---

## PHASE F — ONBOARDING (lead → client)

- 🖥️ **IN:** Client onboarding tab (`components/clients/onboarding-tab.tsx`) — activate the client.
- 🔗 **FLOW:** `lib/onboarding/generateClientOnboarding.ts` spins up the initial client record + onboarding structure.
- 🖥️ **IN:** New row in `clients`; client now visible in `/admin/clients`.
- 🌐 **OUT:** Kickoff call, collect assets (logo, access, content), set expectations.
- 🖥️ **IN:** Optionally create a **client login** → they access `/client/dashboard` (the portal).

---

## PHASE G — DELIVERY (doing the work)

- 🖥️ **IN:** Work organised as **Projects** (`/projects`) + **Tasks** (`/tasks`).
- 🖥️ **IN:** PM dashboard (`/manager` / pm role) creates projects, assigns deliverables.
- 🖥️ **IN:** Deliverable manager tracks each output (paste URL for files today).
- 🌐 **OUT:** The actual work — websites built (outsourced freelancers), ads run, content created, SEO done.
- 🔗 **FLOW:** Tasks link to projects + clients; completion feeds team scorecards + client health.
- 🖥️ **IN:** Strategy Engine can generate the delivery task plan (Phase K) for a client.

---

## PHASE H — CLIENT MANAGEMENT & RETENTION

- 🖥️ **IN:** Client profile `/admin/clients/[id]` — 6 tabs (overview, onboarding, projects, etc.).
- 🖥️ **IN:** **Client reports** — build at `/admin/clients/[id]/reports/new`; share via public token link `/client/report/[token]` (no login needed).
- 🖥️ **IN:** **Renewals** dashboard `/admin/clients/renewals` — retainers coming due.
- 🌐 **OUT:** Monthly review calls, performance conversations.
- 🔗 **FLOW:** Review requests (Growth → GMB) ask happy clients for Google reviews → `review_requests`.
- ⏳ **Pending feature:** real-time client health score.

---

## PHASE I — FINANCE (recording the money)

> FMOS **records and reports** money; the bank **moves** it.

- 🖥️ **IN:** **Invoices** `/admin/finance/invoices` — create, track, **real PDF** (`@react-pdf/renderer`). Revenue type: MRR / setup_fee.
- 🌐 **OUT:** Client actually pays (UPI/bank/cash).
- 🖥️ **IN:** Mark invoice paid; track overdue.
- 🖥️ **IN:** **Expenses** `/admin/finance/expenses` — log agency costs.
- 🖥️ **IN:** **GST** `/admin/finance/gst` — GST view (GSTIN 29ICWPS9816Q1ZS).
- 🖥️ **IN:** **P&L** `/admin/finance/pnl` — revenue, profit, margin, health score, net cash (all computed from real data).
- 🔗 **FLOW:** Invoices + expenses → P&L + finance dashboard `/admin/finance`.
- ⏳ **Pending feature:** invoice payment reminders (cron exists in concept).

---

## PHASE J — TEAM & OPERATIONS (running the people)

- 🖥️ **IN:** **Team** `/admin/team` — add members, set roles, deactivate.
- 🖥️ **IN:** **Scorecards** `/admin/team/scorecards` — weekly per-role performance (telecaller from `outreach_logs`, strategist from `proposals`).
- 🖥️ **IN:** **Attendance** — staff clock-in/out (`/attendance`); admin view `/admin/attendance`; APIs `/api/attendance/*`.
- 🖥️ **IN:** **Work hours / sessions** `/admin/work-hours`, `/admin/sessions` — time tracking; CSV export.
- 🖥️ **IN:** **SOPs** `/admin/team/sops` — standard operating procedures library.
- 🌐 **OUT:** Actual management, training (Afifa-telecaller, outsourced freelancers-builders), payroll.
- 🔗 **FLOW:** `session-timeout` cron auto-closes stale sessions; attendance feeds work-hours reports.

---

## PHASE K — AGENCY'S OWN MARKETING (the growth loop you just rebuilt)

> This is FortuneMarq marketing *itself* — a closed loop: **Plan → Execute → Track → optimise.**

### K1 · PLAN — Strategy Engine (`/admin/strategy`)
- 🌐 **OUT:** Think up / write a marketing or acquisition strategy.
- 🖥️ **IN:** Paste it → **AI (Claude)** extracts dated, assigned, prioritised tasks → route to a destination (organic channel or acquisition city/niche).
- 🔗 **FLOW:** Saves to `strategy_runs` + `tasks` (+ `strategy_run_tasks` link).

### K2 · EXECUTE — Growth Hub (`/admin/growth`)
- 🖥️ **IN (Organic tab):** content pieces per channel (IG/LinkedIn/FB/GMB/SEO), task checklist, content calendar/kanban, GMB checklist + monthly metrics, review requests, SEO pages/keywords/backlinks.
- 🖥️ **IN (Acquisition tab):** city/niche targets, per-city lead stats, active campaigns.
- 🌐 **OUT:** Actually create + publish the content; do the SEO/GMB work.
- 🔗 **FLOW:** Publishing marks `content_pieces.status = published` → feeds Growth stats + strategy outcomes.

### K3 · TRACK — Marketing Analytics (`/admin/marketing`)
- 🖥️ **IN:** Inbound Funnel (real: leads→won, CPL, CAC, speed-to-lead) · Overview (real KPIs + weekly AI brief) · Paid Campaigns (budget pacing, real CPL trend) · Organic & SEO · Content Calendar.

### K4 · UNIFIED FRONT DOOR — Marketing Hub (`/admin/marketing-hub`)
- 🖥️ **IN:** One page: MTD KPIs + the 3-stage loop + recent strategies threaded to their **measured outcomes** + quick links.
- 🔗 **FLOW:** `fetchStrategyRunOutcome()` measures each strategy against real results (content published / leads won in its destination + timeframe) — *this closes the loop*.

### K5 · OPTIMISE
- 🌐 **OUT:** Read the numbers, decide what to change.
- 🖥️ **IN:** Feed the decision back into a new strategy (K1). Loop repeats.
- ⏳ **Pending (M3):** connect GSC + Meta/Google Ads + social APIs for fully-automatic tracking (today: CSV import + manual entry bridge these).

---

# LAYER 3 — AUTOMATION & INTELLIGENCE (the always-on brain)

## 3.1 Cron jobs (scheduled background tasks)
| Cron route | Purpose | Scheduled? |
|---|---|---|
| `/api/cron/daily-digest` | Daily summary (03:30) | ✅ yes |
| `/api/cron/admin-alerts` | Admin alerts (03:00) | ✅ yes |
| `/api/cron/automations/followups` | Auto follow-up reminders | ✅ GitHub Actions |
| `/api/cron/automations/sla` | SLA breach checks | ✅ GitHub Actions |
| `/api/cron/automations/tasks` | Task automations | ✅ GitHub Actions |
| `/api/cron/sla` | Speed-to-lead SLA | ✅ GitHub Actions |
| `/api/cron/session-timeout` | Close stale work sessions | ✅ GitHub Actions |
- 🔗 All require `CRON_SECRET`; all use service-role client.
- ✅ **Scheduled:** `.github/workflows/cron.yml` runs all jobs free (Vercel Hobby is once/day only) — SLA + follow-ups every 15 min, digest/alerts/session-cleanup daily. Needs `FMOS_BASE_URL` var + `CRON_SECRET` secret in the repo.

## 3.2 Automations engine (`lib/automations/engine.ts`)
- 🖥️ Rule-based: **trigger** (e.g. lead stage change) → **conditions** (field checks) → **actions** (notify, update, etc.), with **throttling** + full run logging (`automation_runs`).
- 🖥️ Managed inline at `/admin/automations` (enable/disable, edit, new rule).
- 🔗 Rules live in `automation_rules`; throttle state in `automation_throttle`.

## 3.3 Lead scoring (`lib/lead-scoring.ts`)
- 🖥️ Scores 0–10 (Hot/Warm/Cold) from phone, business name, niche-kit, follow-up, interest, recency.
- ⏳ Logic complete; surfacing it in the cockpit/lead list is a pending wire-up.

## 3.4 Notifications (`lib/notifications.ts`)
- 🖥️ In-app notification bell; `sendNotification()` helper; verify endpoint for browser push.

## 3.5 AI (Anthropic / Claude)
- 🖥️ Strategy task extraction (Phase K1) · AI sections of `/admin/reports` · marketing weekly briefs.
- 🔗 Server-side only (`ANTHROPIC_API_KEY` never touches the browser).

---

# DATA BACKBONE — KEY TABLES & WHO WRITES THEM

| Table | Holds | Written by |
|---|---|---|
| `leads` | every prospect + `outreach_stage` (SOURCE OF TRUTH) | import, webhooks, cockpit — via `pipeline.ts` |
| `outreach_logs` | every call/touch (`actor_id`, `outcome_id`) | telecaller cockpit |
| `proposals` | proposal docs + amounts | proposal builder |
| `agreements` | signed agreements | agreement flow |
| `clients` | active clients | onboarding |
| `projects` / `tasks` | delivery work | PM dashboard + strategy engine |
| `invoices` | billing | finance |
| `expenses` | agency costs | finance |
| `content_pieces` | organic content | Growth Hub |
| `ad_campaigns` / `ad_insights_daily` | paid spend/results | Paid tab + CSV import |
| `strategy_runs` / `strategy_run_tasks` | AI strategies + their tasks | Strategy Engine |
| `inbound_events` | raw inbound webhook log | inbound webhooks |
| `automation_rules` / `automation_runs` | automations + history | automations engine |
| `acquisition_targets` | city/niche focus | Growth acquisition |
| `gmb_*`, `seo_*`, `backlinks`, `review_requests` | SEO/GMB ops | Growth Hub |
| `profiles` | team members + roles | team management |

---

# ROLES — WHO TOUCHES WHAT

| Role | Lives in | Does |
|---|---|---|
| **Admin (you)** | everything | full control, finance, strategy, team |
| **Telecaller (Afifa)** | `/sales`, `/telecaller/my-stats` | calls, logs outcomes, books meetings |
| **Strategist** | `/strategist` | pipeline, proposals |
| **PM** | `/projects` | delivery, projects, tasks |
| **Staff (an outsourced freelancer, an outsourced freelancer)** | `/tasks`, `/attendance` | assigned work, clock in/out |
| **Client** | `/client/dashboard` | view own project + reports |

---

# MASTER CONNECTION DIAGRAM (end-to-end)

```
            OUTSIDE FMOS                          INSIDE FMOS
─────────────────────────────────   │   ─────────────────────────────────────
 Cold list (scrape niche+city)  ─────┼──► CSV upload ─┐
 Meta/Google ads ──webhook───────────┼──► /api/inbound─┤
 Landing page form ──────────────────┼──► /api/inbound─┼─► leads (outreach_stage)
 WhatsApp/referral/walk-in ──────────┼──► WA webhook ──┘        │
                                     │                          ▼
 Phone call (real) ◄─script──────────┼──  Telecaller Cockpit ─► outreach_logs
                                     │         │ log outcome
                                     │         ▼
                                     │   Outreach Board ─► Meetings ─► Proposals
 Client meeting (real) ◄─────────────┼─────────┘                         │
                                     │                                    ▼
 Client signs (real) ────────────────┼──► Agreements (confirm) ─► Clients
                                     │                                    │
 Do the work (web/ads/content) ◄─────┼──  Projects + Tasks ◄── Strategy Engine (AI)
                                     │                                    │
 Client pays (bank/UPI) ─────────────┼──► Invoices ─► P&L / Finance       │
                                     │                                    ▼
 Publish content (real) ─────────────┼──► Growth Hub ─► Marketing Analytics
                                     │         └──────► Marketing Hub (loop closes)
 Cron (Vercel) ──────────────────────┼──► digests · alerts · SLA · follow-ups
```

---

# QUICK GAP LIST (things built but not fully live)
1. ✅ **Auth gate** — DONE (2026-06-15). Lives in `proxy.ts` (Next 16 convention, not middleware.ts). Rewritten FAIL-OPEN: unauthenticated → /login; role routing only on positively-known role; any read error allows through (no lockout). This was the historic lockout source (old unguarded `getUser()` + `.single()`), now fixed.
2. ✅ **Cron scheduling** — DONE: `.github/workflows/cron.yml` runs all jobs free (Vercel Hobby is once/day only). Pings SLA + follow-ups every 15 min, digest/alerts/session-cleanup daily. Driven by `FMOS_BASE_URL` var + `CRON_SECRET` secret in the repo. (The `leads.last_contacted_at` / `stale_flag` / `next_action_date` columns all exist in the live DB.)
3. ✅ **Lead scoring** — DONE (2026-06-15): `calculateLeadScore` wired into the Telecaller Cockpit. Priority Queue now sorts hottest-first; each lead shows a Hot/Warm/Cold + score badge. No SQL. (`noContactIn7Days` factor left off until `last_activity_at` is surfaced to the cockpit query.)
4. ✅ **Outbound WhatsApp send** — DONE. Cloud API live (+91 79759 18980); `lib/whatsapp/send.ts` wired into the cockpit + `/admin/direct-report`.
5. ✅ **Proposals + agreements** — send as WhatsApp documents (invoices already use `@react-pdf/renderer`).
6. ✅ **`meeting_link`/`meeting_notes`** columns — exist in the live DB (no pending migration).
7. **External marketing APIs (M3)** — GSC, Meta/Google Ads, social reach (CSV/manual bridge today).
8. **Client health score** — planned, not built.

See `EXTERNAL_SETUP_GUIDE.md` (accounts/keys), `MARKETING_AUDIT_2026-06-14.md` (marketing detail),
`CONTINUE_HERE.md` (state + priorities).
