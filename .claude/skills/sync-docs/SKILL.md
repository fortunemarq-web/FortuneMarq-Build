---
name: sync-docs
description: Keep the FortuneMarq-Build docs in sync with the live system. Use when the user asks to sync/update/reconcile the docs, fix doc drift, refresh LIVE_STATE, or whenever a doc_sync FACT-DRIFT alert appears (e.g. lead/city/niche/report counts changed, deploy state changed). Pulls live ground truth (git + Supabase counts), refreshes 00_MASTER/LIVE_STATE.md, then reconciles any prose doc that contradicts it. DOCS ONLY.
---

# Sync FortuneMarq docs with live state

Goal: make every doc reflect the **true current state**, automatically. This is the on-demand
companion to the SessionStart hook (`scripts/doc_sync.mjs --session`) and the Stop hook
(`scripts/docs_check_stop_hook.mjs`).

**Hard rule: DOCS ONLY.** Edit only `.md` files. Never touch app source, data CSVs, SQL, `.env`, or scripts logic.

## Steps

1. **Refresh the live snapshot.** Run:
   ```bash
   node scripts/doc_sync.mjs --write
   ```
   This pulls git + Supabase counts (leads / cities / niches / market_insights / report_assets),
   rewrites `00_MASTER/LIVE_STATE.md` **only if the facts changed**, and prints a `drift` line.
   (If it says "Supabase not reached", the local `.env.local` is missing/offline — proceed with the
   last-known `LIVE_STATE.md`; do not invent numbers.)

2. **Check reference/folder drift.** Run:
   ```bash
   node scripts/docs_check.mjs --mode worktree
   ```
   This lists DEAD REFERENCES (links/paths to files that no longer exist — these block commits) and
   STALE folder-docs (a folder changed but its CONTEXT.md/README didn't).

3. **Read the ground truth.** Read `00_MASTER/LIVE_STATE.md`. Those numbers + deploy state are
   authoritative. The build-status source of truth is `00_MASTER/FMOS_System_Design_And_Tasks.md`
   (newest dated entries) + `FMOS_Execution_Roadmap.md`.

4. **Reconcile.** If `doc_sync` reported FACT DRIFT, or `docs_check` reported dead refs / stale docs:
   - Fix every doc whose facts now contradict `LIVE_STATE.md` — the canonical set first
     (`CONTINUE_HERE.md`, the `00_MASTER/` docs, `CLAUDE.md`), then the flagged folder `CONTEXT.md` files.
     Correct counts, deploy state, and tick/untick build-status checkboxes to match.
     Convert any relative dates ("yesterday") to absolute. Keep each doc's voice/structure.
   - Fix dead references (correct the path, update the doc, or remove the reference).
   - Leave genuine **content** (sales-script copy, keyword volumes, pricing, legal text) untouched —
     only fix project-STATUS claims. The word "curiosity" inside a telecaller script is a technique,
     not the superseded feature.

5. **Verify.** Re-run both scripts — `node scripts/doc_sync.mjs` should show `✓ no fact drift` and
   `docs_check` should show `0 dead refs`. Spot-grep the canonical docs for known stale phrases
   (`"only Hubli"`, `"@react-pdf"` as the report generator, `"Curiosity Blast"`, old lead/niche counts)
   and confirm none survive as live claims.

6. **Commit (docs only).** Stage only the changed `.md` files (plus `00_MASTER/LIVE_STATE.md`); do NOT
   stage data/CSV/code changes. Commit with a clear message ending in the Co-Authored-By line.
   **Do not push to `main`** without explicit owner approval (pushing `main` auto-deploys; pushing
   `continue-on-mac` is fine if asked).

## Notes
- Kill switches: `DOC_SYNC=off` disables the snapshot/SessionStart layer; `DOCS_STOP_HOOK=off` disables
  the Stop-hook reconciliation. Full design: `scripts/DOC_AUTOMATION.md`.
- `00_MASTER/LIVE_STATE.md` is machine-generated — never hand-edit it; regenerate with the script.
