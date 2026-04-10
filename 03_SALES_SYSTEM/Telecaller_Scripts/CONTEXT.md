# 03 — Telecaller Scripts
**Last Updated:** April 2026 | **Status:** COMPLETE — 4 lead-type JSON scripts in FMOS_Script_Data/

## Purpose
All telecaller script content for Afifa. Scripts are loaded dynamically by FMOS based on lead type — not per-niche. FMOS auto-detects the lead type from the CSV columns and displays the matching script during the call.

## Architecture — NEW (April 2026)
Scripts are no longer per-niche. There are 4 lead-type variants that cover all niches. FMOS detects lead type from: `SERP_Ranked` and `Has_Website` columns in the lead CSV.

### Lead Type Detection Logic
| Type | Condition | Situation | PDF Referenced |
|---|---|---|---|
| A | SERP_Ranked = Y | Already ranking on Google | Type 1 — Visibility Report |
| B | Has_Website = Y, SERP_Ranked = N | Has website, not ranking | Type 3 — Website Performance |
| C | Has_Website = N, SERP_Ranked = N | No website, GMB only | Type 2 — Market Opportunity |
| D | Low search volume niche/city | Limited direct search demand | Type 4 — Niche Market Report |

## Script Structure (all 4 types — English)
1. **Introduction** — "Hi, my name is Afifa, I'm calling from FortuneMarq Media & Marketing — online growth system building agency, based in Hubli."
2. **Opening Hook** — "We conducted a market research for [niche] in [city] and we have some interesting data on how many people are actively searching on Google for services you offer. Do you have a minute to talk?"
3. **Data Hook** — Type-specific: monthly search volume + what it means for their current situation
4. **FOMO Point** — Type-specific: opportunity exists NOW before competitors get strong. Anchored in: today people search online first, online presence = trust. Phrase: "you have a good opportunity before your competitor gets strong"
5. **Differentiator** — Short: "We don't just run ads. We build a complete online growth system — presence, visibility, leads — all connected, built specifically for your business."
6. **Meeting Ask** — 30–45 min Google Meet with Jabeer (founder). Presentation built for their business. Valuable even if they don't sign. No pressure, no commitment.

## Objections Bank (per step)
- After Step 2 (Opening): Busy right now / Not interested / Who are you
- After Step 3 (Data Hook): Numbers not real / Already have enough customers / (Type C: We rely on word of mouth)
- After Step 6 (Meeting Ask): How much does it cost / We tried before / Owner not here right now / Just send on WhatsApp / Let me think about it / We handle marketing internally

## Call Outcomes
- **INTERESTED** → Sub-options: Book Meeting Now / Follow Up Later / Send More Info
- **NOT INTERESTED** → Reason required (6 options) → Mark Cold or Dead
- **FOLLOW BACK** → Date + time + note → auto-reminder in FMOS
- **WRONG NUMBER / DEAD** → Mark dead → cleanup queue

## Script Files for Code
Location: `Telecaller_Scripts/FMOS_Script_Data/`
- `script_type_A.json` — Already ranking on Google
- `script_type_B.json` — Has website, not ranking
- `script_type_C.json` — No website, GMB only
- `script_type_D.json` — Low search volume
- `script.types.ts` — TypeScript interfaces for the script data structure
- `index.ts` — Script loader utility (`getScriptForLead(lead)` function returns matching script)

## Old Files (Superseded)
The `Hubli/` subfolder contains old per-niche Kanglish and Kannada .md script files. These are superseded by the new type-based JSON architecture. Do not use for Afifa — FMOS will load from FMOS_Script_Data/ instead.

## Session Log
| Date | Summary |
|---|---|
| March 2026 | Context file created. Waiting on L1 completion before writing scripts. |
| 2026-04-01 | Full script architecture redesign. 4 lead-type English variants created. 6-step structure: Introduction → Opening Hook (market research angle) → Data Hook (type-specific volumes) → FOMO Point (opportunity before competitors, today people search online first) → Differentiator (complete online growth system, not just ads) → Meeting Ask (Jabeer, founder, 30-45min, presentation, valuable even without signing). Objections bank mapped per step. 4 call outcomes with sub-options. JSON data files + TypeScript types + loader created in FMOS_Script_Data/. |

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
- Design: Canva

### Revenue Targets
- ₹50K MRR → End April/May 2026
- ₹1L MRR → Month 4–5
- ₹2L MRR → Hiring trigger
- ₹5L MRR → 2-year vision

### Niche Attack Order (Phase 1 — Hubli-Dharwad)
1. Gyms (63,950/mo) 2. Skin Clinics (41,850/mo) 3. Computer Training (24,350/mo)
4. Dental (21,100/mo) 5. Car Rentals (16,450/mo) 6. JEE/NEET Coaching (12,300/mo)

### Golden Rule
Every decision made in any folder must be considered in context of the full system. If a decision affects another folder — note it and update that folder's context too.

### How to Use This File
- **Start session:** "Read CONTEXT.md and continue."
- **End session:** "Update CONTEXT.md with everything we decided today."
