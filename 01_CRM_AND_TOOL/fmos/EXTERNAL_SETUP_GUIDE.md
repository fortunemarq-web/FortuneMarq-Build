# FMOS — External Setup Guide
**Everything you (Jabeer) must do OUTSIDE the code, then wire into FMOS, before full-scale use.**
**Last updated:** 2026-06-22

This is the master checklist of accounts, API keys, plans, verifications, and dashboard
configs that FMOS depends on. The code is built — these are the *external* pieces that
make it actually run live. Work top-to-bottom; later sections depend on earlier ones.

---

## 0. STATUS AT A GLANCE

| # | External dependency | Needed for | Status |
|---|---|---|---|
| 1 | Supabase project | Database + auth (everything) | ✅ LIVE |
| 2 | Anthropic API key | AI strategy + AI reports | ✅ key in `.env.local` — verify billing |
| 3 | WhatsApp Cloud API (Meta) | Outbound + inbound WhatsApp | ✅ LIVE — all templates approved, webhook set |
| 4 | Generated secrets (CRON / INBOUND) | Cron jobs + lead webhooks | ✅ in `.env.local` + Vercel |
| 5 | Vercel account + project | Hosting the live app | ✅ Deployed & LIVE |
| 6 | Domain `fmos.fortunemarq.com` | Public URL | ✅ DNS pointed (Hostinger CNAME) |
| 7 | Meta Lead Ads webhook | Auto-capture FB/IG ad leads | 🔴 Not configured (needs active ad campaigns) |
| 8 | Google Ads lead-form webhook | Auto-capture Google ad leads | 🔴 Not configured |
| 9 | Google Search Console API | Real organic SEO tab data | 🔴 Not connected (shows placeholder) |
| 10 | Data + people inside FMOS | Real leads, team logins | 🟡 In progress (~7,960 leads loaded; team logins to confirm) |

Legend: ✅ done · 🟡 partial · 🔴 not started

---

## 1. SUPABASE  ✅ (already live — maintenance only)

**What it is:** Your database, authentication, and file storage. The backbone of FMOS.
**Project:** `cnwooodktqwvpzkucskm` · dashboard: supabase.com/dashboard/project/cnwooodktqwvpzkucskm

**Already done:** 38 tables created, RLS hardened, audit triggers + indexes live.

**PLAN DECISION (2026-06-14): Stay on FREE tier for the first ~3 months.** Run every feature
for real work, see how it performs under real load, fix what breaks, then buy Pro. Do NOT
subscribe yet. Notes for the free period below.

**What you still need to decide / do:**
- [ ] **Free-tier caveat:** Free Supabase **pauses after 7 days of zero activity** and caps at 500MB DB + 1GB storage. As long as the team uses it most days it won't pause. If it ever does, un-pause it from the dashboard (one click). Watch the DB size meter in Settings → Usage — 500MB is plenty for thousands of leads, but bulk CSV imports + audit logs add up. Upgrade to **Pro ($25/mo)** only when you hit a real limit or are ready to depend on uptime + daily backups.
- [ ] **Storage bucket** for PDFs (proposals/agreements/invoices) — confirm a public-read bucket exists (Storage tab). Needed when we build PDF generation (Phase 2 P2).
- [x] **Auth redirect URLs** — `https://fmos.fortunemarq.com/**` is added to Authentication → URL Configuration → Redirect URLs. Login works on the live domain.

**Keys (already in `.env.local`):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
⚠️ The service-role key is admin-level — never expose it client-side, never commit it.

---

## 2. ANTHROPIC API (Claude)  ✅ key present — verify billing

**What it is:** Powers the AI features — `/admin/strategy` (strategy-to-task engine) and AI sections of `/admin/reports`.
**Where used in code:** `lib/anthropic.ts` (model IDs centralized in `lib/ai-models.ts`), `app/admin/strategy/actions.ts`, `lib/reports/dailyReport.ts`.

**What to do:**
- [ ] Go to console.anthropic.com → Billing → confirm you have **prepaid credits or a card on file**. Without credit, every AI feature returns an error live.
- [ ] Set a **monthly spend limit** (e.g. $20) so a bug can't run up a bill.
- [ ] Optional: rotate the key before go-live (the current one has been shared in chat logs). Console → API Keys → create new → replace `ANTHROPIC_API_KEY` in `.env.local` AND in Vercel.

**Env var:** `ANTHROPIC_API_KEY`
**Cost:** Pay-as-you-go. Light usage (a few strategy generations/day) ≈ $1–5/mo.

---

## 3. WHATSAPP CLOUD API (Meta)  ✅ LIVE

