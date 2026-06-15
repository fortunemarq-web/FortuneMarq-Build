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
- **`COWORK_HANDOFF.md`** — current project state and next steps.
- **`APPLICATION_DOCUMENTATION.md`** — full technical reference (schema, routes, components).
- **`lib/pipeline.ts`** — the single source of truth for lead stages; never write
  `outreach_stage`/`status` directly, always go through `leadStageUpdate()` /
  `leadStatusUpdate()`.

The auth gate lives in `proxy.ts` (Next 16's renamed middleware) and is intentionally
**fail-open** — read the notes in that file before touching it.
