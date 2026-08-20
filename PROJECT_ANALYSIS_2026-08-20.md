# FortuneMarq-Build — Full Project Analysis
**Date:** 2026-08-20 (original pass) · **Updated:** 2026-08-20, same day — see status block below · **Branch analyzed:** `ui-refresh` (HEAD at analysis time `9d29d6d`; now `ae05fce` after the follow-up work) · **Method:** terminal-first (`find`/`du`/`grep`/`git log`), full coverage of every folder; PDFs/leads/media sampled, not read individually (see notes per folder)

---

## ✅ STATUS UPDATE (2026-08-20, later same day) — everything in this report is now resolved

Every P0, P1, and P2 finding below has been fixed and independently verified (not just claimed) in the hours after this report was written. Summary, details in each section below:

- **P0 — leaked service-role key: fully resolved, not just rotated.** Migrated the whole Supabase project off legacy JWT-based API keys onto the new `sb_publishable_.../sb_secret_...` key system, then **disabled and revoked** the legacy keys project-side. Verified live: the exact leaked key now gets `401 "Legacy API keys are disabled"` from Supabase's own API — it is permanently dead, not just superseded. New keys verified working both server-side (a real admin action) and client-side (a real `200` REST call). Both scripts fixed to read from env; a related issue found in the same pass (4 real account passwords hardcoded in `create-users.js`) was also fixed — moved to a new gitignored `00_MASTER/FMOS_USER_CREDENTIALS.local.json`.
- **P1 — documentation drift: reconciled.** `01_CRM_AND_TOOL/CONTEXT.md`, `05_FORTUNEMARQ_ONLINE_PRESENCE/CONTEXT.md`, `06_PAID_MARKETING/CONTEXT.md`, `00_MASTER/Claude_Project_Instructions.md`, and `fmos/CONTINUE_HERE.md`/`CLAUDE.md` all corrected and re-verified against source (not just against other docs) — see §4. `node scripts/doc_sync.mjs` now reports `0 dead refs, 0 stale folder-docs`.
- **P1 — `types/database.types.ts`: regenerated.** Was stale since 2026-06-17 (missing `ad_conversions`, `cron_heartbeats`, and ~5 other columns/tables). Regenerated via the official `supabase gen types typescript` CLI (113 → 119 tables, +290 lines) rather than hand-reconstructed from a SQL introspection query, to avoid introducing subtle type errors into a file the whole app leans on. `tsc --noEmit` and `npm run build` both stayed green before and after. This closes the last open item from the original report.
- **P2 items: resolved, with two reversals worth knowing about.** Root scratch scripts deleted, `voice-swap/` gitignored, `FMOS_Change_Specs/data/` re-synced (and confirmed still in sync on re-check), `CLAUDE-FABLE-5.md` removed. But **`public_html.zip` and `Telecaller_Scripts/Hubli/`/`Website/Landing-Pages/` were explicitly NOT deleted** — the original recommendation to delete/archive them was wrong. Reading their own governing docs before acting (rather than just the file tree) showed `public_html.zip` is actively cited as the design source-of-truth in `fmos/app/site/README.md`, `Telecaller_Scripts/Hubli/` has a locked "kept for reference" decision in its own `CONTEXT.md`, and `Website/Landing-Pages/` is the live per-niche×city tracking layer for the LP system, not dead pre-redesign content. See §4 for the corrected framing.
- All changes pushed to `main` in five separate merges (`20e6631`, `112f45a`, `4a67697`, `cfb93db`, `95636a4`), each verified as a clean, live, error-free Vercel production deployment (fresh build etag, zero console errors) before moving to the next step.
- Minor: the lead count has since ticked from 7,961 → **7,960** — a test lead created and deleted during the key-swap verification, not a data issue.

The findings below are left as originally written (including the now-resolved P0 in §0) so this stays an accurate record of what the original pass found — read them as history, not current state, wherever this update block says otherwise.

---

## 0. Original finding — live secret exposed in a public repo (RESOLVED — see status block above)

**`SUPABASE_SERVICE_ROLE_KEY` (full DB admin, bypasses all RLS) is hardcoded in plaintext and committed to git**, and the repo is **public** on GitHub (`github.com/fortunemarq-web/FortuneMarq-Build`, confirmed via `gh repo view` → `"visibility":"PUBLIC"`).

