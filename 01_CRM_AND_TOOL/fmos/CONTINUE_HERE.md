# ▶ CONTINUE HERE — Session Handoff (Mac Mini continuation)
**Written:** 2026-06-16 · **Machine moved:** Windows PC → Mac Mini · **Branch:** `continue-on-mac`

> **Claude on the Mac: read THIS first, then `WHATSAPP_AUTOMATION_PLAN.md` and
> `AUDIT_FIX_CONTINUATION.md` (both in this folder). The Windows machine's Claude
> memory does NOT travel — this doc is the source of truth for where we are.**

App lives in `01_CRM_AND_TOOL/fmos` (Next.js 16 + Supabase + Tailwind v4).
Live at https://fmos.fortunemarq.com. Repo: github.com/fortunemarq-web/FortuneMarq-Build.

---

## 1. WHERE WE ARE (current truth — supersedes the older June-14 master docs)

The app is **deployed and live**. The June-14 `00_MASTER` docs say "not deployed / auth
missing / cron not scheduled" — that is STALE. Since then: FMOS is deployed, the auth gate
is done (`proxy.ts`, fail-open), GitHub-Actions cron runs and is verified, lead scoring is
wired, the DB is fully synced, and the daily WhatsApp report is wired.

**11 commits sit on `continue-on-mac` (and were NOT pushed to `main` — no production
deploy yet by owner's choice).** `c12f943`→`cb4402b`. `npx tsc --noEmit` = 0, `npm run build` green.
- 10 audit-fix commits (`c12f943`→`0c7add5`) — see `AUDIT_FIX_CONTINUATION.md`.
- 1 WhatsApp automation Phase-1 commit (`cb4402b`).

---

## 2. WHAT THIS SESSION DID

**Audit fixes (done, committed):** Task 3 WhatsApp env (`ADMIN_WHATSAPP_NUMBERS` set in
Vercel = `918904192656,919353082656,971502846785`); fixed duplicates-scan throwing filter;
fixed team_targets daily-goal end-to-end (code-only, existing columns); retired dead
`outreach_sequences` (9 files). A1 migration-replay deferred (needs Docker/psql). Details in
`AUDIT_FIX_CONTINUATION.md` §6.

**WhatsApp automation — big initiative (owner wants it full-scale before customer go-live):**
- **Plan written:** `WHATSAPP_AUTOMATION_PLAN.md` — full lifecycle map divided into **3
  channels** (1: leads/clients · 2: admin · 3: staff), prerequisites, build phases, decisions.
- **Phase 1 built + committed (`cb4402b`):** a generic `send_whatsapp` ACTION on the
  automation engine — `lib/automations/{types,actions}.ts` + helpers `lib/whatsapp/
  recipients.ts` + `lib/whatsapp/params.ts`. Resolves recipient by audience
  (lead/client/admin/staff), opt-out guard, template resolution (flat OR A/B/C/D lead-type),
  Graph-API param building. **Inert until a rule is enabled — nothing sends yet.** Works now
  with the 4 already-wired triggers (`lead_created`, `lead_followup_due`, `lead_sla_missed`,
  `task_overdue`).

**Whole-repo alignment audit (chat only — captured in §4 below so it travels):** read the
`00_MASTER` docs + the app; confirmed the owner's 4-stage operating model aligns strongly
with the repo's documented "Master Flow."

---

## 3. NEXT STEPS (pick up here)

1. **WhatsApp Phase 2 — fire `runTrigger` at every lifecycle event** (the keystone =
   `lead_outcome_logged` from the cockpit + pitch list; then meeting_booked, proposal_sent,
   agreement_sent/signed, client_created, invoice events, report_published). Each is additive
   + inert until a rule exists. This is the next build (was about to start when we moved).
   Build order + per-event detail: `WHATSAPP_AUTOMATION_PLAN.md` §5 Phase 2.
2. **Collect prerequisites in PARALLEL (owner, external):** submit the Channel-1 Meta
   templates (`WHATSAPP_AUTOMATION_PLAN.md` §4a) + the 2 generic internal templates
   (`admin_alert`, `staff_alert`); collect staff WhatsApp numbers (`profiles.phone`).
3. **Open design decisions** that shape the build — `WHATSAPP_AUTOMATION_PLAN.md` §6
   (report delivery mechanic, opt-out policy, quiet hours). Not blocking; sensible defaults
   are baked in.
4. **Owner-gated, still pending:** push `continue-on-mac` → merge to `main` (triggers Vercel
   deploy + activates the admin daily report — safe; no customer messages). A1 migration replay.

---

## 4. 4-STAGE OPERATING MODEL — alignment + gaps (captured from this session)

Owner's 4 stages = the repo's documented Master Flow. Alignment is strong; gaps are build-status.

- **Stage 1 — Data → demand → competitor → A/B/C/D typing → reports** (`07_DATA_AND_RESEARCH`):
  Hubli COMPLETE (7,298 leads, 75 market-intel PDFs, keyword data 9c×14n, competitor data).
  GAPS: 8 more cities pending; NO structured competitor table in FMOS; report PDFs sent manually.
- **Stage 2 — LPs/portfolio → strategy → creative → campaigns → tracking → optimise**
  (`06_PAID_MARKETING`,`05_ONLINE_PRESENCE`,`02_SERVICE_DELIVERY`): FMOS has tracking
  (attribution, ad-spend import, marketing hub, strategy engine, growth hub, `/lp/[niche]/[city]`).
  GAPS (LEAST-built stage = the bottleneck): niche landing pages, ad accounts, creative
  production pipeline, live campaigns, conversion/pixel setup, portfolio showcase — mostly
  external + pending. No ads → no inbound → Stage-3 curiosity flow has nothing to run on.
- **Stage 3 — curiosity → priority calls → meetings** (`03_SALES_SYSTEM` + cockpit): cockpit,
  scripts, outreach board, 9 outcomes, follow-up queue, lead scoring, meetings, approved
  templates (a/b/c; d in review), inbound webhook + button-tap priority + auto-replies, retry
  logic — all built. GAPS: outbound WhatsApp SEND is manual (the Phase-1 engine targets this);
  the "ad-live-2-days → curiosity blast → prioritise engagers → then non-repliers" automation
  not wired; niche↔live-campaign link missing.
- **Stage 4 — meetings → proposal → agreement → onboard → deliver → invoice → scale**
  (`04`/`08`/`09` + FMOS): proposals, agreements, onboarding, clients, projects/tasks, invoices
  (real PDF), expenses, GST, P&L, scorecards, renewals — built. GAPS: real PDF for
  proposal/agreement (browser-print today), WhatsApp doc-send, client health score, upsell
  triggers, invoice payment reminders, some manual handoffs.

**Cross-cutting "foolproof" gaps:** (1) outbound WhatsApp automation [in progress], (2) the
niche+city campaign isn't a first-class object threading all stages, (3) Stage 2 demand engine
is the bottleneck, (4) real PDFs + doc-send, (5) retention loop (health/upsell/reminders),
(6) external API connections (GSC, Meta/Google Ads, social — CSV bridge today).

Proposed: capture this as a living `FMOS_OPERATING_MODEL.md` and close gaps stage by stage.

---

## 5. KEY FACTS
- **Branch with all work:** `continue-on-mac` (push it / clone it on the Mac; merge to `main`
  only when ready to deploy).
- **Env:** `.env.local` is GITIGNORED — it does NOT travel with git. Recreate it on the Mac
  (copy the file over, or `vercel env pull`). All values are also set in Vercel.
- **Verify after setup:** from `01_CRM_AND_TOOL/fmos` → `npm install` → `npx tsc --noEmit`
  (expect 0) → `npm run dev`.
- **Conventions (don't break):** auth gate = `proxy.ts` (never `middleware.ts`), fail-open.
  Lead stage writes only via `lib/pipeline.ts`. Commits scoped to `01_CRM_AND_TOOL/fmos`.
  Green = `brand-deep` #1E7A4F. No emoji in UI chrome. See `CLAUDE.md`.
