# 02 — Service Delivery Automation
**Last Updated:** 2026-06-17 | **Status:** NOT BUILT — still the planning layer. The CRM (01) is deployed & live, but the three standalone automation systems below are future work. Delivery today runs through FMOS Stage 4 (the delivery board at `/admin/clients/[id]` — milestones, tasks, Drive links, milestone-complete WhatsApp, proof vault), executed manually by **Jabeer + outsourced freelancers**.

> Ground truth for build state: `00_MASTER/FMOS_System_Design_And_Tasks.md` (newest dated entries) + `00_MASTER/FMOS_Execution_Roadmap.md`.

## Folder Purpose
Plan and build the three automation systems that power FortuneMarq's service delivery at scale. These systems allow the agency to serve 30–50 clients without proportionally increasing manual work. Every service has an automation layer. Clients are served through FMOS-triggered workflows, not manual coordination.

## The Three Systems

### 1. Website Design & Brief App
Brief intake → AI generates PRD + build prompts → outsourced freelancer builds → Jabeer reviews → Go-live
- Client fills brief form (in FMOS client portal or standalone form)
- AI generates structured PRD + build prompts from brief
- An outsourced freelancer executes build tasks assigned in FMOS
- Jabeer does final review before anything goes live
- GitHub Actions deploys to Hostinger automatically on approval

### 2. SEO Automation Engine
Audit → Keyword strategy → Git-based execution → DataForSEO rank tracking → Auto monthly reports
- DataForSEO API for rank tracking (~₹1,500/month for 30 clients)
- FMOS generates monthly SEO reports from rank data
- Scheduled tasks via Celery + Redis

### 3. Ads Automation Platform
Google Ads MCC + Meta Business Manager → AI campaign generation → Human approval → Auto-optimisation → Auto reports
- All client ad accounts managed under FortuneMarq MCC
- Campaign structure templates per niche
- Human approval gate before any changes go live
- Monthly reports auto-generated from API data

## Architecture Principles
- All three tools share one client database (FMOS/Supabase)
- Git as backbone — every website change versioned, auto-deployed via GitHub Actions to Hostinger
- Human approval gate before anything goes live
- Celery + Redis for scheduled automation jobs
- API cost estimate: ~₹8,200/month for 30 clients

## What Exists (Complete)

| File | Description |
|---|---|
| `Agency_OS_Master_Plan.docx` | Reference document — architecture overview for all three systems, cost estimates, build phases |
| `_project_files/Agency_OS_Master_Plan.docx` | Copy in _project_files |
| `_project_files/MASTER_CONTEXT.md` | Master context for the folder |
| Each subfolder has a `CONTEXT.md` only | No build files exist yet — all three systems are pre-build |

## What's Pending
- Website Brief App: not started — Phase 1 (Months 1–2 after FMOS deployed)
- Ads Automation: not started — Phase 2 (Months 3–4)
- SEO Automation Engine: not started — Phase 3 (Months 5–6)
- Full automation + unified reporting: Phase 4 (Months 7–8)
- SOPs (L5 in content hierarchy) must be written first — they are the blueprint for what gets automated

## What's Gating Build
- FMOS is deployed, so these are no longer blocked on the app — they're simply **not yet started** (delivery is run manually for now).
- SEO and Ads Automation are best justified once there are enough paying clients to cover the API costs.
- Website Brief App build capacity = Jabeer + an outsourced freelancer (no in-house dev team).

## Connections to Other Folders
- **Feeds FROM:** `01_CRM_AND_TOOL` (client data, task assignments trigger delivery), `04_CLIENT_MANAGEMENT` (onboarding completion triggers delivery start)
- **Feeds INTO:** `04_CLIENT_MANAGEMENT` (delivery status updates), `08_FINANCE` (delivery completion triggers invoice)
- **Depends ON:** L5 SOPs in `04_CLIENT_MANAGEMENT/Onboarding/onboarding_sop.md` — automation executes these SOPs

## Key Decisions Made (Locked)
- Git + GitHub Actions + Hostinger for website deployment — decided and locked
- Celery + Redis for scheduled jobs — decided, not yet built
- DataForSEO for rank tracking (not SEMrush — cost-efficient at scale)
- All client accounts managed under one MCC / Business Manager — never give clients admin access to ad accounts
- Human approval gate before any automation pushes live changes

## Session History
| Date | Summary |
|---|---|
| March 2026 | Context file created. Master plan document reviewed. Build phases confirmed. |
| 2026-04-28 | CONTEXT.md rewritten. Confirmed no build files exist yet. All three systems are pre-build. Blocked on FMOS deployment. |
| 2026-06-17 | Doc-accuracy sweep. FMOS now deployed & live, so "blocked on deployment" removed. Zaid/Sufiyan references replaced with "outsourced freelancer" (team = Jabeer + Afifa only). Clarified delivery currently runs through FMOS Stage 4 board, not these automation tools (still unbuilt). |
