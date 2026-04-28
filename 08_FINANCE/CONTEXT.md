# 08 — Finance
**Last Updated:** 2026-04-28 | **Status:** Finance module exists in FMOS but not yet activated. No revenue yet. All pricing locked.

## Folder Purpose
Plan and manage all financial operations — invoicing, GST compliance, expense tracking, revenue reporting, and progress toward ₹50K MRR goal. The finance module exists in FMOS (`/admin/finance`) but needs GST settings activated and the MRR/one-time split built (Phase E).

## What Exists (Complete)

### Root Files
| File | Description |
|---|---|
| `CONTEXT.md` | This file |

### Subfolders (CONTEXT.md only — no build files yet)
| Subfolder | Description |
|---|---|
| `Invoicing/CONTEXT.md` | Invoicing process documentation |
| `Pricing_Decisions/CONTEXT.md` | All locked pricing decisions |
| `Revenue_Tracking/CONTEXT.md` | Revenue tracking methodology |
| `_project_files/MASTER_CONTEXT.md` | Master context for the folder |

## Revenue Model (Locked)
- **MRR (Monthly Recurring Revenue):** All retainer payments — Ads management, SEO, GMB, WhatsApp Marketing
- **One-Time:** Website builds, setups, logo design, AI automations
- **Track separately** — MRR is the business health metric, one-time is cash flow

## Pricing (All Locked)
| Service | Setup Fee | Monthly |
|---|---|---|
| Landing Page | ₹5,000–₹8,000 | One-time |
| Standard Website | ₹8,000 | One-time |
| Premium Website | ₹15,000–₹20,000 | One-time |
| Google Ads Management | ₹4,500 | ₹2,500/month |
| Meta Ads Management | — | ₹2,500/month |
| GMB Optimization | — | ₹2,500/month |
| SEO Starter | — | ₹7,000/month |
| SEO Growth | — | ₹10,000–₹12,000/month |
| SEO Dominate | — | ₹15,000+/month |
| WhatsApp Marketing | ₹5,000 | ₹2,500/month |

*Ad spend for Google Ads and Meta Ads is client's own budget, paid directly to Google/Meta. FortuneMarq charges management fee only.*

## Payment Policy (Locked)
- Invoices raised 1st of month, due by 5th
- Setup fees due before work begins
- 7 days overdue: ad campaigns paused + auto WhatsApp reminder
- 30 days overdue (website): site taken offline, payment pending page shown
- Service resumes same day payment confirmed
- Accepted: UPI / Bank Transfer / Cash (office)

## Monthly Burn
₹15,600–₹16,600/month (rent ₹6K + electricity ₹1.2K + wifi ₹700 + EMI ₹2.7K + subscriptions ₹4–5K)

## GST Details
- GSTIN: 29ICWPS9816Q1ZS
- GST Type: Regular, 18% on all services
- Invoice settings not yet activated in FMOS
- To activate: enter GSTIN + bank details in FMOS `/admin/finance` settings

## Revenue Milestones
| Target | Timeline |
|---|---|
| ₹50K MRR | End April/May 2026 |
| ₹1L MRR | Month 4–5 |
| ₹2L MRR | Hiring trigger |
| ₹5L MRR | 2-year vision |

## Current Revenue
- Company MRR: ₹0 (as of April 2026)
- Personal freelance income: ₹15,000–₹20,000/month (Jabeer — not counted in company revenue)

## What's Pending
- FMOS Phase E: MRR vs one-time revenue split in Finance dashboard
- FMOS Phase E: Revenue Forecast Widget (pipeline × close rate vs ₹50K target)
- Activate GST invoice settings in FMOS once deployed
- First invoice to be raised: will be for the first signed company client

## What's Blocked
- All finance operations blocked on FMOS deployment
- No clients yet = no invoices

## Connections to Other Folders
- **Receives FROM:** `02_SERVICE_DELIVERY_AUTOMATION` (delivery complete → invoice trigger), `04_CLIENT_MANAGEMENT` (renewals → invoice)
- **Lives IN:** `01_CRM_AND_TOOL/fmos/app/admin/finance/` — all finance operations in FMOS
- **GST docs in:** `09_LEGAL_AND_OPERATIONS/GST_and_Compliance/`

## Key Decisions Made (Locked)
- All pricing is locked — do not change without explicit review session
- MRR tracked separately from one-time (FMOS Phase E)
- Invoices in INR + GST 18%
- No free trials, no credit — payment before work, always

## Session History
| Date | Summary |
|---|---|
| March 2026 | Context file created. Finance module noted as existing in FMOS but needing activation. Pricing locked. |
| 2026-04-28 | CONTEXT.md fully rewritten. GSTIN confirmed. Current revenue confirmed zero. Phase E requirements documented. |
