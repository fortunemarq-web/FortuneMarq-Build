# 09 — GST & Compliance
**Last Updated:** 2026-04-28 | **Status:** GST registered. Udyam registered. Invoicing not yet activated in FMOS.

## Folder Purpose
Store GST registration documents and all compliance-related files. Ensures FortuneMarq invoices are legally compliant with Indian GST requirements.

## What Exists (Complete)

| File | Description |
|---|---|
| `GST Certificate.pdf` | Official GST registration certificate. GSTIN: 29ICWPS9816Q1ZS. Type: Regular. State: Karnataka (29). Valid from 05/11/2025. No end date. |
| `CONTEXT.md` | This file |

Note: Udyam Registration Certificate (`fortunemarq udyam.pdf`) is stored in `09_LEGAL_AND_OPERATIONS/` root, not in this subfolder.

## GST Details
| Field | Value |
|---|---|
| GSTIN | 29ICWPS9816Q1ZS |
| Registration Type | Regular |
| State Code | 29 (Karnataka) |
| Valid From | 05/11/2025 |
| NIC Codes | 62012 (Web-page designing), 73100 (Advertising) |
| GST Rate | 18% on all services |

## Invoice Compliance Requirements (FMOS)
GST-compliant invoices must include:
- Supplier GSTIN: 29ICWPS9816Q1ZS
- Supplier legal name: Sayed Jabeer (or trade name: FortuneMarq Media & Marketing)
- Supplier address: Galaxy Mall, Floor 1, Shop No. 43, JC Nagar, Hubli — 580020
- Invoice number (sequential)
- Invoice date
- Client name and address
- HSN/SAC code for each service
- Taxable value
- CGST (9%) + SGST (9%) = 18% total (for Karnataka clients)
- IGST (18%) for clients outside Karnataka

## What's Pending
- Activate invoice settings in FMOS (`/admin/finance`): enter GSTIN + bank account details
- This activates GST-compliant PDF invoice generation in FMOS
- SAC codes for each service need to be confirmed and entered in FMOS

## What's Blocked
- Blocked on FMOS deployment

## Connections to Other Folders
- **GSTIN used in:** `08_FINANCE/Invoicing/` — all invoices
- **GSTIN in:** `09_LEGAL_AND_OPERATIONS/BUSINESS_MASTER_INFO.md` — master reference
- **Invoice generation in:** `01_CRM_AND_TOOL/fmos/app/admin/finance/invoices/`

## Session History
| Date | Summary |
|---|---|
| March 2026 | Folder created. GST certificate stored. |
| 2026-04-28 | CONTEXT.md fully rewritten. Udyam location clarified. FMOS activation steps documented. |
