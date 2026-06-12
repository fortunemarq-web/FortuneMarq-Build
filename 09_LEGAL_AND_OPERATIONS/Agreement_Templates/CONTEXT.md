# 09 — Agreement Templates
**Last Updated:** 2026-04-28 (revised: FMOS production-ready v4.5) | **Status:** COMPLETE — agreement_template.md + service_terms.json ready

## Folder Purpose
Store the client service agreement template and service-specific terms. The agreement is the closing document sent to clients after verbal/message confirmation. It is 1 page, sent via WhatsApp or email, confirmed by client reply.

## What Exists (Complete)

| File | Description |
|---|---|
| `agreement_template.md` | The actual agreement document text (what the client receives). All {{variables}} marked for FMOS substitution: {{agreementNumber}}, {{proposalNumber}}, {{agreementDate}}, {{businessName}}, {{ownerName}}, {{city}}, {{service_n_name}}, {{service_n_setup}}, {{service_n_monthly}}, {{totalSetupFee}}, {{totalMonthlyRetainer}} |
| `service_terms.json` | Service-specific terms for all 7 services: WEBSITE, GMB, SEO, GOOGLE_ADS, META_ADS, WHATSAPP_MARKETING, AI_AUTOMATIONS — plus universal terms and exit policy |
| `CONTEXT.md` | This file |

## Agreement Document Summary
**Header:** FortuneMarq branding, address, contact info
**Agreement number + proposal reference**
**Parties:** FortuneMarq (Jabeer) and [Client Business] (Owner Name)
**Services table:** Service name, setup fee, monthly retainer per row
**Payment terms:** Setup fee before work, monthly invoice 1st/due 5th, overdue consequences
**Key rules:** 30-day exit notice, asset handover on exit
**Confirmation:** "Reply 'Yes, confirmed' or 'Confirmed' to start"

## Service Terms Summary (`service_terms.json`)
**Universal Terms (apply to all services):**
- Work starts only after setup fee received
- Monthly invoices raised 1st, due by 5th
- 7 days overdue: ads paused; 30 days overdue: website offline
- No guaranteed results (market conditions, competition, client cooperation)
- Client provides accurate info and assets on time
- 30-day exit notice, monthly fees pro-rated

**Per-Service Terms cover:**
- WEBSITE: 2 revision rounds, go-live only after Jabeer review + client approval, scope changes quoted separately
- GMB: Client must have verified profile, 4 posts/month, review management, client must not make changes without informing us
- SEO: Results timeline (60–90 days), client must not make website changes without informing us
- GOOGLE_ADS: Ad spend is client's budget, FortuneMarq charges management fee only
- META_ADS: Creative approval required before launch, FortuneMarq manages all creatives
- WHATSAPP_MARKETING: Client provides opt-in contact list, FortuneMarq manages templates
- AI_AUTOMATIONS: Scoped per project, separate agreement per automation built

## What's Pending
- FMOS Phase D: Build agreement generation flow (from proposal → generate agreement → send → log confirmation)
- FMOS_Change_Specs/data/agreement_template.json is the FMOS-compatible version (already created)

## What's Blocked
- Agreement generation blocked on FMOS Phase D
- No agreements signed yet (no clients)

## Connections to Other Folders
- **FMOS version:** `01_CRM_AND_TOOL/FMOS_Change_Specs/data/agreement_template.json`
- **Referenced from:** `03_SALES_SYSTEM/Proposals/FMOS_Proposal_Data/` — proposals link to agreement
- **Triggers:** `04_CLIENT_MANAGEMENT/Onboarding/` — agreement confirmation triggers onboarding checklist
- **Payment terms reference:** `09_LEGAL_AND_OPERATIONS/Business_Policies/payment_and_cancellation_policy.md`

## Key Decisions Made (Locked)
- No physical signature required — WhatsApp/email reply "Confirmed" is sufficient
- Agreement number: AGR-2026-001 format (FMOS auto-increments)
- Always references proposal number so both documents link together
- Service terms displayed in FMOS proposal flow; brief version in agreement

## Session History
| Date | Summary |
|---|---|
| March 2026 | Folder created. Agreement template not yet written. |
| 2026-04-02 | agreement_template.md created. service_terms.json created for all 7 services + universal terms + exit policy. |
| 2026-04-28 | CONTEXT.md fully rewritten with file contents documented. |