**What it is:** Send templates/reminders to leads + receive inbound messages. Fully built in code (`lib/whatsapp/send.ts` + `app/api/webhooks/whatsapp/route.ts`) and live end-to-end — Meta-side setup done and the inbound webhook is configured.

**Dedicated number:** +91 79759 18980 (Jio SIM — NEVER install the WhatsApp app on this SIM).

**Already done:**
- ✅ Business verification APPROVED
- ✅ India payment method added
- ✅ First real test message delivered
- ✅ All 33 system templates + the `direct_report_v3_{a,b,c,d}` family Meta-approved & live
- ✅ Inbound webhook configured — Meta App (FMOS, `1713470496330818`) → WhatsApp → Configuration → Callback URL `https://fmos.fortunemarq.com/api/webhooks/whatsapp`, Verify Token = `WHATSAPP_VERIFY_TOKEN`, subscribed to the `messages` field. Replies from leads now flow into FMOS.

**What you still need to do (housekeeping only):**
- [ ] **Display name "FortuneMarq"** — was auto-rejected (thin web presence). Re-appeal with GST + Udyam certificate. NOT a blocker for sending — leads just see the number until approved.
- [ ] **Delete stale duplicate WABAs** to avoid confusion: `1852036272835920` (Test) and `705784465410369` (stray dup).

**Env vars (in `.env.local`):** `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` (=`1084263481446667`), `WHATSAPP_VERIFY_TOKEN`, `META_APP_SECRET`, and optional `WHATSAPP_LP_FALLBACK_URL` (landing page link used in auto-replies).
⚠️ **Token expiry:** The `WHATSAPP_API_TOKEN` may be a temporary 24h/60-day token. For production you need a **permanent System User token**: business.facebook.com → Business Settings → Users → System Users → create → assign the WABA → generate token with `whatsapp_business_messaging` + `whatsapp_business_management` scopes → never expires. Replace the env var with this.
**Cost:** Meta charges per 24-hour conversation (India business-initiated ≈ ₹0.7–1.0 each). First 1,000 service conversations/month are free.

**Daily AI report to admins (built — needs activation):** The daily-digest cron now also sends a
Claude-written one-line activity summary to admin WhatsApp numbers. To turn on:
- [ ] Submit a Meta template named `daily_report` (named params `report_date` + `summary`):
  Body: `FortuneMarq Daily — {{report_date}}` newline newline `{{summary}}` newline newline `Open FMOS for full detail.`
- [ ] Set env `ADMIN_WHATSAPP_NUMBERS` to the 2 admin numbers (comma-separated, country code, no +).
- It runs once/day, is idempotent, falls back to a deterministic summary if Claude is unavailable,
  and no-ops safely until the numbers + template exist. This is **Phase 1** of the FMOS AI assistant
  (Phase 2 = in-app chat; Phase 3 = strategy suggestions).

---

## 4. GENERATED SECRETS  ✅ exist — in `.env.local` + Vercel

These aren't from a third party — you generate them yourself (random strings). They protect
your cron jobs and inbound webhooks from being triggered by strangers.

| Env var | Protects | Status |
|---|---|---|
| `CRON_SECRET` | All `/api/cron/*` routes (daily digest, alerts, SLA, follow-ups). Routes return 503 without it. | ✅ in `.env.local` |
| `INBOUND_WEBHOOK_SECRET` | All `/api/inbound/*` lead webhooks. Fails closed (401) without it. | ✅ in `.env.local` |

- [x] Both values are copied from `.env.local` into Vercel env vars. Keep them identical to what you put in Meta/Google dashboards — if they differ, lead capture silently fails.
- To regenerate if ever leaked: any long random string works, e.g. run `openssl rand -hex 32`.

**Activate scheduled jobs (free-tier cron) — available now (app is deployed):**
A GitHub Actions workflow (`.github/workflows/cron.yml`) runs FMOS's scheduled jobs for free
(Vercel Hobby only runs cron once/day, too slow for SLA/follow-ups). To turn it on:
- [ ] Repo → Settings → Secrets and variables → Actions →
  - Add **Variable** `FMOS_BASE_URL` = `https://fmos.fortunemarq.com`
  - Add **Secret** `CRON_SECRET` = same value as in `.env.local`
- It then pings SLA + follow-up endpoints every 15 min, and digest/alerts/session-cleanup daily.
- Until both are set, the workflow safely no-ops. Move to Vercel Pro crons later if preferred.

---

## 5. VERCEL — DEPLOY THE APP  ✅ deployed & LIVE (see also DEPLOY_VERCEL.md)

