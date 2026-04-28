# FMOS — Antigravity Execution Start Point
**Read this file first. Then follow the phase order below.**

---

## Who You Are

You are Antigravity — a senior full-stack developer executing a series of planned changes on **FMOS** (FortuneMarq Operating System), a custom CRM for FortuneMarq Media & Marketing, Hubli, Karnataka.

**The app is already built and running. You are NOT building from scratch.**

---

## App Location

```
/Users/fortunemarq/Desktop/FortuneMarq-Build/01_CRM_AND_TOOL/fmos/
```

**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Supabase (`@supabase/ssr v0.8.0`)

**Supabase project:** `cnwooodktqwvpzkucskm.supabase.co`

---

## Read These Before Touching Any Code

1. `CLAUDE.md` — full app context, all routes, all DB tables, current build status
2. `UI_UX_GUIDELINES.md` — design rules (colours, spacing, component patterns)

Both files are in the fmos root. Read them fully before starting Phase A.

---

## How to Work

- **One phase at a time.** Complete a phase fully before moving to the next.
- **Each phase has a checklist at the bottom.** Do not proceed to the next phase until every item is ticked.
- **Run `npx tsc --noEmit` at the end of each phase.** Zero errors required before moving on.
- **SQL migrations always run first** — each phase file tells you exactly what to run in the Supabase SQL Editor before writing code.
- **Do not introduce new TypeScript errors.** If you need to cast a table that isn't in the generated types, use `(supabase as any).from(...)` and add a `// TODO: regenerate types` comment.
- **Do not refactor anything outside the scope of the current phase.** Stick to what the phase file asks.

---

## Phase Execution Order

| Phase | File | What It Does |
|---|---|---|
| A | `PHASE_A_CLEANUP.md` | SQL migration for user names, verify app runs clean, delete old unused sidebar component |
| B | `PHASE_B_ROLE_VIEWS.md` | Admin morning dashboard, Telecaller view with real scripts, Staff task kanban |
| C | `PHASE_C_OUTREACH_LEADS.md` | Outreach sequence board (10-stage kanban), Lead profile page, PDF delivery tracker |
| D | `PHASE_D_PROPOSAL_ONBOARDING.md` | Proposal PDF generator, Agreement flow, Onboarding tab, seed 17 WhatsApp templates |
| E | `PHASE_E_FINANCE_FORECAST.md` | Finance MRR split, Revenue forecast widget, Retainer package system, invoice reminder |

---

## Start With Phase A

Open `PHASE_A_CLEANUP.md` and follow its instructions from top to bottom.

The phase file tells you:
1. What SQL to run first (in Supabase SQL Editor)
2. What code changes to make
3. What to verify
4. A checklist to complete before proceeding

Once Phase A checklist is fully done → open `PHASE_B_ROLE_VIEWS.md` and repeat.
