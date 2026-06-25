# Landing Pages — control room for the niche LPs

This is where you plan, track, and request changes to the **niche landing pages** —
the city × niche pages an ad or search sends a business owner to (e.g.
https://fortunemarq.com/lp/dental-clinics/hubli ). Owner is not technical — Claude does the work.

**First read** `01_CRM_AND_TOOL/fmos/app/site/README.md`. All commands run from `01_CRM_AND_TOOL/fmos`.

## How the landing pages actually work (important)
There are **117 live LPs but NOT 117 files.** They're generated from **one template + a registry**:
- **Template (the page itself):** `01_CRM_AND_TOOL/fmos/app/lp/[niche]/[city]/page.tsx` (+ `lp.css`).
- **Registry (which niches × which cities exist):** `01_CRM_AND_TOOL/fmos/lib/lp/niches.ts`
  — 13 niches (`NICHE_DEFS`) × 9 cities (`CITIES`) = 117 pages.
- **The words on every LP:** `01_CRM_AND_TOOL/fmos/lib/lp/lp-sections.ts` (tokenised EN + Kannada).
- **Per-niche screenshots:** `01_CRM_AND_TOOL/fmos/public/site/lp/img/<niche>-site-{mobile,tablet,desktop}.png`.

So a change to one niche's copy usually changes that niche **in every city at once** (it's shared copy),
unless it's city-specific data (search volumes etc.) which the page pulls live from Supabase `market_insights`.

## Two automatic modes (don't fight these)
Each LP auto-picks its angle from the city's real search volume:
- **Demand mode** (≥ ~1,000 monthly searches) → "capture the demand that already exists".
- **Presence mode** (< 1,000 or no data) → "lead the market via Meta ads" — **no fabricated numbers**.
You don't set this by hand; it resolves from `market_insights`. Never hard-code fake search numbers.

## This folder = the control surface (planning, not the live page)
- One folder per **city**; inside it, one card (`<niche-slug>.md`) per **niche**.
- Each card tracks that LP: live URL, status, mode, screenshots, and any notes/requests.
- ✏️ Editing a card here does **NOT** change the live page — it's your plan/record. The live change
  happens in the app files above, then deploys.

## To actually change or add an LP
1. Owner says what they want (in plain English) for a niche/city.
2. Make the smallest edit in the right app file:
   - reword a section → `lib/lp/lp-sections.ts`
   - add/rename/enable a niche, change a city, swap screenshots → `lib/lp/niches.ts`
   - layout/visual → `app/lp/[niche]/[city]/page.tsx` / `lp.css`
3. Verify from `01_CRM_AND_TOOL/fmos`: `npx tsc --noEmit` + `npm run build` (both green).
4. Show the owner, commit only the files you touched, push to `main` → live in ~2 min.
5. Update the affected card(s) in this folder to reflect the change.

## 🚫 Do not touch
- The lead-capture wiring on the LP form/chat/WhatsApp (`processInboundLead` / `lib/inbound/capture.ts`)
  — that's the link to the CRM. Restyle freely; never change how it submits.
- `proxy.ts`, the auth gate, the bot, WhatsApp send safety, Supabase clients — all off-limits (see
  `Website/Website-Changes/CLAUDE.md` for the full do-not-touch list).
