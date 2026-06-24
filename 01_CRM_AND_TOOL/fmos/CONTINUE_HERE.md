# ▶ CONTINUE HERE — Canonical Handoff
**Updated:** 2026-06-25 · **Branch:** `continue-on-mac` · **This file supersedes all other handoff/continuation docs.**

> You are a fresh Claude Code session (new account, same machine + same `FortuneMarq-Build`
> folder — we switched accounts because the previous one hit its weekly rate limit). The prior
> session's memory does NOT carry over. **This file is the source of truth for where we are.**
> Read it fully, then `CLAUDE.md` (auto-loaded) for app structure.

App: `01_CRM_AND_TOOL/fmos` (Next.js 16 + Supabase + Tailwind v4). Owner: Jabeer.

## ⚡ Latest session (2026-06-25) — ad-launch prep (all DEPLOYED to `main`)
- **Canonical domain fix (`proxy.ts`):** `fortunemarq.com/lp/*` was 404ing (rewritten into `/site/lp/*`); the marketing-host branch now passes `/lp /p /a /inv /client/report` straight through. **Ad + organic destination URL is `https://fortunemarq.com/lp/<niche>/<city>`** (works now; `fmos.fortunemarq.com` is the app host).
- **Conversion-ready tracking:** `trackLpEvent` also fires the STANDARD ad events (Meta `Lead`/`Schedule`/`Contact` + GA4 `generate_lead`); `lib/inbound/capture.ts` persists `gclid`/`fbclid` on `lead_source_attribution` (migration `supabase/2026-06-24_attribution_clickids.sql` RUN). Vercel analytics env (GA4/Pixel/Clarity) all set — events fire on prod. **Owner-side remaining at launch:** GA4↔Google-Ads link + mark `generate_lead` a conversion; connect Pixel to the Meta ad account.
- **Offline-conversion uploader (Meta CAPI + Google OCI) — BUILT 2026-06-25, DORMANT.** `lib/ads/{meta-capi,google-oci,conversions}.ts` + cron `/api/cron/ad-conversions` + table `ad_conversions` (migration `supabase/2026-06-25_ad_conversions.sql` RUN). When a paid-click lead (gclid/fbclid) books a meeting or is won, it uploads that conversion back to the platforms. Env-gated → does nothing until tokens set. **⚠️ MUST ACTIVATE AT AD LAUNCH:** set `META_CAPI_TOKEN` (+ later `GOOGLE_ADS_*`) in Vercel and add a `/api/cron/ad-conversions` step to `.github/workflows/cron.yml`. **Full step-by-step checklist:** `00_MASTER/FMOS_Status_Report_2026-06-24.md` → "🔔 ACTIVATE AT AD LAUNCH".
- **SEO:** `app/sitemap.ts` emits all 117 LPs (126 URLs); `/lp` un-blocked in `robots.ts`; sitemap **re-submitted to GSC** (fortunemarq.com Domain property).
- **2 LP bugs fixed** (found via end-to-end smoke test): React #418 hydration mismatch (booking slots were SSR'd from build-time `new Date()` on static pages → now client-only in `book-cta.tsx`) and an uncaught WebGL crash (`side-rays.tsx` ogl `Renderer` now try/caught → degrades to CSS bg). Verified on prod: 0 hydration/renderer errors; 2/2 form submits land in FMOS tagged niche+city+source + gclid.
- **Smoke test PASSED:** form lead capture confirmed live (tagged `industry`/`city`/`src:lp`, auto-assigned, UTM + gclid captured). All test leads cleaned up.

---

## 0. Doc trust map (what to read vs ignore)
**Authoritative / current:**
- **This file** — current state + next steps.
- `00_MASTER/LIVE_STATE.md` — **machine-generated** live snapshot (Supabase counts + deploy state), refreshed each session by `scripts/doc_sync.mjs`. Never hand-edit it; trust it for current data counts. Doc-automation design: `scripts/DOC_AUTOMATION.md`; reconcile on drift with the `/sync-docs` skill.
- `CLAUDE.md` — app structure, routes, conventions (auto-loaded).
- `WHATSAPP_TEMPLATES_FINAL.md` + `03_SALES_SYSTEM/WhatsApp_Templates/FMOS_Template_Data/templates_final.json` — the 33 submitted WhatsApp templates (SOURCE OF TRUTH).
- `WHATSAPP_HANDOFF_2026-06-16.md` — the WhatsApp work order (BUILD/CHANGE/REMOVE, 12 surfaces, DoD).
- `00_MASTER/FMOS_Execution_Roadmap.md`, `FMOS_System_Design_And_Tasks.md`, `CRITICAL_PATH.md`, `PENDING_ACTIONS.md` — owner's strategy/launch-gate (maintained in Cowork).

