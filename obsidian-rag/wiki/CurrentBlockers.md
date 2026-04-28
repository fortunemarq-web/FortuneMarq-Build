# CurrentBlockers

**Last updated:** 2026-04-28  
**Tags:** #active #needs-review  
**Related:** [[FMOS]], [[TeamStructure]], [[FortuneMarq]], [[OpenDecisions]]

---

## Summary

As of April 2026, FortuneMarq is in final build phase. Three blockers stand between the current state and launch. The FMOS deployment is the critical path — everything else cascades from it.

## Blocker 1 — FMOS Not Deployed (CRITICAL)

FMOS is ~90% complete and running on localhost:3000 but not yet live on fmos.fortunemarq.com. Until this is resolved:
- 8,000 Hubli leads cannot be uploaded
- Afifa cannot start calling
- The entire outbound sales machine is offline
- No revenue is possible

**To deploy:** Finish the 6 pending features (see below), then run the deployment checklist in [[FMOS]].

## Blocker 2 — FMOS Phases C, D, E Not Yet Executed

Phases A and B are complete. Three phases remain, all fully spec'd and waiting for Antigravity execution:

**Phase C — Outreach & Leads:**
- Outreach Sequence Board (3-touch tracker per lead)
- Lead Profile Page (full history: calls, WhatsApp, PDFs, proposals, meetings)
- PDF Delivery Tracker (log which PDF sent, when, by whom)

**Phase D — Proposal & Onboarding:**
- Retainer Package System (service tier tagging + upsell flags)
- Proposal builder + Agreement integration

**Phase E — Finance & Forecast:**
- Revenue Forecast Widget (pipeline × close rate = projected MRR)
- Upsell Tracker (current package, eligible upgrades, last attempt, outcome)

Note: L6 (Monthly Reports) and L7 (Upsell System) data files are already complete in `04_CLIENT_MANAGEMENT/`. They just need wiring into FMOS via Phase D/E.

## Blocker 3 — Antigravity Team Access

Zaid and Sufiyan cannot build client websites until Jabeer upgrades from personal to team plan on Antigravity. This doesn't block revenue but does block website delivery capacity.

## Next Immediate Tasks (Priority Order)

1. Build the 6 pending FMOS features
2. Deploy FMOS to fmos.fortunemarq.com on Hostinger
3. Create team accounts (Afifa, Zaid, Sufiyan) in FMOS
4. Upload 8,000 Hubli leads CSV to FMOS
5. Onboard Afifa and start call queue
6. Finalize Dharwad lead data and run PDF pipeline
7. Build 13–14 landing pages for Phase 1 niches
8. Launch Meta/Google campaigns (LAST — only after system is fully live)

## Open Questions

- [ ] Which of the 6 pending features is fastest to build?
- [ ] Estimated time to full deployment?

## Sources

- [[raw/2026-04-28_open-decisions-blockers]]
- [[raw/2026-04-28_fmos-crm]]
