# SERP Scrape Scope — Pending Cities (Dharwad, Mysuru, Kalaburgi, Vijayapura)

**Status:** Not started. Lead Final CSVs for these cities currently have `SERP Ranked = "Not Scraped"`.

## Why this is needed

`SERP Ranked` / `SERP Source` in the Final lead CSVs tell the telecaller whether a
business already shows up in Google's local pack (GBP) or organic results for its
niche — this drives the pitch angle (Type A script vs Type B/C). For Hubli this was
computed by matching leads against real scraped Google results
(`Hubli_GBP_Data.csv` + `Hubli_Organic_Results.csv`, sourced via SearchAPI.io).

These 4 cities have no equivalent scrape yet, so the column is marked
"Not Scraped" rather than guessed.

## What exists already

Per-niche Google Keyword Planner data in `Keyword_Data/<City>*_Keywords/` for all
4 cities — useful for picking the search query per niche, but not a substitute for
the SERP scrape itself.

## Niches to scrape per city (13, matches Final CSV split)

Gyms, Skin Clinics, Computer Training, Dental Clinics, JEE NEET Coaching (JEE +
NEET combined), Car Rentals, Physiotherapy, IVF Clinics, IELTS Coaching, Interior
Designers, Modular Kitchens, Real Estate, Tuition Centres.

(Hubli also scraped "Salons" — optional 14th niche if relevant for these cities.)

## Process (mirrors Hubli's pipeline)

1. **Pick a query per niche** — `"<top keyword> <city>"`, e.g. `"dental clinic near
   me dharwad"`. Use the highest-volume keyword from
   `Keyword_Data/<City>*_Keywords/<Niche>_Keywords.csv` for each niche.
2. **Run SearchAPI.io** (Google Search engine) for each of the 13 queries per city
   → 13 API calls per city, 52 total across all 4 cities.
3. **Save raw results** as `Competitor_Data/<City>/_ALL_RESULTS.json`, keyed by
   niche, same shape as `Competitor_Data/Hubli/_ALL_RESULTS.json` (local_pack,
   organic, directories, social, volume, scraped_at).
4. **Extract two flat CSVs** per city from `_ALL_RESULTS.json`:
   - `<City>_GBP_Data.csv` — from `local_pack` entries (name, phone, address, rating)
   - `<City>_Organic_Results.csv` — from `organic` entries (title, link/url, snippet)
5. **Re-run `process_city_leads.py <City>`** — it auto-detects these two files
   (`Competitor_Data/<City>/<City>_GBP_Data.csv` /
   `<City>_Organic_Results.csv`) and will perform the same SERP cross-matching
   logic used for Hubli, replacing "Not Scraped" with real Y/N + source.
6. **Spot-check** a few matches per niche against the raw `_ALL_RESULTS.json`.

## Effort estimate

- ~52 SearchAPI.io calls total (13 niches × 4 cities)
- ~30–45 min per city for extraction scripting (can reuse/generalize Hubli's
  extraction logic once written)
- Pipeline re-run is instant once GBP/Organic CSVs exist — `process_city_leads.py`
  needs no changes

## Recommended order

Dharwad first (next city in the attack order), then Mysuru, Kalaburgi, Vijayapura.
