# CurrentBlockers

**Last updated:** 2026-06-14  
**Tags:** #active #needs-review  
**Related:** [[FMOS]], [[TeamStructure]], [[FortuneMarq]], [[OpenDecisions]]

---

## Summary

As of 2026-06-14: **WhatsApp Cloud API is LIVE** (dedicated number +91 79759 18980, real message delivered). FMOS is feature-rich and tsc-clean but **not deployed** — deploy is gated on fixing a P0 auth gap found in QA. Authoritative current state: `01_CRM_AND_TOOL/fmos/HANDOFF_CONTINUE_ON_WINDOWS.md`.

## 🚦 FMOS Status — QA done, deploy GATED

Static QA complete (`fmos/FMOS_QA_VERIFICATION_2026-06-13.md`). Core app solid, old critical bugs fixed, tsc 0 errors. **Not "zero pending features"** — see blockers below.

## Blocker 1 — P0: page-level auth/RBAC missing (MUST FIX before deploy)

No `middleware.ts`; ~40 admin pages have no login/role gate (reads rely on Supabase RLS; mutations gated by `requireAdmin`). Fix: add middleware redirect-to-/login + role enforcement, then verify RLS. **Deploy is blocked on this per Jabeer.**

## Blocker 2 — FMOS Not Yet Deployed (depends on Blocker 1)

Runs on localhost, not yet on fmos.fortunemarq.com. Until it ships: leads can't be bulk-imported, Afifa can't call, outbound machine is offline. **Deploy target is VERCEL (not Hostinger).** Guide: `fmos/DEPLOY_VERCEL.md`.

**Deployment checklist (corrected):**
- [ ] Vercel project, **Root Directory = `01_CRM_AND_TOOL/fmos`**
- [ ] Env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, **ANTHROPIC_API_KEY** (not OpenRouter), CRON_SECRET, INBOUND_WEBHOOK_SECRET, + 4 WhatsApp vars
- [ ] Point `fmos.fortunemarq.com` DNS to Vercel + add domain in Supabase auth redirects
- [ ] Create accounts: Afifa (telecaller), Zaid (staff), Sufiyan (staff) — admins already exist
- [ ] Bulk-import remaining leads, enter real client data, smoke test, activate GST settings

## Blocker 3 — P1: outbound-WhatsApp send UI unbuilt

Send library ready; no UI calls it. The "send report/proposal/invoice PDF via WhatsApp from FMOS" flow isn't built. Also externally gated until type_d approves + display-name appeal. Decide: build now vs after launch.

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
