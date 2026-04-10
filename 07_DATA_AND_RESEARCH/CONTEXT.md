# 07 — Data & Research
**Last Updated:** 2026-03-19 | **Status:** Active — Hubli pipeline complete. Other cities pending.

## Purpose
Store and organise all data assets that power the FortuneMarq sales and marketing machine — keyword research, competitor analysis, lead database, and market intelligence PDFs. This is the foundation of the content hierarchy. Nothing in the sales system, marketing, or CRM is accurate without this data.

## Assets in This Folder
| Asset | Status | Location |
|---|---|---|
| Niche Data Reference Sheet | COMPLETE — 6 priority niches, Hubli | Niche_Data_Reference_Sheet.md |
| PDF Index | PENDING — must be created | PDF_Index.md (not yet created) |
| Keyword Data | COMPLETE — all 9 cities x 14 niches | Keyword_Data/ subfolder |
| Competitor SERP Data | HUBLI COMPLETE. HTML files exist for Dharwad, Belgaum, Mangalore, Davangere, Ballari — pipeline not yet run. Mysuru, Kalaburgi, Vijayapura need SERP HTML collected. | Competitor_Data/ subfolder |
| Lead Database | HUBLI COMPLETE — 14 niches cleaned, SERP-matched, finalised in Hubli_Final/ (11 files). Other 8 cities cleaned but not yet finalised. | Lead_Database/ subfolder |
| Market Intelligence PDFs | HUBLI COMPLETE — 75 PDFs (EN + KN, 4 types across 14 niches). Pipeline reusable for all cities. | PDF_Generator/output/Hubli/ |
| PDF Generator Pipeline | COMPLETE and reusable | PDF_Generator/ subfolder |

## Key Data Facts
- Total monthly searches across 9 cities x 14 niches: 2,154,200/month
- 7,298 GBP scraped leads — cleaned and standardised across 9 cities
- Hubli: 11 finalised upload-ready CSVs in Hubli_Final/ — 14 niches cleaned and SERP-matched
- 75 PDFs generated for Hubli (English + Kannada) — 4 types across 14 niches
- NOT A SINGLE competitor in 6 priority niches runs paid ads
- PDF Generator pipeline is complete: pdf_generator.py, pdf_generator_kn.py, generate_all_pdfs.py, generate_all_pdfs_kn.py, data_loader.py, translator.py

## Competitor Data Note
Traffic numbers adjusted to reflect reality: ~25–30% of search volume goes to local websites. ~70% goes to directories (JustDial, Sulekha, Practo etc.). This is the truth and the pitch.

## Reusable Pipeline for Other Cities
Step 1: Save SERP HTML files for all 14 niches → Competitor_Data/[City]/SERP_HTML/
Step 2: Extract text → GBP CSV → Organic CSV → Master SERP Report
Step 3: Clean leads → cross-match SERP → split into [City]_Final/ files
Step 4: Update data_loader.py volumes for city → run generate_all_pdfs.py → run generate_all_pdfs_kn.py
Step 5: Upload [City]_Final CSVs to FMOS

## Content Build Hierarchy — Current Status
- L0  Niche Data Reference Sheet — COMPLETE
- L1a Lead CSV Files — HUBLI COMPLETE (11 finalised files in Hubli_Final/). Other 8 cities pending pipeline run.
- L1b PDF Index — COMPLETE — PDF_Index.md created in this folder
- L2  Telecaller Scripts — COMPLETE — New 4 lead-type JSON architecture in 03_SALES_SYSTEM/Telecaller_Scripts/FMOS_Script_Data/
- L3  WhatsApp Templates — COMPLETE — 17 templates in 5 JSON files in 03_SALES_SYSTEM/WhatsApp_Templates/FMOS_Template_Data/
- L4a Proposal Template — COMPLETE — 5-6 page dynamic proposal in 03_SALES_SYSTEM/Proposals/FMOS_Proposal_Data/
- L4b Agreement Document — COMPLETE — 1-page doc + service terms in 09_LEGAL_AND_OPERATIONS/Agreement_Templates/
- L5  SOPs + Onboarding — COMPLETE — onboarding_checklists.json + onboarding_sop.md in 04_CLIENT_MANAGEMENT/Onboarding/
- L6  Report Templates + Health Score — PENDING
- L7  Upsell Trigger System — PENDING

## Next Tasks — This Folder
1. Run pipeline for Dharwad — all SERP assets ready, next priority city
2. Run pipeline for Belgaum, Mangalore, Davangere, Ballari
3. Collect SERP HTML for Mysuru, Kalaburgi, Vijayapura then run pipeline

## Next Task — Outside This Folder
FMOS deployment is the current priority blocker. Once FMOS is live, upload Hubli_Final CSVs and begin outreach.

## Connections to Other Folders
- **Feeds INTO:** 03_SALES_SYSTEM (scripts, templates use real numbers), 06_PAID_MARKETING (ad copy data), 01_CRM_AND_TOOL (leads uploaded), 05_ONLINE_PRESENCE (content hooks)
- **Foundation FOR:** Every single folder in the build system depends on this data being accurate

