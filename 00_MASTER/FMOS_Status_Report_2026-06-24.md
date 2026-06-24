# FMOS — System Design Report

**Date:** 2026-06-24 · **Owner:** Jabeer · **Branch/Deploy:** `continue-on-mac` → `main` (Vercel) at `a2698cd`

> Snapshot of what's built, what shipped today (the full niche-LP rollout), and what's left — grounded in `00_MASTER/FMOS_System_Design_And_Tasks.md` + the work deployed 2026-06-24.

---

## What FMOS is
One integrated machine that sells marketing to local businesses by **leading with real data about their own business**. Five engines, one spine:
**Stage 1 Data → Stage 2 Inbound (ads/LPs) + Stage 3 Outbound (calls/WhatsApp) → FMOS pipeline → Stage 4 Deliver/grow → Stage 5 own presence → Stage 6 cross-cutting safety nets.**

## Overall status
**The convert-and-deliver spine is fully built and live.** Roughly **half** of the 43 designed workflows are shipped — and critically, *all the ones a lead actually flows through* (capture → nurture → meeting → proposal → agreement → deliver → invoice). What's left is mostly the **growth/scale and presence layers**, plus the **campaign-management tooling**.

---

## 🚀 Shipped & deployed today (2026-06-24)
- **Stage 2.1 — Niche LPs: PARTIAL → DONE.** From "only Dental·Hubli enabled" to **all 13 niches × 9 cities (117 live pages)**, bilingual EN+KN, with two auto-switching angles:
  - **Demand mode** (≥1,000 real searches) → "capture the demand" (search/Maps/SEO).
  - **Presence mode** (<1,000 or no data) → "lead the market via Meta ads" (no fabricated numbers).
- **Registry restructured** to a niche×city cross-product; **fixed 4 industry-key mismatches** (SkinClinics/JEENEETCoaching/ComputerTraining/CarRentals) that were silently using fallback numbers — now pulling live `market_insights` per city.
- **LP lead capture fully wired to FMOS** — form, chat, and WhatsApp all tag leads with **niche + city + source** into the shared inbound pipeline (dedup + attribution + auto-assign). Call-button taps tracked per page (GA4/Pixel/Clarity).
- Verified: tsc=0, production build green, **234/234 page variants (EN+KN) load clean** (no console/runtime errors, no broken assets).

---

## Stage-by-stage status

| Stage | Done ✅ | Pending ⛔ |
|---|---|---|
| **1 — Data & Intelligence** | 1.3 demand · 1.4 competitor · 1.5 lead typing · 1.6 reports (936 PDFs, 9×13) | 1.1 collection automation · 1.2 cleaning-in-app · intake orchestrator (batch status machine) |
| **2 — Inbound / Campaigns** | **2.1 niche LPs (today)** | 2.2 proof vault · 2.3 campaign object + auto-tasks · 2.4 content-item model · 2.5 status machine · **2.6 metrics pull + conversion tracking + flags + digest** · 2.7 publish · 2.8 optimize log |
| **3 — Outreach** | 3.1 direct reports · 3.2 priority calls · 3.3 follow-up · 3.4 booking | — (complete) |
| **4 — Sales / Deliver / Grow** | 4.1–4.7 (meeting → proposal → agreement → onboard → plan → deliver → invoice) | 4.8 scale (upsell flags, renewals, review/referral autos) |
| **5 — Own presence** | 5.1 marketing site (+ GA4/Clarity/GSC/Pixel) | 5.2 GMB · 5.3 SEO/AEO/GEO (+ GSC dashboard) · 5.4 IG/FB · 5.5 LinkedIn · 5.6 unified organic capture · 5.7 presence dashboard + digest |
| **6 — Cross-cutting** | 6.1 bot · 6.2 inbox · 6.3 dedup · 6.4 WA compliance · 6.5 command center · 6.8 health monitoring · 6.9 backups | 6.6 long-term nurture / reactivation · 6.7 capacity / WIP guardrail |

Also live: **33 WhatsApp templates + the `direct_report_v3_*` family Meta-approved**; WA business number **79759 18980** registered & live on Cloud API.

---

## The big pending rocks (priority order)
1. **Stage 2 campaign tooling** — the FMOS Campaign object (2.3), Meta Marketing API metrics pull + flag rules + WhatsApp digest (2.6), status machine (2.5). *Today you'd run/track ads in Meta Ads Manager directly; FMOS doesn't yet ingest campaign performance.*
2. **Ad conversion tracking** (part of 2.6, held for launch): persist `gclid`/`fbclid` on leads, map events → Google/Meta conversions, wire **Meta CAPI + Google OCI** so platforms optimize for *real* leads (meeting/won), not cheap form-fills.
3. **Stage 5 organic engine** — GMB, programmatic SEO + GSC dashboard (LPs exist but need a sitemap + internal-linking for organic discovery), social, and the unified presence dashboard (5.7).
4. **Stage 1 intake automation** (1.1/1.2 + orchestrator) — stop running manual scrape/clean scripts.
5. **6.6 nurture + 6.7 capacity guardrail** — recover cold leads; don't oversell past delivery capacity.

---

## For the ad launch (~2 days) — ready vs missing
**✅ Ready:** 117 live LP destinations, lead capture into FMOS (tagged niche+city+source), Pixel/GA4/Clarity present, bot + booking + the full downstream pipeline.

**⛔ Missing (build at / just before launch):**
1. **Conversion tracking** — `gclid`/`fbclid` persistence + event→conversion mapping + CAPI/OCI (so ads optimize correctly). **Highest priority.**
2. **Campaign module in FMOS** (2.3/2.6) — optional to start; track in Ads Manager initially.
3. **LP sitemap** for the 117 pages (organic only — not needed for paid).

**You can launch paid ads now** (manual setup → live LPs → Pixel fires). The conversion-tracking wiring is what turns that spend into *measurable, self-optimizing* campaigns — the launch-day job.

---

## Recommended next sequence
1. **Now → launch:** verify Vercel deploy + analytics env IDs firing → wire **conversion tracking** (gclid/fbclid + conversions + CAPI/OCI).
2. **Then:** Stage 2 Campaign object + Meta metrics pull (campaigns live inside FMOS).
3. **Then:** Stage 5 organic (GMB + programmatic SEO/GSC dashboard + presence dashboard).
4. **Background:** 1.1/1.2 intake automation, 6.6 nurture, 6.7 capacity guardrail.

---

## Lead-capture integrity (verified 2026-06-24)
| Path | Stored in `leads` | Niche + City tagged | Source |
|---|---|---|---|
| Book form / meeting | ✅ | ✅ | `lp` |
| Chatbot (SiteChat) | ✅ | ✅ | `website` + industry/city |
| WhatsApp (wa.me) | ✅ | ✅ (parsed from prefill) | `whatsapp`/`ctwa` + industry/city |
| Floating call (`tel:`) | ❌ analytics-only | — | GA4/Pixel event per page |

All form/chat/WhatsApp leads flow through one pipeline (`processInboundLead`) with dedup + attribution + auto-assign. Calls are intentionally analytics-only (no call-tracking number).
