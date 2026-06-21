# 07 — Data & Research
**Last Updated:** 2026-06-21 | **Status:** Full re-scrape complete — **~7,958 leads across 9 cities** (Rescraped/ via SerpApi google_maps), SERP-typed (A/B/C/D), email-enriched, imported into FMOS. The FMOS **Stage 1 data engine is built & live** (`/admin/market-insights`): keyword-CSV ingest → `general_insights`, SERP scan → `competitor_insights` (4-bucket traffic split: GMB / directories / real sites / social-other — **no SEMrush**), `pitch_type` tagging on leads, and 8-PDF-per-niche×city generation (Type A–D × EN/KN) → Supabase Storage. Collection automation (1.1/1.2) + the pipeline orchestrator are **not** built.

> **PDF_Generator generalisation (2026-06-21):** the standalone `PDF_Generator/` (original 5-page editorial design) has been generalised from Hubli-only to **all 9 cities** via new `generate_city_reports.py`, which builds per-city `niche_data` (top GBP businesses, directories, websites, traffic split, volume) from the live rescraped dataset + competitor SERP. `pdf_generator.py` paths were fixed for the current repo (`FM_BRAND_DIR` env / `Brand_Assets/`), business-name word-wrap + truncation hardened (originals broke mid-word), and the page-2 header made city-aware (was hardcoded "Hubli"). One Mysuru sample approved-pending; batch regen + Supabase Storage upload gated on owner sign-off. App-side reports (`lib/reports/`) were a separate denser template now being replaced by this original design.

> Ground truth for build state: `00_MASTER/FMOS_System_Design_And_Tasks.md` + `00_MASTER/FMOS_Execution_Roadmap.md`.
> NOTE: this folder has two older overlapping status docs — `DATA_RESEARCH_CONTEXT.md` (2026-03-19) and `DATA_RESEARCH_STATUS_REPORT.md` (2026-03-18). **This CONTEXT.md is the current one;** the other two are historical (flagged for consolidation/removal).
> `pitch_type` (A/B/C/D report/pitch tier, stored on `leads`) is distinct from `lead_type` (outbound/inbound source).

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
| `pdf_generator.py` | Python PDF generator (English), 5-page editorial design. **2026-06-21:** brand-asset path now via `FM_BRAND_DIR` env (defaults to repo `Brand_Assets/`); name word-wrap/truncate hardened; page-2 header city-aware. |
| `generate_city_reports.py` | **NEW 2026-06-21** — generalised all-city driver. Builds `niche_data` per (city, niche) from `Lead_Database/Rescraped/` + `Lead_Database/Competitor_Data/` and renders the original design for any city. `sample` mode writes one PDF to `/tmp` (no upload). |
| `pdf_generator_kn.py` | Python PDF generator (Kannada) — old `deep_translator` (Google Translate) output had bad wording; to be replaced with owner-supplied Gemini Kannada keyed to this design's copy. |
| `generate_all_pdfs.py` | Original Hubli-only batch runner (kept for reference; superseded by `generate_city_reports.py`). |
| `generate_all_pdfs_kn.py` | Original Hubli-only Kannada batch runner. |
| `data_loader.py` | Original Hubli data loader (hardcoded volumes/competitor CSVs); `generate_city_reports.py` supplies data directly instead. |
| `translator.py` | Google-Translate utility used by the old Kannada path (source of the misspellings). |
| `output/Hubli/` | 75 original Hubli PDFs (kept as the design reference set). |

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
5. **FMOS upload** — ✅ done for Hubli (858 leads live in FMOS); load remaining cities via `/admin/bulk-import`

## What's Still Open (FMOS is live)
- Load remaining cities' leads/reports (only Hubli is loaded) via `/admin/bulk-import`.
- Kannada PDF regeneration: needs pdf_generator_kn.py misspelling fixes first.
- Other city pipelines: not urgent until after Hubli outreach is underway.

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
| 2026-06-21 | `PDF_Generator/` generalised to all 9 cities (`generate_city_reports.py`); `pdf_generator.py` paths/wrap/city-header fixed. Mysuru Gyms sample rendered + sent for approval. Dharwad re-scraped to parity (238 → 777 leads). Dataset now ~7,958 leads / 9 cities. Batch regen + Storage upload pending owner go-ahead. |
