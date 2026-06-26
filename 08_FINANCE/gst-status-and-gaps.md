# GST in FMOS — status + open tasks (2026-06-25)

Checked against the FMOS finance code. GST invoicing is **functionally built** — not a "switch it on"
task. Below is what's done and the real remaining gaps (load these as tasks in FMOS `/admin/strategy`
or `/tasks`).

## ✅ Already built
- **Settings** — GSTIN (`29ICWPS9816Q1ZS`) + 18% rate stored/editable in `/admin/settings` (`01_CRM_AND_TOOL/fmos/app/admin/settings/actions.ts`).
- **Invoice GST calc** — "Include GST (18%)" in `01_CRM_AND_TOOL/fmos/components/admin/finance/InvoiceCreateModal.tsx`; server side in `01_CRM_AND_TOOL/fmos/actions/issue-invoice.ts`.
- **GST-compliant invoice PDF** — GSTIN + GST line + business/bank details (`01_CRM_AND_TOOL/fmos/components/admin/finance/InvoicePDF.tsx`).
- **Quarterly GST filing report** — `/admin/finance/gst` (`01_CRM_AND_TOOL/fmos/app/admin/finance/gst/page.tsx`): taxable value, output GST, CGST/SGST split, input credit, net payable, Indian FY quarters.

## ☐ Open tasks (the real gaps)
1. **Inter-state IGST / place-of-supply.** Today all GST is treated as same-state **CGST+SGST** (Karnataka). No client-state field → an out-of-state client would show CGST+SGST instead of **IGST 18%**. Add a place-of-supply field + IGST branch. (Low urgency — current clients are Karnataka; needed before billing outside the state.)
2. **Wire GST rate from settings.** Rate is hardcoded `0.18` in `actions/issue-invoice.ts` and `InvoiceCreateModal.tsx` instead of reading `gst_rate` from settings. Make them read settings so the rate is changeable without code edits.
3. **Fix the `[Add GSTIN]` placeholder** on the public invoice view (`01_CRM_AND_TOOL/fmos/app/inv/[id]/page.tsx`) — it shows a placeholder instead of the real GSTIN; this may be the link a client opens.
4. **Verify saved settings + test invoice.** GSTIN is defaulted in code; confirm the `business_settings` row is saved with correct bank details, then raise one test invoice PDF end-to-end.
5. ~~MRR vs one-time forecast view (Phase E)~~ — **DONE 2026-06-26.** The MRR/Setup/One-Time split was already on the finance dashboard; added the Revenue Forecast widget there (committed MRR + pipeline × real close rate vs a configurable MRR target — `business_settings.mrr_target`, migration `supabase/2026-06-26_business_settings_mrr_target.sql`).

## Notes
- GST docs/reference: `09_LEGAL_AND_OPERATIONS/GST_and_Compliance/`.
- Pricing that feeds GST: `08_FINANCE/Pricing_Decisions` (must stay in sync with the bot + proposals).
