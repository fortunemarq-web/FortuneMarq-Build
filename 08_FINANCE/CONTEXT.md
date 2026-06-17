# 08 — Finance
**Last Updated:** 2026-06-17 | **Status:** Finance module is live in FMOS (deployed) — invoicing, partial payments, recurring GST invoices + payment-reminder cron are built. Still pending: Jabeer entering GSTIN + bank details in `/admin/finance` settings to fully activate GST invoicing, and the MRR-vs-one-time forecast view. No company MRR yet. All pricing locked (below).

> Ground truth for build state: `00_MASTER/FMOS_System_Design_And_Tasks.md` + `00_MASTER/FMOS_Execution_Roadmap.md`.

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
| Standard Website | ₹8,000–₹15,000 | One-time |
| Premium Website | ₹15,000–₹20,000 | One-time |
| Google Ads Management | ₹4,500 | ₹2,500/month + 5% of ad spend if spend exceeds ₹15,000/month |
| Meta Ads Management | — | ₹2,500/month + 5% of ad spend if spend exceeds ₹15,000/month |
| GMB Optimization | — | ₹3,500/month |
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

## June 2026 Focus (This Month)
No revenue target for June. Entire month focused on:
- Completing and deploying FMOS
- Building strategies (sales, content, ads)
- Setting up online presence (GMB, social)
- Preparing marketing campaigns to launch in July

## Revenue Targets (Reset: 2026-06-08)
| Period | Target | Notes |
|---|---|---|
| June 2026 | ₹0 target | Build month — app, strategy, presence |
| Q3 2026 (Jul–Sep) | ₹1,00,000 total revenue | First revenue quarter. Mix of one-time + retainer. |
| Oct 2026 onwards | 20% month-on-month growth | Compounding from Q3 baseline |

**Projected trajectory at 20% MoM from Q3 baseline (₹33K/month avg):**
| Month | Target |
|---|---|
| July 2026 | ₹25,000 |
| August 2026 | ₹35,000 |
| September 2026 | ₹40,000 |
| October 2026 | ₹48,000 |
| November 2026 | ₹58,000 |
| December 2026 | ₹70,000 |
| January 2027 | ₹84,000 |
| February 2027 | ₹1,00,800 |
| March 2027 | ₹1,21,000 |
| Hiring trigger | ₹2,00,000 MRR | Month 12–14 at this trajectory |

## Current Revenue
- Company MRR: ₹0 (as of June 2026)
- Personal freelance income: ₹15,000–₹20,000/month (Jabeer — not counted in company revenue)

## What's Pending
- FMOS Phase E: MRR vs one-time revenue split in Finance dashboard
- FMOS Phase E: Revenue Forecast Widget (pipeline × close rate vs monthly target)
- **Activate GST invoice settings in FMOS post-deployment:**
  - Enter GSTIN: 29ICWPS9816Q1ZS in `/admin/finance` settings
  - Enter bank details: Karnataka Bank, A/C 0332202500001101, IFSC KARB0000332
  - Enable GST invoice generation (18% GST on all services)
  - Test invoice PDF generation before first client
- First invoice to be raised: will be for the first signed company client

## What's Still Open (FMOS is live)
- Activate GST: enter GSTIN + bank details in `/admin/finance` settings, test invoice PDF.
- Build the MRR-vs-one-time forecast view (Phase E).
- No company clients yet = no invoices raised yet.

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
| 2026-06-08 | Revenue targets reset. June = build month, no revenue target. Q3 (Jul–Sep) = ₹1L total revenue. 20% MoM growth after Q3. GST activation steps documented with bank details from BUSINESS_MASTER_INFO.md. |
| 2026-06-17 | Doc-accuracy sweep. FMOS deployed & live; "blocked on deployment" removed. Recorded finance module as built (invoicing, partial payments, recurring GST invoices + reminder cron). Remaining: GST settings activation + MRR/one-time forecast view. |
