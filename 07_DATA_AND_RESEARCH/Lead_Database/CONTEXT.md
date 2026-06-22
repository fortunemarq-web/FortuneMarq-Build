# 07 — Lead Database
**Last Updated:** 2026-06-22 | **Status:** ALL 9 cities LIVE in FMOS — ~7,960 leads across 13 niches, loaded and typed; market-intel reports generated. The per-city `<City>_Final/` CSVs remain the source files.

## Folder Purpose
Store and manage all GBP-scraped leads — cleaned, formatted, and segmented by city and niche. Ready for upload to FMOS and assignment to Afifa's call queue.

## Lead Data Available Per Lead
Business Name / Phone / City / Niche / Has Website (Y/N) / GMB Rating / GMB Reviews / SERP Ranked / Lead Source / Import Date / Status

## What Exists (Complete)

### Hubli_Final/ — source CSVs (11 files, ~858 leads)
The Hubli source set (final cleaned, SERP-matched). **Already loaded into FMOS** — all 9 cities' per-city `<City>_Final/` CSVs are the source files behind the ~7,960 loaded leads.
| File | Approx Leads |
|---|---|
| Hubli_CarRentals_Final.csv | 106 |
| Hubli_ComputerTraining_Final.csv | 101 |
| Hubli_DentalClinics_Final.csv | 106 |
| Hubli_Gyms_Final.csv | 117 |
| Hubli_InteriorDesigners_Final.csv | 91 |
| Hubli_JEENEETCoaching_Final.csv | 48 |
| Hubli_ModularKitchens_Final.csv | 42 |
| Hubli_Physiotherapy_Final.csv | 33 |
| Hubli_RealEstate_Final.csv | 49 |
| Hubli_SkinClinics_Final.csv | 111 |
| Hubli_TuitionCentres_Final.csv | 54 |

### Combined Hubli Files
- `Hubli_All_Leads_Clean.csv` — All Hubli leads combined (~858 rows)
- `No_Phone_Has_Website_Leads.csv` — Leads with websites but no phone number (different outreach strategy)
- `Website_Rescrape_Queue.csv` — Leads flagged for website URL re-scrape

### Intermediate / Other City Files (inputs to the clean pipeline)
- `Hubli_cleaned_leads/` — 13 files (intermediate — use Hubli_Final/ instead)
- `Dharwad_cleaned_leads/` — 13 niche CSVs
- `Belgaum_cleaned_leads/` — Partial city data
- `Davangere_Cleaned_Leads/` — 11 niche CSVs
- `Mysuru_Cleaned_Leads/` — 14 niche CSVs
- `manglore_cleaned_leads/` — 14 niche CSVs
- `Kalburgi_cleaned_leads/` — 12 niche CSVs
- `Vijayapura_Cleaned_Leads/` — 12 niche CSVs

### `<City>_Final/` — generated 2026-06-20 (8 cities via process_city_leads.py)
Cleaned, deduped, niche-split. Each has a matching `<City>_All_Leads_Clean.csv` master.
| City | Unique | Dups removed | With phone |
|---|---|---|---|
| Mysuru_Final | 1,068 | 195 | 1,036 |
| Manglore_Final | 917 | 152 | 862 |
| Dharwad_Final | 758 | 133 | 724 |
| Belgaum_Final | 748 | 111 | 664 |
| Kalburgi_Final | 616 | 83 | 525 |
| Davangere_Final | 560 | 79 | 489 |
| Vijayapura_Final | 459 | 75 | 392 |
| Ballari_Final | 326 | 43 | 292 |

## Data Notes (history) — resolved
A/B/C/D type is derived from `Has Website` + `SERP Ranked`. Earlier in cleaning, the 8 non-Hubli cities had placeholder type fields (`Has Website` = `Y` for 100% of rows from the `_cleaned_leads` source; `SERP Ranked` = "Not Scraped"), so they temporarily collapsed to Type B. This has since been resolved upstream — all 9 cities are loaded and typed in FMOS (~7,960 leads, 13 niches), with market-intel reports generated. City naming (`Manglore`→Mangalore, `Kalburgi`→Kalaburgi) was normalized to match Keyword_Data before import.

