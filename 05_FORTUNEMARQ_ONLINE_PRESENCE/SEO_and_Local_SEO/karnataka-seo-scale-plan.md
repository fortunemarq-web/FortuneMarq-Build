# SEO at Scale — Ranking FortuneMarq Across Karnataka (plan / roadmap)

Goal: rank FortuneMarq **organically in every major Karnataka city** (not just Hubli) and get
**cited in AI answers** (AEO/GEO) — programmatically and mostly automated. This is FortuneMarq's
**own** SEO at scale (client SEO = `02_SERVICE_DELIVERY_AUTOMATION/SEO_Automation`).

Target cities (the 9 we already hold data for): Hubli, Dharwad, Belagavi, Mysuru, Mangalore,
Davangere, Ballari, Kalaburagi, Vijayapura.

## Two hard truths (design around these)
1. **Two kinds of ranking, different ceilings:**
   - **Organic blue links** — achievable in every city, **no physical office needed**. This is the main lever.
   - **Local map pack (3 pins)** — needs a **real address / verified GBP in that city**. Without offices we won't show in other cities' map packs. Plan: organic everywhere; map-pack only where we have presence.
2. **Doorway-page penalty is the #1 risk.** Google's Scaled Content Abuse policy (2024–2025 updates) algorithmically suppresses cookie-cutter "{service} in {city}" pages that only swap the name. Mass thin city pages = penalty.

## Our unfair advantage
We already have **real per-city data** in `07_DATA_AND_RESEARCH` (keyword volumes, competitor/SERP analysis, market insights for all 9 cities). Injecting that genuine local data into each page is exactly what turns a "doorway page" into a "data-rich, genuine-value page" Google rewards — and almost no local competitor can match it. We also already have the **programmatic page engine** (the 117 niche×city LPs at `01_CRM_AND_TOOL/fmos/app/lp/[niche]/[city]`) and **GSC connected**.

## The model (how scale happens)
1. One **programmatic engine** generates `digital-marketing-agency/<city>` pages for every target city (same pattern as the client LP cross-product).
2. Each page is **enriched with real per-city data** from `07` → passes the genuine-value bar, avoids the doorway penalty.
3. **Technical layer automated** (schema, sitemaps, indexing, speed) so 50+ pages stay healthy hands-off.
4. **AEO/GEO layer on top** → also get cited in AI answers, not just blue links.
5. **Off-page** runs continuously (citations, reviews where present, community/Reddit mentions for AI authority).
6. **Measure** in GSC (organic) + an AI-citation tracker (AEO).

---

## What's automated (in FMOS) vs manual

| Layer | Automated in FMOS | Manual / human |
|---|---|---|
| **On-page** | City×service page generation from template × `07` data; varied titles/meta/H1; auto FAQ blocks; internal linking | Per-city editorial polish; the genuinely-unique local angle |
| **Technical** | Dynamic sitemaps, LocalBusiness/Service/FAQ/Breadcrumb schema, hreflang EN/KN, Indexing API submit, Core Web Vitals/PageSpeed monitoring, broken/orphan detection | Fixing flagged issues |
| **Off-page** | Citation/NAP submission at scale; backlink + review monitoring; outreach tracking | The outreach/relationships, digital PR, Reddit/community participation |
| **AEO/GEO** | Direct-answer blocks, FAQ/HowTo schema, entity `sameAs`; AI-citation monitoring across ChatGPT/Perplexity/AI Overviews/Claude/Gemini | Earning third-party/Reddit citations; original data/content |

---

## Phased roadmap

### Phase 0 — Foundation (do first, mostly manual)
- Optimize the core pages (home/services) for "digital marketing agency Hubli" (`keyword-targets.md` + `on-page-checklist.md`).
- Lock entity signals: consistent NAP everywhere, strong About page, `sameAs` links (GBP, socials), LocalBusiness schema.
- Confirm GSC coverage clean; baseline the 20–30 target prompts/queries.

### Phase 1 — Programmatic city pages (the scale engine)
- Build `digital-marketing-agency/<city>` pages via the existing engine, one per target city.
- **Each page enriched with real `07` data** (local market size, competitor gaps, demand signals) — NOT a name swap.
- Bilingual EN/KN. Auto schema + sitemap entries + internal links.
- Submit via Indexing API; watch GSC for coverage + doorway-risk signals (thin/duplicate warnings).

### Phase 2 — Technical automation at scale
- Auto schema injection, Core Web Vitals monitoring (PageSpeed API), broken/orphan detection, automated GSC Search-Analytics pull → a presence dashboard ("which pages have impressions but low position → optimize next").

### Phase 3 — AEO/GEO layer
- Add direct-answer blocks (first ~150 words) + Q&A formatting + FAQ schema across pages.
- Stand up AI-citation monitoring for target prompts.
- Begin earning third-party/community citations (Reddit is ~40% of AI citations) — genuine participation + digital PR.

### Phase 4 — Off-page + local
- Citation/NAP consistency program across directories.
- Reviews + GBP optimization where we have presence (`05_FORTUNEMARQ_ONLINE_PRESENCE/GMB`).
- Backlink outreach (tracked in FMOS), original local data content (we can publish real Karnataka market insights — strong link + citation bait).

---

## Reality check
- **Organic across all of Karnataka + AI-answer citations: achievable**, programmatic, mostly automated — *because* we have the per-city data to make each page legitimately valuable.
- **Map pack** is gated by physical presence per city — the one thing scale can't fake.
- Timeframe: meaningful movement in **3–6 months**, compounding after.
- This same engine is sellable as a **client service** (programmatic local SEO + AEO) once proven on ourselves.

> Status: PLAN ONLY (2026-06-25). Nothing built yet — build is gated on owner go-ahead, phase by phase.
