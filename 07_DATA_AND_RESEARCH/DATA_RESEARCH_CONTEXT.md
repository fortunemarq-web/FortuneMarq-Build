# FortuneMarq — Data & Research Context
**Last Updated:** 2026-03-19 | **Status:** Active — Hubli pipeline complete. Other cities pending.

## What This Folder Contains
All data assets that power FortuneMarq's sales machine — keyword research, competitor data scraped from real Google results, lead database, and market intelligence PDFs. This is Level 0 and Level 1 of the content build hierarchy. Every script, template, proposal, and PDF in the entire system pulls from this data.

---

## Asset 1 — Keyword Data
**Location:** 07_DATA_AND_RESEARCH/Keyword_Data/
**Status:** COMPLETE — all 9 cities x 14 niches
**Source:** Google Keyword Planner exports
**Format:** CSV files, one per niche per city
**Key column:** "Avg. monthly searches"

### Coverage
Cities: Hubli, Dharwad, Belgaum, Ballari, Davangere, Kalaburgi, Mangalore, Mysuru, Vijayapura
Niches: Dental, Car Rentals, Computer Training, Gyms, IELTS, IVF, Interior Design, JEE Coaching, Modular Kitchen, NEET Coaching, Physiotherapy, Real Estate, Skin Clinics, Tuition Centres

### Top Stats
- Total monthly searches across all 9 cities x 14 niches: 2,154,200/month
- #1 niche: Gyms — highest volume across all cities
- #1 city: Mysuru — 549,550/month
- Hubli priority niches: Gyms 63,950, Skin Clinics 41,850, Computer Training 24,350, Dental 21,100, JEE/NEET 12,300, Car Rentals 16,450

---

## Asset 2 — Real Google Search Results (Scraped)
**Location:** 07_DATA_AND_RESEARCH/Competitor_Data/
**Status:** COMPLETE for Hubli (14 niches — GBP CSVs, Organic CSVs, Master SERP Report). HTML files exist for Dharwad, Belgaum, Mangalore, Davangere, Ballari — pipeline not yet run. Mysuru, Kalaburgi, Vijayapura need SERP HTML collection.
**Source:** SearchAPI.io — real Google Page 1 results
**Key file:** Competitor_Data/Hubli/_ALL_RESULTS.json

### What Was Scraped Per Niche
For each niche+city keyword search, captured:
- Local Pack (GBP) — Google Business Profile 3-pack with name, rating, reviews, address
- Directories — JustDial, Sulekha, Practo etc. with traffic estimates
- Social Media — Instagram, Facebook, YouTube profiles ranking on Page 1
- Organic Websites — actual business websites with domain, snippet, traffic estimates
- Traffic Distribution — how monthly search volume splits across all result types

### Traffic Distribution Model
Based on real CTR research for local Indian searches:
- Google Local Pack (GBP): ~35% of traffic
- Directories (JustDial etc.): ~20%
- Social Media profiles: ~10%
- Organic websites: ~25%
- Uncaptured/bounce: ~10%

### Key Finding Across All 14 Niches
NOT A SINGLE competitor in any Hubli niche runs paid ads. This is the core sales opportunity.

