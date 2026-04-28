# CurrentBlockers

**Last updated:** 2026-04-28  
**Tags:** #active #needs-review  
**Related:** [[FMOS]], [[TeamStructure]], [[FortuneMarq]], [[OpenDecisions]]

---

## Summary

As of 2026-04-28, FMOS is **production-ready (v4.5)**. All phases are complete. The only thing between FortuneMarq and its first paying client is deploying FMOS and getting Afifa on the phones.

## 🚀 FMOS Status — Production Ready

All phases complete. TypeScript strict build passes clean. Zero pending features. See [[FMOS]] for full feature list.

## Blocker 1 — FMOS Not Yet Deployed (CRITICAL PATH)

FMOS is complete and running on localhost but not yet live on fmos.fortunemarq.com. Until this ships:
- 8,000 Hubli leads cannot be uploaded
- Afifa cannot start calling
- The outbound sales machine is offline
- Revenue is impossible

**Deployment checklist:**
- [ ] Add `OPENROUTER_API_KEY` to Hostinger env vars
- [ ] Point `fmos.fortunemarq.com` subdomain DNS to Hostinger
- [ ] Create accounts: Afifa (telecaller), Zaid (staff), Sufiyan (staff)
- [ ] Upload 8,000 Hubli leads CSV
- [ ] Enter real client data and run smoke test
- [ ] Activate GST invoice settings

## Blocker 2 — Antigravity Team Access

Zaid and Sufiyan cannot build client websites until Jabeer upgrades from personal to team plan on Antigravity. Low urgency until first clients are signed, but needs to happen before the first website delivery.

## ✅ Resolved Blockers

- ~~6 FMOS features pending~~ → All phases complete as of 2026-04-28
- ~~Phase C, D, E not built~~ → All done, production-ready v4.5

## Next Tasks — Priority Order

1. **Deploy FMOS to Hostinger** — this is the only thing that matters right now
2. Create team accounts and upload 8,000 Hubli leads
3. Onboard Afifa — walk through FMOS, start call queue
4. Upgrade Antigravity to team plan for Zaid/Sufiyan
5. Deploy niche landing pages to fortunemarq.com
6. Launch Meta/Google campaigns (after first 2 weeks of calling)

## Open Questions

- [ ] Hostinger deployment plan — Node.js hosting or VPS?
- [ ] When does Afifa officially start?

## Sources

- [[raw/2026-04-28_fmos-production-ready]]
- [[raw/2026-04-28_open-decisions-blockers]]
