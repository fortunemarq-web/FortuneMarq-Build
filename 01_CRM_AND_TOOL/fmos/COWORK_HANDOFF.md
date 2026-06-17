> # ⚠️ HISTORICAL / SUPERSEDED — not the current state
> Dated plan/audit/handoff log, kept for history. **Live build state:** `00_MASTER/FMOS_System_Design_And_Tasks.md` (newest dated entries) + `01_CRM_AND_TOOL/fmos/CONTINUE_HERE.md` (canonical handoff). As of **2026-06-17**: FMOS is **deployed \& live**; Stages 1/3/4 + the AI bot (6.1) + messaging safety/inbox (6.2–6.4) are built; WhatsApp Cloud API live with **33 Meta-approved templates**; the "curiosity" teaser was replaced by the **Direct Report**; team = **Jabeer + Afifa** (delivery via freelancers).

# FMOS — Master Handoff
**Last updated:** 2026-06-15 · **Read this fully before touching anything.**
**Current phase: MID-DEPLOY on Vercel.** Build phase is complete; we're wiring up hosting.

---

## 0. WHERE WE ARE RIGHT NOW (the one thing that matters)

We are **partway through deploying FMOS to Vercel.** The user is on the Vercel
**import → configuration screen** for the repo `FortuneMarq-Build`.

**The immediate next actions (finish the deploy):**
1. Set **Root Directory = `01_CRM_AND_TOOL/fmos`** (the app lives in this subfolder, not the repo root).
2. Add the **10 environment variables** (see §6) — copy values from local `.env.local`.
3. Click **Deploy**.
4. Then do **post-deploy config** (§5).

The user will be sending **screenshots** in Cowork — guide them screen by screen.

---

## 1. MACHINE / REPO / ACCOUNTS