**What it is:** The host that runs FMOS at a public URL and runs the scheduled cron jobs.
✅ **Auth gate is live** — it lives in `proxy.ts` (Next 16 convention, fail-open), NOT `middleware.ts`. Admin pages are gated on the live URL.

**Steps (all done — kept for reference / re-deploy):**
- [x] Account at vercel.com (signed in with the company GitHub).
- [x] New Project → imported repo `FortuneMarq-Build` → **Root Directory set to `01_CRM_AND_TOOL/fmos`** (critical — the repo has other folders).
- [x] Added **all env vars** from the master list in §10 (values from `.env.local`).
- [x] Deployed. Branch `continue-on-mac`; push to `main` auto-deploys.
- [ ] **Plan:** Stay on **Hobby (free)** for the first ~3 months alongside Supabase. It only runs crons **once per day** — fine, since `vercel.json` schedules exactly 2 daily crons (daily-digest + admin-alerts). The SLA/follow-up crons exist in code but aren't scheduled, so they don't need Pro yet. The one watch-item: Vercel's free plan is technically non-commercial — acceptable for a 3-month internal trial, upgrade to **Pro ($20/mo)** before you treat it as a paid customer-facing product.
**Cost during trial:** ₹0. Upgrade to ~$20/mo Pro after the 3-month evaluation.

---

## 6. DOMAIN — fmos.fortunemarq.com  ✅ live

**What it is:** Your branded URL instead of the random `*.vercel.app` address. FMOS is live at `fmos.fortunemarq.com`.

**Steps (all done — kept for reference):**
- [x] In Vercel → Project → Settings → Domains → added `fmos.fortunemarq.com`.
- [x] **Hostinger** DNS (where fortunemarq.com DNS lives) → CNAME record: host `fmos` → the Vercel target.
- [x] DNS propagated; Vercel auto-issued the SSL certificate.
- [x] Supabase redirect URL (§1) and WhatsApp webhook (§3) wired to this domain.
**Cost:** ₹0 (subdomain of a domain you already own).

---

## 7. META LEAD ADS — auto-capture FB/Instagram leads  🔴 not done

**What it is:** When someone fills a lead form on your Facebook/Instagram ad, it lands in FMOS automatically.
**Code endpoint:** `POST /api/inbound/meta_lead_ad` (built; webhook adapter finalized in Phase F Stage 1).

**Steps (needs the app deployed first):**
- [ ] In Meta App (FMOS) → add the **Webhooks** product → subscribe to the **`leadgen`** field on your Page.
- [ ] Connect your Facebook Page / ad account to the app.
- [ ] Run a Meta "Lead Ads Testing Tool" submission → confirm a lead appears in FMOS.
- [ ] Provide me your **Page ID + ad account ID** so the Graph API pull adapter is wired correctly.
**Prerequisite:** You need active Meta ad campaigns running lead-form ads for this to matter.

---

## 8. GOOGLE ADS — auto-capture Google lead-form leads  🔴 not done

