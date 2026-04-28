---
processed: true
source_date: 2026-04-28
type: correction
---

# Corrections Found During Full Folder Scan

These are facts that were incorrect or missing in the initial wiki build. All wiki pages have been updated to reflect this.

## 1. L6 and L7 Are Complete (not pending)

Old assumption: Monthly Reports (L6) and Upsell System (L7) were still pending.

Reality: Both completed April 26, 2026.
- L6 files: monthly_report_schema.json, client_health_score.json, report_index.ts (in 04_CLIENT_MANAGEMENT/Monthly_Reports/FMOS_Report_Data/)
- L7 files: upsell_rules.json, upsell_scripts.json (in 04_CLIENT_MANAGEMENT/Upsell_System/FMOS_Upsell_Data/)

## 2. FMOS Phase Status Is More Precise

Old assumption: FMOS is ~90% complete, 6 features needed.

Reality: Organised into 5 phases (A–E).
- Phase A (Cleanup) — DONE
- Phase B (Role Views) — DONE
- Phase C (Outreach & Leads) — Spec'd, awaiting Antigravity execution
- Phase D (Proposal & Onboarding) — Spec'd, awaiting Antigravity execution
- Phase E (Finance & Forecast) — Spec'd, awaiting Antigravity execution

## 3. Niche Landing Pages Exist (11 HTML files)

Not previously documented. 11 niche landing pages built and stored in 05_FORTUNEMARQ_ONLINE_PRESENCE/niches/. Also: public_html.zip (~40MB full site bundle), 13 niche funnel SVGs, 2 Gemini brand images.

## 4. Data Files Duplicated in FMOS_Change_Specs

21 JSON/TypeScript data files exist in both their source folders (03_SALES_SYSTEM, 04_CLIENT_MANAGEMENT) AND in 01_CRM_AND_TOOL/FMOS_Change_Specs/data/. This is intentional — the FMOS_Change_Specs/data/ copies are what get loaded directly into FMOS code.

## 5. Telecaller_Scripts_Review.docx Exists

A reviewed and finalized telecaller script document (April 2026) exists in 03_SALES_SYSTEM/Telecaller_Scripts/ — not previously documented.
