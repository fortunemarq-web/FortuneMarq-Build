# 08 — Invoicing
**Last Updated:** 2026-04-28 (revised: FMOS production-ready v4.5) | **Status:** Invoice system built in FMOS but not yet activated. No invoices raised yet.

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

## What's Blocked
- Blocked on FMOS deployment and first client

## Connections to Other Folders
- **Invoice generated in:** `01_CRM_AND_TOOL/fmos/app/admin/finance/invoices/page.tsx`
- **GST certificate in:** `09_LEGAL_AND_OPERATIONS/GST_and_Compliance/GST Certificate.pdf`
- **Bank details in:** `09_LEGAL_AND_OPERATIONS/BUSINESS_MASTER_INFO.md`

## Session History
| Date | Summary |
|---|---|
| March 2026 | Folder created. Invoice process defined. |
| 2026-04-28 | CONTEXT.md rewritten. Confirmed no invoices exist yet. |
