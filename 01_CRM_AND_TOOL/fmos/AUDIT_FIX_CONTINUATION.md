# Audit-Fix Continuation Guide
**For a fresh Claude Code session continuing the 24-issue audit fix.**
**Last worked:** 2026-06-15 · **Last commit:** `c12f943` (local, NOT pushed) · **Branch:** `main`

Read this file FIRST, then `CLAUDE.md` and `COWORK_HANDOFF.md`. The full audit write-up
is `FortuneMarq_Consolidated_Audit.docx` at the repo root (24 issues).

---

## 0. The one-paragraph situation

The FMOS app lives in `01_CRM_AND_TOOL/fmos` (Next.js 16 App Router + Supabase +
Tailwind v4). An audit found 24 issues, being fixed in 3 phases. **Phase 0
(code hygiene + docs) is DONE and committed locally as `c12f943` — not pushed.**
Phases 1 (database) and 2 (hosting/cron/secrets) are NOT started; they need the
owner's Supabase / Vercel / GitHub / Anthropic access and several decisions
(marked `[NEEDS OWNER]` below). Do Phase 1 next, but **stop and ask** at every
`[NEEDS OWNER]` point — do not guess schema or delete data.

---

## 1. Ground rules (do not break these)

- `npx tsc --noEmit` MUST be 0 errors before any task is "done". Run `npm run build`
  after DB changes. **Run tsc from inside `01_CRM_AND_TOOL/fmos`** (the Bash CWD can
  reset to repo root; if you see it install `tsc@2.0.4`, you're in the wrong dir —
  `cd` into fmos first).
- The auth gate is `proxy.ts` (Next 16 renamed middleware→proxy) and is intentionally
  **fail-open**. Keep it that way. NEVER create `middleware.ts`.
- Lead stage writes go ONLY through `leadStageUpdate()` / `leadStatusUpdate()` in
  `lib/pipeline.ts`. Never write `outreach_stage` / `status` directly.
