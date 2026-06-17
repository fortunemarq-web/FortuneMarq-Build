# 03 — Sales System
**Last Updated:** 2026-06-17 | **Status:** Content COMPLETE and LIVE in FMOS. FMOS is deployed; outbound is running. **WhatsApp Cloud API is LIVE** on dedicated number **+91 79759 18980** (93530 82656 stays in the WhatsApp Business app). **All 33 WhatsApp templates are submitted AND APPROVED by Meta** (source of truth: `01_CRM_AND_TOOL/fmos/WHATSAPP_TEMPLATES_FINAL.md` + `03_SALES_SYSTEM/WhatsApp_Templates/FMOS_Template_Data/templates_final.json`). Outbound Stage 3 (Direct Report send + tracking, outcome auto-sends, Google Calendar/Meet booking) and the AI bot (6.1) are built and live. Inbound leads auto-arrive in the cockpit (round-robin + notified) via the Phase F inbound engine; cockpit quick-add has a source picker.

> Ground truth for build state: `00_MASTER/FMOS_System_Design_And_Tasks.md` (newest dated entries) + `00_MASTER/FMOS_Execution_Roadmap.md`. NOTE: the "curiosity message" teaser step has been **removed** — the type-matched PDF report is now sent **immediately** as the "Direct Report" (with action buttons), not after a teaser.

## Folder Purpose
Plan and create everything related to acquiring clients — telecaller scripts, WhatsApp templates, proposals, agreements, and the outreach sequence. This folder is the content layer for the sales function. The execution happens in FMOS (01_CRM_AND_TOOL). The content lives here.

## The Sales Flow
Direct Report WhatsApp send (type-matched PDF + buttons, immediate) → Replied leads tagged as priority → Inbound leads from ads/bot → Cold call queue (Afifa works through FMOS) → outreach → Meeting booked with our founder (Jabeer) via Google Calendar/Meet → Founder closes → Proposal sent (FMOS-generated PDF) → Agreement confirmation (WhatsApp/email reply) → Invoice → Work starts

## Lead Priority in FMOS Queue
1. Replied to the Direct Report / engaged with the bot (highest priority)
2. Inbound from paid ads (landing page form fills)
3. Cold leads from CSV (standard queue)

## The Outreach Sequence
- Step 1: **Direct Report** — the type-matched market-intel PDF (A/B/C/D) sent over WhatsApp immediately with action buttons. (The old "curiosity teaser" step is removed.)
- Step 2: Replies handled by the AI bot (6.1) or a telecaller; follow-up call.
- Step 3: Goal is booking a 15–20 min **Google Meet** call with our founder (Jabeer) — booked via the Google Calendar/Meet integration, not Calendly/Zoom.

## Script Architecture — Type-Based (Not Niche-Based)
FMOS auto-detects lead type from CSV columns and loads the matching script.

| Type | Condition | Situation | PDF Used |
|---|---|---|---|
| A | SERP_Ranked = Y | Already ranking on Google | Type 1 — Visibility Report |
| B | Has_Website = Y, SERP_Ranked = N | Has website, not ranking | Type 3 — Website Performance |
| C | Has_Website = N, SERP_Ranked = N | No website, GMB only | Type 2 — Market Opportunity |
| D | Low search volume niche/city | Limited direct search demand | Type 4 — Niche Market Report |

## Content Build Status

| Level | Content | Status | Location |
|---|---|---|---|
| L0 | Niche Data Reference Sheet | COMPLETE | `07_DATA_AND_RESEARCH/Niche_Data_Reference_Sheet.md` |
| L1 | Lead CSV Files + PDF Index | COMPLETE | `07_DATA_AND_RESEARCH/Lead_Database/Hubli_Final/` |
| L2 | Telecaller Scripts | COMPLETE | `Telecaller_Scripts/FMOS_Script_Data/` (4 JSON files) |
| L3 | WhatsApp Templates | COMPLETE — 33 approved | `WhatsApp_Templates/FMOS_Template_Data/templates_final.json` (33 templates, the source of truth). The older split JSONs (curiosity/bot_reply/outcome/etc.) are **superseded**. |
| L4a | Proposal Template | COMPLETE | `Proposals/FMOS_Proposal_Data/` (schema, services data, types) |
| L4b | Agreement Document | COMPLETE | `09_LEGAL_AND_OPERATIONS/Agreement_Templates/` |
| L5 | SOPs + Onboarding | COMPLETE | `04_CLIENT_MANAGEMENT/Onboarding/FMOS_Onboarding_Data/` |
| L6 | Report Templates + Health Score | COMPLETE | `04_CLIENT_MANAGEMENT/Monthly_Reports/FMOS_Report_Data/` |
| L7 | Upsell System | COMPLETE | `04_CLIENT_MANAGEMENT/Upsell_System/FMOS_Upsell_Data/` |

## What Exists (Complete)

### Telecaller_Scripts/ folder
- `FMOS_Script_Data/script_type_A.json` — Full script JSON: already ranking on Google
- `FMOS_Script_Data/script_type_B.json` — Full script JSON: has website, not ranking
- `FMOS_Script_Data/script_type_C.json` — Full script JSON: no website, GMB only
- `FMOS_Script_Data/script_type_D.json` — Full script JSON: low search volume
- `FMOS_Script_Data/index.ts` — Script loader TypeScript utility
- `FMOS_Script_Data/script.types.ts` — TypeScript interfaces for script data structure
- `Hubli/` — Legacy per-niche script folder with 15 niche subfolders (English, Kannada, Kanglish variants — OLD architecture, replaced by type-based scripts)
- `Telecaller_Scripts_Review.docx` — Reviewed script document (April 2026)
- `FortuneMarq_Telecaller_Call_Flow.docx` — Complete call flow reference

