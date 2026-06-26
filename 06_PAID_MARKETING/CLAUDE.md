# 06_PAID_MARKETING — Working guide

Plans for **FortuneMarq's own** paid ads (Meta + Google) to generate inbound leads — niche- and
city-specific, targeting local business owners. `CONTEXT.md` = inventory; this file = how to work here.

## ⚠️ Two rules that govern this whole folder
1. **Own ads, not client ads.** This is FortuneMarq's own spend. Client ad management = `02_SERVICE_DELIVERY_AUTOMATION/Ads_Automation`.
2. **Paid is the LAST step**, and the **launch switches stay OFF until the owner says go-live** (`WHATSAPP_LAUNCH`, ad tokens, etc.). Gates: niche LPs rolled out, telecaller operational, delivery able to handle leads.

## How it connects to FMOS
- Ads point to the **niche landing pages** (`https://fortunemarq.com/lp/<niche>/<city>`) → leads land in FMOS tagged source/niche/city → telecaller → delivery.
- Click IDs (gclid/fbclid) are already captured on the lead (`01_CRM_AND_TOOL/fmos/lib/inbound/capture.ts`).
- The **conversion feedback loop is already built (dormant):** `lib/ads/{meta-capi,google-oci,conversions}.ts` + cron `app/api/cron/ad-conversions/route.ts` + the `ad_conversions` table. See `conversion-tracking-checklist.md`.

## How to work here
- **Own ads:** lean on the platforms' **native AI** (Meta Advantage+, Google Performance Max / Smart Bidding) — don't over-engineer API campaign creation for a single account.
- Plan each campaign in `Campaigns/<City>/<Niche>/` (copy `Campaigns/_TEMPLATE/`).
- `Meta_Ads/` = Phase 1 (start here). `Google_Ads/` = Phase 2 (after Meta produces data).
- The **conversion loop** (feed booked/won back to the platforms) is the automation that matters — activation steps + the urgent Google migration fix live in `conversion-tracking-checklist.md`.
- API-driven campaign automation is the **client** play (`02`), not for one own-account.

## Boundaries
- Planning docs only — no ad-account tokens, API keys, or credentials in here (those go in Vercel env, owner-set).
- No fabricated performance numbers; record only real results in `Campaigns/.../results.md`.
