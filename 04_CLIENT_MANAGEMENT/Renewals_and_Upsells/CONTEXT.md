# 04 — Renewals & Upsells
**Last Updated:** 2026-04-28 | **Status:** Planning reference — detailed upsell logic moved to Upsell_System/ subfolder

## Folder Purpose
Documents when and how to upsell existing clients and manage contract renewals. The detailed rules engine and scripts now live in `04_CLIENT_MANAGEMENT/Upsell_System/FMOS_Upsell_Data/`.

## What Exists (Complete)
| File | Description |
|---|---|
| `CONTEXT.md` | This file — contains all 10 upsell paths and renewal process |

## All Upsell Paths
| From Service | To Service | Trigger |
|---|---|---|
| GMB | Google Ads | 50+ calls/month from GMB, 2 months in |
| GMB | Website | No website or poor website, demand proven |
| Google Ads | SEO | 3+ months stable, client asks about long-term |
| Google Ads | Meta Ads | Client wants to expand to Instagram audience |
| Meta Ads | Google Ads | Client misses search-intent customers |
| Website Only | GMB | At go-live moment — retainer pitch |
| Website Only | Google Ads | 2 weeks post go-live, no organic leads yet |
| SEO Starter | SEO Growth | 3 months, starter keywords ranking |
| SEO Growth | SEO Dominate | 6 months, strong results |
| Any Service | WhatsApp Marketing | Client has existing customer database |

## Renewal Process
- FMOS alerts Jabeer 30 days before renewal date
- Review client health score
- Prepare renewal + upsell proposal if applicable
- Call client — lead with results, pitch upgrade if eligible

## What's Pending
- Detailed rules engine: `04_CLIENT_MANAGEMENT/Upsell_System/FMOS_Upsell_Data/upsell_rules.json`
- FMOS Phase E: 30-day renewal alert + upsell queue in admin dashboard

## What's Blocked
- Execution blocked on FMOS deployment and having active clients

## Connections to Other Folders
- **Detailed scripts:** `04_CLIENT_MANAGEMENT/Upsell_System/FMOS_Upsell_Data/upsell_scripts.json`
- **Trigger data:** `04_CLIENT_MANAGEMENT/Monthly_Reports/FMOS_Report_Data/client_health_score.json`
- **FMOS execution:** Phase E

## Session History
| Date | Summary |
|---|---|
| March 2026 | Folder created. Upsell paths and renewal process mapped. |
| 2026-04-28 | CONTEXT.md rewritten. Notes that detailed logic is in Upsell_System/ subfolder. |
