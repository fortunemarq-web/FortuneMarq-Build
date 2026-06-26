# Google Ads — Working guide (Phase 2)

FortuneMarq's own Google Ads campaigns for lead generation — **Phase 2**, after Meta is running and
producing data. `CONTEXT.md` = inventory; this file = how to work here. Launch switches stay OFF until go-live.

## Approach (own account = lean on native AI)
- Use **Performance Max / Search** with **Smart Bidding** (Target CPA) — destination = the matching niche LP.
- Plan each campaign in `../Campaigns/<City>/<Niche>/`.
- gclid is already captured on leads (`01_CRM_AND_TOOL/fmos/lib/inbound/capture.ts`).

## ⚠️ Conversion tracking needs a fix before it works (2026 migration)
- The offline-conversion sender is built (`01_CRM_AND_TOOL/fmos/lib/ads/google-oci.ts`) but as of **June 15, 2026**
  Google **moved offline/enhanced conversions to the Data Manager API and blocked them in the Google Ads API**.
  So `google-oci.ts` must be **updated to the Data Manager API** before activation.
- Verify the dev token is still allowlisted (it was dormant). **Use Enhanced Conversions for Leads** — send hashed
  email/phone with the gclid for ~10% more recovered conversions. Full steps: `../conversion-tracking-checklist.md`.
- Owner-side: link **GA4 ↔ Google Ads** and mark `generate_lead` a conversion.

## Volume note
- Target CPA needs ~30+ conversions/month to stabilize — early on optimize for form-fills, move to booked/won later.

## Boundaries
- Planning only — no tokens/credentials here. Real results only, logged in the campaign's `results.md`.
