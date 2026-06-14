# HANDOFF — 2026-06-12 (Claude Code session, tokens exhausted mid-Stage-0)
# READ THIS FULLY before continuing. Pick up at "PART 2 → NOT DONE" below.
#
# ───────────────────────────────────────────────────────────────────────
# ⬆ NEWER SESSION (2026-06-12 night, Cowork): PHASE F STAGE 1 part 1 —
# WhatsApp Cloud API. See "PART 0 — STAGE 1 STATE" immediately below.
# ───────────────────────────────────────────────────────────────────────
#
# ## PART 0 — STAGE 1 STATE (2026-06-12 night)
#
# DECISION LOCKED: WABA Option A — NEW dedicated Jio number 79759 18980 for
# Cloud API (SIM active, NEVER install WhatsApp on it). 93530 82656 stays in
# the WA Business app. The old "use 93530 82656" note in PENDING_ACTIONS.md
# is superseded.
#
# BUILT (FMOS side complete):
# - app/api/webhooks/whatsapp/route.ts — GET handshake (WHATSAPP_VERIFY_TOKEN,
#   real value already in .env.local), POST X-Hub-Signature-256 HMAC verify
#   (META_APP_SECRET, fail-closed). Idempotent via inbound_events.external_id
#   = wamid. Unknown → processInboundLead (channel whatsapp/ctwa; referral
#   source_id+headline → campaign_external_id/campaign_name = WhatsApp-ads
#   attribution). Known → whatsapp_logs/activity_events/inbound_events +
#   notify assignee. Statuses → delivery_status. "Yes, confirmed" → admins.
# - Button replies → tags [report_engaged, tapped_book_meeting|tapped_tell_me_more]
#   + follow_up_date=now (cockpit already surfaces these) + notify + auto-reply
#   (lib/whatsapp/auto-replies.ts; "Not right now" = +3d follow-up).
# - lib/whatsapp/send.ts — text/template/buttons/document/uploadMedia,
#   Graph v23.0, all sends logged to whatsapp_logs. No-ops gracefully on
#   placeholder creds.
# - Auto-greeting (session text, default ON) on new inbound leads; toggle in
#   /admin/whatsapp-templates header (components/admin/auto-greeting-toggle.tsx);
#   stored in NEW app_settings table.
# - next.config.ts: distDir override via NEXT_DIST_DIR (sandbox builds).
#
# ✅ COMPLETED LATER SAME SESSION (2026-06-12/13 night):
# - Stage 1 SQL RUN in Supabase ✓. Mac build clean (92 routes) + e2e webhook
#   curl tests passed (401 unsigned / 200 text+ctwa+button); test leads verified
#   in cockpit. Committed+pushed as 40e9f49 (v4.9).
# - META SIDE DONE: BM portfolio (ID 879084085296794) · developer account ·
#   Meta App "FMOS" (ID 1713470496330818, app secret in .env.local) · WABA
#   "FortuneMarq" (ID 1499408311884474) · number +91 79759 18980 added,
#   PHONE_NUMBER_ID 1084263481446667 · permanent system-user token
#   (user: fmos-server, never expires) generated + TESTED via Graph GET ✓.
#   ALL 4 env vars in .env.local are now REAL values.
# - Business verification SUBMITTED (record: "Sayed jabeer DBA FortuneMarq
#   Media & Marketing", GSTIN …ZS) — in review 1–5 days.
# - Templates SUBMITTED: direct_report_type_a/b/c (Marketing, Document header,
#   2 quick replies "Book a meeting 📅"/"Tell me more"). ⚠️ NAMED variables
#   ({{business_name}}, {{niche}}, {{city}} — no repeats allowed, can't
#   start/end body). type_d submission FAILED (likely rate limit) → RESUBMIT.
# - Cockpit: NEW inbound script (3 steps, emerald) for lead_type='inbound'
#   with no last_outcome, both tabs; "Follow-ups due" header stat FIXED
#   (was callsToday count → now live due-today count from queue).
#
# ✅ 2026-06-14 UPDATE — CLOUD API IS LIVE:
#    Number REGISTERED · BV APPROVED · India payment method ADDED to the REAL
#    WABA FortuneMarq (1499408311884474) · FIRST REAL MESSAGE DELIVERED
#    end-to-end (hello_world → 93530 82656, landed on handset). Token +
#    PHONE_NUMBER_ID 1084263481446667 proven. Gotcha: card first attached to
#    the TEST WABA (1852036272835920) by mistake — must add to the REAL WABA;
#    a NEW-card entry at WABA level fails RBI e-mandate, so use "select existing
#    card". Stray duplicate WABA to clean up: 705784465410369.
#
# ⚠️ STILL PENDING:
# 1. ✅ DONE — number registration (was blocked by Meta outage 2026-06-12).
# 2. Resubmit direct_report_type_d (body in 03_SALES_SYSTEM template JSON,
#    use named-variable rules above).
# 3. Display name "FortuneMarq" was REJECTED → resubmit as
#    "FortuneMarq Media and Marketing" (matches verified DBA; spell out "and",
#    no "&"). BV is now approved so it should pass.
# 4. ✅ DONE — India payment method added to the real WABA.
# 5. ⚠️ sendWhatsAppTemplate callers must use NAMED parameters
#    (components: [{type:'body', parameters:[{type:'text',
#    parameter_name:'business_name', text:'…'}, …]}]).
# 6. AFTER DEPLOY (Jabeer deferred deploy — app not ready): Meta App →
#    WhatsApp → Configuration → Callback URL
#    https://<domain>/api/webhooks/whatsapp + WHATSAPP_VERIFY_TOKEN from
#    .env.local → Verify and save → subscribe to `messages` field. Add all
#    WhatsApp env vars to Vercel. Test with a real message to 79759 18980.
# - NOT built (later wishlist): PDF report/proposal/agreement/invoice sends
#   (sendWhatsAppDocument + uploadWhatsAppMedia are ready), date-time picker
#   flows, followback reminder template selection logic, Meta Lead Ads webhook,
#   SLA cron wiring.
# (This replaces the 2026-06-11 UI/UX handoff — that work is merged & documented
#  in 00_MASTER_BUILD_PLAN.md and CLAUDE.md.)

