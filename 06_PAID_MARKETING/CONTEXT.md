# 06 — Paid Marketing (FortuneMarq's Own)
**Last Updated:** 2026-06-22 | **Status:** PLANNED + INBOUND TRACKING INFRA BUILT IN FMOS (which is deployed & live). Built: campaign registry (`ad_campaigns` + CPL targets), daily spend tracking (`ad_insights_daily` via Meta/Google CSV import, API sync later), UTM link builder, lead-source attribution, inbound funnel + channel scoreboard on `/admin/marketing`. The agency's own **campaign LAUNCH** has not happened yet — it waits on the niche landing pages rolling out across niches/cities (critical rule below). Note this is FortuneMarq's *own* ad spend; the broader campaign-management Stage 2 is not yet built. Plan: `00_MASTER/FMOS_System_Design_And_Tasks.md` (Stage 2) + `00_MASTER/FMOS_Execution_Roadmap.md`.

> Ground truth for build state: `00_MASTER/FMOS_System_Design_And_Tasks.md` + `00_MASTER/FMOS_Execution_Roadmap.md`.

## Folder Purpose
Plan and execute FortuneMarq's own paid ad campaigns (Meta Ads + Google Ads) to generate inbound leads. Niche-specific, city-specific campaigns targeting local business owners in Hubli-Dharwad. This folder covers FortuneMarq's own marketing spend — not client campaigns (those are in 02_SERVICE_DELIVERY_AUTOMATION/Ads_Automation).

## Critical Rule
**Paid campaigns are the LAST step.** FMOS is now deployed and working, so the remaining gates are:
- Niche landing pages rolled out (in-app dynamic LP template `/lp/[niche]/[city]` is live; Dental·Hubli enabled, other niche/city combos to be turned on)
- Telecaller system operational (Afifa working leads in FMOS)
- Delivery can handle incoming leads (Stage 4 board is live)

Do not run ads into a broken system.

## What Exists (Complete)
| File | Description |
|---|---|
| `CONTEXT.md` | This file |
| `Google_Ads/CONTEXT.md` | Planning placeholder — no build files |
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
