# 04 — Client Management
**Last Updated:** 2026-06-17 | **Status:** Content (L5 onboarding / L6 reports + health score / L7 upsell) COMPLETE and wired into FMOS, which is **deployed & live**. FMOS Stage 4 (delivery) is built: onboarding checklist + "Download details PDF", plan-deliverables → milestones/tasks, delivery board with Drive links, milestone-complete WhatsApp, `monthly_report_ready` auto-send, and "Mark as Case Study" → `05_.../Proof_Vault/` (hard consent gate). Renewals/upsell queue automation is the main piece not yet built. Delivery is executed by **Jabeer + outsourced freelancers**.

> Ground truth for build state: `00_MASTER/FMOS_System_Design_And_Tasks.md` (newest dated entries) + `00_MASTER/FMOS_Execution_Roadmap.md`.

## Folder Purpose
Define and document how FortuneMarq manages clients after they sign — onboarding, delivery oversight, health monitoring, monthly reports, renewals, and upsells. This folder contains the processes, schemas, and SOPs. The execution happens in FMOS (01_CRM_AND_TOOL).

## The Client Lifecycle (post-sign)
Agreement Signed → Invoice Raised → Onboarding Checklist Triggered → Assets Collected → Delivery Starts → Monthly Reports Generated → Health Score Monitored → Upsell Flagged (if Excellent 2 months) → Renewal

## Content Build Status

| Level | Content | Status | Location |
|---|---|---|---|
| L5a | Onboarding SOP | COMPLETE | `Onboarding/onboarding_sop.md` |
| L5b | Onboarding Checklists | COMPLETE | `Onboarding/FMOS_Onboarding_Data/onboarding_checklists.json` |
| L6a | Monthly Report Schema | COMPLETE | `Monthly_Reports/FMOS_Report_Data/monthly_report_schema.json` |
| L6b | Client Health Score | COMPLETE | `Monthly_Reports/FMOS_Report_Data/client_health_score.json` |
| L7 | Upsell System | COMPLETE | `Upsell_System/FMOS_Upsell_Data/` |

## What Exists (Complete)

### Onboarding/ folder
- `FMOS_Onboarding_Data/onboarding_checklists.json` — Per-service onboarding checklists for all 7 services with full task+asset lists
- `FMOS_Onboarding_Data/onboarding.types.ts` — TypeScript interfaces for onboarding data
- `FMOS_Onboarding_Data/index.ts` — Loader: generateClientOnboarding(), isOnboardingComplete(), getMissingRequiredAssets()
- `onboarding_sop.md` — Full 10-step onboarding SOP covering: welcome message, kickoff call, asset collection, project setup, task assignment, timeline by service, asset vault guide, common problems

### Monthly_Reports/ folder
- `FMOS_Report_Data/monthly_report_schema.json` — Full report structure: 8 sections (Cover, Rankings, Traffic, Leads, GMB, What We Did, Plan for Next Month, Health Score)
- `FMOS_Report_Data/client_health_score.json` — Health score rules: 4 pillars (Rankings 25 + Traffic 25 + Leads 25 + GMB 25 = 100), tier thresholds, upsell trigger logic
- `FMOS_Report_Data/report_index.ts` — TypeScript loader with calculateHealthScore(), generateReportData(), getHealthScoreTier() helpers

### Upsell_System/ folder
- `FMOS_Upsell_Data/upsell_rules.json` — Trigger conditions (Excellent score 2+ months), services offered (Social Media, Google Ads), 5-step upsell process, pipeline statuses
- `FMOS_Upsell_Data/upsell_scripts.json` — Jabeer's call script, meeting talking points, post-call WhatsApp templates

### Renewals_and_Upsells/ folder
- `CONTEXT.md` — Defines all 10 upsell paths (GMB → Google Ads, Website → GMB, etc.), renewal process (30-day FMOS alert), health score trigger

### _project_files/ folder
- `CONTEXT.md` — Master context for the folder (old version)

## Health Score System (Performance-Only, 100 Points)
- **4 pillars:** Rankings (25) + Traffic (25) + Leads (25) + GMB (25) = 100 total
- **Tiers:** Excellent (80–100) | Good (60–79) | Needs Attention (40–59) | At Risk (0–39)
- **New client base score:** 10 points per pillar for first 2 months (results take 60–90 days)
- **Upsell trigger:** Excellent tier for 2 consecutive months → FMOS flags for upsell conversation

## Current Clients
- Personal clients (freelance, not in build system): OM SAI TRAVELS, Trishika Car Rental, Sneha Cabs, Shanteshwara Travels
- Company clients (FortuneMarq entity): 0 (building towards ₹50K MRR)

## What's Pending
- FMOS Phase D: Build onboarding tab with per-service task checklists + asset vault management
- FMOS Phase E: Build upsell queue in admin dashboard
- Monthly report generation in FMOS: generate PDF reports from the schema
- Health score auto-calculation in FMOS: calculate from real data each month
- Renewals alert: FMOS to alert Jabeer 30 days before renewal date

## What's Still Open (not blockers — FMOS is live)
- Upsell queue automation + 30-day renewal alert (not yet built).
- Monthly report PDF generation from the schema is built; health-score auto-calc from real data is partially wired.

## Connections to Other Folders
- **Feeds FROM:** `03_SALES_SYSTEM` (new client signed), `02_SERVICE_DELIVERY_AUTOMATION` (delivery complete)
- **Feeds INTO:** `08_FINANCE` (renewal invoices triggered), `03_SALES_SYSTEM` (upsells re-enter pipeline)
- **Execution IN:** `01_CRM_AND_TOOL/fmos` — all client profiles, onboarding tabs, health scores, tasks live in FMOS
- **JSON files copied to:** `01_CRM_AND_TOOL/FMOS_Change_Specs/data/` — for Antigravity Phases D + E

## Key Decisions Made (Locked)
- Health score is performance-only (no subjective factors like "communication" or "payment timeliness")
- 4 pillars: Rankings, Traffic, Leads Generated, GMB — all measurable
- Upsell services: Social Media Management (Instagram + Facebook) and Google Ads only (Phase 1)
- Jabeer personally handles all upsell calls — same approach as first meeting
- Renewal process: FMOS alert 30 days before → review health score → Jabeer calls

## Session History
| Date | Summary |
|---|---|
| March 2026 | Context file created. Lifecycle and health score system defined. |
| 2026-04-02 | L5 complete: onboarding_checklists.json + onboarding.types.ts + index.ts + onboarding_sop.md created. |
| 2026-04-26 | L6 complete: monthly_report_schema.json + client_health_score.json + report_index.ts created. L7 complete: upsell_rules.json + upsell_scripts.json created. |
| 2026-04-28 | CONTEXT.md fully rewritten. All files inventoried. L5, L6, L7 all confirmed complete. |
| 2026-06-17 | Doc-accuracy sweep. FMOS deployed & live; removed "execution pending deployment". Recorded Stage 4 delivery as built (onboarding PDF, milestones/tasks, delivery board, milestone WhatsApp, monthly_report_ready, case-study → Proof_Vault). Renewals/upsell automation noted as the remaining build. |
