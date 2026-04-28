# 07 — Data & Research
**Last Updated:** 2026-04-28 | **Status:** Hubli pipeline complete. Other cities pipeline ready to run. PDF Index created. L1–L7 content hierarchy fully complete.

## Folder Purpose
Store and organise all data assets that power the FortuneMarq sales and marketing machine — keyword research, competitor analysis, lead database, market intelligence PDFs, and the PDF generator pipeline. This is the foundation of the content hierarchy. Nothing in the sales system, marketing, or CRM is accurate without this data.

## What Exists (Complete)

### Root Files
| File | Description |
|---|---|
| `Niche_Data_Reference_Sheet.md` | L0: All 6 priority niches with real search volumes, competitor analysis, opportunity sizing |
| `PDF_Index.md` | L1b: Maps all 75 Hubli PDFs to city/niche/type/language/filename. Status: 37 English APPROVED, 38 Kannada PENDING REWRITE (misspellings found) |
| `cleanup.py` | Python script for data cleaning |

### Lead_Database/ subfolder
| Location | Description |
|---|---|
| `Hubli_Final/` | 11 upload-ready Hubli CSV files (~858 leads total) — final cleaned, SERP-matched, ready for FMOS upload |
| `Hubli_All_Leads_Clean.csv` | Combined Hubli leads (858 rows) |
| `No_Phone_Has_Website_Leads.csv` | Leads with website but no phone — different outreach approach needed |
| `Website_Rescrape_Queue.csv` | Leads flagged for website re-scrape |
| `Hubli_cleaned_leads/` | Intermediate cleaned files (pre-final) — 13 niche files |
| `Dharwad_cleaned_leads/` | 13 niche CSVs — cleaned, not yet finalized |
| `Belgaum_cleaned_leads/` | Partial — less complete than Dharwad |
| `Davangere_Cleaned_Leads/` | 11 niche CSVs |
| `Mysuru_Cleaned_Leads/` | 14 niche CSVs — full coverage |
| `manglore_cleaned_leads/` | 14 niche CSVs |
| `Kalburgi_cleaned_leads/` | 12 niche CSVs |
| `Vijayapura_Cleaned_Leads/` | 12 niche CSVs |
| `analyze_leads.py` | Python analysis script |
| `process_hubli_leads_v2.py` | Hubli lead processing pipeline script |
| `website_phone_scraper.py` | Script to scrape phones and websites from GBP data |

**Hubli_Final/ files (11 CSVs, ~858 leads):**
- Hubli_CarRentals_Final.csv (106 leads)
- Hubli_ComputerTraining_Final.csv (101 leads)
- Hubli_DentalClinics_Final.csv (106 leads)
- Hubli_Gyms_Final.csv (117 leads)
- Hubli_InteriorDesigners_Final.csv (91 leads)
- Hubli_JEENEETCoaching_Final.csv (48 leads)
- Hubli_ModularKitchens_Final.csv (42 leads)
- Hubli_Physiotherapy_Final.csv (33 leads)
- Hubli_RealEstate_Final.csv (49 leads)
- Hubli_SkinClinics_Final.csv (111 leads)
- Hubli_TuitionCentres_Final.csv (54 leads)

### Keyword_Data/ subfolder
| Location | Description |
|---|---|
| `FortuneMarq_Master_Keyword_Research.xlsx` | Master Excel with all keyword data across 9 cities × 14 niches |
| `Keyword Research For Google Ads.xlsx` | Google Ads specific keyword research |
| `FortuneMarq_Detailed_Report.txt` | Text summary of keyword findings |
| `analyze_keywords.py` | Analysis script |
| `generate_master_excel.py` | Script to generate master Excel |
| `Hubli_Keywords/` | 14 CSV files — one per niche (Hubli) |
| `Dharwad_Keywords/` | City keyword folder |
| `Belgaum_Keywords/` | City keyword folder |
| `Ballari_Cleaned_Keywords/` | City keyword folder |
| `Davangere_Cleaned_Keywords/` | City keyword folder |
| `Kalaburgi_keywords/` | City keyword folder |
| `Mangalore_keywords/` | City keyword folder |
| `Mysuru_Cleaned_Keywords/` | City keyword folder |
| `Vijayapura_Cleaned_Keywords/` | City keyword folder |

