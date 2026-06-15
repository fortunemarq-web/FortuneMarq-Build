# START HERE — New Claude Session Entry Point
**Last updated:** 2026-06-14

## What is this?
FMOS = FortuneMarq Marketing Operating System. Full-stack agency CRM.
Owner: Jabeer (Sayed Jabeer), Hubli-based digital marketing founder.

## Where is the code?
**Windows 11:** `C:\Users\sayed\FortuneMarq-Build\01_CRM_AND_TOOL\fmos`
Stack: Next.js 16 App Router · TypeScript · Tailwind v4 · Supabase (`cnwooodktqwvpzkucskm`)

## What phase are we in?
**Phase 2: New Features** — Phase 1 (all bugs fixed) is COMPLETE as of 2026-06-14.

## What to read first
1. `CLAUDE.md` — full app map: all routes, all DB tables, all conventions. Read this completely.
2. `COWORK_HANDOFF.md` — current state, WhatsApp API status, Phase 2 feature priority list, deploy checklist.
3. `EXTERNAL_SETUP_GUIDE.md` — every account/API key/plan/integration to set up OUTSIDE the code before full-scale use.
4. `last_session.md` — table of all 17 bugs fixed in the last session + context files changed.

## What to do next
The single highest-priority next task is **`middleware.ts` auth gate** — see `COWORK_HANDOFF.md §4 P0` for the full spec. Every admin route is currently publicly readable. This must be fixed before live testing or deploy.

After middleware: outbound WhatsApp send UI → real PDF generation → feature list in `COWORK_HANDOFF.md §4 P3`.

## How to start the dev server
```powershell
cd "C:\Users\sayed\FortuneMarq-Build\01_CRM_AND_TOOL\fmos"
npm run dev
```
Then open http://localhost:3000

## TypeScript check
```powershell
cd "C:\Users\sayed\FortuneMarq-Build\01_CRM_AND_TOOL\fmos"
npx tsc --noEmit
```
Should be 0 errors. Fix any before writing new code.

## Uncommitted changes
All Phase 1 bug fixes are NOT yet committed. When Jabeer greenlit, run:
```powershell
cd "C:\Users\sayed\FortuneMarq-Build\01_CRM_AND_TOOL\fmos"
git add -A
git commit -m "Phase 1 complete: all critical bugs fixed, TypeScript 0 errors (2026-06-14)"
git push origin master
```
