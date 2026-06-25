# 02/Ads_Automation — Working guide

Plans for the platform that manages **clients'** Google Ads + Meta Ads — campaign generation,
human approval gates, auto-optimisation, and monthly performance reports. `CONTEXT.md` = inventory;
this file = how to work here.

## ⚠️ Client ads, not ours
This is ad management *for paying clients*. FortuneMarq's **own** lead-gen ads are `06_PAID_MARKETING`.
Don't mix the two.

## How this connects to FMOS / the rest
- The `GOOGLE_ADS` / `META_ADS` services here are what clients buy — mirrored in the proposal builder (`01_CRM_AND_TOOL/fmos/lib/data/services_data.json`) and priced in `08_FINANCE/Pricing_Decisions`.
- **Pricing rule to honor:** management fee only — the client pays Google/Meta ad spend directly; +5% of spend applies above ₹15,000/month. Keep any number here matching Finance + the bot's `00_MASTER/Bot_Knowledge_Base/pricing.md`.
- Monthly ad reports feed `04_CLIENT_MANAGEMENT/Monthly_Reports`; approvals/tasks run through FMOS.

## Boundaries
- Planning docs only. No client account credentials or API tokens in here.
