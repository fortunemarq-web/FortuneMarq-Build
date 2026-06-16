# ▶ CONTINUE HERE — Canonical Handoff
**Updated:** 2026-06-17 · **Branch:** `continue-on-mac` · **This file supersedes all other handoff/continuation docs.**

> You are a fresh Claude Code session (new account, same machine + same `FortuneMarq-Build`
> folder — we switched accounts because the previous one hit its weekly rate limit). The prior
> session's memory does NOT carry over. **This file is the source of truth for where we are.**
> Read it fully, then `CLAUDE.md` (auto-loaded) for app structure.

App: `01_CRM_AND_TOOL/fmos` (Next.js 16 + Supabase + Tailwind v4). Owner: Jabeer.

---

## 0. Doc trust map (what to read vs ignore)
**Authoritative / current:**
- **This file** — current state + next steps.
- `CLAUDE.md` — app structure, routes, conventions (auto-loaded).
- `WHATSAPP_TEMPLATES_FINAL.md` + `03_SALES_SYSTEM/WhatsApp_Templates/FMOS_Template_Data/templates_final.json` — the 33 submitted WhatsApp templates (SOURCE OF TRUTH).
- `WHATSAPP_HANDOFF_2026-06-16.md` — the WhatsApp work order (BUILD/CHANGE/REMOVE, 12 surfaces, DoD).
- `00_MASTER/FMOS_Execution_Roadmap.md`, `FMOS_System_Design_And_Tasks.md`, `CRITICAL_PATH.md`, `PENDING_ACTIONS.md` — owner's strategy/launch-gate (maintained in Cowork).

**Superseded / historical (do NOT act on):**
- `WHATSAPP_TEMPLATE_SPEC.md` — superseded by `WHATSAPP_TEMPLATES_FINAL.md` (already banner-marked).
- `WHATSAPP_AUTOMATION_PLAN.md` — Phases 1–3 already built (see §3); keep for design rationale only.
- `PHASE_*.md`, `AUDIT_FIX_CONTINUATION.md`, `last_session.md`, `COWORK_HANDOFF.md`, `START_HERE.md`,
  `00_MASTER_BUILD_PLAN.md` — older session logs; CLAUDE.md + this file override them.
- `AGENTS.md` — does not exist (a second agent "omp" was trialed and removed; see §6).

---

## 1. Where we are
- All work sits on **`continue-on-mac`** and is **NOT pushed** (no production deploy yet, by owner's choice). Merging to `main` triggers a live Vercel deploy — **do not push/merge to `main` without explicit owner approval.**
- `.env.local` is in place (gitignored). `npx tsc --noEmit` = **0**, `npm run build` = **green**.
- Unpushed WhatsApp-automation commits this stretch: `cb4402b` (Phase 1) → `b84dc79`, `e8cba86`,
  `d226466`, `f666e4d`, `f2bffe0`, `eec7d00`.

## 2. Conventions (non-negotiable)
- Lead stage writes only via `lib/pipeline.ts` (`leadStageUpdate`/`leadStatusUpdate`) — never write `outreach_stage`/`status` directly.
- Auth gate = `proxy.ts` (Next 16), **not** `middleware.ts`; fail-open.
- No emoji in UI chrome; green = `brand-deep` `#1E7A4F` (raw `#42CA80` = accents only).
- Commits scoped to `01_CRM_AND_TOOL/fmos`. `tsc=0` + build green before every commit.
- WhatsApp: cold/outside-24h = Meta-approved template only; free-text only inside the 24h window.
- Supabase: server → `createServerClientWithCookies()`; client → `createClient()`; service-role (`createAdminClient()`) for cron/public/trusted only.

## 3. What's built (WhatsApp automation — all additive + INERT until a rule is enabled / a send is triggered)
- **Engine + triggers:** `actions/automations.ts` `fireTrigger` (fail-open) wired at `lead_outcome_logged`, `meeting_booked`, `proposal_sent`, `lead_won`.
- **Send layer:** `lib/whatsapp/send.ts` + `params.ts` — template send with body params **and document header** (PDF via link/mediaId). Token modifiers `{field:date|datetime|time|inr}` (IST/₹).
- **Config UI:** `/admin/automations` — `send_whatsapp` action builder + condition builder (route by `last_outcome` etc.). `/admin/whatsapp-templates` — "Register 33 Meta Templates" button now reads `templates_final.json` (source of truth; upserts; `direct_report_*`/`daily_report` untouched).
- **Direct-report bulk send (currently named "Curiosity Blast"):** `actions/curiosity-blast.ts`, `/admin/curiosity-blast`, `lib/whatsapp/report-lookup.ts` — niche×city send of the A/B/C/D `direct_report_*` template with the matching market-intel PDF as the document header; daily cap; sets `curiosity_sent`; opt-out honored; test-send-to-one-number + dry-run.
- **Opt-out:** `leads.wa_opt_out` + inbound **STOP** (and START) in the WhatsApp webhook.
- **SQL:** `supabase/2026-06-16_curiosity_blast.sql` (`wa_opt_out` + `report_assets`) — **already run in Supabase** (owner confirmed).

## 4. Next steps
**Code (next build — from `WHATSAPP_HANDOFF_2026-06-16.md` §3–5, in order):**
1. **Rename "Curiosity" → "Direct Report"** across UI/route/nav/files (mechanism already correct — report sent immediately, no teaser). Confirm no teaser-only code path remains. Keep stage value `curiosity_sent` unless a safe migration is proven.
2. **Delivery/read/click tracking** on the send dashboard (webhook already stamps `whatsapp_logs.delivery_status`), filterable by city / niche×city.
3. Then: **bot brain** (Anthropic + `00_MASTER/Bot_Knowledge_Base/*` — currently STUB files, owner must fill), **Google Calendar/Meet booking**, **channel adapters** (web/IG/Messenger), lifecycle sends, compliance/inbox.

**Owner / external (not code):**
- **Seed PDFs:** owner is fixing the market-intel reports, then will click `/admin/curiosity-blast` → "Seed report library" (local only). Known gap: **SkinClinics missing Type-B (English)** report.
- Templates: all 33 **submitted to Meta, pending review** (incl. `direct_report_type_d`).
- Deploy: push → Vercel env vars (`SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `INBOUND_WEBHOOK_SECRET`) → domain DNS → Supabase redirect URLs → set WhatsApp webhook callback URL.
- Data: only **Hubli** has reports/leads loaded (858 clean leads, 11 niches); other cities pending. Bulk-import remaining leads via `/admin/bulk-import`.

## 5. Verify after picking up
From `01_CRM_AND_TOOL/fmos`: `npm install` (if needed) → `npx tsc --noEmit` (expect 0) → `npm run dev`.

## 6. About "omp" (removed)
A second coding agent (`omp`/Kimi) was trialed in a git worktree to work in parallel. It's been
**removed** (worktree + `omp-work` branch deleted); its one useful change (the 33-template
registry rework) was **cherry-picked into `continue-on-mac` as `eec7d00`**. No omp references
remain in the repo. The `~/.local/bin/omp` binary + `KIMI_API_KEY`/`MOONSHOT_API_KEY` in `~/.zshrc`
are harmless leftovers on the machine — ignore or remove at will.