## Session Log
| Date | Summary |
|---|---|
| March 2026 | Context file created. L0 complete. L1 in progress. |
| 2026-03-19 | Hubli pipeline complete. 75 PDFs generated (EN + KN, Types 1–4). 11 Hubli_Final CSVs ready for FMOS upload. PDF Generator pipeline reusable for all cities. Next: PDF_Index.md then move to 03_SALES_SYSTEM. |
| 2026-03-19 | All niche volumes updated from FortuneMarq_Master_Keyword_Research.xlsx. Replaced estimated numbers with real Google Keyword Planner data across all context files and data_loader.py. PDFs already generated with correct data — no regeneration needed. |
| 2026-04-09 | Context audit. Updated Content Build Hierarchy to reflect all completed work: L1b PDF Index COMPLETE, L2–L5 all COMPLETE (scripts, templates, proposal, agreement, onboarding). Next: run pipeline for Dharwad, then FMOS deployment. |

---

## FortuneMarq System DNA
> This section is present in every context file. It ensures every Claude session — regardless of folder — understands the full interconnected system.

### Business
- **Legal Name:** FortuneMarq Media & Marketing
- **Brand:** FortuneMarq | **Tagline:** Marketing That Pays You Back
- **Address:** Galaxy Mall, First Floor, Shop No. 43, J.C Nagar, Hubli — 580020
- **CRM/OS:** fmos.fortunemarq.com | **Website:** fortunemarq.com
- **Contact:** fortunemarq@gmail.com | +91 93530 82656

### Team
| Person | Role | Status |
|---|---|---|
| Jabeer | Founder — strategy, sales, closing, all tech | Active |
| Afifa | Telecaller — calls, outcomes, PDF delivery, meeting booking | Hired, not started |
| Zaid | Website builder — Antigravity builds, task execution | Training |
| Sufiyan | Website builder — Antigravity builds, task execution | Training |

### The Full System Map
```
07_DATA_AND_RESEARCH
  → feeds → 06_PAID_MARKETING + 03_SALES_SYSTEM
06_PAID_MARKETING
  → feeds → 01_CRM_AND_TOOL (inbound leads)
03_SALES_SYSTEM
  → feeds → 01_CRM_AND_TOOL (pipeline) + 04_CLIENT_MANAGEMENT
01_CRM_AND_TOOL (FMOS — central nervous system)
  → feeds → 02_SERVICE_DELIVERY_AUTOMATION + 04_CLIENT_MANAGEMENT + 08_FINANCE
02_SERVICE_DELIVERY_AUTOMATION
  → feeds → 04_CLIENT_MANAGEMENT (delivery) + 08_FINANCE (invoicing triggers)
04_CLIENT_MANAGEMENT
  → feeds → 08_FINANCE (renewals) + 03_SALES_SYSTEM (upsells back to pipeline)
05_FORTUNEMARQ_ONLINE_PRESENCE
  → feeds → 06_PAID_MARKETING (brand trust) + 03_SALES_SYSTEM (inbound leads)
08_FINANCE ← receives from all service delivery and client management
09_LEGAL_AND_OPERATIONS ← supports 03_SALES_SYSTEM + 04_CLIENT_MANAGEMENT
10_PERSONAL_GROWTH ← supports Jabeer across all folders
```

### Master Flow
```
Data (L0) → Campaign → Lead in FMOS → 3-Touch Outreach → Meeting
→ Proposal → Agreement → Invoice → Onboarding → Delivery
→ Monthly Report → Health Score → Upsell → Renewal
```

### Content Build Hierarchy (current progress)
- L0  Niche Data Reference Sheet — COMPLETE
- L1a Lead CSV Files — HUBLI COMPLETE. Other 8 cities pending.
- L1b PDF Index — COMPLETE
- L2  Telecaller Scripts — COMPLETE — 4 lead-type JSON files in FMOS_Script_Data/
- L3  WhatsApp Templates — COMPLETE — 17 templates in 5 JSON files in FMOS_Template_Data/
- L4a Proposal Template — COMPLETE — 5-6 page dynamic PDF, JSON schema in FMOS_Proposal_Data/
- L4b Agreement Document — COMPLETE — 1-page doc, service terms, payment policy
- L5  SOPs + Onboarding — COMPLETE — onboarding_checklists.json + onboarding_sop.md
- L6  Report Templates + Health Score — PENDING
- L7  Upsell System — PENDING

### Tech Stack
- CRM: Next.js 16, TypeScript, Tailwind CSS v4, Supabase
- Hosting: Hostinger → fmos.fortunemarq.com
- Builds: Antigravity | AI: Claude Pro + Claude Code
- Design: Canva | Task Queue: Celery + Redis (planned)

### Revenue Targets
- ₹50K MRR → End April/May 2026
- ₹1L MRR → Month 4–5
- ₹2L MRR → Hiring trigger
- ₹5L MRR → 2-year vision

### Niche Attack Order (Phase 1 — Hubli-Dharwad)
1. Gyms (63,950/mo) 2. Skin Clinics (41,850/mo) 3. Computer Training (24,350/mo)
4. Dental (21,100/mo) 5. Car Rentals (16,450/mo) 6. JEE/NEET Coaching (12,300/mo)

### Golden Rule
Every decision made in any folder must be considered in context of the full system. If a decision affects another folder — note it and update that folder's context too.

### How to Use This File
- **Start session:** "Read CONTEXT.md and continue."
- **End session:** "Update CONTEXT.md with everything we decided today."
