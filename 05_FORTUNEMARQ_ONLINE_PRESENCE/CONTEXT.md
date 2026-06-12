# 05 — FortuneMarq Online Presence
**Last Updated:** 2026-06-08 | **Status:** Website live but needs redesign. GMB created, optimization starts June 15. Social accounts created, content strategy pending. Niche landing pages exist but need redesign before deployment. Ad accounts pending.

## Folder Purpose
Build and manage FortuneMarq's own digital presence — website SEO, GMB, Instagram, Facebook, and LinkedIn. This is the long-game inbound lead channel. While the sales system does outbound, online presence builds brand authority that makes every outbound call easier and generates inbound leads over time.

## Current State

| Channel | Status | Next Action |
|---|---|---|
| fortunemarq.com | Live on Hostinger — needs redesign | Redesign and redeploy |
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
| `public_html.zip` | Full website HTML/CSS/JS zip (40MB) — current fortunemarq.com build (needs redesign) |
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
1. **fortunemarq.com redesign** — current site needs full redesign and redeployment
2. **Niche landing pages redesign** — all 11 HTML pages need redesign before going live. Physiotherapy page missing — create it. Deploy to fortunemarq.com/[niche]-hubli after redesign
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
- fortunemarq.com needs full redesign before it can be used as a credibility asset in sales
- GMB optimization and SEO start date: June 15, 2026

## Session History
| Date | Summary |
|---|---|
| March 2026 | Context file created. Website live. GMB created. Content strategy outlined. |
| 2026-04-28 | CONTEXT.md fully rewritten. Niche landing pages (11 HTML files in niches/) and assets confirmed present. |
| 2026-06-08 | Full section review. Website and niche pages flagged for redesign. GMB + SEO start date set: June 15. Social accounts confirmed created with few posts — content strategy pending. Ad accounts (Google + Meta) added as pending. bot_reply_templates reference updated to reflect deprecated flow. |
