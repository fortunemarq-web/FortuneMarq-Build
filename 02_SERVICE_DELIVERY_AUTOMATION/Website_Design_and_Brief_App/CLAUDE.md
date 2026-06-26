# 02/Website_Design_and_Brief_App — Working guide

Plans for the intake system that converts a client's instructions into a **structured PRD + build
prompt + freelancer task assignments**. `CONTEXT.md` = inventory; this file = how to work here.

## How this connects to FMOS / the rest
- Feeds from the client **onboarding/website brief** captured in FMOS (the build-ready intake) — see `04_CLIENT_MANAGEMENT/Onboarding`.
- The `WEBSITE` service here is what clients buy — mirrored in the proposal builder (`01_CRM_AND_TOOL/fmos/lib/data/services_data.json`) and priced in `08_FINANCE/Pricing_Decisions` (landing page / standard / premium). Keep prices in sync with Finance + the bot's `pricing.md`.
- Output PRDs/build prompts become **tasks for outsourced freelancers in FMOS** (tasks/projects); delivery is tracked there, not here.

## Boundaries
- Planning/spec docs only. No client assets dumps or secrets — heavy media goes to Google Drive, linked.
