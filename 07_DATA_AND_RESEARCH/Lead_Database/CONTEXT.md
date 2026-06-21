# 07 — Lead Database
**Last Updated:** 2026-06-20 | **Status:** 858 Hubli leads LIVE in FMOS. 2026-06-20: all 8 other cities cleaned to `<City>_Final/` (5,452 unique businesses, 871 dups removed) — but **NOT type-ready** (see Data-Quality Blocker below). Bulk-import tool at `/admin/bulk-import` still pending run.

## Folder Purpose
Store and manage all GBP-scraped leads — cleaned, formatted, and segmented by city and niche. Ready for upload to FMOS and assignment to Afifa's call queue.

## Lead Data Available Per Lead
Business Name / Phone / City / Niche / Has Website (Y/N) / GMB Rating / GMB Reviews / SERP Ranked / Lead Source / Import Date / Status

## What Exists (Complete)

### Hubli_Final/ — Upload-Ready (11 files, ~858 leads)
The definitive set. Final cleaned, SERP-matched, ready for FMOS upload.
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

## ⚠ Data-Quality Blocker (2026-06-20) — these Finals are NOT type-ready
A/B/C/D type is derived from `Has Website` + `SERP Ranked`. For all 8 non-Hubli cities:
- **`Has Website` = `Y` for 100% of rows** — the `_cleaned_leads` source never verified website presence per business (no `Website Link` column either). Blanket default, not real.
- **`SERP Ranked` = "Not Scraped"** — no SERP data collected for these cities (only Hubli has it).
- ⟹ Every lead collapses to **Type B**; accurate segregation is impossible until the two upstream steps run: **website verification** (`website_phone_scraper.py` → real Has Website + Website Link) and **SERP scrape** (SearchAPI.io per city×niche → SERP Ranked).
- Naming: `Manglore`→Mangalore and `Kalburgi`→Kalaburgi need normalizing (to match Keyword_Data) before app import.

### Scripts
- `analyze_leads.py` — Python analysis: counts, phone coverage, duplicates
- `process_hubli_leads_v2.py` — Hubli data processing pipeline (reusable for other cities)
- `website_phone_scraper.py` — Scrapes phone numbers and website URLs from GBP

## Overall Database Stats (as of March 2026 audit)
| Metric | Count |
|---|---|
| Total leads across 9 cities (all cleaned files) | ~7,298 |
| Hubli_Final leads (upload-ready) | ~858 |
| Phone coverage | ~87.2% |
| Leads without phones | ~12.8% |
| Duplicates removed | 69 |

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

## What's Pending
1. ~~Upload Hubli_Final/ CSVs to FMOS~~ ✅ DONE — 858 Hubli leads live
2. ~~Clean the other 8 cities to `_Final`~~ ✅ DONE 2026-06-20 — but see Data-Quality Blocker.
3. **Website verification** for the 8 cities (`website_phone_scraper.py`) → real `Has Website` + `Website Link`.
4. **SERP scrape** for the 8 cities (SearchAPI.io per city×niche) → `SERP Ranked`. Then re-run process_city_leads.py so `_Final` carries real type fields.
5. **Normalize** `Manglore`→Mangalore, `Kalburgi`→Kalaburgi (City column + folder) before import.
6. Then `/admin/bulk-import` to load the remaining ~5,450 leads (additive, dup-safe — must NOT wipe live Hubli).

## What's Blocked
- Other city finalization not urgent until Hubli outreach is running
- Bulk import from other cities is ready to run — no blockers

## Connections to Other Folders
- **Uploads to:** `01_CRM_AND_TOOL/fmos/app/admin/upload/` — via CSV upload UI (manual, per-file)
- **Bulk uploads via:** `01_CRM_AND_TOOL/fmos/app/admin/bulk-import/` — one-click, walks entire Lead_Database folder
- **CSV format documented in:** `01_CRM_AND_TOOL/fmos/CSV_UPLOAD_FORMAT.md`
- **PDFs matched to these leads from:** `07_DATA_AND_RESEARCH/PDF_Generator/output/Hubli/`

## Key Decisions Made (Locked)
- Hubli_Final/ is the authoritative source for Hubli leads — not _cleaned_leads
- Upload order: Hubli first (6 priority niches), then Dharwad, then other cities
- Phone number is required for upload — leads with no phone go to separate queue

## Session History
| Date | Summary |
|---|---|
| March 2026 | Folder created. Initial data processing. |
| 2026-03-16 | Full audit complete. 7,298 total leads, 87.2% phone coverage. 11 Hubli_Final/ files finalized. |
| 2026-04-28 | CONTEXT.md fully rewritten with file-level inventory. |
| 2026-04-29 | 858 Hubli leads confirmed live in FMOS (imported before this session). Bulk-import server action created at /admin/bulk-import/actions.ts — walks Lead_Database, handles both CSV formats, chunks at 200/file, duplicate-safe. Ready to load ~6,300 remaining leads from other city folders. |
| 2026-06-20 | Ran process_city_leads.py for all 8 non-Hubli cities → `<City>_Final/` + `<City>_All_Leads_Clean.csv` (5,452 unique, 871 dups removed). **Found blocker:** source `Has Website` is Y for 100% of rows + no SERP → leads not type-segregatable (all Type B). Website verification + SERP scrape needed before import. Not loaded to app. |