- Mutations use server actions; client mutations capture `{ error }` + `toast.error()`;
  use `promptModal()` not native `alert`/`confirm`. Green = `brand-deep` (#1E7A4F);
  `#42CA80` for accents only. No emoji in UI chrome.
- Commits scoped to `01_CRM_AND_TOOL/fmos` (plus `01_CRM_AND_TOOL/CONTEXT.md` when a
  doc fix touches it). One commit per phase. **Commit locally; do NOT push** — the
  owner reviews before push (pushing to `main` triggers a Vercel deploy).
- Pipeline truth: **17 stages in 3 groups** (9 active + 4 parked + 4 closed) — see
  `lib/pipeline.ts`. Call cockpit emits **9 outcomes** — see `OUTCOMES` in
  `components/sales/telecaller-cockpit.tsx`. `lead_type` column = `inbound|outbound`;
  A/B/C/D is DERIVED via `getLeadScriptType()`, never stored.

---

## 2. What Phase 0 already did (commit `c12f943`)

**Code:**
- `lib/ai-models.ts` (NEW) — single source of truth for Anthropic model IDs:
  `ANTHROPIC_MODELS.fast` = `claude-haiku-4-5-20251001`, `.smart` = `claude-sonnet-4-6`.
  Pure module (no server imports) so client components can use it.
- `lib/openrouter.ts` → **renamed** `lib/anthropic.ts`; `callOpenRouter()` →
  `callAnthropic()`. All call sites updated (`app/api/ai/actions.ts`,
  `app/admin/strategy/actions.ts`, `lib/reports/dailyReport.ts`,
  `StrategyGeneratorModal.tsx`, `LLMKeyManager.tsx`). No `openrouter`/`callOpenRouter`
  references remain in code.
- `next.config.ts` — removed hardcoded LAN IP `192.168.1.4:3000` from
  `serverActions.allowedOrigins`; documented the `0.0.0.0` dev-bind LAN exposure.
- `proxy.ts` (**M1**) — removed `/sales` and `/staff` from `SHARED_AREAS` so they are
  role homes again: `/sales` → telecaller+admin, `/staff` → staff+admin (was: any
  signed-in role could enter). Gate still fail-open.

**Docs (factual fixes):** `APPLICATION_DOCUMENTATION.md`, `CLAUDE.md`,
`00_MASTER_BUILD_PLAN.md`, `CSV_UPLOAD_FORMAT.md` (+ `public/` copy), `CONTEXT.md`,
`DEPLOY_VERCEL.md`, `00_QUICK_REFERENCE.md`, `README.md`, `PHASE_A_CLEANUP.md`,
`EXTERNAL_SETUP_GUIDE.md`, `PHASE_B_ROLE_VIEWS.md`. Standardized version → **v4.9**.

**Owner decisions already given:** M1 = use defaults (above). Doc version = v4.9.
m6 = "I don't know" → deletions DEFERRED (nothing deleted).

**Deferred / not in the commit:**
- **M4 (as-any removal):** 514 `as any` casts across 161 files were INVENTORIED only.
  Removal happens in Phase 1 AFTER `supabase gen types` regenerates types.
- **m6 cleanup (repo root, outside fmos scope):** duplicate scripts
  `generate_sample_pdf{,_v2,_v3}.py`, `patch_pdf{,_v2}.py`,
  `scrape_google_results{,_v2}.py`, and 0-byte `project_data.json` — UNTOUCHED.
  Owner unsure which is the keeper; diff them and recommend before deleting.
- **3 unstaged files** (`COWORK_HANDOFF.md`, `START_HERE.md`, `last_session.md`)
  carry prior-session edits not made in this work; left unstaged on purpose.

---

## 3. PHASE 1 — database.  STATUS as of 2026-06-15 session 2:

**Committed `39a36d1`:** S1 (deleted re-opener), M2 (report token 30-day expiry +
publish gate + narrowed select), H1 (whatsapp_templates canonical; TemplateManager
rewritten; seed fixed; dead button deleted), M3 (no change needed — resolved).
**Committed `d8cc759`:** A1 baseline migration (`20260101000000_baseline_core_schema.sql`)
+ applied drop of orphan `whatsapp_message_templates`.
**Committed `38a6100`:** regenerated `types/database.types.ts` from live schema.
**Committed `5fb0ec4`:** M4 — stripped 114 redundant Supabase `as any` casts (499→385);
tsc 0 errors. Two latent bugs surfaced with FIXME (behavior preserved): duplicates-scan
filters `status='active'` (invalid lead_status); my-stats selects `daily_target`/
`target_value` (absent on team_targets) → goal always falls back to 100.
**Still open:** A1 follow-up only (renumber all migrations onto one ordered prefix +
scratch-DB replay verify — needs a throwaway Postgres). The remaining 385 `as any` are
result-casts / genuinely needed; not in scope. PHASE 1 otherwise COMPLETE.

Original task detail (for reference):

- **S1 (CRITICAL).** `supabase/migrations/fix_leads_rls_policies.sql` has 6×
  `CREATE POLICY "Enable all for leads" ... USING (true) WITH CHECK (true)` and sorts
  AFTER `20260611000000_harden_rls_policies.sql`, re-opening `leads` to anon on replay.
  **Delete that file** (or replace with the role-scoped policy).
  `[NEEDS OWNER]` confirm the live policy after you propose the change.
- **A1 (CRITICAL).** No migration CREATEs the core tables (`leads, clients, projects,
  proposals, profiles`) — only ALTERs; and 53 migrations apply alphabetically, not
  chronologically. `[NEEDS OWNER]` ask for `pg_dump --schema-only` of those tables →
  build ordered baseline migrations; renumber all migrations onto one timestamp
  prefix; verify a clean replay in a scratch DB before prod.
- **H1 (HIGH).** `components/admin/template-manager.tsx` writes
  `whatsapp_message_templates`, but `components/sales/whatsapp-template-picker.tsx` +
  `app/admin/leads/[id]/page.tsx` read `whatsapp_templates` — created templates never
  reach senders. `[NEEDS OWNER]` pick the canonical table → migrate rows, point both
  at it, remove the `as any`.
- **M3.** `supabase/migrations/whatsapp_template_system.sql` (lines 28 & 42) limits
  `outcome` to 3 values but the cockpit emits 9 — align the CHECK + mapping with the 9
  outcomes in `lib/pipeline.ts` / `telecaller-cockpit.tsx`.
- **M2.** `app/api/public/client-report/[token]/route.ts` has no expiry and returns
  `select("*")` — add `expires_at` (+ `revoked`) column + check; select only needed
  columns. `[NEEDS OWNER]` validity window (proposed: 60 days).
- **M4 (finish).** Regenerate types (`supabase gen types`), then complete the
  `as any` removal across the 514 sites.

Commit: `fmos: DB hardening — RLS, baseline schema, WhatsApp unify, token expiry`.

---

## 4. PHASE 2 — hosting/cron/secrets. Needs Vercel + GitHub + Anthropic access.

- **H2 (HIGH).** `vercel.json` schedules `daily-digest` + `admin-alerts` but those
  routes export **POST only** → Vercel Cron (GET) 405s; they never run. Add GET
  handlers (keep `verifyCronSecret`) OR move all crons to `.github/workflows/cron.yml`.
  `[NEEDS OWNER]` set `CRON_SECRET` in Vercel and `FMOS_BASE_URL`+`CRON_SECRET` in
  GitHub Actions secrets.
- **H3 (HIGH).** A secure server action `extractStrategyTasks`
  (`app/admin/strategy/actions.ts`) exists, but `StrategyGeneratorModal.tsx` +
  `LLMKeyManager.tsx` still call `api.anthropic.com` from the browser with a
  `sessionStorage` key. Route the modal through the server action; delete the browser
  fetch + key handling. `[NEEDS OWNER]` **ROTATE `ANTHROPIC_API_KEY`** (leaked in
  chat) and set the new value in Vercel.
- **M5.** Code reads undocumented env vars: `WA_OUTCOME_TEMPLATES`,
  `WA_OUTCOME_TEMPLATE_LANG`, `WHATSAPP_LP_FALLBACK_URL`, `NEXT_DIST_DIR`,
  `DAILY_REPORT_TEMPLATE`, `DAILY_REPORT_TEMPLATE_LANG`, `ADMIN_WHATSAPP_NUMBERS`.
  Create `.env.example` documenting ALL of them (+ the `WA_OUTCOME_TEMPLATES` JSON
  shape); make the outcome-send feature WARN (not silently skip) when unset in prod.
  `[NEEDS OWNER]` real values (leave dormant if Meta/WhatsApp not ready).
  NOTE: `README.md` already references `.env.example` — creating it closes that loop.
- **M6.** `git rm -r --cached 01_CRM_AND_TOOL/fmos/tmp` and add `tmp/` to
  `01_CRM_AND_TOOL/fmos/.gitignore` (~2,064 build files currently tracked).

Commit: `fmos: cron GET handlers, server-side AI, env docs, untrack tmp`.

**Also (M8, no phase):** `outreach_sequences` is legacy but still used by `/sales/*`
(`components/sales/outreach/outreach-actions.ts`, `app/sales/leads/[id]/page.tsx`).
`[NEEDS OWNER]` decide: migrate those to `leads.outreach_stage` OR retire the
`/sales/*` routes — don't change behavior without the owner's call.

---

## 5. Verification each phase

- `npx tsc --noEmit` → 0 errors (run inside `fmos`).
- `npm run build` passes (after DB changes).
- Auth/DB smoke test: log in per role; non-admin blocked from `/admin`; non-telecaller
  bounced from `/sales`, non-staff from `/staff`; a new WhatsApp template appears in
  the picker (after H1).
- Summarize changes, list anything blocked on `[NEEDS OWNER]`, and STOP for owner
  review before pushing.

---

## 6. Open `[NEEDS OWNER]` decisions to collect before Phase 1 work lands

1. S1 — OK to delete `fix_leads_rls_policies.sql`? (confirm live policy)
2. A1 — paste `pg_dump --schema-only` for `leads, clients, projects, proposals, profiles`.
3. H1 — canonical table: `whatsapp_templates` or `whatsapp_message_templates`?
4. M2 — client-report token validity window (proposed 60 days)?
5. Phase 2: rotate `ANTHROPIC_API_KEY`; set `CRON_SECRET`/`FMOS_BASE_URL`; M5 env values; M8 decision.
