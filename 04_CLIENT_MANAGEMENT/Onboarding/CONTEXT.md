# 04 — Client Onboarding
**Last Updated:** 2026-04-28 (revised: FMOS production-ready v4.5) | **Status:** COMPLETE — onboarding_checklists.json + onboarding.types.ts + index.ts + onboarding_sop.md all created

## Folder Purpose
Define the exact onboarding process — what happens the moment a client signs, what assets are collected, how the project is set up in FMOS, and how work begins within 48 hours.

## What Exists (Complete)

### FMOS_Onboarding_Data/ folder
| File | Description |
|---|---|
| `onboarding_checklists.json` | Full per-service onboarding checklists for all 7 services: WEBSITE, GMB, SEO, GOOGLE_ADS, META_ADS, WHATSAPP_MARKETING, AI_AUTOMATIONS. Each service has tasks (with owner, due_by, status) and assets (with required flag, status) |
| `onboarding.types.ts` | TypeScript interfaces: OnboardingTask, OnboardingAsset, ServiceOnboarding, ClientOnboarding, OnboardingStatus |
| `index.ts` | Loader: generateClientOnboarding(clientId, services[]), isOnboardingComplete(checklist), getMissingRequiredAssets(checklist), getOverdueTasks(checklist) |

### Root Files
| File | Description |
|---|---|
| `onboarding_sop.md` | Full 10-step onboarding SOP for Jabeer: welcome message, kickoff call, brief form, asset collection, project setup in FMOS, task assignment to cousins, timeline by service, asset vault guide, common problems + solutions |
| `CONTEXT.md` | This file |

## Onboarding Process (10 Steps)
1. Agreement confirmed → Welcome message sent (WhatsApp template from L3)
2. Invoice raised for setup fee → paid before work starts
3. Kickoff call scheduled + completed (30 min)
4. Brief form filled (in FMOS or shared link)
5. Assets collected (logo, photos, domain, hosting, GMB access etc.)
6. Assets stored in FMOS Asset Vault per service
7. Project set up in FMOS — tasks created from onboarding_checklists.json
8. Tasks assigned: website tasks to Zaid/Sufiyan, strategy tasks to Jabeer
9. Work begins — delivery within stated timeline per service
10. Day 7 check-in with client (WhatsApp)

## Standard Timeline by Service
- Website: 7–10 working days from brief approval
- GMB: Setup week 1; results visible 30–60 days
- Google Ads: Campaign live within 3–5 working days
- Meta Ads: Creative review + launch within 5–7 working days
- SEO: Strategy in week 1; first results 60–90 days
- WhatsApp Marketing: Setup + first broadcast within 5 days
- AI Automations: Scoped per project

## What's Pending
- FMOS Phase D: Build Onboarding Tab in client profile (`/admin/clients/[id]`) using these JSON files
- Asset Vault UI in FMOS: track asset collection status per service
- Welcome message auto-trigger in FMOS when client status changes to onboarding
- Note: Most local clients provide logo, services description, photos only — domain/hosting often handled by FortuneMarq

## What's Blocked
- Execution blocked on FMOS deployment

## Connections to Other Folders
- **JSON files copied to:** `01_CRM_AND_TOOL/FMOS_Change_Specs/data/` — for Antigravity Phase D
- **Triggered by:** Agreement confirmation in FMOS (from `09_LEGAL_AND_OPERATIONS/Agreement_Templates/`)
- **Feeds into:** `02_SERVICE_DELIVERY_AUTOMATION` (delivery tasks start once onboarding complete)

## Key Decisions Made (Locked)
- Work begins only after setup fee received — no exceptions
- All assets collected within 48 hours target (or work cannot start)
- Onboarding tasks auto-created in FMOS from checklists when client is onboarded
- Asset vault per service — client must supply minimum required assets for each service

## Session History
| Date | Summary |
|---|---|
| March 2026 | Folder created. Asset checklist and process defined. Waiting on L4b agreement. |
| 2026-04-02 | L5 complete. All FMOS_Onboarding_Data/ files created. onboarding_sop.md written. |
| 2026-04-28 | CONTEXT.md fully rewritten to reflect actual file inventory. |
