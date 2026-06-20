# 05 — FortuneMarq Online Presence
**Last Updated:** 2026-06-20 | **Status:** Own-presence work is largely **still pending**, BUT the website redesign is **DONE & live**: fortunemarq.com is now the **redesigned Next.js marketing site that lives inside the FMOS app** (`01_CRM_AND_TOOL/fmos`, see `components/site/` + its public marketing routes), **deployed on Vercel** — NOT the old Hostinger static `public_html` build (that is legacy/superseded). Still pending: GMB optimization; social content strategy; the 11 niche landing pages (still the old HTML — need porting into the new site before deploy); ad accounts. The FMOS app itself is deployed & live. This folder also hosts `Proof_Vault/` (case studies written by FMOS's "Mark as Case Study" flow, behind a consent gate).

> Ground truth for build state: `00_MASTER/FMOS_System_Design_And_Tasks.md` (newest dated entries) + `00_MASTER/FMOS_Execution_Roadmap.md`.

## Folder Purpose
Build and manage FortuneMarq's own digital presence — website SEO, GMB, Instagram, Facebook, and LinkedIn. This is the long-game inbound lead channel. While the sales system does outbound, online presence builds brand authority that makes every outbound call easier and generates inbound leads over time.

## Current State

| Channel | Status | Next Action |
|---|---|---|
| fortunemarq.com | **Redesigned & live on Vercel** (Next.js site inside the FMOS app, `components/site/` — NOT the old Hostinger `public_html` build) | Port the 11 niche landing pages into the new site |
| GMB | Created, verified, not optimized | Full optimization starts June 15 |
| Niche landing pages | 11 HTML files built — need redesign | Redesign before deploying to fortunemarq.com |
| Instagram | Account created, few posts live | Complete content strategy + consistent posting |
| Facebook | Account created, few posts live | Complete content strategy + consistent posting |
| LinkedIn | Account created, few posts live | Complete content strategy + consistent posting |
| Google Ads account | Not created | Create account + build strategy |
| Meta Ads account | Not created | Create account + build strategy |

## What Exists (Complete)

### Root Files
| File | Description |
|---|---|
| `public_html/` | **LEGACY** static HTML/CSS/JS site — the PRE-redesign fortunemarq.com. **Superseded** by the live Next.js marketing site in `01_CRM_AND_TOOL/fmos` (`components/site/`). Kept for reference only; editing it does NOT change the live site. (The old `public_html.zip` was removed.) |
| `CONTEXT.md` | This file |

### niches/ — Niche Landing Pages (April 2026)
11 HTML files — one per Hubli niche, data-driven with real search volumes and competitor gaps. **Pending redesign before deployment.**
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

These landing pages are referenced by WhatsApp templates as `{{landingPageLink}}`. All WhatsApp messages that include the landing page link are blocked until these pages are redesigned and deployed.

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

### SEO_and_Local_SEO/ — SEO Planning
- `CONTEXT.md` only — no build files yet

### _project_files/ — Reference
- `CONTEXT.md`, `MASTER_CONTEXT.md`, `Niche_Data_Reference_Sheet.md`

## Goals
- **GMB:** Rank for "digital marketing agency Hubli" and related searches. Optimization starts June 15.
- **Niche pages:** Redesigned and live on fortunemarq.com so WhatsApp templates can send links
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
2. **Niche landing pages** — the 11 HTML pages in `niches/` are still the OLD design and are NOT yet on the new Next.js site. Port/redesign them into the new site (route them under fortunemarq.com/[niche]-hubli). Physiotherapy page missing — create it.
3. **GMB full optimization** — starts June 15: add all 7 services, 15+ photos, keyword-rich description, posting schedule (2x/week), pre-populate Q&A, request reviews from existing clients
4. **SEO** — starts June 15: keyword targeting for fortunemarq.com, "digital marketing agency Hubli" and niche searches
5. **Social media content strategy** — complete content calendar for Instagram, Facebook, LinkedIn. Consistent posting schedule
6. **Google Ads account** — create account + build full strategy before launching campaigns
7. **Meta Ads account** — create account + build full strategy before launching campaigns

## What's Blocked
- All WhatsApp `{{landingPageLink}}` references blocked until niche pages are redesigned and deployed
- Ad campaigns blocked until accounts created and strategy built
- Niche page deployment blocked on redesign completion

## Connections to Other Folders
- **Feeds INTO:** `06_PAID_MARKETING` (brand awareness reduces CPL), `03_SALES_SYSTEM` (inbound leads from content)
- **Uses data FROM:** `07_DATA_AND_RESEARCH` (niche search volumes for content hooks)
- **Landing pages enable:** `03_SALES_SYSTEM/WhatsApp_Templates/` — all templates referencing `{{landingPageLink}}` are blocked until pages are live
- **Note:** bot_reply_templates.json is deprecated (2026-06-08) — landing page link is now sent via direct PDF report flow and Tell Me More auto-reply in curiosity_templates.json

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
