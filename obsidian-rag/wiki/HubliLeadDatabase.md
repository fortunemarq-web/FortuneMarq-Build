# HubliLeadDatabase

**Last updated:** 2026-04-29  
**Tags:** #research #active  
**Related:** [[PhaseOneNiches]], [[SalesSystem]], [[FMOS]], [[FortuneMarq]]

---

## Summary

FortuneMarq has ~7,181 scraped, cleaned, and standardized business leads across 9 cities stored as CSV files in `07_DATA_AND_RESEARCH/Lead_Database/`. 858 Hubli leads are **live in FMOS** as of 2026-04-29. A one-click bulk-import tool at `/admin/bulk-import` is ready to load the remaining ~6,300 leads from other city folders.

## Lead Database

- **Hubli leads in FMOS:** 858 ✅ LIVE
- **Total leads across all cities:** ~7,181 (all city folders in Lead_Database)
- **Hubli format:** 11 CSV files in `07_DATA_AND_RESEARCH/Lead_Database/Hubli_Final/` (one per niche)
- **Key columns:** Business Name, Phone, City, Niche, Has Website (Y/N), SERP Ranked (Y/N), Website Link, Google Maps Link, SERP Source, Owner Name

## Bulk Import Tool

`/admin/bulk-import` in FMOS — one-click server action that:
- Walks the entire `Lead_Database` folder recursively
- Handles both CSV column formats (Hubli_Final format and *_cleaned_leads format)
- Skips: `Hubli_cleaned_leads/` (superseded), combined files, utility scripts
- Uploads in chunks of 200 rows/file, duplicate-safe (skips existing phone numbers)
- Shows real-time results: files / leads found / added / skipped

**To run:** go to `192.168.1.2:3000/admin/bulk-import` → click Start Bulk Import. Run once. Safe to re-run (all duplicates skipped).

## PDF Assets (Market Intelligence)

75 PDFs generated and ready to send as cold outreach conversation starters:
- 37 English versions: Approved
- 38 Kannada versions: Pending rewrite (misspellings found, need correction)

### 4 PDF Types

| Type | Trigger Condition | Angle |
|------|-------------------|-------|
| Type 1 — Visibility Report | Lead already ranks on Google | "Here's proof you're ahead — let's dominate further" |
| Type 2 — Market Opportunity | Lead has no website | "You're invisible online while competitors capture leads" |
| Type 3 — Website Performance | Lead has website, not ranking | "You have a website but Google doesn't know it exists" |
| Type 4 — Niche Market Report | Low search volume niche | "Here's the full picture of digital demand in your space" |

## PDF Generation Pipeline

Fully built and reusable. Scripts ready: `pdf_generator.py`, `pdf_generator_kn.py`, `generate_all_pdfs.py`, `data_loader.py`, `translator.py`. Can be re-run for 8 remaining cities.

## Other City Status

| City | Status |
|------|--------|
| Hubli | ✅ Complete — 858 leads LIVE in FMOS |
| Dharwad | Cleaned, ready to format |
| Belgaum | SERP HTML ready, pipeline not run |
| Mangalore | SERP HTML ready, pipeline not run |
| Davangere | SERP HTML ready, pipeline not run |
| Ballari | SERP HTML ready, pipeline not run |
| Mysuru | SERP collection needed first |
| Kalaburgi | SERP collection needed first |
| Vijayapura | SERP collection needed first |

## Open Questions

- [ ] When will Kannada PDFs be corrected and approved?
- [ ] Priority order for next city after Dharwad?

## Sources

- [[raw/2026-04-28_data-assets]]