**Superseded / historical — REMOVED 2026-06-22** (archived via git history; recover with `git log --diff-filter=D`):
- 27 stale session-logs / phase-plans / pre-deploy guides were deleted in the docs-reconciliation pass — `PHASE_1..6_*.md`, `PHASE_A..F_*.md`, `WHATSAPP_TEMPLATE_SPEC.md`, `WHATSAPP_AUTOMATION_PLAN.md`, `AUDIT_FIX_CONTINUATION.md`, `last_session.md`, `COWORK_HANDOFF.md`, `00_MASTER_BUILD_PLAN.md`, `START_HERE.md`, `00_QUICK_REFERENCE.md`, `DEPLOY_HANDOFF.md`, `DEPLOY_VERCEL.md`, `FMOS_APP_REPORT.md`, and the dated audits (`POST_AGREEMENT_FLOW_AUDIT.md`, `MARKETING_AUDIT_2026-06-14.md`, `VERIFICATION_REPORT.md`, `FMOS_QA_VERIFICATION_2026-06-13.md`). Their live content lives in this file + `CLAUDE.md` + the `00_MASTER/` set.
- `AGENTS.md` — does not exist (a second agent "omp" was trialed and removed; see §6).

---

## 1. Where we are
- **FMOS is DEPLOYED and live** (Vercel, `fmos.fortunemarq.com`). WhatsApp Cloud API is live and **all 33 templates are Meta-approved**.
- **WhatsApp number live (2026-06-23):** business number **79759 18980** is **registered on Cloud API** with the **approved display name "FortuneMarq Media & Marketing"** (`code_verification_status=VERIFIED`, `platform_type=CLOUD_API`, `account_mode=LIVE`, `quality_rating=GREEN`). Re-registered via `POST /{PHONE_NUMBER_ID}/register` after the name-change approval (`new_name_status` flipped to APPROVED); owner reset the 2-step-verification PIN.
- **6.5 / 6.8 / 6.9 (command center + safety nets) BUILT + DEPLOYED to `main` (2026-06-23, commit `b3094ea` ff'd onto main).** `cron_heartbeats` + `backups` bucket SQL run (verified live). `/admin/command`, `/admin/system-health`, `/admin/backups` live; health alerts reuse the approved `admin_alert` template → `ADMIN_WHATSAPP_NUMBERS`.
- **Niche-LP rollout (2.1) + LP lead-capture wiring BUILT + DEPLOYED to `main` 2026-06-24 (commit `a2698cd`, ff'd onto main, live on Vercel).** Further build work sits on **`continue-on-mac`**; merging to `main` triggers a live Vercel deploy — **do not push/merge to `main` without explicit owner approval.**
- `.env.local` is in place (gitignored). `npx tsc --noEmit` = **0**, `npm run build` = **green**.
- **Vercel env — ALL CONFIGURED (Production + Preview), do NOT re-flag as missing:** analytics `NEXT_PUBLIC_GA4_ID` · `NEXT_PUBLIC_META_PIXEL_ID` · `NEXT_PUBLIC_CLARITY_ID` (all live since 2026-06-19 — so the LP analytics + the standard conversion events `Lead`/`generate_lead`/`Schedule`/`Contact` fire on prod); Supabase `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY`; `ANTHROPIC_API_KEY`; `CRON_SECRET`; `INBOUND_WEBHOOK_SECRET`; WhatsApp `WHATSAPP_API_TOKEN`/`WHATSAPP_PHONE_NUMBER_ID`/`WHATSAPP_VERIFY_TOKEN`/`META_APP_SECRET`/`WHATSAPP_DAILY_CAP`/`WHATSAPP_ALLOWLIST`/`WHATSAPP_FLOW_ID_{EN,KN,HI}`; `ADMIN_WHATSAPP_NUMBERS`. (Defaults-OK if ever needed: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WA_BOT_NUMBER`.) The only ad-side work left is **owner-side**: link GA4↔Google Ads + mark `generate_lead` a conversion, connect the Pixel to the Meta ad account, and (later) CAPI/OCI tokens.
- **Built since the last handoff (all live):** Stage 1 data engine (1.3–1.6) — **all 9 cities / 13 niches / ~7,960 leads loaded, 936 EN+KN reports** generated by the reportlab pipeline at `07_DATA_AND_RESEARCH/PDF_Generator` (the in-app `@react-pdf` generator is disabled behind `REPORTS_INAPP_GENERATOR`); Stage 3 outbound (3.1–3.4, incl. the **Direct Report v3** — `direct_report_v3_{a,b,c,d}` text template with 3 buttons → matched PDF follow-up; the ಕನ್ನಡ ವರದಿ button sends only the Kannada PDF); Stage 4 delivery (4.1–4.7); the **AI bot (6.1)** (KB filled, guardrails, booking-intent, human-takeover via `leads.bot_paused`); and **messaging safety + unified inbox (6.2/6.3/6.4)**.
- **✅ Marketing site (5.1) DONE & live** at `/site` (re-platformed onto this app): all pages built — home, about, services, work, contact, blog, privacy-policy, terms-of-service — with **GA4 + Microsoft Clarity + Google Search Console + Meta Pixel connected** (`components/site/site-analytics.tsx`). Architecture/handoff: `app/site/README.md`. **Niche LPs (2.1) DONE & live (2026-06-24):** all **13 niches × 9 cities = 117 LPs** at `/lp/[niche]/[city]`, bilingual EN+KN, with two auto-switching angles — **demand mode** (≥1,000 searches → capture-the-demand) and **presence mode** (<1,000 or no data → lead-the-market-via-Meta-ads, no fabricated numbers). Registry is a niche×city cross-product (`lib/lp/niches.ts` → `NICHE_DEFS` × `CITIES`; fixed 4 industry-key mismatches so live `market_insights` resolves per city). LP lead capture (form/chat/WhatsApp) tags niche+city+source into FMOS via `processInboundLead`. Remaining Stage-5: GMB, organic SEO, social, the unified presence dashboard.

## 2. Conventions (non-negotiable)
- Lead stage writes only via `lib/pipeline.ts` (`leadStageUpdate`/`leadStatusUpdate`) — never write `outreach_stage`/`status` directly.
- Auth gate = `proxy.ts` (Next 16), **not** `middleware.ts`; fail-open.
- No emoji in UI chrome; green = `brand-deep` `#1E7A4F` (raw `#42CA80` = accents only).
- Commits scoped to `01_CRM_AND_TOOL/fmos`. `tsc=0` + build green before every commit.
- WhatsApp: cold/outside-24h = Meta-approved template only; free-text only inside the 24h window.
- Supabase: server → `createServerClientWithCookies()`; client → `createClient()`; service-role (`createAdminClient()`) for cron/public/trusted only.

## 3. What's built (WhatsApp automation — all additive + INERT until a rule is enabled / a send is triggered)
- **Engine + triggers:** `actions/automations.ts` `fireTrigger` (fail-open) wired at `lead_outcome_logged`, `meeting_booked`, `proposal_sent`, `lead_won`.
- **Send layer:** `lib/whatsapp/send.ts` + `params.ts` — template send with body params **and document header** (PDF via link/mediaId). Token modifiers `{field:date|datetime|time|inr}` (IST/₹).
- **Config UI:** `/admin/automations` — `send_whatsapp` action builder + condition builder (route by `last_outcome` etc.). `/admin/whatsapp-templates` — "Register 33 Meta Templates" button now reads `templates_final.json` (source of truth; upserts; `direct_report_*`/`daily_report` untouched).
- **Direct Report bulk send:** `actions/direct-report.ts`, `/admin/direct-report` (+ `/admin/direct-report/tracking`), `lib/whatsapp/report-lookup.ts` — niche×city send of the A/B/C/D `direct_report_v3_*` TEXT template (body + 3 buttons) then the matching market-intel PDF as a follow-up document; the ಕನ್ನಡ ವರದಿ button → webhook `sendLeadReport` sends only the Kannada PDF; daily cap; opt-out honored; test-send-to-one-number + dry-run. (Old `actions/curiosity-blast.ts` / `/admin/curiosity-blast` removed.)
- **Opt-out:** `leads.wa_opt_out` + inbound **STOP** (and START) in the WhatsApp webhook.
- **SQL:** `supabase/2026-06-16_curiosity_blast.sql` (`wa_opt_out` + `report_assets`) — **already run in Supabase** (owner confirmed).

## 4. Next steps
**Already done (these were the old "next" items — all built & live):** Curiosity→Direct Report rename; delivery/read/click tracking (`/admin/direct-report/tracking`); the bot brain (6.1, KB filled); Google Calendar/Meet booking; messaging safety + unified inbox (6.2/6.3/6.4).

**Done + deployed 2026-06-23 (command center + safety nets — on `main`):**
- **6.5** `/admin/command` — cross-engine funnel (leads→…→won) + MRR/clients/outstanding KPIs + by-source table.
- **6.8** automation health monitoring — `cron_heartbeats` + `withHeartbeat` on all 9 crons + `/api/cron/health` (15-min) + `/admin/system-health` + deduped alert via the approved `admin_alert` template → `ADMIN_WHATSAPP_NUMBERS`. SQL run; live.
- **6.9** backups — daily `/api/cron/backup-export` (paginated JSON snapshot → private `backups` bucket, 30-day prune) + `/admin/backups` + `BACKUP_RESTORE.md`. Bucket SQL run; live.

**Niche LPs (2.1) DONE + DEPLOYED 2026-06-24 (commit `a2698cd`):** all **13 niches × 9 cities = 117 LPs** live, bilingual EN+KN. One template (`app/lp/[niche]/[city]/page.tsx` + `lp.css`) brand-matched to the marketing site (imports `site.css`, mounts `SiteMotion`/`SiteFooter`). Sections: sticky glassmorphism nav (Book-CTA reveals after hero) → **Hero** (SideRays WebGL rays bg + partner/cert auto-marquee) → **The Gap** (animated search-volume bars; big number = total searches, leak below) → **How it's built** (CardSwap of system mockups) → **Responsive showcase** (GSAP scroll-resize, per-niche mock-site screenshots via `cfg.siteShots`) → **Why choose us** (scroll-glow funnel) → **Book** (form) + chat + floating call FABs. **Two auto modes:** demand (≥1,000 searches) vs **presence** (<1,000/no data → Meta-ads/market-leadership angle, no fabricated numbers). Registry = niche×city cross-product (`lib/lp/niches.ts` → `NICHE_DEFS` × `CITIES`; fixed 4 industry-key mismatches). Copy is tokenised EN+KN (`lib/lp/lp-sections.ts`). Deps added: `gsap` 3.15 + `ogl`. New `components/lp/*` (side-rays, card-swap, lp-funnel, gap-bars, split-heading, responsive-showcase, system-build, lp-nav, floating-call). See `lp-redesign-direction` memory.

**Code (remaining, not yet built):**
1. **Stage 2 — campaigns** (campaign object + status machine + metric pull + WhatsApp digest).
2. **Stage 5 — site/presence** (GMB/SEO/social + **5.7** presence dashboard), **6.6 nurture**, **6.7 capacity guardrail**.
3. **Collection automation (1.1/1.2)** + the **pipeline orchestrator** (batch status on `import_batch_id`).
4. **Channel adapters** (web/IG/Messenger) beyond WhatsApp.
5. **Ad conversion tracking** (held for campaign launch) — persist `gclid`/`fbclid` on the lead + map LP events (`lp_lead_submitted`/`lp_whatsapp_click`/`lp_call_click`) → Google Ads & Meta conversions + **CAPI/OCI** so the platforms optimize for real leads (meeting/won). Also: LP sitemap entries for the 117 pages (organic/SEO only).

**Owner / external (not code):**
- **Seed PDFs:** the report library is complete — 936 reports = all 9 cities × 13 niches × 4 types × EN/KN (no gaps; the earlier SkinClinics Type-B EN gap is closed). Regenerate via the reportlab pipeline + `batch_upload_*` when copy/data changes.
- Templates: all 33 system templates + the `direct_report_v3_{a,b,c,d}` family are **Meta-approved and live**.
- Deploy is done (Vercel, live). Post-deploy config in place (env vars, domain DNS, Supabase redirect URLs, WhatsApp webhook callback). Any new build → merge to `main` only with owner approval.
- **Niche landing pages: DONE — all 13 niches × 9 cities (117 LPs) live & deployed** (2026-06-24), bilingual EN+KN, demand + presence modes; lead capture (form/chat/WhatsApp) wired into FMOS tagged niche+city+source. Each niche has its own mock-site screenshots (`public/site/lp/img/<niche>-site-{mobile,tablet,desktop}.png`). The marketing site itself is fully built + analytics connected.
- Data: **all 9 cities loaded** — ~7,960 leads across 13 niches (Hubli, Dharwad, Belagavi, Mysuru, Mangalore, Davangere, Ballari, Kalaburagi, Vijayapura). `leads`/`market_insights` (117 = 9×13)/`report_assets` (936) aligned, 0 orphans. Further leads can still be added via `/admin/bulk-import`.

## 5. Verify after picking up
From `01_CRM_AND_TOOL/fmos`: `npm install` (if needed) → `npx tsc --noEmit` (expect 0) → `npm run dev`.

## 6. About "omp" (removed)
A second coding agent (`omp`/Kimi) was trialed in a git worktree to work in parallel. It's been
**removed** (worktree + `omp-work` branch deleted); its one useful change (the 33-template
registry rework) was **cherry-picked into `continue-on-mac` as `eec7d00`**. No omp references
remain in the repo. The `~/.local/bin/omp` binary + `KIMI_API_KEY`/`MOONSHOT_API_KEY` in `~/.zshrc`
are harmless leftovers on the machine — ignore or remove at will.
