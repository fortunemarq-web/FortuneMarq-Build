# 07 — Lead Database
**Last Updated:** March 16, 2026 | **Status:** Fully standardised, cleaned, renamed — 7,298 leads — 87.2% phone coverage — ready for FMOS upload

## Purpose
Store and manage the 8,000 GBP scraped leads — cleaned, formatted, and segmented by city and niche — ready for upload to FMOS and assignment to Afifa's call queue.

## Lead Data Available Per Lead
Business Name / Phone / City / Has Website (Y/N)
(Owner name not available from GBP scrape)

## CSV Format Standard
Columns: Business Name, Owner Name, Phone, City, Niche, Has Website (Y/N), GMB Rating, GMB Reviews, Lead Source, Import Date, Status

## File Naming Convention
[City]_[Niche]_Leads.csv
Example: Hubli_Gyms_Leads.csv, Dharwad_Dental_Leads.csv

## Phase 1 Priority Files (Hubli only — upload first)
Hubli_Gyms_Leads.csv / Hubli_SkinClinics_Leads.csv / Hubli_ComputerTraining_Leads.csv
Hubli_DentalClinics_Leads.csv / Hubli_Coaching_Leads.csv / Hubli_CarRentals_Leads.csv

## Upload Status
- [ ] Hubli leads — not uploaded to FMOS
- [ ] Dharwad leads — not uploaded
- [ ] Other cities — Phase 2+

## Master Index File
All_Leads_Index.csv — columns: City, Niche, Total Leads, File Name, Upload Status, Date Uploaded

## Database Audit — March 16, 2026

### Overall Stats (across 9 cities, 111 valid files)
| Metric | Count |
|---|---:|
| Total leads (post-clean) | 7,298 |
| Have phone number | 6,366 (87.2%) |
| Missing phone number | 932 (12.8%) |
| Duplicates removed | 69 |
| Files standardised | 111 |
| Corrupt/skipped files | 1 (HUBLI_IELTS_COACHING1.csv) |

> **Full standardisation run March 16, 2026** — All 111 CSV files cleaned. Headers unified to standard 11-column format. Phone numbers standardised (leading-0 stripped, +91 removed, spaces cleaned). 69 exact duplicates removed. All files renamed to [City]_[Niche]_Leads.csv convention. City names corrected: Belgaum → Belagavi, Kalburgi → Kalaburagi.

#### City-Level Phone Coverage
| City | Total | Has Phone | Missing | Coverage |
|---|---:|---:|---:|---:|
| Hubli | 975 | 899 | 76 | 92% |
| Dharwad | 891 | 825 | 66 | 93% |
| Belagavi | 859 | 719 | 140 | 84% |
| Mysuru | 1,263 | 1,174 | 89 | 93% |
| Mangalore | 1,069 | 950 | 119 | 89% |
| Davangere | 639 | 536 | 103 | 84% |
| Ballari | 369 | 279 | 90 | 76% |
| Vijayapura | 534 | 436 | 98 | 82% |
| Kalaburagi | 699 | 548 | 151 | 78% |

### Phone Number Issues — Post-Clean Status

> All phones standardised March 16, 2026. Leading-0 stripped (11-digit STD format → 10-digit), +91 prefix removed, spaces/brackets cleaned. Junk numbers (6666666667 etc.) flagged as PHONE MISSING.

#### Files with highest remaining phone gaps (post-clean)
| File | Total | Has Phone | Missing | % Missing |
|---|---:|---:|---:|---:|
| Ballari_Coaching_Leads.csv | 35 | 0 | 35 | 100% |
| Kalaburagi_Gyms_Leads.csv | 116 | 58 | 58 | 50% |
| Kalaburagi_SkinClinics_Leads.csv | 76 | 38 | 38 | 50% |
| Vijayapura_Gyms_Leads.csv | 78 | 42 | 36 | 46% |
| Belagavi_Gyms_Leads.csv | 114 | 68 | 46 | 40% |
| Belagavi_SkinClinics_Leads.csv | 118 | 67 | 51 | 43% |
| Davangere_RealEstate_Leads.csv | 28 | 11 | 17 | 61% |
| Vijayapura_CarRentals_Leads.csv | 48 | 31 | 17 | 35% |
| Mangalore_Gyms_Leads.csv | 118 | 64 | 54 | 46% |