**What it is:** Leads from Google lead-form ad extensions flow into FMOS automatically.
**Code endpoint:** `POST /api/inbound/google_lead_form` (built — already parses Google's native payload).

**Steps:**
- [ ] In Google Ads → your lead form asset → **Webhook integration** → set:
  - Webhook URL: `https://fmos.fortunemarq.com/api/inbound/google_lead_form`
  - Key: your `INBOUND_WEBHOOK_SECRET` value (Google sends it as `google_key` in the body — code already checks this).
- [ ] Click "Send test data" in Google Ads → confirm the lead appears in FMOS.
- [ ] Still needed from you: **Google Ads customer ID, target CPL, and which niches** you're advertising.
**Prerequisite:** An active Google Ads account with lead-form campaigns.

---

## 9. GOOGLE SEARCH CONSOLE — real SEO tab data  🔴 not connected

**What it is:** The Organic SEO tab in `/admin/marketing` currently shows a "GSC not connected" placeholder (we removed the fake data). To show real organic traffic/keywords, connect Search Console.

**Steps:**
- [ ] Verify `fortunemarq.com` (and client sites you manage) in search.google.com/search-console.
- [ ] In Google Cloud Console → create a project → enable **Search Console API** → create a **service account** → download its JSON key → share each GSC property with the service account email.
- [ ] Give me the JSON key — I'll add a `GOOGLE_GSC_*` env var + build the integration (this is a Phase 3 feature, low priority).
**Note:** Lowest priority. The tab is honest ("not connected") until then — no fake data showing.

---

## 10. MASTER ENV VAR CHECKLIST

Every variable FMOS reads. ✅ = confirmed in your local `.env.local`. All of these are also
set in **Vercel** (the app is deployed). Values live in `.env.local` / Vercel only — never commit them.

| Env var | Service | Required? | In .env.local? |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | Yes (core) | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Yes (core) | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Yes (cron + inbound) | ✅ |
| `ANTHROPIC_API_KEY` | Anthropic | Yes (AI features) | ✅ |
| `CRON_SECRET` | self-generated | Yes (cron routes 503 without) | ✅ |
| `INBOUND_WEBHOOK_SECRET` | self-generated | Yes (lead webhooks 401 without) | ✅ |
| `WHATSAPP_API_TOKEN` | Meta | Yes (WhatsApp send) | ✅ |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta | Yes (WhatsApp send) | ✅ |
| `WHATSAPP_VERIFY_TOKEN` | Meta | Yes (inbound webhook handshake) | ✅ |
| `META_APP_SECRET` | Meta | Yes (verifies webhook signatures) | ✅ |
| `WHATSAPP_LP_FALLBACK_URL` | self | Optional (auto-reply link) | check |
| `ADMIN_WHATSAPP_NUMBERS` | self | Optional — daily AI report recipients (comma-sep, e.g. `917975918980,919353082656`) | add when ready |
| `DAILY_REPORT_TEMPLATE` | self | Optional — Meta template name (default `daily_report`) | add when ready |
| `DAILY_REPORT_TEMPLATE_LANG` | self | Optional — template language (default `en`) | add when ready |

---

## 11. DATA & PEOPLE — set up INSIDE FMOS (app is live)

These aren't API keys — they're the real-world content that makes FMOS usable day one:

- [ ] **Admin login** — confirm your own admin account works on the live domain.
- [ ] **Team accounts** — create logins for Afifa (telecaller), outsourced freelancers (website builders) with correct roles. Roles control what each person sees: admin / telecaller / strategist / pm / staff.
- [x] **Real leads loaded** — ~7,960 leads across 9 cities (Hubli, Dharwad, Belagavi, Mysuru, Mangalore, Davangere, Ballari, Kalaburagi, Vijayapura) and 13 niches are in the DB. Add more anytime via the CSV upload on the leads page (format in `CSV_UPLOAD_FORMAT.md`).
- [ ] **Services & pricing** — confirm `lib/data/services_data.json` reflects your real packages and prices (used in the proposal builder).
- [ ] **WhatsApp templates** — make sure the approved templates' wording matches what you actually want to send.
- [ ] **Test one full lifecycle** end-to-end: import a test lead → call → log outcome → book meeting → send proposal → agreement → convert to client → invoice. Catch any dead ends before the team relies on it.

---

## 12. RECOMMENDED ORDER OF OPERATIONS

1. ✅ **Anthropic billing** (§2) — verify a card/credits are on file so AI features keep working.
2. ✅ **Auth gate** (`proxy.ts`, fail-open) — built and live.
3. **Get permanent WhatsApp token** (§3) — so it doesn't expire mid-use.
4. ✅ **Deployed to Vercel** (§5) with all env vars.
5. ✅ **Domain pointed** (§6).
6. ✅ **Supabase redirect URLs** (§1) + **WhatsApp webhook** (§3) — done.
7. **Wire inbound channels** (§7, §8) — only if you're running paid ads.
8. **Set up team + import leads** (§11).
9. **Full lifecycle smoke test** (§11) → then go live with the team.
10. GSC integration (§9) and other Phase 3 features can come later.

---

## 13. ROUGH MONTHLY COST SUMMARY

**DECISION: First ~3 months run 100% on free tiers. Evaluate, fix, test, THEN subscribe.**

| Service | Trial (first 3 mo) | After evaluation | Monthly (paid) |
|---|---|---|---|
| Supabase | Free | Pro (no pause, backups) | $25 |
| Vercel | Free (Hobby) | Pro (commercial, frequent crons) | $20 |
| Anthropic | Pay-as-you-go (unavoidable) | usage-based | ~$1–5 |
| WhatsApp Cloud API | 1,000 conv/mo free | per-conversation after | varies (~₹1/conv) |
| Domain | Already owned | — | ₹0 |
| Meta / Google Ads | your ad spend | your ad spend | your budget |
| **Platform total** | **≈ ₹0–400 (just Anthropic + WA overflow)** | — | **≈ $45–50/mo + ad spend** |

**Trial-period cost is effectively zero** beyond a few dollars of Anthropic usage and any
WhatsApp conversations past the free 1,000/month. Only Anthropic genuinely requires money
on day one (and only if you use the AI features). Revisit subscriptions after the 3-month
real-world run.