### Competitor_Data/ subfolder
| Location | Description |
|---|---|
| `Hubli/` | Hubli competitor SERP analysis — complete for 6 priority niches |
| `Dharwad/` | Dharwad competitor data — partial |
| `Belgaum/` | Belgaum data folder |
| `Davangeri/` | Davangere data folder |
| `Manglore/` | Mangalore data folder |

### PDF_Generator/ subfolder
| File/Location | Description |
|---|---|
| `pdf_generator.py` | Python PDF generator (English) using brand fonts, search volumes, competitor data |
| `pdf_generator_kn.py` | Python PDF generator (Kannada) — misspellings found, needs rewrite |
| `generate_all_pdfs.py` | Batch runner for English PDFs |
| `generate_all_pdfs_kn.py` | Batch runner for Kannada PDFs |
| `data_loader.py` | Data loader with real search volumes per niche per city |
| `translator.py` | Translation utility for Kannada versions |
| `output/Hubli/` | 75 PDF files (37 English approved + 38 Kannada pending rewrite) |

**PDF Types:**
- Type 1 — Visibility Report (for SERP_Ranked = Y leads)
- Type 2 — Market Opportunity Report (for no-website leads)
- Type 3 — Website Performance Report (for has-website-not-ranking leads)
- Type 4 — Niche Market Report (for low-volume niches: IVF, Physiotherapy, IELTS, Hotels)

## Key Data Facts
- Total Hubli leads in Hubli_Final/: ~858 (upload-ready)
- Total leads across 9 cities (all cleaned folders): ~7,298
- Total PDFs generated for Hubli: 75 (37 EN approved, 38 KN pending rewrite)
- Keyword data: 9 cities × 14 niches = 126 niche-city combinations
- Total monthly searches across all cities/niches: ~2,154,200/month
- Not a single competitor in 6 priority niches runs paid ads

## What's Pending
1. **Hubli Kannada PDFs** — regenerate 38 KN PDFs after fixing misspellings in pdf_generator_kn.py
2. **Dharwad pipeline** — all SERP assets ready; run process_hubli_leads_v2.py equivalent for Dharwad
3. **Belgaum, Mangalore, Davangere, Ballari** — SERP assets partially ready; run pipeline
4. **Mysuru, Kalaburgi, Vijayapura** — need SERP HTML collection first, then run pipeline
5. **FMOS upload** — upload Hubli_Final/ CSVs once FMOS is deployed (currently the active priority)

## What's Blocked
- FMOS upload blocked on FMOS deployment (Phase C–E completion)
- Kannada PDF regeneration: needs pdf_generator_kn.py misspelling fixes first
- Other city pipelines: not urgent until after Hubli outreach is underway

## Connections to Other Folders
- **Feeds INTO:** `03_SALES_SYSTEM` (scripts/templates reference real search volumes), `06_PAID_MARKETING` (ad copy uses competitor gaps), `01_CRM_AND_TOOL` (leads uploaded via CSV), `05_FORTUNEMARQ_ONLINE_PRESENCE` (content hooks from niche data)
- **Foundation FOR:** Every single folder in the build system depends on this data being accurate

## Key Decisions Made (Locked)
- Hubli is Phase 1 — all other cities are Phase 2+
- 11 Hubli_Final/ CSVs are the upload-ready set (not the _cleaned_leads versions)
- English PDFs approved; Kannada PDFs pending rewrite
- PDF type assignment: by SERP_Ranked + Has_Website columns on each lead
- Pipeline is fully reusable for all cities — same scripts, just update data_loader.py per city

## Session History
| Date | Summary |
|---|---|
| March 2026 | Context file created. L0 complete. L1 in progress. |
| 2026-03-19 | Hubli pipeline complete. 75 PDFs generated (EN + KN). 11 Hubli_Final CSVs ready. PDF generator pipeline documented. All keyword volumes updated from master keyword research. |
| 2026-04-09 | Context audit. L1b PDF Index confirmed complete. L2–L7 all complete (in 03_SALES_SYSTEM and 04_CLIENT_MANAGEMENT folders). |
| 2026-04-28 | CONTEXT.md fully rewritten. All files inventoried including city-by-city lead folders, PDF counts, script files. |
