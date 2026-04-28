# 08 — Revenue Tracking
**Last Updated:** 2026-04-28 (revised: FMOS production-ready v4.5) | **Status:** Revenue tracking methodology defined. No revenue to track yet.

## Folder Purpose
Documents the methodology for tracking FortuneMarq's revenue. Tracks both MRR (recurring retainers) and one-time payments separately. All tracking happens in FMOS `/admin/finance`.

## What Exists (Complete)
| File | Description |
|---|---|
| `CONTEXT.md` | This file — only file in this folder |

## Revenue Tracking Methodology

### Two Revenue Streams (tracked separately)
1. **MRR (Monthly Recurring Revenue)** — All retainer payments: Ads management, SEO, GMB, WhatsApp Marketing
   - MRR = number of clients × average monthly retainer
   - This is the business health metric — grows slowly but predictably
2. **One-Time Revenue** — Website builds, setup fees, logo, AI automations
   - Does not count toward MRR
   - Improves cash flow while waiting for MRR to build

### Revenue Milestones Tracked
| Milestone | Target Date | Status |
|---|---|---|
| First paying client | ASAP | Pending |
| ₹10K MRR | Within 1 month of first client | Pending |
| ₹50K MRR | End April/May 2026 | Pending |
| ₹1L MRR | Month 4–5 | Pending |
| ₹2L MRR (hiring trigger) | Month 6–8 | Pending |
| ₹5L MRR | 2-year vision | Pending |

### Current Revenue Status
- Company MRR: ₹0 (as of April 2026)
- Clients: 0 company clients
- Personal freelance clients (Jabeer): OM SAI TRAVELS, Trishika Car Rental, Sneha Cabs, Shanteshwara Travels

## FMOS Phase E — Revenue Features to Build
- `revenue_type` column on invoices (mrr / setup_fee / one_time)
- Finance dashboard: MRR card vs One-Time card (separate, not combined)
- Revenue Forecast Widget: (leads in pipeline × close rate) = projected MRR vs ₹50K target
- Retainer Package tiers: starter / growth / pro / custom on each client record

## What's Pending
- FMOS Phase E build
- First client to track

## Connections to Other Folders
- **Tracks invoices from:** `01_CRM_AND_TOOL/fmos/app/admin/finance/invoices/`
- **Forecast uses pipeline from:** FMOS outreach board (Phase C)
- **Monthly burn reference:** ₹15,600–₹16,600/month (in `08_FINANCE/CONTEXT.md`)

## Session History
| Date | Summary |
|---|---|
| March 2026 | Folder created. Revenue methodology defined. |
| 2026-04-28 | CONTEXT.md rewritten with current state and Phase E requirements. |
