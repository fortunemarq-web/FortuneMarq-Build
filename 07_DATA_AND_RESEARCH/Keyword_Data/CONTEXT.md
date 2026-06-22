# 07 — Keyword Data
**Last Updated:** 2026-06-22 | **Status:** COMPLETE — keyword research across all 9 cities × 14 researched niches (real Google Keyword Planner data). NOTE: **13** of these are the niches loaded into FMOS (`market_insights`); **Hotels** was researched but is not a pursued/loaded niche. Per-market search-volume ranking in `SearchVolume_Ranking.csv`.

## Folder Purpose
Store all keyword research data — monthly search volumes, top keywords, and competition levels per niche per city. This data powers the sales pitches, ad campaigns, SEO strategies, and is the source of truth for all search volume numbers across the project.

## What Exists (Complete)

### Root Files
| File | Description |
|---|---|
| `FortuneMarq_Master_Keyword_Research.xlsx` | Master Excel — all keyword data consolidated across 9 cities × 14 niches. Source of truth. |
| `Keyword Research For Google Ads.xlsx` | Google Ads-specific keyword research with ad group structure |
| `FortuneMarq_Detailed_Report.txt` | Text summary of key findings across all cities |
| `analyze_keywords.py` | Python script to analyze and aggregate keyword data |
| `generate_master_excel.py` | Script to generate/update the master Excel from city CSVs |
| `SearchVolume_Ranking.csv` | **All 125 city×niche markets ranked by total monthly searches** (Rank, City, Niche, TotalMonthlySearches, Keywords, AvgCPC_INR). Generated 2026-06-20 by summing "Avg. monthly searches" per file. Used to prioritize SERP scans + report generation (highest-demand markets first). |

### City Folders (all 9 cities)
Each city folder contains CSV files per niche (12–14 files per city) with: keyword, monthly volume, competition level, CPC estimate

| City Folder | Status |
|---|---|
| `Hubli_Keywords/` | Complete — 14 niche CSVs |
| `Dharwad_Keywords/` | Complete |
| `Belgaum_Keywords/` | Complete |
| `Ballari_Cleaned_Keywords/` | Complete |
| `Davangere_Cleaned_Keywords/` | Complete |
| `Kalaburgi_keywords/` | Complete |
| `Mangalore_keywords/` | Complete |
| `Mysuru_Cleaned_Keywords/` | Complete |
| `Vijayapura_Cleaned_Keywords/` | Complete |

### Hubli_Keywords/ files (14 niches)
Hubli_Car_Rental_Keywords.csv, Hubli_Computer_Training_Institute_Keywords.csv, Hubli_Dental_Clinic_Keywords.csv, Hubli_Gym_Keywords.csv, Hubli_IELTS_Coaching_Keywords.csv, Hubli_IVF_Fertility_Clinic_Keywords.csv, Hubli_Interior_Designer_Keywords.csv, Hubli_JEE_Coaching_Keywords.csv, Hubli_Modular_Kitchen_Keywords.csv, Hubli_NEET_Coaching_Keywords.csv, Hubli_Real_Estate_Agent_Keywords.csv, Hubli_Skin_Clinic_Keywords.csv, Hubli_Tuition_Centre_Keywords.csv

## Key Data Points (Hubli — Phase 1 priority)
| Niche | Monthly Searches (Hubli-Dharwad area) |
|---|---|
| Gyms | 63,950 |
| Skin Clinics | 41,850 |
| Computer Training | 24,350 |
| Dental | 21,100 |
| Car Rentals | 16,450 |
| JEE/NEET Coaching | 12,300 |

## Key Finding
Not a single competitor in the 6 priority Hubli niches runs paid ads. The search volume is there. The competition is not. This is the core pitch.

## Overall Data Stats
- Total monthly searches across all 9 cities × 14 niches: ~2,154,200/month
- Top niche overall: Gyms — 278,100/month
- Top city overall: Mysuru — 220,150/month

## Search-Volume Ranking (2026-06-20)
`SearchVolume_Ranking.csv` ranks all 125 city×niche markets by total monthly searches.
Top markets: Mysuru Gyms (151,350), Mysuru Skin Clinic (103,550), Mangalore Gym (81,750),
Belgaum Gym (67,250), Hubli Gym (63,950). Gyms → Skin Clinics → Dental Clinics dominate
demand across all cities; IVF / Physiotherapy / IELTS are negligible (often <500/mo).

**Data-quality notes (from the ranking pass):**
- 9 files did not parse: 8 are genuinely **empty** exports (Physiotherapy / IVF for several cities — no data collected). 1 — **Kalaburgi JEE Coaching** — needs a recheck (failed to parse; not truly empty, so it is wrongly ranked 0).
- Niche labels in the ranking are derived from filenames and still carry folder artifacts ("Cleaned", "gym-keywords", a "Keword" typo). Volumes are correct; only the display labels need tidying.

## What's Pending
- Recheck/re-export **Kalaburgi JEE Coaching** keyword file (parse failure in the 2026-06-20 ranking).
- Collect Physiotherapy / IVF keyword data where files are empty (low priority — negligible demand).
- Data feeds into: `07_DATA_AND_RESEARCH/PDF_Generator/data_loader.py` (volumes used in PDFs)

## What's Blocked
- Nothing.

## Connections to Other Folders
- **Directly used by:** `07_DATA_AND_RESEARCH/PDF_Generator/data_loader.py` — volumes loaded into PDFs
- **Referenced in:** `03_SALES_SYSTEM/Telecaller_Scripts/FMOS_Script_Data/` — Data Hook step in all scripts
- **Used for:** `06_PAID_MARKETING/` — ad campaign targeting and copy
- **Source of truth for:** `07_DATA_AND_RESEARCH/Niche_Data_Reference_Sheet.md`

## Key Decisions Made (Locked)
- All volumes sourced from Google Keyword Planner — no estimates
- Numbers updated from FortuneMarq_Master_Keyword_Research.xlsx in March 2026 across all context files and data_loader.py
- PDFs already generated with correct data — no regeneration needed for English versions

## Session History
| Date | Summary |
|---|---|
| March 2026 | Context file created. All keyword data confirmed. |
| 2026-03-19 | All niche volumes updated from master Excel across all context files and data_loader.py. |
| 2026-04-28 | CONTEXT.md fully rewritten with file-level inventory. |
| 2026-06-20 | Generated `SearchVolume_Ranking.csv` — 125 city×niche markets ranked by monthly searches. Flagged 1 parse failure (Kalaburgi JEE) + 8 empty Physio/IVF files. Fixed stale `Kalaburagi`→`Kalaburgi` folder reference. |
