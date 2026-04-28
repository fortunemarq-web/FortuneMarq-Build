# 07 — Lead Database
**Last Updated:** 2026-04-28 | **Status:** Hubli_Final ready for FMOS upload. 8 other cities cleaned but not finalized.

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

### Intermediate / Other City Files
- `Hubli_cleaned_leads/` — 13 files (intermediate — use Hubli_Final/ instead)
- `Dharwad_cleaned_leads/` — 13 niche CSVs
- `Belgaum_cleaned_leads/` — Partial city data
- `Davangere_Cleaned_Leads/` — 11 niche CSVs
- `Mysuru_Cleaned_Leads/` — 14 niche CSVs
- `manglore_cleaned_leads/` — 14 niche CSVs
- `Kalburgi_cleaned_leads/` — 12 niche CSVs
- `Vijayapura_Cleaned_Leads/` — 12 niche CSVs

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

## What's Pending
1. Upload Hubli_Final/ CSVs to FMOS once deployed (11 files)
2. Finalize Dharwad leads — run process_hubli_leads_v2.py equivalent
3. Finalize remaining cities: Belgaum, Mangalore, Davangere, Ballari, Kalaburgi, Vijayapura
4. Mysuru SERP data needed first before finalization

## What's Blocked
- FMOS upload blocked on FMOS deployment (active priority — Phases C–E)
- Other city finalization is not urgent until Hubli outreach is running

## Connections to Other Folders
- **Uploads to:** `01_CRM_AND_TOOL/fmos/app/admin/upload/` — via CSV upload UI
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