### Broken / Corrupt File
- **`Hubli/HUBLI_IELTS_COACHING1.csv`** — No Phone column. No valid data.
  Contains CSS class names as column headers (`fontBodySmall`, `ASWgTc`, etc.).
  This is a raw HTML dump accidentally saved as CSV. 0 usable rows.
  Action required: delete this file and re-scrape Hubli IELTS Coaching data.
  Note: File was skipped during March 16 standardisation run — Hubli has no IELTS Coaching data currently.

### Phase 1 Impact (Hubli — priority niches)
| Niche | Callable? | Leads | Has Phone | Coverage | Notes |
|---|---|---:|---:|---:|---|
| Gyms | **YES** | 118 | 99 | 84% | Phones standardised ✅ |
| Skin Clinics | **YES** | 119 | 94 | 79% | Phones standardised ✅ |
| Computer Training | **YES** | 108 | 101 | 94% | Ready ✅ |
| Dental Clinics | **YES** | 106 | 105 | 99% | Ready ✅ |
| JEE/NEET Coaching | **YES** | 69 | 69 | 100% | Ready ✅ |
| Car Rentals | **YES** | 106 | 97 | 92% | Ready ✅ |
| IELTS Coaching | **NO DATA** | 0 | 0 | — | Corrupt file — re-scrape needed |

### Action Items from Audit
- [x] Re-scrape Gyms for all 9 cities — **COMPLETE** (March 16, 2026 — 95.6% recovery)
- [x] Re-scrape Skin Clinics for 7 cities — **COMPLETE** (March 16, 2026 — 95.6% recovery)
- [ ] Delete or replace `HUBLI_IELTS_COACHING1.csv` — corrupt file, no usable data
- [ ] Investigate and fix Davangere Real Estate Agents (only 11/28 have phones — 61% missing)
- [ ] Investigate and fix Vijayapura Car Rentals (only 31/48 have phones — 35% missing)
- [x] Gym and Skin Clinic files are now ready for FMOS upload — phone block removed
- [x] Standardise all CSV headers to 11-column format — **COMPLETE** (March 16, 2026)
- [x] Clean all phone numbers (strip leading 0, remove spaces, remove +91) — **COMPLETE** (March 16, 2026)
- [x] Remove duplicate rows across all files — **COMPLETE** (69 removed, March 16, 2026)
- [x] Rename all files to [City]_[Niche]_Leads.csv convention — **COMPLETE** (March 16, 2026)
- [x] Correct city name spelling errors (Belgaum→Belagavi, Kalburgi→Kalaburagi) — **COMPLETE**
- [ ] Upload Hubli leads to FMOS — Phase 1 ready
- [ ] Upload Dharwad leads to FMOS — Phase 1 second city

### Prime Calling List Insight
- 2,282 businesses have NO website — these are the hottest prospects for web services
- Cross these against the 5,393 leads with phones to get the exact "callable + no website" list
- This is the ideal cold call queue for Afifa

## Session Log
| Date | Summary |
|---|---|
| March 2026 | Context file created. Data cleaned and sorted. Awaiting FMOS deployment for upload. |
| March 16, 2026 | Full database audit completed. 7,367 total leads. 5,393 have phones (73.2%). 5,085 have websites (69%). Gyms (all cities) and Skin Clinics (7 cities) identified as 100% phoneless — re-scrape required before these can be called. 1 corrupt file found (Hubli IELTS). Detailed findings logged above. |
| March 16, 2026 | Phone scraper completed successfully. 1,524 businesses processed across Gyms and Skin Clinics for all 9 cities. 1,457 phone numbers recovered — 95.6% recovery rate. Gyms: was 0% phone coverage, now ~95%. Skin Clinics: was 81% missing, now ~95% covered. Overall database phone coverage updated from 73.2% to ~95%. Gyms and Skin Clinics are now callable — BLOCKED status removed. Niche attack order Priority #1 (Gyms) is unblocked. |
| March 16, 2026 | Full database standardisation complete. 111 CSV files scanned, cleaned, and renamed. All headers unified to 11-column standard. 6,471 phone numbers reformatted (leading-0, spaces, +91 removed). 69 duplicates removed. All files renamed to [City]_[Niche]_Leads.csv PascalCase convention. City names corrected (Belgaum→Belagavi, Kalburgi→Kalaburagi). Final stats: 7,298 leads, 6,366 with phone (87.2%), 932 missing (12.8%). All Phase 1 Hubli niches confirmed READY. |
---

## FortuneMarq System DNA
> This section is present in every context file. It ensures every Claude session — regardless of folder — understands the full interconnected system.