- **OS:** Windows 11. **App path:** `C:\Users\sayed\FortuneMarq-Build\01_CRM_AND_TOOL\fmos`
- **Git repo root:** `C:\Users\sayed\FortuneMarq-Build` (branch **main**). App is in subdir `01_CRM_AND_TOOL/fmos`. **Commits are scoped to that subdir** (`git add -A 01_CRM_AND_TOOL/fmos`) — there's other unrelated stuff in the repo root.
- **GitHub:** `github.com/fortunemarq-web/FortuneMarq-Build` (company account `fortunemarq-web`, email fortunemarq@gmail.com). Repo was transferred off the personal account `sayedjabeer`. Last commit: `169a14e`.
- **Pushing:** HTTPS with a fine-grained PAT (Contents + **Workflows** read/write — Workflows perm is required because of `.github/workflows/cron.yml`). Windows Credential Manager caches it after first push.
- **Supabase:** project `cnwooodktqwvpzkucskm`, in org **`fotunemarq-ship-it's Org`**. Company account (login via **GitHub `fortunemarq-web`**) is now **Owner**. (Supabase has NO Google login — always log in via GitHub.) An empty stray org `fortunemarq@gmail.com's Org` exists — ignore it; do NOT point the app at it.
- **Vercel:** sign in via **GitHub `fortunemarq-web`**. Free (Hobby) tier for the ~3-month trial.
- **Hosting split:** Hostinger Business = shared hosting (can't run Next SSR). Use it for the **domain DNS** + **client WordPress/static sites**. FMOS runs on **Vercel**; `fmos.fortunemarq.com` points to Vercel via a Hostinger CNAME.

**Account consolidation goal:** everything under `fortunemarq@gmail.com` / `fortunemarq-web`. Old identities: `fotunemarq@gmail.com` (typo, original Supabase), `sayedjabir33@gmail.com` (old git author). Don't delete old accounts until the live site is confirmed working.

---

## 2. WHAT FMOS IS

FortuneMarq Marketing Operating System — a Next.js 16 + Supabase CRM for Jabeer's Hubli marketing agency. Full lifecycle: lead calling → outreach → meetings → proposals → agreements → clients → finance → team, plus the agency's own marketing engine.

**Stack:** Next.js 16 App Router · TypeScript · Tailwind v4 · Supabase · Recharts · `@react-pdf/renderer`

**Supabase client rules (critical):**
- Server components/actions → `createServerClientWithCookies()` (`@/lib/supabase-server`)
- Client components → `createClient()` (`@/lib/supabase`)
- Cron + webhooks (no user) → `createAdminClient()` (service role)

**Conventions:**
- Lead stage changes ONLY via `leadStageUpdate()`/`leadStatusUpdate()` in `lib/pipeline.ts` (single source of truth).
- No emoji as UI chrome (emoji in WhatsApp/script *content* is fine). Use `toast` + `promptModal` (no native alert/confirm).
- `brand-deep` (#1E7A4F) for green text/buttons; `#42CA80` for accents.
- **Auth gate lives in `proxy.ts`** (Next 16 renamed middleware → proxy). It's FAIL-OPEN — keep it that way. Edit `proxy.ts`, never create `middleware.ts`.
- `npx tsc --noEmit` must stay at 0 errors before any commit.

---

## 3. BUILD STATUS

| Area | Status |
|---|---|
| Phase 1 bug sweep (17 fixes + confirm→promptModal) | ✅ |
| Marketing honesty pass (9 fake widgets removed) | ✅ |
| Strategy→outcome loop + Marketing Hub (`/admin/marketing-hub`) | ✅ |
| Lead scoring in telecaller cockpit (queue sorts hottest-first) | ✅ |
| Onboarding build-ready intake (GENERAL basics + WEBSITE brief + WA/AI services + readiness) | ✅ |
| Delivery Load dashboard (`/admin/delivery-load`) | ✅ |
| GitHub-Actions cron scheduler (`.github/workflows/cron.yml`) | ✅ |
| Fail-open auth gate (`proxy.ts`) — fixes historic lockout | ✅ |
| Daily AI WhatsApp report Phase 1 (`lib/reports/dailyReport.ts`) | ✅ built, needs activation |
| Schema | ✅ in sync, NO pending SQL (verify: `supabase/2026-06-15_verify_schema.sql`) |
| TypeScript | ✅ 0 errors · committed+pushed `169a14e` |

**New-feature ideas are parked in `FUTURE_FEATURES.md`.** Do NOT build them mid-deploy — finish deploy first.

---

## 4. THE DEPLOY (finish this)

**Vercel import config screen:**
- Root Directory → **`01_CRM_AND_TOOL/fmos`**
- Framework → Next.js (auto)
- Environment Variables → add the 10 from §6
- Deploy

**Continuous deployment (what the user wants):** once connected, every `git push` to `main` auto-builds and goes live. Failed builds keep the last good version up. Branch pushes get preview URLs.

---

## 5. POST-DEPLOY CONFIG (after first successful deploy)

- [ ] **Supabase auth redirect URLs** — add the live domain (Authentication → URL Configuration) or login breaks.
- [ ] **Domain** — Vercel → add `fmos.fortunemarq.com` → add the CNAME it gives you in Hostinger hPanel → DNS Zone.
- [ ] **WhatsApp inbound webhook** — Meta App → callback `https://fmos.fortunemarq.com/api/webhooks/whatsapp` + verify token (`WHATSAPP_VERIFY_TOKEN`) + subscribe `messages`.
- [ ] **GitHub Actions cron** — repo Settings → Secrets and variables → Actions: Variable `FMOS_BASE_URL`=`https://fmos.fortunemarq.com`, Secret `CRON_SECRET`=(same as env). Turns on SLA + follow-up automation.
- [ ] **Daily AI report** — submit Meta template `daily_report` (named params `report_date` + `summary`) + set env `ADMIN_WHATSAPP_NUMBERS` (2 admin numbers, comma-sep).
- [ ] **Automation rules** — in `/admin/automations` create rules for `lead_sla_missed` / `lead_followup_due` → notify (gives the cron teeth).
- [ ] **Smoke test** — dry-run a test lead through the A→H pipeline; confirm login works with the new `proxy.ts` gate.
- [ ] **Meta Lead Ads / Google lead-form webhooks** — only if running paid ads (see EXTERNAL_SETUP_GUIDE §7–8).

---

## 6. ENV VARS (add all 10 to Vercel; values from `.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
CRON_SECRET
INBOUND_WEBHOOK_SECRET
WHATSAPP_API_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_VERIFY_TOKEN
META_APP_SECRET
```
Optional (add later): `ADMIN_WHATSAPP_NUMBERS`, `DAILY_REPORT_TEMPLATE`, `DAILY_REPORT_TEMPLATE_LANG`, `WHATSAPP_LP_FALLBACK_URL`.
⚠️ `.env.local` is gitignored — NEVER commit it. Hardening to-dos: rotate `ANTHROPIC_API_KEY` (leaked in chat), get a permanent WhatsApp System User token.

---

## 7. KEY DOCS

| File | Purpose |
|---|---|
| `START_HERE.md` | Entry point — read first |
| `COWORK_HANDOFF.md` | This file — full state + next steps |
| `CLAUDE.md` | App map, routes, tables, conventions |
| `EXTERNAL_SETUP_GUIDE.md` | Every account/API key/integration to set up outside the code |
| `AGENCY_INFRASTRUCTURE_MAP.md` | Hierarchical map of the whole operation (outside vs inside FMOS) |
| `FUTURE_FEATURES.md` | Backlog of new features to build AFTER deploy |
| `MARKETING_AUDIT_2026-06-14.md` | Marketing module deep audit |
| `supabase/2026-06-15_verify_schema.sql` | Confirms schema is in sync (run Part A) |

---

## 8. KEY IDs (no secrets)

| Thing | Value |
|---|---|
| GitHub repo | github.com/fortunemarq-web/FortuneMarq-Build (branch main) |
| Supabase project | `cnwooodktqwvpzkucskm` (org: fotunemarq-ship-it's Org) |
| WhatsApp Cloud number | +91 79759 18980 · PHONE_NUMBER_ID `1084263481446667` |
| Meta App | FMOS `1713470496330818` · WABA `1499408311884474` |
| Vercel root dir | `01_CRM_AND_TOOL/fmos` |
| Live domain (target) | fmos.fortunemarq.com |
| GSTIN | 29ICWPS9816Q1ZS |
