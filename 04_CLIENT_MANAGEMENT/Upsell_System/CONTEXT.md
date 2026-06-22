> **Current status (2026-06-17):** FMOS is **deployed \& live**; this folder is planning/reference content. Any "blocked on / pending FMOS deployment" notes below are **obsolete**. Authoritative build state: `00_MASTER/FMOS_System_Design_And_Tasks.md` (newest dated entries) + `00_MASTER/FMOS_Execution_Roadmap.md`.

# 04 — Upsell System
**Last Updated:** 2026-04-28 (revised: FMOS production-ready v4.5) | **Status:** COMPLETE — upsell_rules.json + upsell_scripts.json created

## Folder Purpose
Rules engine and conversation scripts for upselling active clients once strong results are established. Keeps revenue growing from the existing client base without relying entirely on new client acquisition.

## What Exists (Complete)

### FMOS_Upsell_Data/ folder
| File | Description |
|---|---|
| `upsell_rules.json` | Trigger conditions (Excellent health score for 2+ months), eligible services per trigger scenario, 5-step upsell process, pipeline statuses with definitions |
| `upsell_scripts.json` | Jabeer's call script for the upsell call, meeting talking points, post-call WhatsApp templates (4 outcome variants) |

### Root Files
| File | Description |
|---|---|
| `CONTEXT.md` | This file |

## Upsell Services (Phase 1)
- **Social Media Management** — Instagram + Facebook content calendar. Best for visual/B2C niches (Gyms, Skin Clinics, Dental, Interior Designers)
- **Google Ads** — Paid search on top of organic SEO. Best for high-intent niches (IVF, Car Rentals, JEE/NEET Coaching)

## Trigger Condition
- Client scores **Excellent (80+)** on health score for **2 consecutive months**
- FMOS flags client as "Upsell Ready" and surfaces them in admin upsell queue
- Jabeer reviews, decides whether to proceed

## Upsell Pipeline Statuses
Not Eligible → Upsell Ready → In Conversation → Closed Won / Closed Lost / Snoozed (60 days)

## 5-Step Upsell Process
1. FMOS flags client as Upsell Ready (health score trigger)
2. Jabeer reviews client — confirms results are strong enough to justify the ask
3. Jabeer calls client — leads with results, presents the upsell opportunity
4. If interested: Zoom call booked for detailed presentation
5. Outcome logged in FMOS (Closed Won / Follow Up / Not Now / Declined)

## Who Handles It
- **Jabeer personally** makes the upsell call — same relationship-first approach as first meeting
- No hard sell — lead with results, explain the next growth lever

## What's Pending
- FMOS Phase E: Build upsell queue in admin dashboard (`/admin/clients` upsell tab)
- FMOS: Auto-flag clients who hit Excellent score 2 months in a row
- `upsell_rules.json` + `upsell_scripts.json` to be seeded into FMOS in Phase E

## What's Blocked
- FMOS is live; upsell automation (4.8) not yet built
- No clients yet to upsell

## Connections to Other Folders
- **Triggered by:** `04_CLIENT_MANAGEMENT/Monthly_Reports/FMOS_Report_Data/client_health_score.json` — Excellent tier for 2 months
- **Re-enters pipeline at:** `03_SALES_SYSTEM` — upsell is a mini sales cycle
- **Tracked in:** `01_CRM_AND_TOOL/fmos` — FMOS admin upsell queue (Phase E)

## Key Decisions Made (Locked)
- Upsell trigger: Excellent (80+) for 2 consecutive months — not before
- Jabeer handles all upsell calls personally — Afifa does not do upsell calls
- Phase 1 upsell services: Social Media and Google Ads only
- Snoozed: 60-day pause before re-approaching "Not Now" clients

## Session History
| Date | Summary |
|---|---|
| March 2026 | Folder created. Upsell paths and renewal process defined in Renewals_and_Upsells/. |
| 2026-04-26 | L7 complete. FMOS_Upsell_Data/ folder created. upsell_rules.json and upsell_scripts.json created. |
| 2026-04-28 | CONTEXT.md written for first time accurately. Files confirmed present. |