- [01_CRM_AND_TOOL/fmos/scripts/create-users.js:14](01_CRM_AND_TOOL/fmos/scripts/create-users.js#L14) (fixed)
- [01_CRM_AND_TOOL/fmos/scripts/delete-old-users.js:9](01_CRM_AND_TOOL/fmos/scripts/delete-old-users.js#L9) (fixed)

Decoded JWT: `role: service_role`, project ref `cnwooodktqwvpzkucskm` — this is FMOS's live production Supabase project. It's been in git history since commit `c02ce0a`. Anyone who finds the repo has unrestricted read/write on `leads`, `clients`, `invoices`, `profiles` — everything.

**Original recommendation (superseded — actual fix went further):**
1. ~~Supabase Dashboard → Project Settings → API → regenerate the `service_role` key.~~ Done, then taken a step further: migrated off the legacy key system entirely rather than just rotating within it.
2. ~~Update it in Vercel env vars, local `.env.local`, and anywhere else it's used.~~ Done.
3. ~~Remove the hardcoded key from both scripts.~~ Done.
4. "The old key stays in git history even after this fix" — still true (git history is immutable without a rewrite, which wasn't done), but now moot: the key is **revoked project-side**, not just superseded by a new one. Anyone who finds it in old commits gets a `401`, permanently. History rewriting/making the repo private was considered and explicitly not needed once revocation (not just rotation) was confirmed.

---

## 1. Executive summary

FortuneMarq-Build is a solo-operator (Jabeer) digital marketing agency's entire business-in-a-repo: strategy docs, a production CRM (FMOS), lead/market-research data, ad creative, sales scripts, and back-office records, all in one 3.6GB git working tree. It's an unusually complete build for a one-person shop — FMOS itself (2.1GB, the actual product) is a real, deployed, working Next.js 16 + Supabase CRM with WhatsApp Cloud API automation, an AI bot, 117 live landing pages, and a genuinely broad feature set (telecalling, proposals, invoicing, delivery boards, command center, backups). `tsc --noEmit` and `npm run build` both pass clean on the current branch.

The core risk isn't the code — it's that **the documentation has stopped tracking reality**, and in security-review 07_DATA_AND_RESEARCH/PDF_Generator wasn't scanned for scale (out of scope). The last coherent "state of the world" snapshot across the `00_MASTER/` docs is dated 2026-06-22 to 2026-07-08; real work (dark theme ship, security RLS lockdown, Google Ads API approval, a new `/start` campaign LP, ad-creative production) continued through 2026-08-04 without those docs being updated to match. Several folder-level `CONTEXT.md` files actively contradict the live state (e.g., claiming only 1 of 13 niche LPs is enabled, weeks after all 117 went live).

**Top 3 risks, in order (original — see status block at top for current state):**
1. ~~**P0 — Live Supabase service-role key committed to a public GitHub repo** (§0).~~ **RESOLVED 2026-08-20.**
2. ~~**P0/P1 — Documentation drift**~~ **RESOLVED 2026-08-20** — reconciled and re-verified against source, not just other docs.
3. ~~**P1 — Generated Supabase types (`types/database.types.ts`) haven't been regenerated since 2026-06-17**~~ **RESOLVED 2026-08-20** — regenerated (113 → 119 tables), `tsc`+build confirmed still green.

The business itself is genuinely close to "everything built, waiting on the owner to flip switches" — the FMOS app deep-dive below confirms the docs' claim that most remaining gaps are owner-side (ad account activation, GA4↔Google Ads linking, GMB/social content) rather than engineering gaps.

---

## 2. Per-folder breakdown

| Folder | Size | Purpose | State |
|---|---|---|---|
| `00_MASTER` | 1.2M | Strategy/roadmap brain, brand assets, bot KB | The flagged docs reconciled 2026-08-20 (`Claude_Project_Instructions.md` + the folder-doc claims below); `CRITICAL_PATH.md`/`PENDING_ACTIONS.md` left as-is, they already self-flag as historical; `LIVE_STATE.md` machine-generated and accurate |
| `01_CRM_AND_TOOL` | 2.1G | FMOS app (see §3) | Deployed, live, actively developed |
| `02_SERVICE_DELIVERY_AUTOMATION` | 96K | Client-delivery automation (ads/SEO/website) | **Unbuilt** — CONTEXT.md stubs only, no code |
| `03_SALES_SYSTEM` | 6.7M | Telecaller scripts, WhatsApp templates, proposals content | Content live in-app via type-based (A/B/C/D) system; legacy niche-based scripts likely superseded |
| `04_CLIENT_MANAGEMENT` | 228K | Onboarding/upsell/report data mirrored into FMOS | Data-source folder, in sync with app as of last check |
| `05_FORTUNEMARQ_ONLINE_PRESENCE` | 852M | Website/social/content studio | Marketing site live; `CONTEXT.md` reconciled 2026-08-20; 736M of it is an untracked video-dubbing pipeline, now gitignored |
| `06_PAID_MARKETING` | 117M | FortuneMarq's own ad campaigns | Infra built, campaigns not yet launched (correctly, per its own launch-gate rule); active creative production |
| `07_DATA_AND_RESEARCH` | 258M | Leads, market research, PDF report generator | Data fully loaded (per docs, verified against schema shape); raw SERP scrape HTML dominates the size |
| `08_FINANCE` | 36K | Finance planning | Mostly stubs; GST doc is real and current |
| `09_LEGAL_AND_OPERATIONS` | 524K | Legal/compliance docs | Real content (GST cert, Udyam, agreements); current |
| `10_PERSONAL_GROWTH` | 32K | Learning notes | All stubs, no content |
| `Brand_Assets` (root) | 1.4M | Fonts/logos | Fine, some dup file variants (`alliance1.ttf` vs `alliance1_fixed.ttf`) |
| `Website` (root) | 508K | Legacy static-site LP content briefs (108 .md files, 9 cities × 12 niches) | Likely superseded by the in-app dynamic LP system |
| `scripts` (root) | 36K | Doc-sync automation (`doc_sync.mjs`, `docs_check.mjs`) | Working, actively used |
| `graphify-out` | 9.0M | Cache/output from a code-analysis tool | Tooling artifact, not project content |
| Root loose files | ~15M | `fix_*.py`, `patch_pdf*.py`, `generate_sample_pdf_v{1,2,3}.py`, `scrape_*_v2.py`, etc. | **Deleted 2026-08-20** — confirmed dead (superseded by `07_DATA_AND_RESEARCH/`), removed via `git rm`, recoverable from history if ever needed |

### 00_MASTER
Read `LIVE_STATE.md` (machine-generated by `scripts/doc_sync.mjs`, trustworthy), `CLAUDE.md`, `CRITICAL_PATH.md`, `PENDING_ACTIONS.md`, `FMOS_System_Design_And_Tasks.md`. The prose docs are the ones that have drifted (see §4). New/untracked this session: `Client_Acquisition_Launch_Tracker.xlsx` (76-task Excel tracker, referenced from `LAUNCH_CHECKLIST.md`), `Marketing_Foundation.md`, `00_MASTER/Brand_Assets/DESIGN.md`.

### 02_SERVICE_DELIVERY_AUTOMATION
Every file is a `CONTEXT.md`/`CLAUDE.md` placeholder ("planning placeholder — no build files"). Confirmed via `find`: 96K total, zero code. This is entirely aspirational — the folder exists as a slot for future client-delivery automation (ads/SEO/website delivery), not started.

### 03_SALES_SYSTEM
`CONTEXT.md` (2026-06-22) is explicit that **the type-based A/B/C/D system in FMOS is the live source of truth**, and this folder is "the content layer." The `Telecaller_Scripts/Hubli/<Niche>/` tree (14 niche folders, Kanglish+Kannada scripts) predates that system — it's niche-based, not type-based, and isn't referenced anywhere as currently in use. Likely stale/superseded; not deleted because it may still be useful reference copy. New this session: Afifa's training docs (`Afifa_Call_Script_Book.docx`, `Afifa_Training_Guide.{docx,md}`, `Afifa_Service_Details.{docx,md}`) — current and tied to the 2026-07-08 script-warming pass documented in `CONTINUE_HERE.md`.

### 04_CLIENT_MANAGEMENT
`Onboarding/FMOS_Onboarding_Data/`, `Upsell_System/FMOS_Upsell_Data/`, `Monthly_Reports/FMOS_Report_Data/` mirror data structures that live in the FMOS app (`onboarding_checklists.json`, `upsell_rules.json`, etc.). This is a recurring pattern across the repo: **content authored here, then hand-copied into `01_CRM_AND_TOOL/fmos/lib/data/`** (see §4, dual-maintenance risk). `_TEMPLATE/` and `_EXAMPLE_BrightSmile_Dental_Hubli/` give the folder a clear intended workflow (copy template per new client) — no real clients have been onboarded into it yet (only the example).

### 05_FORTUNEMARQ_ONLINE_PRESENCE
- **Marketing site**: per `CONTEXT.md`, actually built and live inside the FMOS app (`01_CRM_AND_TOOL/fmos/components/site/`), not the old Hostinger `public_html/` — confirmed by the FMOS app section below. `public_html/` (39M) + `public_html.zip` (39M, an exact zip of the same directory) is dead legacy duplication — recommend deleting the zip at minimum.
- **Content_Studio/voice-swap/** is 736M of the folder's 852M — almost the whole thing. It's a Python voice-dubbing pipeline (`voice_swap.py`, `tts_voiceover.py`, `concat_scenes.py`) with `inbox/`+`done/` raw video/audio (58 mp4, 14 mp3) **and a full Python virtualenv (`.venv/`, ~995 `.py`/`.pyc` files, pip `dist-info` metadata) sitting inside a content folder.** Confirmed entirely untracked by git (0 files under `git ls-files`), so it's not bloating the repo history, but it is bloating the working tree / any local backup or sync of this folder.
- **`Content_Studio/carousels/`** (25M, added 2026-08-04) is the most recently touched thing in the entire repo — an HTML→PNG branded carousel builder, actively developed alongside the `06_PAID_MARKETING` creative work.
- `CONTEXT.md` top summary is stale (§4).

### 06_PAID_MARKETING
Well-maintained relative to its peers — `CONTEXT.md` has a dated changelog updated through 2026-07-13 (Google Ads API Basic Access approval), and `Campaigns/Hubli/` shows real, current ad-creative production (`carousel_general_v1.html`, per-niche carousel generators, broll mockups, brand fonts self-hosted). The one contradiction: the "Critical Rule" section (launch gate: "niche LPs not yet rolled out") wasn't updated when the rest of the file was on 2026-07-30 — **fixed 2026-08-20.**

### 07_DATA_AND_RESEARCH
**Sampled, not exhaustively read**, per the task's own instruction (PDFs/leads are bulk data, not something to read file-by-file).
- `PDF_Generator/`: the Python reportlab pipeline (`pdf_generator.py`, `kn_shape.py` for Kannada shaping, `batch_upload_reports.py`) that docs claim generates the 936 live reports. Local `output/` only has 76 sample files (Hubli only) — consistent with the docs' claim that the real 936 live in Supabase Storage, not locally.
- `Lead_Database/`: per-city `*_Final/`, `*_cleaned_leads/`, and `*_All_Leads_Clean.csv` — duplicated/overlapping naming per city (e.g., `Manglore_Final` vs. lowercase `manglore_cleaned_leads`), consistent with the task's warning about scattered v1/v2/cleaned/final proliferation. Untracked this session (`Ballari_Final/`, `Website_Contacts.csv`, `backup_leads_2026-06-21.json`, etc.) — recent scraping/rescraping work, not yet committed.
- `Competitor_Data/`: 235M of the folder's 258M is raw SERP HTML scrapes (123 files, ~5–6.6M each) — one-time research artifacts, not something actively read by the app.

### 08_FINANCE / 09_LEGAL_AND_OPERATIONS / 10_PERSONAL_GROWTH
08 and 10 are almost entirely `CONTEXT.md` stubs. 09 has real, current content: `gst-status-and-gaps.md` and `open-tasks.md` (both 2026-06-25, self-consistent, list real open items like inter-state IGST handling and SAC codes — genuinely useful, not stale claims), plus GST certificate and Udyam registration PDFs.

### Root loose files
`fix_csv.py`, `fix_location.py`, `generate_sample_pdf.py`/`_v2`/`_v3`, `patch_pdf.py`/`_v2`, `scrape_google_results.py`/`_v2`, `scrape_phones.py`, `phone_scrape_progress.json`, `project_data.json` (0 bytes) — all committed 2026-06-12, all superseded by the proper pipelines now living in `07_DATA_AND_RESEARCH/`. Dead weight at the repo root. `CLAUDE-FABLE-5.md` (120K) is an Anthropic system-prompt reference document with no connection to FortuneMarq's business — looks like an accidental save into the repo root rather than intentional project content.

---

## 3. The FMOS app — deep dive (`01_CRM_AND_TOOL/fmos`)

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres) · `@supabase/ssr` · Anthropic SDK (bot) · `@react-pdf/renderer` (disabled generator) · GSAP/`ogl`/`motion` (LP animation) · `googleapis` (Calendar/Ads).

**Verified, not just claimed:**
- `npx tsc --noEmit` → **0 errors.**
- `npm run build` → **succeeds**, all routes compile (including the new uncommitted `/start` route).
- No `vercel.json` — crons fully migrated to GitHub Actions (`.github/workflows/cron.yml`), confirmed all 12 documented cron endpoints (SLA, followups, scheduled-messages, whatsapp-quality, health, daily-digest, admin-alerts, session-timeout, invoice-reminders, backup-export, ad-conversions, reactivation, review-requests, renewals) are actually wired into the workflow, not just documented.
- `.env.local` present with all vars `CLAUDE.md`/`CONTINUE_HERE.md` claim are set (Google Calendar, WhatsApp, Anthropic, Supabase, SearchAPI) — consistent with "deployed & live" claims.
- Security: `supabase/migrations/20260702000000_security_lockdown_rls.sql` exists and matches the RLS-hardening story in `CONTINUE_HERE.md`.

**Routes:** 20 top-level app segments (`admin`, `sales`, `telecaller`, `manager`, `strategist`, `client`, `client-portal`, `staff`, `projects`, `tasks`, `attendance`, `lp`, `p`/`a`/`inv`/`r` short-link public views, `site` marketing pages, `start` — new). 32 API routes, of which 12 are cron endpoints, 1 inbound webhook dispatcher (`/api/inbound/[channel]`), 1 WhatsApp webhook, session/attendance tracking, lead dedup/merge.

**Auth:** gate lives in `proxy.ts` (Next 16 convention, not `middleware.ts`), fail-open by design (documented, deliberate choice per multiple docs — not an oversight).

**Supabase:** 54 files in `supabase/migrations/` + 26 dated one-off SQL files at `supabase/` root (run manually via dashboard SQL editor per project convention — no local psql/CLI). Latest migration `20260702000000_security_lockdown_rls.sql`; latest root SQL file `2026-06-26_invoice_is_interstate.sql`. ~~`types/database.types.ts` (177K, generated) is dated 2026-06-17 — stale.~~ **Regenerated 2026-08-20** via `supabase gen types typescript` (113 → 119 tables) — `ad_conversions`, `cron_heartbeats`, `do_not_contact`, `renewal_reminded_at` and the rest all present now. `tsc` was already passing before the regen because the app code didn't lean on strict typing for those fields (consistent with `CLAUDE.md`'s own admission: `as any` used "sparingly" but present) — it stayed passing after too.

**In-flight, uncommitted work found on this branch (not yet in any doc except README, which is current):**
- `app/start/page.tsx` — a new general (non-niche) campaign landing page at `/start`, wired into `proxy.ts` and `layout-wrapper.tsx` as a public route. README documents it accurately as of 2026-07-27, "not yet deployed to prod." This is coherent, current work — not drift.
- 3 commits landed after `CONTINUE_HERE.md`'s last update (2026-07-08): dark-theme contrast fixes and mobile FAB fixes through 2026-07-22, none reflected in the canonical handoff doc.

**Doc trust map for this app specifically:** at analysis time, `CONTINUE_HERE.md` (2026-07-08) and `CLAUDE.md` (2026-06-25) were ~6 weeks stale against the git log and untracked work; `README.md` (2026-07-27) was the freshest. **Both updated 2026-08-20** — `CONTINUE_HERE.md` now covers through the same date (including the in-flight `/start` LP work), `CLAUDE.md`'s banner now points readers at it instead of going stale itself.

---

## 4. Cross-cutting findings

### Documentation drift (the dominant theme) — reconciled 2026-08-20
Every dated doc in this repo was accurate *at the time it was written*, but several stopped being updated while work continued:
- ~~`01_CRM_AND_TOOL/CONTEXT.md` (2026-06-22): claims 6.5/6.6/6.8/6.9... "not yet built"~~ **Fixed.** On the follow-up source-level re-check, one more imprecision surfaced in the fix itself: "Stage 5 presence not yet built" was also wrong in a subtler way — a content-calendar/checklist shell for GMB/SEO/social exists (`app/admin/growth/*`, predates the Stage 5 spec) but doesn't fulfill it (no GA4/GSC/social-API integration — confirmed via a code comment admitting "no data source yet"). Corrected to reflect that distinction rather than a flat "not built."
- ~~`05_FORTUNEMARQ_ONLINE_PRESENCE/CONTEXT.md`... "only dental-clinics is enabled"~~ **Fixed** — and a second false claim caught in the same file while fixing it: a 2026-06-20 changelog entry claiming `public_html.zip` "was removed" was itself wrong (it's still present). Corrected too.
- ~~`06_PAID_MARKETING/CONTEXT.md`... "Critical Rule" section... still says LP rollout is a blocking gate.~~ **Fixed.**
- `00_MASTER/CRITICAL_PATH.md` (2026-06-24) and `PENDING_ACTIONS.md` (2026-06-25) both explicitly flag themselves as historical/superseded in their own text — good practice, left as-is (no active contradiction to fix, just intentionally frozen history).
- `FMOS_System_Design_And_Tasks.md` header staleness — not directly edited; its own dated-entry convention means new facts get appended as entries rather than the header being bumped, which is an acceptable pattern for that specific doc (unlike the others above, where the *headline claim itself* was wrong, not just the "last updated" stamp).

**Root cause pattern:** docs get a full rewrite when a major feature ships, then incremental facts get appended below without touching the top summary/status line, so the headline claim silently goes stale while the body is technically append-only-correct. `LIVE_STATE.md` (machine-generated) doesn't have this problem — it's the one doc in the repo guaranteed current. **Lesson from the fix pass:** even after reconciling against `LIVE_STATE.md`/`FMOS_System_Design_And_Tasks.md`, it was worth a second pass re-verifying the reconciled claims against actual source code — one of the "fixes" in the first pass was itself imprecise until checked against the code directly (see the `01_CRM_AND_TOOL/CONTEXT.md` bullet above). Reconciling docs against other docs isn't the same as reconciling against ground truth.

### Duplicate/dead content — resolved 2026-08-20, with corrections
- ~~`05_FORTUNEMARQ_ONLINE_PRESENCE/public_html.zip` — exact duplicate of `public_html/` (39M wasted).~~ **Correction: not dead.** `fmos/app/site/README.md` names it directly as the design source-of-truth ("unzip to inspect" for the original `script.js`/GSAP init patterns). Kept, deliberately, unchanged.
- Root: 12 loose one-off Python/JSON scratch files (`fix_*`, `patch_pdf*`, `generate_sample_pdf_v{1,2,3}`, `scrape_*_v2`, plus 2 stray data files) — confirmed genuinely dead, **deleted**.
- `01_CRM_AND_TOOL/FMOS_Change_Specs/data/` mirrors `fmos/lib/data/` — **the risk was real, not theoretical**: diffing found `script_type_{A,B,C,D}.json` had actually drifted (missing a whole Kannada/Kanglish localization layer added to the live copies on 2026-07-08). **Re-synced**, confirmed still in sync on a later re-check. The rest of the "mirrored" files (`proposal_schema.json`, `agreement_template.json`, `onboarding_checklists.json`, `upsell_rules.json`, etc., and their `04_CLIENT_MANAGEMENT/FMOS_*_Data/` counterparts) turned out **not to be a real risk at all** — grepped the live app and found zero references to any of those filenames; the actual implementations hardcode equivalent logic directly in TypeScript. Those are stale build-specs, not actively dual-maintained data — left as-is, correctly lower priority than originally framed.
- ~~`03_SALES_SYSTEM/Telecaller_Scripts/Hubli/<niche>/` — niche-based scripts likely superseded~~ **Correction: not superseded, deliberately retained.** Its own `CONTEXT.md` has a locked decision: *"Per-niche Hubli/ scripts are legacy and will not be used... Kept for reference only."* Already correctly documented — this report's "likely superseded" framing was an assumption from the file tree alone, not from reading the governing doc. Left unchanged.
- ~~`Website/Landing-Pages/` — 108 markdown LP content briefs, likely superseded~~ **Correction: not superseded, actively used.** Its `CLAUDE.md` reveals this is the **live planning/tracking layer** for the 117-LP system — one status card per niche×city tracking URL/status/mode/notes — not dead pre-redesign content. Left unchanged.

### Security
- ~~**P0**: live service-role key committed + public repo (§0).~~ **RESOLVED** — see status block at top. Legacy keys fully disabled/revoked project-side, not just rotated; verified via a live `401` on the exact leaked key.
- RLS lockdown migration is real and present; `is_staff()`-scoped policies replacing blanket `authenticated` policies, per `CONTINUE_HERE.md` and confirmed by migration file existing.
- No other hardcoded secrets found in tracked `.ts`/`.tsx`/`.js` source at the time of the original pass (broader regex sweep for API-key-shaped strings came back clean apart from the two files above). One thing found in the *follow-up* work, not the original sweep: `import_hubli_leads.py`'s hardcoded key was the public `anon` key (safe-by-design to expose) — but since the legacy anon key format is now disabled project-side anyway, it was switched to read from `SUPABASE_ANON_KEY` env too, for consistency, not because it was a security risk.
- **New in the follow-up work**: `create-users.js` also had 4 real account passwords (Jabeer/Afifa/admin1/admin2) hardcoded in plaintext — missed by the original secret-pattern regex sweep because passwords don't match API-key shapes. Moved to a gitignored local file (`00_MASTER/FMOS_USER_CREDENTIALS.local.json`). Worth noting for future passes: a secrets sweep tuned only for key-shaped strings (`eyJ...`, `sk-...`, etc.) will miss plaintext passwords — check for those separately.
- `.env.local`/`.env.staging` are gitignored correctly (not committed).

### Half-finished / dormant-by-design (not bugs — confirmed intentional via docs + code)
- Ad-conversion uploader (Meta CAPI + Google OCI): built, env-gated dormant until `META_CAPI_TOKEN`/`GOOGLE_ADS_*` are set — correct staged rollout, not abandoned.
- Reactivation drip (6.6): built, `REACTIVATION_ENABLED` flag off by default — deliberate.
- In-app `@react-pdf` report generator: disabled behind `REPORTS_INAPP_GENERATOR`, superseded by the Python reportlab pipeline — deliberate, documented "anti-clobber" measure.
- Stage 2 (campaign engine), Stage 5.2–5.7 (GMB/SEO/social/presence dashboard), 6.7 (capacity guardrail), 1.1/1.2 (collection automation) — genuinely not built, consistently described as such across every doc that mentions them.

---

## 5. Production-ready vs. looks-done

**Actually production-ready (verified, not just claimed):**
- FMOS core CRM (leads/outreach/proposals/agreements/invoicing/delivery) — deployed, `tsc`+build green, RLS-hardened.
- WhatsApp Cloud API integration — templates Meta-approved (per docs; not independently re-verified against Meta's API in this pass), cron-driven, safety-gated (opt-out, rate limits, dedup).
- Marketing site + 117 niche landing pages — code compiles, routes present, sitemap wired.
- Cron/automation infrastructure — GitHub Actions workflow confirmed wired to every documented endpoint.

**Looks done but isn't (or isn't verifiable from this pass):**
- "All 33 WhatsApp templates Meta-approved" — taken from docs; not independently checked against the Meta Graph API in this analysis (would need live API credentials/call).
- Ad campaigns — infrastructure built, but **no campaigns have actually launched** per the folder's own "Critical Rule" gate; this is honestly represented in the docs, just worth restating since "Google Ads API approved" reads like more progress than it is.
- ~~`types/database.types.ts` accuracy — the app *works* around the stale types~~ **regenerated 2026-08-20, no longer applies.**
- Own doc claims about build status generally — treat anything in `00_MASTER/` dated before ~2026-07-08 as needing a re-verify pass against actual code before acting on it.

---

## 6. Prioritized recommendations — status as of 2026-08-20 (follow-up work)

**P0 — do today:**
1. ✅ **DONE.** Rotated *and* migrated off the legacy key system entirely, then disabled/revoked it project-side (stronger than the original recommendation, which only asked for rotation). Both scripts fixed to read from env.

**P1 — this week:**
2. ✅ **DONE.** All five docs reconciled — not just against `LIVE_STATE.md`/`FMOS_System_Design_And_Tasks.md`, but re-verified against actual source code (routes, grep for underlying logic) in a second pass. One claim in the first reconciliation pass turned out itself imprecise ("Stage 5 presence not yet built") and was corrected on re-check — see the FMOS app CONTEXT.md's own changelog for that detail.
3. ✅ **DONE.** [types/database.types.ts](01_CRM_AND_TOOL/fmos/types/database.types.ts) regenerated via the official `supabase gen types` CLI (113 → 119 tables). Chose the CLI over hand-writing it from a SQL introspection query specifically to avoid subtle type errors; `tsc --noEmit` + `npm run build` both confirmed green before committing.
4. ✅ **DONE.** `CONTINUE_HERE.md` and `CLAUDE.md` both updated to cover the gap through 2026-08-20, including the in-flight uncommitted `/start` LP work (still uncommitted as of this update, correctly — it's genuinely not deployed yet).

**P2 — status, with two corrections:**
5. ❌ **Reversed — do not delete.** `public_html.zip` is the documented design source-of-truth per `fmos/app/site/README.md`. Left in place.
6. ✅ **DONE.** All 12 root scratch files deleted via `git rm` (recoverable from history).
7. ✅ **DONE** (partial, deliberately). `voice-swap/` added to `.gitignore`; the 736M of actual content (real production video/audio work) was left in place rather than moved, since moving/deleting untracked bulk content wasn't asked for and isn't reversible.
8. ✅ **DONE**, and the risk assessment corrected: only `script_type_{A,B,C,D}.json` were an actual dual-maintenance risk (re-synced); everything else "mirrored" turned out to be unused dead specs, not live-synced data.
9. ✅ **DONE.** Moved to the session scratchpad (outside the repo), not deleted outright since it was untracked and irreversible.
10. ❌ **Reversed — do not delete/archive.** Both `Telecaller_Scripts/Hubli/` and `Website/Landing-Pages/` are deliberately retained per their own governing docs, not superseded. Left unchanged.

---

## Method notes / what was sampled vs. read in full
- **Read in full:** every `CONTEXT.md`/`CLAUDE.md` doc in the 11 top folders, `CONTINUE_HERE.md`, `CLAUDE.md` (fmos), `LIVE_STATE.md`, `CRITICAL_PATH.md`, `PENDING_ACTIONS.md`, `FMOS_System_Design_And_Tasks.md` (tail), `gst-status-and-gaps.md`, `open-tasks.md`, `package.json`, `.env.example`.
- **Structurally surveyed (file trees, counts, sizes, git log/diff) but not opened file-by-file:** all component/lib/action directories in fmos, all SQL migrations (54 files — existence/naming verified, contents not individually read), all 108 `Website/Landing-Pages/*.md` briefs, all 14 telecaller-script niche folders.
- **Explicitly sampled, not exhaustive (per task instruction):** the ~900+ generated PDF reports (76 local samples found; the rest live in Supabase Storage, not on disk), the 123 raw SERP HTML scrape files in `Competitor_Data/`, the lead CSVs in `Lead_Database/`.
- **Verified by execution, not just reading docs:** `npx tsc --noEmit` (0 errors), `npm run build` (success), `gh repo view` (confirmed public), secret-pattern grep across tracked source, git status/diff/log for every folder with uncommitted or recent changes.
- **Not verified (would need external access):** live Meta WhatsApp template approval status, live Supabase table/RLS state (only migration *files* were checked, not the live database), live Vercel env var values.
