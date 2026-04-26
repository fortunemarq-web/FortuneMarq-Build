# L7 — Upsell System
**Created:** April 2026 | **Status:** COMPLETE

## Purpose
Rules engine and scripts for upselling active clients once strong results are established. Keeps revenue growing from the existing client base without relying entirely on new client acquisition.

## Files
| File | Purpose |
|---|---|
| `FMOS_Upsell_Data/upsell_rules.json` | Trigger conditions, services offered, 5-step upsell process, pipeline statuses |
| `FMOS_Upsell_Data/upsell_scripts.json` | Jabeer's call script, meeting talking points, post-call WhatsApp templates |

## Upsell Services
- **Social Media Management** — Instagram + Facebook. Best for visual/B2C niches (Gyms, Skin, Dental, Interior Designers)
- **Google Ads** — Paid search on top of organic SEO. Best for high-intent niches (IVF, Car Rentals, JEE/NEET)

## Trigger
- Client scores **Excellent (80+)** on health score for **2 consecutive months**
- FMOS flags client as "Upsell Ready" and surfaces them in the admin upsell queue

## Who Handles It
- **Jabeer personally** calls the client — same approach as the first meeting
- Zoom call booked if needed to walk through the upsell proposal
- Outcome logged in FMOS (Closed Won / Follow Up / Not Now / Declined)

## Upsell Pipeline Statuses
Not Eligible → Upsell Ready → In Conversation → Closed Won / Closed Lost / Snoozed (60 days)
