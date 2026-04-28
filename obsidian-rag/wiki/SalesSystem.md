# SalesSystem

**Last updated:** 2026-04-28  
**Tags:** #active #project  
**Related:** [[FortuneMarq]], [[TeamStructure]], [[HubliLeadDatabase]], [[ServiceOfferings]], [[FMOS]]

---

## Summary

FortuneMarq's sales system is a 3-touch outreach sequence executed by Afifa (telecaller) and closed by Jabeer (founder). Every component — scripts, WhatsApp templates, proposals, agreements — is fully built and loaded into FMOS data files. The system cannot launch until FMOS is live.

## The 3-Touch Outreach Sequence

1. **Pre-call WhatsApp (Curiosity message):** Sent before the call to warm the lead — references their specific gap (visibility, ranking, competition)
2. **Call (Afifa):** Follows one of 4 script variants based on lead type (A/B/C/D). Goal: qualify, create interest, book a meeting with Jabeer
3. **Post-call WhatsApp:** Outcome-triggered — sends relevant PDF + next step based on what happened on the call

## Script Variants (L2 — Complete)

| Type | Condition | Angle |
|------|-----------|-------|
| A | Lead already ranked on Google | Reinforce dominance, expand |
| B | Has website, not ranking | Fix what's broken |
| C | No website | Start from scratch — you're invisible |
| D | Low search volume | Different market angle |

Scripts include full call flow, objection handling, and closing technique. JSON data files in `FMOS_Script_Data/` — loaded directly into FMOS.

## WhatsApp Templates (L3 — Complete)

17 templates across 5 categories:
1. **Curiosity messages** (pre-call warmup)
2. **Bot reply templates** (auto-responses to inbound messages)
3. **Outcome-triggered messages** (post-call, based on outcome logged in FMOS)
4. **Follow-back reminders** (when to re-contact unresponsive leads)
5. **Post-meeting templates** (after Jabeer's meeting — follow-up, proposal link)

JSON files in `FMOS_Template_Data/` — ready for Meta WhatsApp API integration.

## Proposal System (L4 — Complete)

Dynamic 5–6 page PDF. Jabeer enters services and pricing in FMOS; client data auto-fills. Generated via @react-pdf/renderer. JSON schema in `FMOS_Proposal_Data/`.

## Agreement (L4 — Complete)

1-page client-facing document. Service-specific terms + payment/cancellation policy. Sent via WhatsApp/email; signed by client reply.

## Onboarding (L5 — Complete)

21-item checklist per service type covering: logo/domain/content/hosting asset collection, team task assignment, kickoff call. JSON in `onboarding_checklists.json`. 10-step SOP for Jabeer.

## What's Still Pending

- **L6 (Report Templates + Health Score):** Monthly auto-generated PDF reports for clients. Health score = payment timeliness + communication + results + tenure + upsell potential.
- **L7 (Upsell System):** Trigger-based upsell scripts (e.g., GMB → Google Ads after 50 calls/month).

## Open Questions

- [ ] WhatsApp API (Meta Business API) vs WhatsApp Business Account — which to use for automation?

## Sources

- [[raw/2026-04-28_business-model-pricing]]
- [[raw/2026-04-28_data-assets]]
