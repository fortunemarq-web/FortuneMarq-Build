# HubliLeadDatabase

**Last updated:** 2026-04-28  
**Tags:** #research #active  
**Related:** [[PhaseOneNiches]], [[SalesSystem]], [[FMOS]], [[FortuneMarq]]

---

## Summary

FortuneMarq has 8,000 scraped, cleaned, and standardized business leads for Hubli across 6 priority niches, stored as 11 CSV files and ready to upload to FMOS. Paired with 75 market intelligence PDFs, this is the data engine that powers cold outreach.

## Lead Database

- **Total leads:** 8,000 (Hubli)
- **Format:** 11 CSV files in `07_DATA_AND_RESEARCH/Hubli_Final/` (one per niche)
- **Status:** COMPLETE — ready for upload the moment FMOS is live
- **Key columns:** Business name, phone, address, website (Y/N), SERP_Ranked (Y/N), niche, city

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
| Hubli | ✅ Complete |
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
