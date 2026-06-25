# SEO & Local SEO — Working guide (FortuneMarq's own website)

FortuneMarq's **own** website SEO — ranking fortunemarq.com for "digital marketing agency Hubli"
and related searches. `CONTEXT.md` = inventory/targets; this file = how to work here.
⚠️ This is **our own** SEO — client SEO is `02_SERVICE_DELIVERY_AUTOMATION/SEO_Automation`.

## How it connects to the rest
- The site itself lives in the app. SEO is edited there, not here:
  - Titles/descriptions/structured data → `01_CRM_AND_TOOL/fmos/lib/site/seo.ts`
  - Sitemap → `01_CRM_AND_TOOL/fmos/app/sitemap.ts` · Robots → `01_CRM_AND_TOOL/fmos/app/robots.ts`
  - Page copy/headings → the page `.tsx` files under `01_CRM_AND_TOOL/fmos/app/site` (see `Website/Website-Changes/CLAUDE.md`).
- **Google Search Console is already connected** (via `01_CRM_AND_TOOL/fmos/components/site/site-analytics.tsx`); the sitemap is submitted.
- This folder holds the **plan + records**: keyword targets, the on-page checklist, and content ideas.

## The manual workflow (now — this is 80% of own-site SEO)
1. **Keyword targets** — keep a list: one primary keyword per page (start: "digital marketing agency Hubli"). Pull volumes from `07_DATA_AND_RESEARCH/Keyword_Data`.
2. **On-page** — for each page set a unique title + meta description + one H1 using the target term; edit in `lib/site/seo.ts` / the page `.tsx`, then deploy via the Website flow.
3. **Local SEO** — keep NAP (name/address/phone) identical across the site, GMB (`05_FORTUNEMARQ_ONLINE_PRESENCE/GMB`), and any directories; build local citations.
4. **Content** — publish helpful local posts via `Website/Add-Blogs` (each post targets one natural keyword).
5. **Measure** — check Search Console weekly: which queries show impressions but low clicks/position → optimize those pages next.

## ⚠️ Future plan — Search Console API automation (build later)
GSC is connected for viewing; the **API** would let FMOS automate the data side:
- **Search Analytics API** → pull queries/clicks/impressions/position into the presence dashboard + client reports.
- **URL Inspection / Indexing / Sitemaps API** → monitor/submit indexing.
- **PageSpeed Insights API** → automated speed / Core-Web-Vitals checks.
- OAuth-based, free; build env-gated in FMOS. Most of the *ranking* work stays manual — the API only automates measurement + monitoring.

## Boundaries
- Planning/records only. Actual SEO changes happen in the app files above and deploy via the Website flow. No secrets here.
