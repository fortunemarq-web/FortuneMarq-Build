> **Current status (2026-06-17):** FMOS is **deployed \& live**. WhatsApp Cloud API is live with **33 Meta-approved templates** (source of truth: `01_CRM_AND_TOOL/fmos/WHATSAPP_TEMPLATES_FINAL.md` + `templates_final.json`). The **"curiosity" teaser flow is removed** — the type-matched PDF is now sent immediately as the **Direct Report**. Booking = Google Calendar/Meet (not Zoom/Calendly). Any obsolete notes below are kept for history.

# 03 — Telecaller Scripts
**Last Updated:** 2026-04-29 | **Status:** COMPLETE — 4 type-based JSON scripts live in FMOS. Real search volumes wired. All content reflects April 2026 review. Ready for Afifa to use once FMOS is deployed.

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

### Script Structure (all 4 types — 7 steps)
1. **Introduction** — Name, FortuneMarq Media & Marketing, based in [City].
2. **Language Preference** — Kannada / Hindi / English — whatever is comfortable.
3. **Permission to Speak** — "2 minutes — we did market research for [Niche] in [City], is this a good time?" Objections: Busy → offer callback hour/evening; Not interested → ask why they don't want digital marketing.
4. **Data Hook** — Type-specific: [Search Volume] monthly searches + what it means for their situation. Real number auto-populated from `market_insights` table via `searchVolumeMap` in FMOS.
5. **The Gap** — Type-specific: who's capturing demand vs who's invisible. A: reinforce position; B: site but no visibility; C: GMB-only, search demand going to competitors; D: low volume, zero competition, high-intent buyers.
6. **How We Fit In** — Own website, own Google ranking, own enquiries. Not JustDial, not directories. Full system managed for them.
7. **Meeting Ask** — Our founder personally does a 15–20 min Zoom call (joinable from phone). Built for their business in [City]. No commitment. Book date + send Zoom link on WhatsApp. Objections: pricing (no fixed rates, founder decides per business), tried before (full system first, not just ads), owner unavailable (WhatsApp PDF first), send on WhatsApp (send PDF + follow up in 2 days), let me think (no pressure), internal team (offer as second opinion).

### Key Language (locked in all 4 scripts)
- "our founder" — never "Jabeer" in Afifa's spoken script
- "Zoom call" — never "Google Meet" or "30–45 min meeting"
- Busy response: "No problem at all. Can I call you back in an hour or later this evening?"
- Not interested response: "No worries. Mind if I ask — is there a specific reason you don't want to do digital marketing for your business?"
- Pricing response: "We don't have fixed prices — our founder first understands your business, what you actually need, and how much you can benefit from the work. Pricing is decided based on that."

### Call Outcomes (9 total)
| ID | Label | Category |
|---|---|---|
| INTERESTED_BOOK_NOW | Interested — Book Meeting Now | INTERESTED |
| INTERESTED_FOLLOW_UP_LATER | Interested — Follow Up Later | INTERESTED |
| INTERESTED_SEND_INFO | Interested — Send More Info First | INTERESTED |
| NOT_INTERESTED | Not Interested (reason required, 6 options) | NOT_INTERESTED |
| FOLLOW_BACK | Follow Back Later | FOLLOW_BACK |
| WRONG_NUMBER | Wrong Number / Dead Lead | DEAD |
| GATEKEEPER | Gatekeeper — Owner Unavailable | FOLLOW_BACK |
| NO_ANSWER | No Answer / Not Reachable (4 sub-options) | FOLLOW_BACK |
| LANGUAGE_BARRIER | Language Barrier — Flag for Jabeer | FOLLOW_BACK |

### WhatsApp Templates (postCallWhatsApp — 5 per script)
| templateId | Trigger | Description |
|---|---|---|
| meeting_booked | INTERESTED_BOOK_NOW | Zoom link + date/time confirmation |
| send_pdf | INTERESTED_SEND_PDF | PDF attachment + Zoom call invite |
| follow_back | INTERESTED_CALLBACK | Follow-up date + PDF |
| follow_back_report_sent | INTERESTED_CALLBACK | For leads who already have the PDF |
| send_portfolio | INTERESTED_SEND_PDF | Portfolio link variant |

## What's Pending
- FMOS deployment — once live, Afifa can start using scripts in TelecallerCockpit (/sales)
- Script JSON changes require `rm -rf .next && npm run dev` to bust Next.js module cache
- WhatsApp template seeding into Supabase `whatsapp_templates` table (Phase D)
- Script content is complete and live in FMOS. No further script writing needed.

## What's Blocked
- FMOS is deployed & live; scripts are live in the cockpit (`/sales`)
- Afifa has not started yet (hired; onboarding pending)

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
| 2026-04-29 | All 4 JSON files (A/B/C/D) updated in fmos/lib/data/scripts/: "Jabeer" → "our founder" everywhere; 7-step structure (added Language Preference as Step 2); meeting ask rewritten as 15–20 min Zoom call; permission step objections rewritten; pricing objection rewritten; 9 outcomes; 2 new WhatsApp templates (follow_back_report_sent, send_portfolio). Real search volumes now live in scripts via searchVolumeMap from market_insights table. |
| 2026-06-08 | Added 3 missing outcomes to all 4 JSON files: GATEKEEPER (owner unavailable — FOLLOW_BACK), NO_ANSWER (not reachable, 4 sub-options — FOLLOW_BACK), LANGUAGE_BARRIER (flag for Jabeer — FOLLOW_BACK). CONTEXT.md outcome table corrected: IDs now match actual JSON (INTERESTED_FOLLOW_UP_LATER, INTERESTED_SEND_INFO, not _CALLBACK/_SEND_PDF). All 4 files now have 9 outcomes. |