### WhatsApp_Templates/ folder
- `FMOS_Template_Data/templates_final.json` — **SOURCE OF TRUTH**: all 33 Meta-approved templates (registered into FMOS via `/admin/whatsapp-templates` → "Register 33 Meta Templates"). Mirrors `01_CRM_AND_TOOL/fmos/WHATSAPP_TEMPLATES_FINAL.md`.
- `FMOS_Template_Data/whatsapp.types.ts` — TypeScript interfaces
- **Superseded (kept for history only):** the split draft JSONs — `curiosity_templates.json`, `bot_reply_templates.json`, `outcome_templates.json`, `followback_reminder_templates.json`, `post_meeting_templates.json`. The "curiosity" teaser flow no longer exists; use `templates_final.json`.

### Proposals/ folder
- `FMOS_Proposal_Data/proposal_schema.json` — Full 5–6 page proposal PDF schema
- `FMOS_Proposal_Data/services_data.json` — All 7 services with deliverables, timelines, what we need
- `FMOS_Proposal_Data/proposal.types.ts` — TypeScript types for proposal data
- `FMOS_Proposal_Data/index.ts` — Proposal loader with generateProposal(), calculateProposalTotals() helpers
- `FMOS_Proposal_Data/agreement_template.json` — Agreement document structure
- `Sample_Proposal_Gyms_Hubli_TypeB.pdf` — Sample proposal PDF for Gyms niche, Type B lead

### _project_files/ folder
- `MASTER_CONTEXT.md` — Master context for the folder
- `Niche_Data_Reference_Sheet.md` — All 6 priority niches: search volumes, competitor gaps, USPs

## What's Pending
- FMOS deployment — once live, all content gets loaded into the live CRM
- ✅ DONE — templates registered into FMOS from `templates_final.json` (`/admin/whatsapp-templates`).
- ✅ DONE — scripts wired to TelecallerCockpit; real search volumes from `market_insights` auto-populate `[Search Volume]` per lead via `searchVolumeMap`.
- ✅ DONE — WhatsApp Cloud API live; all 33 templates approved by Meta.
- Niche landing pages: still pending redesign + deploy on fortunemarq.com (see `05_FORTUNEMARQ_ONLINE_PRESENCE`). Bot/portfolio links that point to these pages wait on that.
- Remaining cities' leads: only Hubli is loaded (858 leads, 11 niches); bulk-import the rest via `/admin/bulk-import`.
- Per-niche scripts in `Hubli/` folder are legacy — the type-based `FMOS_Script_Data/` files are the live ones.

## What's Still Open (not blockers)
- Niche landing pages on fortunemarq.com (redesign + deploy).
- Loading non-Hubli city leads + reports.

## Connections to Other Folders
- **Content data goes INTO:** `01_CRM_AND_TOOL/FMOS_Change_Specs/data/` — all JSON files duplicated there for Antigravity use
- **Feeds FROM:** `07_DATA_AND_RESEARCH` — real search volume numbers used in all scripts and templates
- **Works WITH:** `09_LEGAL_AND_OPERATIONS` — agreement template lives there, referenced from proposals
- **Execution IN:** `01_CRM_AND_TOOL/fmos` — all content displayed and used through FMOS

## Key Decisions Made (Locked)
- Scripts are type-based (A/B/C/D) for the call flow. Note `pitch_type` (A/B/C/D, the stored report/pitch field on `leads`) is distinct from `lead_type` (outbound/inbound, the lead source).
- The Direct Report sends the type-matched PDF immediately (no curiosity teaser).
- **33 WhatsApp templates total, all Meta-approved** (supersedes the older 17/24/28 counts).
- Meta WhatsApp Business API required — not regular WhatsApp
- Tone: friendly, conversational, no pressure
- FortuneMarq branded as "FortuneMarq" only in messages (not full legal name — too long)
- Proposal pricing is entered manually by Jabeer per prospect — not fixed rates in proposal

## Session History
| Date | Summary |
|---|---|
| March 2026 | Context file created. Sales flow defined. Content hierarchy planned. |
| April 2026 | L2 Scripts complete — new type-based architecture (4 JSON files). L3 WhatsApp Templates complete — 17 templates across 5 files. L4a Proposal complete — schema + services data + TypeScript. L4b Agreement complete (in 09_LEGAL_AND_OPERATIONS). |
| 2026-04-28 | CONTEXT.md fully rewritten. All file inventory confirmed. Content hierarchy updated to reflect L6 and L7 also complete (in 04_CLIENT_MANAGEMENT subfolders). |
| 2026-04-29 | Scripts (A/B/C/D JSON files in fmos/lib/data/scripts/) updated: all "Jabeer" references → "our founder"; objection responses updated; 9 outcomes total; real search volumes auto-fill via searchVolumeMap. |
| 2026-06-17 | Doc-accuracy sweep. FMOS deployed & live; removed "blocked on deployment". WhatsApp Cloud API live (+91 79759 18980); 33 templates approved (was "17, type_d in review"). Curiosity teaser flow removed → Direct Report (immediate PDF + buttons). Booking = Google Calendar/Meet (was "Zoom"). Clarified pitch_type vs lead_type. Split template JSONs marked superseded by templates_final.json. |
