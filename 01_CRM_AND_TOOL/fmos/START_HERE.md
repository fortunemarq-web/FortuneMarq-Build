# START HERE — New Session Entry Point
**Last updated:** 2026-06-17

> ▶ **The canonical handoff is `CONTINUE_HERE.md`** — read that first. It holds the current state, the doc trust map, and next steps. This file is a short orientation only.

## What is this?
FMOS = FortuneMarq Marketing Operating System — a Next.js 16 + Supabase CRM for Jabeer's Hubli marketing agency.

## Where is the code?
- **This machine (Mac):** `/Users/fortunemarq/FortuneMarq-Build/01_CRM_AND_TOOL/fmos`
- **Repo:** `github.com/fortunemarq-web/FortuneMarq-Build` (git root is `FortuneMarq-Build`, app in subdir `01_CRM_AND_TOOL/fmos`; latest build on branch `continue-on-mac`)
- **Supabase:** project `cnwooodktqwvpzkucskm`

## What phase are we in?
**DEPLOYED & LIVE** on Vercel (`fmos.fortunemarq.com`). WhatsApp Cloud API is live (33 templates approved). Built & live: Stages 1, 3, 4, the AI bot (6.1), and messaging safety + inbox (6.2–6.4). Next big builds: Stage 2 campaigns, Stage 5 presence, and the remaining safety nets — see `CONTINUE_HERE.md §4`.

## Read in this order
1. `CONTINUE_HERE.md` — **canonical** current state + next steps + doc trust map.
2. `CLAUDE.md` — app map, routes, DB tables, conventions.
3. `EXTERNAL_SETUP_GUIDE.md` — accounts/keys/integrations.
4. `FUTURE_FEATURES.md` — backlog.

## Critical reminders
- **Auth gate lives in `proxy.ts`** (Next 16), NOT `middleware.ts`. It's fail-open — keep it that way.
- Commits are **scoped to `01_CRM_AND_TOOL/fmos`** (repo root has unrelated files).
- `npx tsc --noEmit` must be 0 errors before committing.
- Merging to `main` triggers a live Vercel deploy — only with explicit owner approval.

## Dev + checks
```bash
cd /Users/fortunemarq/FortuneMarq-Build/01_CRM_AND_TOOL/fmos
npm run dev          # localhost:3000
npx tsc --noEmit     # must be 0 errors
```
