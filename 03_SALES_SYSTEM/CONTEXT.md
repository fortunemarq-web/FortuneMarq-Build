# 03 — Sales System
**Last Updated:** 2026-06-12 | **Status:** COMPLETE through L4b. Scripts live in FMOS with real search volumes. Waiting on FMOS deployment (now Vercel) and bulk lead import to execute outreach. NEW 2026-06-12: inbound leads auto-arrive in the cockpit (round-robin assigned + notified) via the Phase F inbound engine; cockpit quick-add has a source picker; WhatsApp Cloud API webhook is Phase F Stage 1 (post-deploy) — see `01_CRM_AND_TOOL/fmos/PHASE_F_INBOUND_MARKETING.md`.

## Folder Purpose
Plan and create everything related to acquiring clients — telecaller scripts, WhatsApp templates, proposals, agreements, and the outreach sequence. This folder is the content layer for the sales function. The execution happens in FMOS (01_CRM_AND_TOOL). The content lives here.

## The Sales Flow
Curiosity WhatsApp mass send → Paid campaign runs simultaneously → Replied leads tagged as priority → Inbound leads from ads → Cold call queue (Afifa works through FMOS) → 3-touch outreach → Meeting booked with our founder (Jabeer) → Founder closes → Proposal sent (FMOS-generated PDF) → Agreement confirmation (WhatsApp/email reply) → Invoice → Work starts

## Lead Priority in FMOS Queue
1. Replied to WhatsApp curiosity message (highest priority)
2. Inbound from paid ads (landing page form fills)
3. Cold leads from CSV (standard queue)

## The 3-Touch Sequence
- Touch 1: WhatsApp curiosity message (mass send before calls begin, per lead type A/B/C/D)
- Touch 2: PDF report delivered (type-matched to lead's online presence situation)
- Touch 3: Follow-up call — goal is booking a 15–20 min Zoom call with our founder (Jabeer)

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
| L3 | WhatsApp Templates | COMPLETE | `WhatsApp_Templates/FMOS_Template_Data/` (17 templates, 5 files) |
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
- `FMOS_Template_Data/curiosity_templates.json` — 4 curiosity templates (one per lead type A/B/C/D)
- `FMOS_Template_Data/bot_reply_templates.json` — 4 bot reply templates (auto-sent when lead replies)
- `FMOS_Template_Data/outcome_templates.json` — 6 outcome-triggered templates
- `FMOS_Template_Data/followback_reminder_templates.json` — 1 follow-back reminder template
- `FMOS_Template_Data/post_meeting_templates.json` — 4 post-meeting templates (proposal/follow-up/agreement/invoice)
- `FMOS_Template_Data/whatsapp.types.ts` — TypeScript interfaces
- `FMOS_Template_Data/index.ts` — Template loader with getCuriosityTemplate(), fillTemplate() helpers

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
- WhatsApp template seeding: Phases D spec will seed templates from JSON files into Supabase `whatsapp_templates` table
- Script loading: ✅ DONE — scripts wired to TelecallerCockpit in FMOS. Real search volumes from `market_insights` table auto-populate `[Search Volume]` token per lead via `searchVolumeMap`.
- Meta WhatsApp Business API: must be purchased and connected to FMOS before templates go live
- Niche landing pages: must be live before bot reply templates can be sent (bot replies send landing page link)
- Per-niche scripts in `Hubli/` folder are legacy — the type-based FMOS_Script_Data/ files are the ones that matter

## What's Blocked
- All execution blocked on FMOS deployment
- WhatsApp templates blocked on Meta Business API activation
- Bot reply templates blocked on niche landing pages being live on fortunemarq.com

## Connections to Other Folders
- **Content data goes INTO:** `01_CRM_AND_TOOL/FMOS_Change_Specs/data/` — all JSON files duplicated there for Antigravity use
- **Feeds FROM:** `07_DATA_AND_RESEARCH` — real search volume numbers used in all scripts and templates
- **Works WITH:** `09_LEGAL_AND_OPERATIONS` — agreement template lives there, referenced from proposals
- **Execution IN:** `01_CRM_AND_TOOL/fmos` — all content displayed and used through FMOS

## Key Decisions Made (Locked)
- Scripts are type-based (A/B/C/D), not per-niche — FMOS auto-detects type from CSV columns
- Bot reply sends landing page link (not PDF) — avoids duplicate PDF send, drives to portfolio
- 17 WhatsApp templates total (not 28 — old count from before architecture was finalised)
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
| 2026-04-29 | Scripts (A/B/C/D JSON files in fmos/lib/data/scripts/) updated: all "Jabeer" references → "our founder"; meeting ask rewritten as 15–20 min Zoom call; objection responses updated (pricing, past-agency, busy, not-interested); 9 outcomes total; 2 new WhatsApp templates added (follow_back_report_sent, send_portfolio). Real search volumes now auto-fill in scripts via searchVolumeMap from market_insights table. |