### Business
- **Legal Name:** FortuneMarq Media & Marketing
- **Brand:** FortuneMarq | **Tagline:** Marketing That Pays You Back
- **Address:** Galaxy Mall, First Floor, Shop No. 43, J.C Nagar, Hubli — 580020
- **CRM/OS:** fmos.fortunemarq.com | **Website:** fortunemarq.com
- **Contact:** fortunemarq@gmail.com | +91 93530 82656

### Team
| Person | Role | Status |
|---|---|---|
| Jabeer | Founder — strategy, sales, closing, all tech | Active |
| Afifa | Telecaller — calls, outcomes, PDF delivery, meeting booking | Hired, not started |
| Zaid | Website builder — Antigravity builds, task execution | Training |
| Sufiyan | Website builder — Antigravity builds, task execution | Training |

### The Full System Map
```
07_DATA_AND_RESEARCH
  → feeds → 06_PAID_MARKETING + 03_SALES_SYSTEM
06_PAID_MARKETING
  → feeds → 01_CRM_AND_TOOL (inbound leads)
03_SALES_SYSTEM
  → feeds → 01_CRM_AND_TOOL (pipeline) + 04_CLIENT_MANAGEMENT
01_CRM_AND_TOOL (FMOS — central nervous system)
  → feeds → 02_SERVICE_DELIVERY_AUTOMATION + 04_CLIENT_MANAGEMENT + 08_FINANCE
02_SERVICE_DELIVERY_AUTOMATION
  → feeds → 04_CLIENT_MANAGEMENT (delivery) + 08_FINANCE (invoicing triggers)
04_CLIENT_MANAGEMENT
  → feeds → 08_FINANCE (renewals) + 03_SALES_SYSTEM (upsells back to pipeline)
05_FORTUNEMARQ_ONLINE_PRESENCE
  → feeds → 06_PAID_MARKETING (brand trust) + 03_SALES_SYSTEM (inbound leads)
08_FINANCE ← receives from all service delivery and client management
09_LEGAL_AND_OPERATIONS ← supports 03_SALES_SYSTEM + 04_CLIENT_MANAGEMENT
10_PERSONAL_GROWTH ← supports Jabeer across all folders
```

### Master Flow
```
Data (L0) → Campaign → Lead in FMOS → 3-Touch Outreach → Meeting
→ Proposal → Agreement → Invoice → Onboarding → Delivery
→ Monthly Report → Health Score → Upsell → Renewal
```

### Content Build Hierarchy (current progress)
- L0 Niche Data Reference Sheet — COMPLETE
- L1 Lead CSV Files + PDF Index — COMPLETE
- L2 Telecaller Scripts — COMPLETE — 4 lead-type JSON files in FMOS_Script_Data/
- L3 WhatsApp Templates — COMPLETE — 17 templates in 5 JSON files in FMOS_Template_Data/
- L4a Proposal Template — COMPLETE — 5-6 page dynamic PDF, JSON schema in FMOS_Proposal_Data/
- L4b Agreement Document — COMPLETE — 1-page doc, service terms, payment policy
- L5 SOPs + Onboarding — COMPLETE — onboarding_checklists.json + onboarding_sop.md
- L6 Report Templates + Health Score — PENDING
- L7 Upsell System — PENDING

### Tech Stack
- CRM: Next.js 16, TypeScript, Tailwind CSS v4, Supabase
- Hosting: Hostinger → fmos.fortunemarq.com
- Builds: Antigravity | AI: Claude Pro + Claude Code
- Design: Canva | Task Queue: Celery + Redis (planned)

### Revenue Targets
- ₹50K MRR → End April/May 2026
- ₹1L MRR → Month 4–5
- ₹2L MRR → Hiring trigger
- ₹5L MRR → 2-year vision

### Niche Attack Order (Phase 1 — Hubli-Dharwad)
1. **Gyms (30,000/mo) — ✅ READY** — 84% phone coverage, fully standardised
2. **Skin Clinics (7,500/mo) — ✅ READY** — 79% phone coverage, fully standardised
3. **Computer Training (7,500/mo) — ✅ READY** — 94% phone coverage
4. **Dental (3,900/mo) — ✅ READY** — 99% phone coverage
5. **JEE/NEET Coaching (2,550/mo) — ✅ READY** — 100% phone coverage
6. **Car Rentals (2,550/mo) — ✅ READY** — 92% phone coverage

### Golden Rule
Every decision made in any folder must be considered in context of the full system. If a decision affects another folder — note it and update that folder's context too.

### How to Use This File
- **Start session:** "Read CONTEXT.md and continue."
- **End session:** "Update CONTEXT.md with everything we decided today."
