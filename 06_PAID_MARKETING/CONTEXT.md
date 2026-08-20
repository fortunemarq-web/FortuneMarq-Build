# 06 — Paid Marketing (FortuneMarq's Own)
**Last Updated:** 2026-08-20 (doc-drift reconciliation vs `00_MASTER/LIVE_STATE.md` + `FMOS_System_Design_And_Tasks.md`) | **Status:** PLANNED + INBOUND TRACKING INFRA BUILT IN FMOS (which is deployed & live). Google Ads API approved and ready (Manager/MCC account `982-189-5523`, developer token **`8jtCRKCJ71JgJYDd5rSEJg`** — Basic Access, approved 2026-07-13; GCP project `fortunemarq-fmos`, OAuth client — see `Google_Ads_API/`). Built: campaign registry (`ad_campaigns` + CPL targets), daily spend tracking (`ad_insights_daily` via Meta/Google CSV import, API sync later), UTM link builder, lead-source attribution, inbound funnel + channel scoreboard on `/admin/marketing`. **All 13 niches × 9 cities (117 LPs) have been live since 2026-06-24 — the niche-LP gate is cleared.** The agency's own **campaign LAUNCH** has not happened yet; the remaining gates are owner-side ad-account/creative work (critical rule below), not the LPs. Note this is FortuneMarq's *own* ad spend; the broader campaign-management Stage 2 is not yet built. Plan: `00_MASTER/FMOS_System_Design_And_Tasks.md` (Stage 2) + `00_MASTER/FMOS_Execution_Roadmap.md`.

> Ground truth for build state: `00_MASTER/FMOS_System_Design_And_Tasks.md` + `00_MASTER/FMOS_Execution_Roadmap.md`.

## Folder Purpose
Plan and execute FortuneMarq's own paid ad campaigns (Meta Ads + Google Ads) to generate inbound leads. Niche-specific, city-specific campaigns targeting local business owners in Hubli-Dharwad. This folder covers FortuneMarq's own marketing spend — not client campaigns (those are in 02_SERVICE_DELIVERY_AUTOMATION/Ads_Automation).

## Critical Rule
**Paid campaigns are the LAST step.** FMOS is now deployed and working, so the remaining gates are:
- ~~Niche landing pages rolled out~~ **DONE (2026-06-24)** — in-app dynamic LP template `/lp/[niche]/[city]` live for all 13 niches × 9 cities (117 LPs)
- Telecaller system operational (Afifa working leads in FMOS)
- Delivery can handle incoming leads (Stage 4 board is live)

The remaining launch gates are owner-side: create the Google Ads + Meta Ads accounts, finish ad creative, and activate the dormant conversion tracking (see `00_MASTER/LAUNCH_CHECKLIST.md`). Do not run ads into a broken system.

