# START HERE — New Session Entry Point
**Last updated:** 2026-06-15

## What is this?
FMOS = FortuneMarq Marketing Operating System — a Next.js 16 + Supabase CRM for Jabeer's Hubli marketing agency.

## Where is the code?
- **Windows:** `C:\Users\sayed\FortuneMarq-Build\01_CRM_AND_TOOL\fmos`
- **Repo:** `github.com/fortunemarq-web/FortuneMarq-Build` (branch `main`; git root is `FortuneMarq-Build`, app in subdir `01_CRM_AND_TOOL/fmos`)
- **Supabase:** project `cnwooodktqwvpzkucskm`

## What phase are we in?
**MID-DEPLOY on Vercel.** The build phase is complete, committed, and pushed. We're wiring up hosting.

## Read in this order
1. `COWORK_HANDOFF.md` — current state + the exact next steps (read §0 first).
2. `CLAUDE.md` — app map, routes, DB tables, conventions.
3. `EXTERNAL_SETUP_GUIDE.md` — accounts/keys/integrations.
4. `FUTURE_FEATURES.md` — backlog (do NOT build these until deploy is done).

## The immediate next task
Finish the Vercel deploy: **Root Directory = `01_CRM_AND_TOOL/fmos`** + add the **10 env vars** (from `.env.local`) → **Deploy** → then post-deploy config (domain CNAME, Supabase redirect URLs, WhatsApp webhook, GitHub cron secrets). Full checklist in `COWORK_HANDOFF.md §4–5`.

## Critical reminders
- **Auth gate lives in `proxy.ts`** (Next 16), NOT `middleware.ts`. It's fail-open — keep it that way.
- Commits are **scoped to `01_CRM_AND_TOOL/fmos`** (repo root has unrelated files).
- `npx tsc --noEmit` must be 0 errors before committing.
- Continuous deployment: once Vercel is connected, `git push` → auto-live.

## Dev + checks
```powershell
cd "C:\Users\sayed\FortuneMarq-Build\01_CRM_AND_TOOL\fmos"
npm run dev          # localhost:3000
npx tsc --noEmit     # must be 0 errors
```
