---
processed: true
source_date: 2026-04-28
type: data_assets
---

# Data Assets — Leads, PDFs, Keywords

## Lead Database
- Total Hubli leads: 8,000 (scraped, cleaned, standardized)
- Format: 11 finalised CSV files in 07_DATA_AND_RESEARCH/Hubli_Final/ (one per niche)
- Status: COMPLETE — ready to upload to FMOS once deployed
- Other cities: Dharwad (cleaned, ready to format), Belgaum/Mangalore/Davangere/Ballari (SERP HTML ready, pipeline not yet run), Mysuru/Kalaburgi/Vijayapura (SERP collection pending)

## Market Intelligence PDFs
- Total generated: 75 PDFs (37 English approved, 38 Kannada pending rewrite due to misspellings)
- 4 PDF types:
  - Type 1 (Visibility Report): For leads already ranking on Google
  - Type 2 (Market Opportunity): For leads with no website
  - Type 3 (Website Performance): For leads with website but not ranking
  - Type 4 (Niche Market Report): For low-volume niches
- Generation pipeline: Fully built and reusable (pdf_generator.py, pdf_generator_kn.py, generate_all_pdfs.py, data_loader.py, translator.py)
- Ready to run for 8 remaining cities immediately

## Keyword Research
- Total: 9 cities × 14 niches = 2,154,200 total monthly searches mapped
- Real data from Google Keyword Planner (not estimates)

## Phase 1 Niche Search Volumes (Hubli)

| Niche | Monthly Searches |
|-------|-----------------|
| Gyms | 63,950 |
| Skin Clinics | 41,850 |
| Computer Training | 24,350 |
| Dental Clinics | 21,100 |
| Car Rentals | 16,450 |
| JEE/NEET Coaching | 12,300 |

## Key Marketing Data Hooks
- "Zero paid ads running in 6 priority niches in Hubli"
- "Gyms: 63,950 searches/month, only 3 websites getting traffic"
- "Skin clinics: 41,850 searches/month, top clinic gets only 173 visits — 99% traffic gap"
- "70% of search traffic goes to JustDial/Sulekha/Practo — FortuneMarq helps clients bypass directories"