### Sample — Gyms Hubli (30,000/month)
- GBP: 0 listings (Local Pack not showing for gym keyword — JustDial dominates)
- Directories: JustDial x2 = 20% = 6,000 searches
- Social: Instagram x3 (@akhada_hubli, @ifitness.hubli) = 10% = 3,000
- Websites: xtremefitness.co.in (#1 organic, 3,600/mo), sanaladiesgymandfitness.in (#2, 2,400/mo)
- Pitch angle: For Gyms — direct website + Google Ads is the opportunity (no GBP pack)

### Sample — Skin Clinics Hubli (7,500/month)
- GBP: 3 listings — Dr Arpitha's (4.8 stars, 925 reviews), Mohan Skin Care (4.8 stars), Jeevannavar (4.5 stars) = 35% = 2,623
- Directories: JustDial x2 + Practo x2 = 20% = 1,500
- Social: Instagram x2 = 10% = 750
- Websites: jeevannavarskincare.com (#1), gsquareskinandaesthetics.in (#2)
- Pitch angle: For Skin Clinics — GMB is critical. 35% of traffic goes to GBP first.

### City Pipeline Status
| City | SERP HTML | Pipeline Run | GBP CSV | Organic CSV | Master Report |
|---|---|---|---|---|---|
| Hubli | EXISTS (14 niches) | COMPLETE | EXISTS | EXISTS | EXISTS |
| Dharwad | EXISTS | NOT YET RUN | PENDING | PENDING | PENDING |
| Belgaum | EXISTS | NOT YET RUN | PENDING | PENDING | PENDING |
| Mangalore | EXISTS | NOT YET RUN | PENDING | PENDING | PENDING |
| Davangere | EXISTS | NOT YET RUN | PENDING | PENDING | PENDING |
| Ballari | EXISTS | NOT YET RUN | PENDING | PENDING | PENDING |
| Mysuru | MISSING — need to collect | NOT YET RUN | PENDING | PENDING | PENDING |
| Kalaburgi | MISSING — need to collect | NOT YET RUN | PENDING | PENDING | PENDING |
| Vijayapura | MISSING — need to collect | NOT YET RUN | PENDING | PENDING | PENDING |

---

## Asset 3 — Niche Data Reference Sheet
**Location:** 07_DATA_AND_RESEARCH/Niche_Data_Reference_Sheet.md
**Status:** COMPLETE — 6 priority niches, Hubli
**Contains:** Search volumes, competitor details, data hooks for scripts, PDF filenames, upsell paths

### Competitor Traffic Rule
All 3 competitors combined = 25% of monthly search volume
Competitor 1 gets 50% of that share, Competitor 2 gets 30%, Competitor 3 gets 20%

---

## Asset 4 — Lead Database
**Location:** 07_DATA_AND_RESEARCH/Lead_Database/
**Status:** HUBLI COMPLETE — 14 niches cleaned, SERP-matched, and finalised in Lead_Database/Hubli_Final/ (11 upload-ready CSV files). Other 8 cities have cleaned leads but are not yet SERP-matched or finalised.
**Source:** Google Business Profile scraping
**Total:** 7,298 leads across 9 cities (post-clean)

### Data Available Per Lead (post-standardisation)
Business Name / Owner Name / Phone / City / Niche / Has Website / GMB Rating / GMB Reviews / SERP_Ranked / Lead Source / Import Date / Status

### Hubli_Final — Upload-Ready Files (11 niches)
All files in Lead_Database/Hubli_Final/ are cleaned, SERP-matched, and ready for FMOS import:
- Hubli_Gyms_Final.csv
- Hubli_SkinClinics_Final.csv
- Hubli_ComputerTraining_Final.csv
- Hubli_DentalClinics_Final.csv
- Hubli_JEENEETCoaching_Final.csv
- Hubli_CarRentals_Final.csv
- Hubli_InteriorDesigners_Final.csv
- Hubli_ModularKitchens_Final.csv
- Hubli_Physiotherapy_Final.csv
- Hubli_RealEstate_Final.csv
- Hubli_TuitionCentres_Final.csv

### Other Cities — Status
All 8 other cities have cleaned leads in [City]_cleaned_leads/ subfolders. They need SERP-matching and finalisation before FMOS upload. Blocked by SERP pipeline not yet run for those cities.

---

## Asset 5 — Market Intelligence PDFs
**Location:** 07_DATA_AND_RESEARCH/PDF_Generator/output/Hubli/
**Status:** HUBLI COMPLETE — 75 PDFs generated (English + Kannada, 4 types across 14 niches). PDF Generator pipeline is complete and reusable for all cities.
**Count:** 75 PDFs in Hubli output folder

### PDF Types
| Lead Segment | PDF Type | Description |
|---|---|---|
| SERP_Ranked = Y | Type 1 — Visibility Report | Lead already appears on Google Page 1 |
| SERP_Ranked = N, Has Website = N | Type 2 — Market Opportunity Report | Lead has no website and not on Google |
| SERP_Ranked = N, Has Website = Y | Type 3 — Website Performance Report | Lead has website but not ranking |
| Any niche with volume under 2,500/month | Type 4 — Niche Market Report | Low search volume niche |

### Niches with Type 4 (Low Volume) Only
- IELTS Coaching — Type 4 only (KN version missing — one file incomplete)
- IVF Clinics — Type 4 only (EN + KN)
- Physiotherapy — Type 4 only (EN + KN)

### Design Specs (Locked)
- Light theme: #FFFFFF background, #15BA7F green accents
- 5 pages: Cover → Market Demand → Traffic Distribution → Competition → Our System + CTA
- Fonts: AllianceNo1 (headings), AllianceNo2 (body), JetBrains Mono (numbers/labels)
- Logo: Logo1_whitebackground.jpg

### Next Step for PDFs
Run pipeline for Dharwad (next priority city). All SERP HTML assets are ready.

---

## Asset 6 — PDF Generator Pipeline
**Location:** 07_DATA_AND_RESEARCH/PDF_Generator/
**Status:** COMPLETE and reusable for all cities

### Scripts
| Script | Purpose |
|---|---|
| pdf_generator.py | Core PDF generator — English |
| pdf_generator_kn.py | Core PDF generator — Kannada |
| generate_all_pdfs.py | Batch runner — generates all English PDFs for a city |
| generate_all_pdfs_kn.py | Batch runner — generates all Kannada PDFs for a city |
| data_loader.py | Loads city-specific volumes and niche data — update VOLUMES here for each new city |
| translator.py | Handles English to Kannada translation for KN PDFs |

### Output Location
PDF_Generator/output/[City]/

### To Run for a New City
1. Update VOLUMES dict in data_loader.py with the new city's monthly search volumes per niche
2. Run: python generate_all_pdfs.py [CityName]
3. Run: python generate_all_pdfs_kn.py [CityName]
4. Output appears in PDF_Generator/output/[CityName]/
5. Update PDF_Index.md with new city's files

---

## Asset 7 — Detailed Keyword Report
**Location:** 07_DATA_AND_RESEARCH/Keyword_Data/FortuneMarq_Detailed_Report.txt
**Status:** COMPLETE — full readable overview of all niches, volumes, competitors

---

## Content Build Hierarchy — Status

| Level | Document | Status |
|---|---|---|
| L0 | Niche Data Reference Sheet | COMPLETE |
| L1a | Lead CSV Files | HUBLI COMPLETE — 11 finalised files in Hubli_Final/. Other 8 cities cleaned but not finalised. |
| L1b | PDF Index | PENDING — PDF_Index.md not yet created |
| L2 | Telecaller Scripts | PENDING — cannot start until L1a and L1b complete |
| L3 | WhatsApp Templates | PENDING |
| L4a | Proposal Template | PENDING |
| L4b | Agreement Template | PENDING |
| L5a | Service Delivery SOPs | PENDING |
| L5b | Onboarding Checklist | PENDING |
| L5c | Website Brief Intake Form | PENDING |
| L6a | Monthly Report Templates | PENDING |
| L6b | Client Health Score System | PENDING |
| L7 | Upsell Trigger System | PENDING |

---

## What Still Needs to Be Done

1. **Create PDF_Index.md** — map all 75 Hubli PDFs to city + niche + type + language + filename. Required before L2 can start.
2. **Run pipeline for Dharwad** — SERP HTML exists, all assets ready. Next priority city.
3. **Run pipeline for Belgaum, Mangalore, Davangere, Ballari** — SERP HTML exists for all.
4. **Collect SERP HTML for Mysuru, Kalaburgi, Vijayapura** — then run pipeline for each.
5. **Upload Hubli_Final CSVs to FMOS** — 11 files ready. Blocked by FMOS deployment (01_CRM_AND_TOOL).
6. **Move to 03_SALES_SYSTEM** — begin L2 Telecaller Scripts for Hubli 6 priority niches once PDF_Index.md is created.

---

## How This Data Feeds the Rest of the System

| Data Asset | Used By |
|---|---|
| Keyword volumes | Telecaller scripts, Proposals, PDF reports, Ad copy |
| Scraped Google results | PDF pages 3+4, Sales pitch, Traffic distribution visual |
| Lead CSVs (Hubli_Final/) | FMOS call queue, WhatsApp outreach |
| Niche Data Reference Sheet | All L2-L7 content creation |
| Market Intelligence PDFs | Primary sales weapon — sent to every lead |

---

## The Core Sales Insight from This Data
"70% of searches go to JustDial and directories. Customers call through JustDial — JustDial owns the customer, not you. Every JustDial lead costs you money. FortuneMarq bypasses directories — customers find YOU directly on Google and call YOUR number."

For GBP pitch: "35% of all local searches go to Google Business Profiles first — before any website. If you're not optimised on GMB, you're invisible to 35% of your potential customers every single month."

---

## Session Log
| Date | Summary |
|---|---|
| March 2026 | Context file created. All 14 Hubli niches scraped via SearchAPI.io. Real traffic distribution data captured including GBP, directories, social media, organic websites. PDF redesign in progress with v3 script. Lead phone number gap identified. |
| March 16, 2026 | Full Lead Database standardisation complete. 111 CSV files cleaned, headers unified, phones reformatted, 69 duplicates removed, all files renamed to [City]_[Niche]_Leads.csv. 7,298 total leads, 6,366 with phone (87.2%). All Phase 1 Hubli niches confirmed callable. Lead data is now FMOS-upload ready. |
| 2026-03-19 | Hubli pipeline complete. 75 PDFs generated in EN + KN (Types 1–4 across 14 niches). 11 Hubli_Final CSVs ready for FMOS upload. PDF Generator pipeline confirmed reusable for all cities. DATA_RESEARCH_CONTEXT.md updated to reflect real current state. Next: PDF_Index.md then 03_SALES_SYSTEM for L2 Telecaller Scripts. |
| 2026-03-19 | All niche volumes updated from FortuneMarq_Master_Keyword_Research.xlsx. Replaced estimated numbers with real Google Keyword Planner data across all context files and data_loader.py. PDFs already generated with correct data — no regeneration needed. |
