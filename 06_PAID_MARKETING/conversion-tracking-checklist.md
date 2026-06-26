# Conversion Tracking — Activation Checklist (do at ad launch)

The single most important paid-ads automation: feed **real downstream conversions** (meeting booked,
deal won) back to Meta + Google so their AI optimizes for **quality leads**, not just form-fills.
The pipeline is **already built in FMOS but dormant** — this is the activation list.

## What's already built (dormant)
- `01_CRM_AND_TOOL/fmos/lib/ads/meta-capi.ts` — Meta Conversions API sender.
- `01_CRM_AND_TOOL/fmos/lib/ads/google-oci.ts` — Google offline-conversion sender.
- `01_CRM_AND_TOOL/fmos/lib/ads/conversions.ts` — maps a won/booked lead → a conversion upload.
- `01_CRM_AND_TOOL/fmos/app/api/cron/ad-conversions/route.ts` — the cron that uploads.
- `ad_conversions` table — already migrated.
- gclid/fbclid already captured on the lead (`lib/inbound/capture.ts`).

## Activation steps
- [ ] Set `META_CAPI_TOKEN` in Vercel (Production + Preview).
- [ ] Set the `GOOGLE_ADS_*` credentials in Vercel.
- [ ] Add a `/api/cron/ad-conversions` step to `01_CRM_AND_TOOL/fmos/.github/workflows/cron.yml`.
- [ ] Test with `?dry=1` (preview which conversions would upload) before going live.

## ⚠️ Google side needs a fix first (2026 migration)
- As of **June 15, 2026**, Google moved offline conversion import + enhanced conversions to the new
  **Data Manager API** and **blocked them in the Google Ads API**. `google-oci.ts` was written against
  the older path → it must be **updated to the Data Manager API** before it will work.
- Dev tokens that didn't send a request Jan–Jun 2026 may **not be allowlisted** — verify access, since this was dormant.
- **Meta CAPI is unaffected** — Meta can go live first; fix Google in parallel.

## Make it more accurate (Enhanced Conversions for Leads)
- [ ] Send hashed **email/phone** alongside gclid (Enhanced Conversions for Leads) — recovers ~10% more
  conversions when the gclid is lost. Update `conversions.ts`/`google-oci.ts` to include first-party data.

## Reality check on volume
- Google wants ~**30+ offline conversions/month** for Target CPA to stabilize (50+ for ROAS). Early on,
  optimize bidding for **form-fills**; switch to downstream (booked/won) conversions once volume is there.