## What Exists (Complete)
| File | Description |
|---|---|
| `CONTEXT.md` | This file |
| `Google_Ads/CONTEXT.md` | Planning placeholder — no build files |
| `Google_Ads_API/FMOS_Google_Ads_API_Design_Document.pdf` | Design document for the Google Ads API **Basic Access** application (describes FMOS's API use: offline conversion import, reporting, campaign management via MCC `982-189-5523`). Attached to the developer-token application. |
| `Meta_Ads/CONTEXT.md` | Planning placeholder — no build files |
| `_project_files/MASTER_CONTEXT.md` | Master context for the folder |
| `_project_files/Niche_Data_Reference_Sheet.md` | Niche data for ad copy |

No campaign files exist. All campaigns are pre-launch.

## Budget (Phase 1 — Hubli)
₹20,000–₹30,000 total for Phase 1 campaigns

## Campaign Structure (Phase 1)
| Campaign | Budget | Target Audience |
|---|---|---|
| Gyms — Hubli | ₹4,000 | Gym owners/managers, 25–45, Hubli |
| Skin Clinics — Hubli | ₹4,000 | Clinic owners, 30–55, Hubli |
| Dental — Hubli | ₹3,000 | Dentists/owners, 30–55, Hubli |
| Coaching — Hubli+Dharwad | ₹4,000 | Institute owners/managers |
| Retargeting (50%+ video views) | ₹5,000 | Warm audience |
| Reserve — double down on winner | ₹10,000 | After week 2 data |

## Ad Format
Jabeer on camera. 60–90 seconds. Explains real niche search data. Ends with WhatsApp CTA to landing page.

## Landing Pages Required (before ads launch)
Served by the in-app dynamic LP template at `/lp/[niche]/[city]` in FMOS (live on fortunemarq.com). 13 niches are available; Dental·Hubli is currently enabled. Remaining niche/city combos need to be turned on for the campaigns being run.

## What's Pending
1. Enable the remaining niche/city LP combos (`/lp/[niche]/[city]`) for the campaigns being run
2. Afifa live working leads in FMOS (FMOS itself is deployed & live)
3. Jabeer records video ad (1 core video per niche — 60–90 seconds)
4. Create ad creatives (thumbnails, copy) in Canva
5. Setup Meta Business Manager ad account
6. Launch campaigns — Healthcare (Dental + Skin) first, then Real Estate → Car Rental → Gyms → Education
7. Week 2: analyze data, cut underperformers, double down on winner

## What's Still Open (FMOS is live; these gate campaign launch)
- Landing pages: enable the remaining niche/city LP combos (`/lp/[niche]/[city]`; Dental·Hubli already live)
- Jabeer records the per-niche video ads + creatives
- Meta Business Manager ad account setup

## Connections to Other Folders
- **Inbound leads to:** `01_CRM_AND_TOOL/fmos` — leads auto-tagged with niche+city+source=meta_ads or google_ads
- **Depends on:** the in-app niche LP template `/lp/[niche]/[city]` in FMOS — the target niche/city combos must be enabled
- **Uses data from:** `07_DATA_AND_RESEARCH` — search volumes and competitor gaps in ad copy

## Key Decisions Made (Locked)
- Paid ads are LAST — not before FMOS is deployed and working
- Phase 1: Meta Ads only (not Google Ads for FortuneMarq's own campaigns)
- Budget: ₹20K–₹30K for Phase 1
- Landing page per niche (not generic — niche-specific converts better)
- Jabeer on camera — personal founder video converts best

## Session History
| Date | Summary |
|---|---|
| March 2026 | Context file created. Campaign plan defined. Critical rule established. |
| 2026-04-28 | CONTEXT.md fully rewritten. Niche landing pages confirmed created (in 05_FORTUNEMARQ_ONLINE_PRESENCE/niches/). Still pre-launch. |
| 2026-06-17 | Doc-accuracy sweep. FMOS deployed & live; "blocked on deployment" removed. Remaining launch gates = LPs live + creatives + ad account. Clarified this is FortuneMarq's own spend vs the unbuilt Stage 2 campaign engine. |
| 2026-06-22 | Doc-accuracy fix. Landing pages corrected from "11 static HTML files in 05_..." to the in-app dynamic LP template `/lp/[niche]/[city]` (13 niches available, Dental·Hubli enabled). Launch gate reframed to enabling the remaining niche/city LP combos. |
| 2026-07-12 | Google Ads API access infrastructure set up via browser (agency/MCC architecture): Manager account `982-189-5523`, developer token (Test access), GCP project `fortunemarq-fmos` with Google Ads API enabled, OAuth consent screen published to Production + Desktop OAuth client "FMOS Ads API". Added `Google_Ads_API/` with the design-document PDF. **Basic Access application SUBMITTED to Google 2026-07-12** (compliance team acknowledged; review ~3 business days). |
| 2026-07-13 | Google Ads API **Basic Access APPROVED**. Developer token `8jtCRKCJ71JgJYDd5rSEJg` activated for Manager account `982-189-5523` (15,000 ops/day). Remaining: generate OAuth refresh token (needs owner Google sign-in) + set `GOOGLE_ADS_REFESH_TOKEN` + `GOOGLE_ADS_CLIENT_ID` + `GOOGLE_ADS_CLIENT_SECRET` + `GOOGLE_ADS_DEVELOPER_TOKEN` in Vercel at ad-launch. |
| 2026-08-20 | Doc-drift reconciliation. The "Critical Rule" gate still said niche LPs weren't rolled out — corrected: all 13 niches × 9 cities (117 LPs) have been live since 2026-06-24. Remaining launch gates are owner-side (ad accounts, creative, activating dormant conversion tracking), not the LPs. |
