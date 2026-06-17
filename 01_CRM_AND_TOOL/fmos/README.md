# FMOS — FortuneMarq Marketing Operating System

FMOS is the in-house CRM and operations platform for **FortuneMarq**, a digital
marketing agency in Hubli, Karnataka. It covers the full agency lifecycle — lead
calling → outreach → meetings → proposals → agreements → client management →
finance → team — plus the agency's own inbound-marketing engine. Built with
**Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, and **Supabase**
(Postgres + Auth + RLS), with Claude (Anthropic) powering the AI features. It is
deployed on **Vercel** and reached at `fmos.fortunemarq.com`.

## Getting started

```bash
npm install
npm run dev      # dev server (binds 0.0.0.0 for LAN/mobile testing) → http://localhost:3000
npm run build    # production build
npm run start    # production server
npm run lint     # ESLint
```

Copy `.env.example` to `.env.local` and fill in the required values (Supabase URL +
keys, `ANTHROPIC_API_KEY`, `CRON_SECRET`, WhatsApp/Meta keys, …) before running.

## Where to look first

- **`CLAUDE.md`** — app map, routes, tables, and the conventions to follow when editing.
- **`CONTINUE_HERE.md`** — the canonical handoff: current project state + next steps (supersedes the older `COWORK_HANDOFF.md`).
- **`APPLICATION_DOCUMENTATION.md`** — full technical reference (schema, routes, components).
- **`lib/pipeline.ts`** — the single source of truth for lead stages; never write
  `outreach_stage`/`status` directly, always go through `leadStageUpdate()` /
  `leadStatusUpdate()`.

## Operational scripts

- **`scripts/bulk_create_whatsapp_templates.py`** — bulk-creates the Meta WhatsApp Business templates from the canonical `03_SALES_SYSTEM/WhatsApp_Templates/FMOS_Template_Data/templates_final.json` (already-approved templates are skipped; safe to re-run).

The telecaller cockpit (`components/sales/telecaller-cockpit.tsx`) logs call outcomes and, on **"Interested — Book Meeting Now"**, creates a Google Calendar/Meet booking (`bookMeeting`); other outcomes auto-send the mapped WhatsApp template (3.2 / 3.4).

## Public site & niche landing pages (Stage 2.1)

**Current status (2026-06-17):** the first data-driven niche landing page is built and verified — **Dental Clinics · Hubli** at `/lp/dental-clinics/hubli` (EN + Kannada via `?lang=kn`). Per the launch gate, only this niche is enabled; the other niches and the fortunemarq.com marketing homepage (5.1) are not built yet. Tracking (Meta Pixel + GA4 + Microsoft Clarity) is wired but env-gated and inert until the IDs are set.

- **Data layer** — `lib/lp/niches.ts` (per-niche registry + `enabled` gate, EN/KN copy, competitors, upsell path), `lib/lp/data.ts` (merges the registry with the live `market_insights` row — the same record that powers the report PDFs — and computes the labelled projection), `lib/lp/copy.ts` (EN/KN section copy).
- **Page + UI** — `app/lp/[niche]/[city]/page.tsx` (server-rendered, SEO + JSON-LD) and `components/lp/` (`book-cta` lead form + Google Meet slot picker, `lang-toggle`, `reveal` scroll animations, `lp-analytics`).
- **Lead capture** — `actions/lp-book.ts` runs the public inbound pipeline (`processInboundLead`) and, on a chosen slot, calls `bookMeeting`; **Book a meeting** is the primary CTA, **WhatsApp** (→ bot WABA number, source-tagged) the secondary. No fabricated results — proof is shown on request only.
- **Seed** — `supabase/2026-06-17_lp_market_insights_hubli_dental.sql` seeds the Dental Clinics · Hubli `market_insights` row (idempotent).

The auth gate lives in `proxy.ts` (Next 16's renamed middleware) and is intentionally
**fail-open** — read the notes in that file before touching it. Public LP routes (`/lp/*`) bypass the gate by design.
