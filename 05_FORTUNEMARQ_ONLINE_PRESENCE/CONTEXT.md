# 05 — FortuneMarq Online Presence
**Last Updated:** 2026-08-20 (doc-drift reconciliation vs `00_MASTER/LIVE_STATE.md` + `FMOS_System_Design_And_Tasks.md`) | **Status:** the website redesign is **DONE & live**: fortunemarq.com is now the **redesigned Next.js marketing site that lives inside the FMOS app** (`01_CRM_AND_TOOL/fmos`, see `components/site/` + its public marketing routes), **deployed on Vercel** — NOT the old Hostinger static `public_html` build (that is legacy/superseded). The marketing site is **fully built** (home, about, services, work, contact, blog, privacy-policy, terms-of-service) with **GA4 + Microsoft Clarity + Google Search Console + Meta Pixel connected**. Niche landing pages have been **rebuilt in-app** at `/lp/[niche]/[city]` and **corrected from "dental-clinics only" — all 13 niches × 9 cities = 117 LPs are enabled and live** (`lib/lp/niches.ts`, deployed 2026-06-24). Still pending: GMB optimization; social content strategy; ad accounts; the unified presence dashboard (5.7). The FMOS app itself is deployed & live (at fmos.fortunemarq.com). This folder also hosts `Proof_Vault/` (case studies written by FMOS's "Mark as Case Study" flow, behind a consent gate).

> Ground truth for build state: `00_MASTER/FMOS_System_Design_And_Tasks.md` (newest dated entries) + `00_MASTER/FMOS_Execution_Roadmap.md`.

## Folder Purpose
Build and manage FortuneMarq's own digital presence — website SEO, GMB, Instagram, Facebook, and LinkedIn. This is the long-game inbound lead channel. While the sales system does outbound, online presence builds brand authority that makes every outbound call easier and generates inbound leads over time.

## Current State

| Channel | Status | Next Action |
|---|---|---|
| fortunemarq.com | **Redesigned, fully built & live on Vercel** (Next.js site inside the FMOS app, `components/site/` — NOT the old Hostinger `public_html` build); all pages live (home/about/services/work/contact/blog/privacy/terms) + GA4/Clarity/GSC/Meta Pixel connected | Maintain content; build the presence dashboard |
| GMB | Created, verified, not optimized | Full optimization starts June 15 |
| Niche landing pages | **Rebuilt in-app** at `/lp/[niche]/[city]` — all 13 niches × 9 cities (117 LPs) live since 2026-06-24 | Maintain content; roll ad spend into them |
| Instagram | Account created, few posts live | Complete content strategy + consistent posting |
| Facebook | Account created, few posts live | Complete content strategy + consistent posting |
| LinkedIn | Account created, few posts live | Complete content strategy + consistent posting |
| Google Ads account | Not created | Create account + build strategy |
| Meta Ads account | Not created | Create account + build strategy |

## What Exists (Complete)

### Root Files
| File | Description |
|---|---|
| `public_html/` | **LEGACY** static HTML/CSS/JS site — the PRE-redesign fortunemarq.com. **Superseded** by the live Next.js marketing site in `01_CRM_AND_TOOL/fmos` (`components/site/`). Kept for reference only; editing it does NOT change the live site. (`public_html.zip`, an exact duplicate of this folder, is still present as of 2026-08-20 — an earlier note here claiming it was removed was wrong.) |
| `CONTEXT.md` | This file |

### niches/ — Niche Landing Pages (April 2026, now superseded)
11 HTML files — one per Hubli niche, data-driven with real search volumes and competitor gaps. **Superseded:** niche landing pages have been **rebuilt in-app** in the FMOS app at `/lp/[niche]/[city]` — all 13 niches × 9 cities (117 LPs) live since 2026-06-24. These old HTML files are kept for reference only.
- `car-rentals-hubli.html`
- `dental-clinics-hubli.html`
- `gyms-hubli.html`
- `ielts-coaching-hubli.html`
- `interior-designers-hubli.html`
- `ivf-clinics-hubli.html`
- `jee-neet-coaching-hubli.html`
- `modular-kitchens-hubli.html`
- `real-estate-hubli.html`
- `skin-clinics-hubli.html`
- `tuition-centres-hubli.html`

Note: physiotherapy landing page is missing — needs to be created.

WhatsApp outreach is **live** via the Direct Report v3 flow (`direct_report_v3_{a,b,c,d}` — a text template with 3 quick-reply buttons, then the matched market-intel PDF as a follow-up). The in-app niche LP at `/lp/[niche]/[city]` (all 13 niches × 9 cities live) is the new home for the landing-page link.

### assets/ — Brand Images
- `images/niches/funnels/` — 13 funnel SVGs (one per niche)
- Gemini-generated brand visuals (2 images, April 2026)

### Instagram_Facebook/ — Social Media Subfolders
- `Carousels/CONTEXT.md` — planning placeholder
- `Reels/CONTEXT.md` — planning placeholder
- `Single_Image/CONTEXT.md` — planning placeholder

### LinkedIn/ — LinkedIn Subfolder
- `Posts/CONTEXT.md` — planning placeholder
- `CONTEXT.md`

### Content_Studio/carousels/ — Branded carousel builder (2026-08-04)
- HTML→PNG carousels built in the FortuneMarq brand system (Alliance + JetBrains Mono fonts in `fonts/`, FM logo in `assets/`, dark + green `#2ecb84`) — vector/CSS graphics only, no AI imagery. Rendered to PNG via headless Chrome into `exports/<name>/`.
- `gmb-checklist.html` — first pre-launch credibility-floor carousel (7 slides, 4:5): designed listing-card cover + 5 tips + CTA. Reuses the same design approach as the ad carousel at `06_PAID_MARKETING/Campaigns/Hubli/carousel_general_v1.html`. More carousels (boosting-vs-ads, search-leak) planned in the same template.

### SEO_and_Local_SEO/ — SEO Planning
- `CONTEXT.md` only — no build files yet

### _project_files/ — Reference
- `CONTEXT.md`, `MASTER_CONTEXT.md`, `Niche_Data_Reference_Sheet.md`

## Goals
- **GMB:** Rank for "digital marketing agency Hubli" and related searches. Optimization starts June 15.
- **Niche pages:** In-app niche LP at `/lp/[niche]/[city]` live — all 13 niches × 9 cities (117 LPs) enabled since 2026-06-24
- **SEO:** fortunemarq.com appearing for local agency keywords. Starts June 15.
- **Instagram/Facebook/LinkedIn:** Consistent posting, complete content strategy
- **Ad accounts:** Google Ads + Meta Ads accounts created and strategy built

## Content Strategy (Instagram/Facebook — 5 posts/week)
1. Niche data reels (2×/week) — real search volume numbers for Hubli niches
2. Behind the system (1×/week) — show the CRM, PDFs, automation
3. AI tools education (1×/week) — tools that help local businesses
4. Client results (1×/week — once results exist)
5. Agency building tips (1×/week)

**Status:** Strategy defined, execution not started. Accounts created with few initial posts.

## What's Pending
1. ~~fortunemarq.com redesign~~ — **DONE & live (2026-06-20):** the redesigned Next.js marketing site is live on Vercel (in the FMOS app, `components/site/`). Remaining work has moved to item 2.
2. ~~Niche landing pages~~ — **DONE (2026-06-24):** rebuilt in-app at `/lp/[niche]/[city]`, all 13 niches × 9 cities (117 LPs) live. The 11 old HTML pages in `niches/` are superseded and kept for reference only.
3. **GMB full optimization** — starts June 15: add all 7 services, 15+ photos, keyword-rich description, posting schedule (2x/week), pre-populate Q&A, request reviews from existing clients
4. **SEO** — starts June 15: keyword targeting for fortunemarq.com, "digital marketing agency Hubli" and niche searches
5. **Social media content strategy** — complete content calendar for Instagram, Facebook, LinkedIn. Consistent posting schedule
6. **Google Ads account** — create account + build full strategy before launching campaigns
7. **Meta Ads account** — create account + build full strategy before launching campaigns

## What's Blocked
- Ad campaigns blocked until accounts created and strategy built

(WhatsApp outreach is no longer blocked — it is live via Direct Report v3, and the niche LP is rebuilt in-app at `/lp/[niche]/[city]`.)

## Connections to Other Folders
- **Feeds INTO:** `06_PAID_MARKETING` (brand awareness reduces CPL), `03_SALES_SYSTEM` (inbound leads from content)
- **Uses data FROM:** `07_DATA_AND_RESEARCH` (niche search volumes for content hooks)
- **Landing pages enable:** `03_SALES_SYSTEM/WhatsApp_Templates/` — outreach is live via Direct Report v3; the in-app niche LP at `/lp/[niche]/[city]` (all 13 niches × 9 cities live) is the link target
- **Note:** bot_reply_templates.json is deprecated (2026-06-08) — outreach now runs through the Direct Report v3 flow (`direct_report_v3_{a,b,c,d}`): a text template with 3 quick-reply buttons ("Book a meeting" / "Tell me more" / "ಕನ್ನಡ ವರದಿ"), then the matched market-intel PDF as a follow-up document

## Key Decisions Made (Locked)
- FortuneMarq brand first (not Jabeer's personal brand) — agency brand building
- Instagram + LinkedIn are the primary social platforms
- Niche landing pages are data-driven (real search volumes) — not generic agency pages
- fortunemarq.com needs full redesign before it can be used as a credibility asset in sales — **redesign DONE & live on Vercel (2026-06-20)**
- GMB optimization and SEO start date: June 15, 2026

## Session History
| Date | Summary |
|---|---|
| March 2026 | Context file created. Website live. GMB created. Content strategy outlined. |
| 2026-04-28 | CONTEXT.md fully rewritten. Niche landing pages (11 HTML files in niches/) and assets confirmed present. |
| 2026-06-08 | Full section review. Website and niche pages flagged for redesign. Social accounts confirmed created with few posts — content strategy pending. Ad accounts (Google + Meta) added as pending. bot_reply_templates reference updated to reflect deprecated flow. |
| 2026-06-17 | Doc-accuracy sweep. Clarified FMOS app is deployed & live (separate from this folder's own-presence work, which remains pending). Noted `Proof_Vault/` now lives here (FMOS case-study consent flow). Past "June 15" optimization date treated as a checklist item, not a deadline. |
| 2026-06-20 | **Corrected stale state.** fortunemarq.com is the **redesigned Next.js site live on Vercel** (inside the FMOS app, `components/site/`), NOT the old Hostinger static `public_html` (now legacy/superseded; the `.zip` was removed). Added a legal-identity line (legal name *Sayed Jabeer* + trade name *FortuneMarq Media & Marketing* + GSTIN 29ICWPS9816Q1ZS + address) to the site footer (`components/site/site-footer.tsx`) for WhatsApp Cloud API display-name verification. Niche landing pages still pending port to the new site. |
| 2026-06-22 | **Doc-accuracy sweep.** Niche landing pages are now **rebuilt in-app** at `/lp/[niche]/[city]` (Dental·Hubli enabled) — the old 11 HTML files in `niches/` are superseded. WhatsApp outreach is **live** via Direct Report v3 (`direct_report_v3_{a,b,c,d}`); no `curiosity_templates.json`. Marketing site is **fully built** (all pages) + GA4/Clarity/GSC/Pixel connected. Removed stale "WhatsApp messages blocked" / "blocked on redesign" framing. |
| 2026-06-22 | **Correction:** marketing site is fully built (not "home only") and analytics (GA4/Clarity/GSC/Pixel) are connected — earlier "HOME page live, others pending" was wrong (verified against `app/site/*` routes + `components/site/site-analytics.tsx`). Niche-LP rollout remains partial (only `dental-clinics` enabled in `lib/lp/niches.ts`). |
| 2026-08-20 | **Doc-drift reconciliation.** Niche-LP status corrected — all 13 niches × 9 cities (117 LPs) have been live since 2026-06-24, not just `dental-clinics`. Also: the 2026-06-20 entry above claiming `public_html.zip` "was removed" is itself wrong — the file (`public_html.zip`, ~40M, an exact duplicate of `public_html/`) is still present on disk and in git as of this reconciliation; flagged for cleanup, not removed here (docs-only pass). |
