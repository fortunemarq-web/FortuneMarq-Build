# Legal & Operations — open tasks (2026-06-25)

Most former "pending" items were stale and are now DONE (GST invoicing built; Privacy Policy + Terms +
consent banner live on the website). Only two genuine tasks remain — load these into FMOS `/admin/strategy`
or `/tasks`.

## ☐ Open tasks
1. **SAC codes (GST).** Confirm the Services Accounting Code for each service and enter them in FMOS so invoices carry the right SAC.
   - Advertising/marketing services ≈ **998361** (confirm per service: SEO/ads/web/WhatsApp/AI).
   - Where it lands: invoice line items / business settings in `01_CRM_AND_TOOL/fmos/app/admin/finance`.
2. **Website Ownership Transfer document.** A short, plain template for website clients who later want to move their site elsewhere — what transfers (code/domain/assets), conditions (dues cleared), and the handover process. Store the source here in `Agreement_Templates/`; the live send goes through FMOS.

## Optional polish
- Review the live Privacy Policy (`01_CRM_AND_TOOL/fmos/app/site/privacy-policy`) for **DPDP-Act** specifics — data-principal rights, consent wording, a grievance-officer contact. The page exists; this is a refinement, not a blocker.

## Already done (for reference)
- Privacy Policy + Terms of Service + consent/cookie banner — live on the website.
- GST invoicing in FMOS — GSTIN + 18% configured, GST-compliant PDF, quarterly GST report. GST refinements: `08_FINANCE/gst-status-and-gaps.md`.
- Agreement template, service terms, payment/cancellation policy — complete and wired into FMOS.
