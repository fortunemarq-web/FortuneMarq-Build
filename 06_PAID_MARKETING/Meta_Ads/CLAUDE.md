# Meta Ads — Working guide (Phase 1)

FortuneMarq's own Meta (Facebook/Instagram) ad campaigns for lead generation — **Phase 1** of paid
marketing. `CONTEXT.md` = inventory; this file = how to work here. Launch switches stay OFF until go-live.

## Approach (own account = lean on native AI)
- Use **Advantage+** campaigns + Meta's automated bidding — give it budget, creative, and a clear conversion goal.
- Target local business owners by city/niche; destination = the matching niche LP (`https://fortunemarq.com/lp/<niche>/<city>`).
- Plan each campaign in `../Campaigns/<City>/<Niche>/`.

## Conversion tracking (the important part)
- Meta **CAPI is already built** (`01_CRM_AND_TOOL/fmos/lib/ads/meta-capi.ts`) and **unaffected by the 2026 Google migration** — Meta can activate first.
- Standard events (`Lead`/`Schedule`/`Contact`) already fire from the LPs; set `META_CAPI_TOKEN` to send server-side + downstream (booked/won) conversions. See `../conversion-tracking-checklist.md`.
- Owner-side: connect the Pixel to the Meta ad account.

## What to plan here
- Audiences (city/niche, interests, lookalikes once there's lead data), creative angles (honest, plain, no war/combat language), budget/test plan, and the offer.

## Boundaries
- Planning only — no tokens/credentials here. No fabricated metrics; real results go in the campaign's `results.md`.
