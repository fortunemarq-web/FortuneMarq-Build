> **Current status (2026-06-17):** FMOS is **deployed \& live**; this folder is planning/reference content. Any "blocked on / pending FMOS deployment" notes below are **obsolete**. Authoritative build state: `00_MASTER/FMOS_System_Design_And_Tasks.md` (newest dated entries) + `00_MASTER/FMOS_Execution_Roadmap.md`.

# 02 — Ads Automation
**Last Updated:** 2026-04-28 | **Status:** Not started — pre-build phase

## Folder Purpose
Plan and build the ads automation platform managing all client Google Ads and Meta Ads accounts — campaign generation, human approval gates, auto-optimisation, and monthly performance reporting.

## What Exists (Complete)
| File | Description |
|---|---|
| `CONTEXT.md` | This file — only file in this folder |

No build files exist. This folder is a planning placeholder.

## What's Pending
- Google Ads MCC setup (all client accounts under FortuneMarq MCC)
- Meta Business Manager setup (all client ad accounts under FortuneMarq BM)
- AI campaign structure generator per niche (campaign → ad group → keyword/audience → ad copy)
- Human approval gate in FMOS before any changes go live
- Budget monitoring + pause rules (overspend protection)
- Monthly ads performance report auto-generation
- Google Ads API + Meta Ads API integration
- Build timeline: Phase 2 (Months 3–4 after FMOS deployed)

## What's Blocked
- FMOS is live; this automation is still pre-build (Phase 2)
- Google MCC creation requires a real Google Ads manager account
- Meta BM requires verified business page and GSTIN
- API access requires billing setup with Google and Meta

## Connections to Other Folders
- **Inbound leads from ads to:** `01_CRM_AND_TOOL` — inbound leads auto-tagged with niche+city+source=ads
- **Campaign data for:** `04_CLIENT_MANAGEMENT/Monthly_Reports/FMOS_Report_Data/monthly_report_schema.json` — ads section
- **Reference:** `02_SERVICE_DELIVERY_AUTOMATION/Agency_OS_Master_Plan.docx`

## Key Decisions Made
- All client ad accounts managed under one MCC / Business Manager — never give clients admin access
- Human approval required before any live changes
- Jabeer reviews all ad creatives before activation

## Session History
| Date | Summary |
|---|---|
| March 2026 | Folder created as planning placeholder. |
| 2026-04-28 | CONTEXT.md rewritten. Confirmed no files exist. Blocked on FMOS deployment. |
