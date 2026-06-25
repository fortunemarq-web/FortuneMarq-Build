# 08 — Invoicing
**Last Updated:** 2026-06-25 | **Status:** Invoice module built and live in FMOS (recurring GST invoices + reminders + partial payments). GST invoicing is functionally built (GSTIN + 18% configured, GST-compliant PDF). No invoices raised yet — pending the first real client; remaining GST refinements tracked in `../gst-status-and-gaps.md`.

## Folder Purpose
Process documentation for raising, tracking, and managing client invoices. All invoice operations live in FMOS `/admin/finance/invoices`.

## What Exists (Complete)
| File | Description |
|---|---|
| `CONTEXT.md` | This file — only file in this folder |

No invoice files exist yet. No invoices have been raised.

## Invoice Process (when active)
1. Service delivery confirmed → Jabeer raises invoice in FMOS
2. Invoice auto-populated: client name, GSTIN, services, amounts, tax, due date
3. Invoice PDF generated and sent via WhatsApp/email
4. Payment received → mark paid in FMOS
5. Overdue 7 days → FMOS alerts Jabeer → auto WhatsApp reminder sent
6. Overdue 30 days (website) → site taken offline

## Invoice Format
- Format: GST-compliant invoice with 18% GST
- GSTIN on invoice: 29ICWPS9816Q1ZS
- Business name: FortuneMarq Media & Marketing
- Address: Galaxy Mall, First Floor, Shop No. 43, J.C Nagar, Hubli — 580020

## What's Pending
- Activate GST invoice settings in FMOS: enter GSTIN + bank account details
- First invoice to be raised when first client signs
- FMOS Phase E: Add `revenue_type` column to invoices table (MRR vs setup_fee vs one_time)

## What's Remaining
- FMOS is deployed & live (fmos.fortunemarq.com); the invoicing module is built and active. Remaining is GST settings data-entry (GSTIN + bank details) and raising the first invoice once the first real client signs.

## Connections to Other Folders
- **Invoice generated in:** `01_CRM_AND_TOOL/fmos/app/admin/finance/invoices/page.tsx`
- **GST certificate in:** `09_LEGAL_AND_OPERATIONS/GST_and_Compliance/GST Certificate.pdf`
- **Bank details in:** `09_LEGAL_AND_OPERATIONS/BUSINESS_MASTER_INFO.md`

## Session History
| Date | Summary |
|---|---|
| March 2026 | Folder created. Invoice process defined. |
| 2026-04-28 | CONTEXT.md rewritten. Confirmed no invoices exist yet. |
