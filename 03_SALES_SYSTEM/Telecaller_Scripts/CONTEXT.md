# 03 — Telecaller Scripts
**Last Updated:** 2026-04-28 (revised: FMOS production-ready v4.5) | **Status:** COMPLETE — 4 type-based JSON scripts + TypeScript loader in FMOS_Script_Data/

## Folder Purpose
All telecaller script content for Afifa. Scripts are loaded dynamically by FMOS based on lead type — not per-niche. FMOS auto-detects the lead type from the CSV columns and displays the matching script during the call.

## What Exists (Complete)

### FMOS_Script_Data/ — The Active Scripts (type-based architecture)
| File | Description |
|---|---|
| `script_type_A.json` | Script for leads already ranking on Google (SERP_Ranked = Y). References Type 1 Visibility PDF. Full 6-step flow with objections bank. |
| `script_type_B.json` | Script for leads with website but not ranking (Has_Website = Y, SERP_Ranked = N). References Type 3 Website Performance PDF. |
| `script_type_C.json` | Script for leads with no website, GMB only (Has_Website = N, SERP_Ranked = N). References Type 2 Market Opportunity PDF. |
| `script_type_D.json` | Script for leads in low search volume niches/cities. References Type 4 Niche Market Report PDF. |
| `index.ts` | TypeScript loader — getScript(leadType), getScriptStep(type, stepId), getObjections(type, stepId) |
| `script.types.ts` | TypeScript interfaces: ScriptLine, ScriptStep, ScriptFile, CallOutcome |

### Hubli/ — Legacy Per-Niche Scripts (15 niche subfolders)
Old architecture — per-niche, per-language scripts. Replaced by type-based FMOS_Script_Data/ architecture. Kept for reference only. Contains English/Kannada/Kanglish variants for: CarRentals, ComputerTraining, DentalClinics, Gyms, Hotels, IELTSCoaching, IVFClinics, InteriorDesigners, JEENEETCoaching, ModularKitchens, Physiotherapy, RealEstate, SkinClinics, TuitionCentres.

### Root Files
| File | Description |
|---|---|
| `Telecaller_Scripts_Review.docx` | Reviewed and finalized script document (April 2026) |
| `FortuneMarq_Telecaller_Call_Flow.docx` | Complete call flow document — all steps, outcomes, objections reference |
| `CONTEXT.md` | This file |

## Script Architecture

### Lead Type Detection Logic (FMOS auto-detects)
| Type | Condition | Situation |
|---|---|---|
| A | SERP_Ranked = Y | Already ranking on Google Page 1 |
| B | Has_Website = Y, SERP_Ranked = N | Has website, not ranking |
| C | Has_Website = N, SERP_Ranked = N | No website, GMB only |
| D | Low search volume niche/city | Limited direct search demand |

### Script Structure (all 4 types — English)
1. **Introduction** — "Hi, my name is Afifa, I'm calling from FortuneMarq Media & Marketing — online growth system building agency, based in [City]."
2. **Opening Hook** — "We conducted market research for [niche] in [city] and have interesting data on how many people are searching for services like yours. Do you have a minute?"
3. **Data Hook** — Type-specific: monthly search volume + what it means for their situation
4. **FOMO Point** — Type-specific: opportunity before competitors get strong; phrase: "you have a good opportunity before your competitor gets strong"
5. **Differentiator** — "We don't just run ads. We build a complete online growth system — presence, visibility, leads — all connected, built specifically for your business."
6. **Meeting Ask** — 30–45 min Google Meet with Jabeer (founder). Presentation built for their business. No pressure, no commitment.

### Objections Bank (per step)
- After Step 2: Busy right now / Not interested / Who are you
- After Step 3 (Data Hook): Numbers not real / Already have enough customers / (Type C: We rely on word of mouth)
- After Step 6 (Meeting Ask): How much does it cost / We tried before / Owner not here / Just send on WhatsApp / Let me think about it / We handle it internally

### Call Outcomes
- **INTERESTED** → Book Meeting Now / Follow Up Later / Send More Info
- **NOT INTERESTED** → Reason required (6 options) → Mark Cold or Dead
- **FOLLOW BACK** → Date + time + note → auto-reminder in FMOS
- **WRONG NUMBER / DEAD** → Mark dead → cleanup queue

## What's Pending
- Scripts are complete. Execution pending FMOS deployment and Afifa starting.
- FMOS Phase C (Outreach Board) will wire these scripts to the lead profile and sales cockpit
- Scripts seeded into Supabase `whatsapp_templates` table during Phase D (or referenced from JSON directly)

## What's Blocked
- Blocked on FMOS deployment
- Afifa has not started yet (hired but waiting on FMOS being live)

## Connections to Other Folders
- **JSON files copied to:** `01_CRM_AND_TOOL/FMOS_Change_Specs/data/` — for Antigravity to use in Phase C/D
- **Uses data from:** `07_DATA_AND_RESEARCH/Niche_Data_Reference_Sheet.md` — real search volume numbers referenced in Data Hook steps
- **Executed in:** `01_CRM_AND_TOOL/fmos/app/sales/` — Sales Cockpit where Afifa makes calls

## Key Decisions Made (Locked)
- Type-based scripts (A/B/C/D) — not per-niche — FMOS auto-detects from CSV
- Scripts in English (Afifa speaks English+Kannada — type as needed)
- Per-niche Hubli/ scripts are legacy and will not be used
- Script displayed step-by-step in FMOS during the call — not printed

## Session History
| Date | Summary |
|---|---|
| March 2026 | Folder created. Per-niche Hubli scripts written. |
| April 2026 | Architecture changed to type-based. 4 JSON files created in FMOS_Script_Data/. TypeScript loader written. Telecaller_Scripts_Review.docx reviewed and finalized. |
| 2026-04-28 | CONTEXT.md fully rewritten to reflect actual file inventory and current architecture. |