### Scripts
- `analyze_leads.py` — Python analysis: counts, phone coverage, duplicates
- `process_hubli_leads_v2.py` — Hubli data processing pipeline (reusable for other cities)
- `website_phone_scraper.py` — Scrapes phone numbers and website URLs from GBP

## Overall Database Stats
| Metric | Count |
|---|---|
| Total leads loaded in FMOS across all 9 cities | ~7,960 |
| Niches loaded | 13 |
| Phone coverage | ~87.2% |
| Leads without phones | ~12.8% |

## CSV Format Standard (Hubli_Final columns)
Business Name, Owner Name, Phone, City, Niche, Has Website (Y/N), GMB Rating, GMB Reviews, SERP Ranked (Y/N), Lead Source, Import Date, Status, lead_type

## Bulk Import Tool
A one-click server action at `/admin/bulk-import` in FMOS handles loading all remaining leads:
- Walks the entire Lead_Database folder recursively
- Skips: `Hubli_cleaned_leads/` folder (superseded by Hubli_Final), `Hubli_All_Leads_Clean.csv`, `No_Phone_Has_Website_Leads.csv`, `Website_Rescrape_Queue.csv`, Python scripts, CONTEXT.md
- Handles both CSV column formats (Hubli_Final format and *_cleaned_leads format)
- Uploads in chunks of 200 rows per file, skipping duplicates automatically
- Shows per-file results: files processed / leads found / added / skipped

To run: go to `192.168.1.2:3000/admin/bulk-import` → click "Start Bulk Import". Takes a few minutes. Run once only (re-running is safe but will skip all existing leads).

## What's Done
1. ~~Upload Hubli_Final/ CSVs to FMOS~~ ✅ DONE
2. ~~Clean the other 8 cities to `_Final`~~ ✅ DONE 2026-06-20
3. ~~Website verification + SERP for type fields~~ ✅ resolved upstream — all cities typed
4. ~~Normalize `Manglore`→Mangalore, `Kalburgi`→Kalaburgi~~ ✅ DONE before import
5. ~~Load all remaining leads to FMOS~~ ✅ DONE — all 9 cities live (~7,960 leads, 13 niches), additive & dup-safe

## Connections to Other Folders
- **Uploads to:** `01_CRM_AND_TOOL/fmos/app/admin/upload/` — via CSV upload UI (manual, per-file)
- **Bulk uploads via:** `01_CRM_AND_TOOL/fmos/app/admin/bulk-import/` — one-click, walks entire Lead_Database folder
- **CSV format documented in:** `01_CRM_AND_TOOL/fmos/CSV_UPLOAD_FORMAT.md`
- **PDFs matched to these leads from:** `07_DATA_AND_RESEARCH/PDF_Generator/output/Hubli/`

## Key Decisions Made (Locked)
- Hubli_Final/ is the authoritative source for Hubli leads — not _cleaned_leads
- Upload order (historical): Hubli first, then Dharwad, then the other cities — all 9 are now loaded
- Phone number is required for upload — leads with no phone go to separate queue

## Session History
| Date | Summary |
|---|---|
| March 2026 | Folder created. Initial data processing. |
| 2026-03-16 | Full audit complete. 7,298 total leads, 87.2% phone coverage. 11 Hubli_Final/ files finalized. |
| 2026-04-28 | CONTEXT.md fully rewritten with file-level inventory. |
| 2026-04-29 | 858 Hubli leads confirmed live in FMOS (imported before this session). Bulk-import server action created at /admin/bulk-import/actions.ts — walks Lead_Database, handles both CSV formats, chunks at 200/file, duplicate-safe. Ready to load ~6,300 remaining leads from other city folders. |
| 2026-06-20 | Ran process_city_leads.py for all 8 non-Hubli cities → `<City>_Final/` + `<City>_All_Leads_Clean.csv` (5,452 unique, 871 dups removed). **Found blocker:** source `Has Website` is Y for 100% of rows + no SERP → leads not type-segregatable (all Type B). Website verification + SERP scrape needed before import. Not loaded to app. |