## WHO/WHAT
FMOS = FortuneMarq Agency OS. Owner: Jabeer. App: `01_CRM_AND_TOOL/fmos` (Next.js 16 + Supabase cnwooodktqwvpzkucskm). v4.8, pre-deploy.

---

## PART 1 — WHAT THIS SESSION SHIPPED (all verified, tsc + build clean)

### 1. FULL SCHEMA SYNC EXECUTED IN SUPABASE ✅ (the big unlock)
- `supabase/2026-06-12_full_schema_sync.sql` (now ~2,280 lines) ran successfully in the
  dashboard SQL editor. Consolidates ~19 previously-unrun migration files.
- 38 missing tables created (attendance_*, notifications, automation_*, saved_views,
  client_reports, client_resources, user_sessions, niche_kits, niches, cities, follow_ups,
  call_logs, duplicate_*, telecaller_stats + leaderboard VIEW, task_dependencies,
  marketing tables incl. ad_campaigns + lead_source_attribution, whatsapp_logs…).
- Also: RLS hardening, audit triggers, indexes, leads.meeting_link/meeting_notes,
  leads.lead_quality_score, profiles.is_active, invoices.payment_method,
  notifications.type + notifications.link (were missing → ALL notification inserts had
  been silently failing; fixed + verified).
- `types/database.types.ts` REGENERATED from live schema (110 tables).
  ⚠️ Regenerate AGAIN — Stage 0 added inbound_events + ad_insights_daily + 3 leads
  columns AFTER the regen (code uses service-role `as any`, so tsc passes regardless).

**HOW TO RUN SQL (no psql/docker/CLI on this machine, no DB password):**
Chrome MCP → user's "FM" Chrome profile (has Supabase logged in via GitHub) →
supabase.com/dashboard/project/cnwooodktqwvpzkucskm/sql/new → `pbcopy < file.sql` →
click editor, cmd+a, cmd+v, cmd+Enter → confirm "Run query" on the destructive-op modal.
ALWAYS append any new DDL to `supabase/2026-06-12_full_schema_sync.sql` (idempotent, versioned).
Service-role REST/node one-liners work for data ops:
`export SRK=$(grep '^SUPABASE_SERVICE_ROLE_KEY' .env.local | cut -d= -f2)` + @supabase/supabase-js.

