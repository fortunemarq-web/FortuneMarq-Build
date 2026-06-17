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

The auth gate lives in `proxy.ts` (Next 16's renamed middleware) and is intentionally
**fail-open** — read the notes in that file before touching it.