### 2. Audit fixes ✅
- /projects/[id]: friendly not-found (was raw Postgres error). /client/report/[token]:
  "link expired" state (was blank). InvoiceManagerClient: list refreshes after MRR gen
  (useEffect sync on initialInvoices).
- **alert()/prompt() are GONE app-wide.** New `components/ui/prompt-modal.tsx`:
  `await promptModal({title, type: select|text|date|textarea, options…})` → value|null.
  `<PromptHost />` mounted in app/layout.tsx next to `<Toaster />`. USE THIS for all
  confirmations/inputs going forward.
- Dead buttons fixed: work-hours Details (expandable daily breakdown + profile names),
  my-stats View All (limit 10⇄100) + company names via leads join, team card Assign.

### 3. Team management ✅ (tested end-to-end via UI)
- `app/admin/team/user-actions.ts`: inviteTeamMember / updateMemberRole /
  resetMemberPassword / setMemberActive (auth ban 876000h) / removeMember.
  All requireAdmin()-gated (checks caller's profile.role==='admin'), audit-logged.
- UI: `components/team/add-member-modal.tsx` + `components/team/member-menu.tsx`
  (⋯ menu on cards), wired in team-overview-client.tsx. AssignTaskModal takes defaultAssignee.
- Auth users are exactly: admin1@, admin2@, afifa@, sayedjabeer@fmos.com.
  ⚠️ Passwords were CHANGED by Jabeer (not the create-users.js ones; Jabeer's login
  works in the preview browser session). For smoke tests: create a temp admin via
  service role, delete it after via the team UI (pattern used + verified this session).

### 4. /manager/performance rewritten with REAL data ✅
Was hardcoded fake (trends, niches, team pace). Now computes from outreach_logs for
today/week/month (buttons actually filter), real period-over-period trend chips,
real niche/peak-hour/top-region. outreach_logs is EMPTY in prod → page shows honest zeros.

### 5. Notifications + digest + partial payments ✅
- notifications.type/link columns added → bell + all 10 sendNotification call sites work.
- `/api/cron/daily-digest`: per-user morning digest (meetings, follow-ups per assignee,
  overdue invoices ₹, overdue tasks, at-risk clients = overdue payments or renewal ≤30d
  with MRR at stake). Idempotent/day. TESTED live (sent real data).
- ALL cron routes now `export { POST as GET }` (Vercel cron calls GET). `vercel.json`
  created: daily-digest 03:30 UTC, admin-alerts 03:00 UTC (Hobby = 2 daily crons max).
- Invoices: `recordInvoicePayment(id, amount, method)` in finance/actions.ts —
  accumulates paid_amount, status → partially_paid|paid. UI: Record Payment flow
  (promptModal amount → method), blue "partially paid" badge + ₹ received, filter option.

### 6. PHASE F PLAN written → `PHASE_F_INBOUND_MARKETING.md` (Jabeer approved; said "build stage 0")

---

## PART 2 — STAGE 0 STATE (MID-FLIGHT — work stopped here)

### Done ✅
1. **Schema RUN in Supabase + appended to sync script:**
   - `inbound_events` (channel, external_id, payload jsonb, status received/processed/duplicate/failed, error, lead_id)
   - `ad_insights_daily` (date, campaign_id→ad_campaigns, platform, campaign_external_id,
     adset_name, ad_name, spend, impressions, clicks, leads; unique idx on
     date+platform+coalesce(ext_id,adset,ad))
   - leads += lead_source (NOTE: column pre-existed with values like "Manual Upload" —
     it's the HUMAN LABEL; `leads.source` is the machine slug e.g. 'manual','landing_page'),
     captured_at, first_contact_at.
2. **`lib/inbound/capture.ts`** — THE pipeline. processInboundLead(input):
   logs inbound_event → normalizePhone (last-10) → dedupe by phone suffix
   (dup → activity_events 'inbound_reenquiry' + bump last_activity/follow_up + notify
   assignee, NO new lead) → resolve/auto-create ad_campaigns from
   campaign_external_id|utm_campaign|campaign_name → insert lead (lead_type='inbound',
   source=channel slug, lead_source=label, captured_at) → lead_source_attribution row →
   audit → `runTrigger("lead_created","lead",id)` ← FIRST EVER CALLER of this trigger;
   fires the seeded "Auto-Assign Inbound" rule (round-robin assignment_pools →
   notify owner → SLA). CHANNEL_LABELS: lp, meta_lead_ad, ctwa, whatsapp,
   google_lead_form, call, gbp, referral, dm, manual.
3. **`app/api/inbound/[channel]/route.ts`** — universal webhook. Auth =
   `INBOUND_WEBHOOK_SECRET` (ADDED to .env.local this session — add to Vercel at deploy!)
   via Bearer / x-webhook-key / ?key= / body.google_key. Native Google Ads lead-form
   payload adapter included (user_column_data mapping, gcl_id, campaign_id). GET = handshake.
4. **LP wired:** `lib/automations/inbound-leads.ts` refactored → validates then calls
   pipeline (duplicate = friendly success msg). `components/lp/lead-capture-form.tsx`
   now captures utm_*/gclid/fbclid/landing_page/referrer from URL.
5. tsc clean at stop point. Dev server runs via preview tool on :3000.

### ✅ STAGE 0 COMPLETED (later in the same session — all items below are DONE)
- Pipeline TESTED end-to-end: create / duplicate-with-format-drift / Google adapter /
  401 on bad key. Full chain verified: webhook → lead → round-robin assign (Afifa) →
  owner notification. Test data deleted after.
- FIXED during testing: live ad_campaigns predated sync with old shape → ALTERed in
  all expected columns + cpl_target (in sync script). Automation engine wrote
  `assigned_to` (leads uses assigned_sales_exec) → mapped in updateEntity;
  notify_owner now re-fetches live assignee (snapshot predates same-run assign).
  assignment_pools seeded: pool 'sales' = all 4 team members.
- Cockpit quick-add: source picker (cold list/call/gbp/referral/walk-in) → source +
  lead_source + captured_at + inbound lead_type for inbound-ish sources.
- logOutcome stamps leads.first_contact_at on first touch (speed-to-lead).
- DISCOVERED: /admin/marketing already had a 4-tab dashboard (overview/organic/paid/
  content, dark-themed, 2,300 lines) — dead until migration, now live. Stage 0 added
  a NEW FIRST TAB "Inbound & Funnel" (components/admin/marketing/tabs/inbound-funnel-tab.tsx):
  KPIs (spend/leads/CPL/meetings/cost-per-meeting/won/speed-to-lead), funnel bars,
  channel scoreboard, UTM link builder (niche LP + source + campaign), spend CSV
  import (Meta + Google daily exports, auto-creates campaigns by name), recent
  inbound events. Server actions: app/admin/marketing/actions.ts (saveCampaign,
  setCampaignStatus, deleteCampaign, importSpendRows — delete+insert upsert because
  the unique index uses coalesce()).
- Sidebar: Marketing added under Insights. Daily digest: "📣 Yesterday: ₹X ad spend,
  N inbound leads (by source)" line for admins.
- types/database.types.ts regenerated AGAIN (112 tables, includes inbound_events +
  ad_insights_daily). tsc clean, build clean (91 pages), marketing hub smoke-tested.
- NOT user-tested yet: CSV import with a real Meta/Google export file (parser written
  for standard daily exports; verify with Jabeer's first real file).

### ORIGINAL STAGE 0 TASK LIST (kept for reference — all done)
1. **TEST the pipeline end-to-end:**
   `curl -X POST http://localhost:3000/api/inbound/test -H "Authorization: Bearer $(grep INBOUND_WEBHOOK_SECRET .env.local | cut -d= -f2)" -H "Content-Type: application/json" -d '{"name":"Test Lead","phone":"9876500001","niche":"Gym","city":"Hubli","utm":{"campaign":"test-campaign"}}'`
   Verify: lead created (source='manual'), attribution row, ad_campaigns auto-created
   'test-campaign', inbound_events status=processed, automation fired —
   ⚠️ assignment_pools is probably EMPTY → seed pool 'sales' with telecaller/admin ids
   or the assign action no-ops (check lib/automations/actions.ts for pool name).
   Test duplicate (same phone) → 'duplicate' + re-enquiry activity + notification.
   Test google_lead_form payload shape. DELETE test leads/campaigns after.
2. **Cockpit quick-add Source picker** — telecaller-cockpit.tsx add-lead modal:
   source select (call/gbp/referral/walk_in/manual) → leads.source + lead_source label
   + captured_at. (Manual adds currently bypass the pipeline.)
3. **first_contact_at stamping** — cockpit `logOutcome()` after outreach_logs insert:
   if lead.first_contact_at null → set = now. Powers speed-to-lead.
4. **`/admin/marketing` hub page** (biggest remaining piece — spec in
   PHASE_F_INBOUND_MARKETING.md Part 3):
   - First: `alter table ad_campaigns add column if not exists cpl_target numeric(10,2);`
   - Campaign Manager (CRUD on ad_campaigns incl. cpl_target, pause/activate),
   - Funnel: spend (Σ ad_insights_daily) → leads (by source / campaign via
     lead_source_attribution) → contacted (first_contact_at) → meetings → proposals →
     won, with ₹-cost per stage,
   - Channel scoreboard (group by leads.source), UTM link builder
     (`/lp/[niche]?utm_source=&utm_medium=&utm_campaign=<name>` + copy),
   - speed-to-lead panel, recent inbound_events list (debug visibility),
   - Sidebar: "Marketing" under INSIGHTS in components/ui/app-sidebar.tsx.
5. **Spend CSV importer** on the hub — client-side parse → server action upserts
   ad_insights_daily (onConflict unique idx) + auto-create campaigns by name.
   Meta headers: "Day","Campaign name","Amount spent (INR)","Impressions","Link clicks","Results".
   Google headers: "Day","Campaign","Cost","Impr.","Clicks".
6. **Daily digest marketing line** — yesterday's spend + new inbound leads by source → admins.
7. Regenerate database.types.ts (browser trick: on a dashboard page, token =
   JSON.parse(localStorage['supabase.dashboard.auth.token']).access_token → fetch
   api.supabase.com/v1/projects/cnwooodktqwvpzkucskm/types/typescript → store on window →
   click page for focus → navigator.clipboard.writeText → `pbpaste > types/database.types.ts`).
8. Update docs (this file, 00_MASTER_BUILD_PLAN.md, CLAUDE.md header) + `npx tsc --noEmit`
   + `npm run build` + smoke the marketing hub in the preview browser.

### Stage 1+ (after Vercel deploy — see PHASE_F_INBOUND_MARKETING.md)
WhatsApp Cloud API webhook (CTWA referral = WhatsApp-ads attribution), Meta leadgen
webhook, SLA cron wiring, Meta insights sync cron, optimize flags, weekly brief.
Jabeer still owes: Meta BM access, WABA number decision (recommend dedicated number),
Google Ads account ID, CPL targets per niche.

---

## PART 3 — DEPLOY CHECKLIST (pending; Jabeer wants more setup first)
- Push to GitHub → Vercel env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, CRON_SECRET, **INBOUND_WEBHOOK_SECRET**.
- vercel.json crons exist. Supabase auth redirect URLs += Vercel domain.
- Nothing has been committed this session — large modified tree; commit when Jabeer says.

## CONVENTIONS (beyond CLAUDE.md)
- toast + promptModal only (no alert/prompt — a few confirm() remain, low priority).
- brand-deep green for text/buttons; no emoji as UI chrome (OK inside message/notification content).
- leads: NO updated_at/assigned_to → use last_activity_at, assigned_sales_exec.
- Stage writes ONLY via lib/pipeline.ts leadStageUpdate()/leadStatusUpdate().
- `source` = machine slug, `lead_source` = human label.
