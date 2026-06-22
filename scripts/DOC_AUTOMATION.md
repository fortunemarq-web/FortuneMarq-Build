# Doc automation — keeping FortuneMarq docs self-updating

Three layers keep the docs honest **every session** (Claude Code and Cowork), so the repo
never drifts back to stale facts like "858 leads / 11 niches / reports via @react-pdf".

| Layer | File | Trigger | Catches | Acts |
|---|---|---|---|---|
| **Live snapshot** | `scripts/doc_sync.mjs` | SessionStart hook + `/sync-docs` skill | **Fact drift** — Supabase counts / git-deploy state moving away from the docs | Rewrites `00_MASTER/LIVE_STATE.md` (only when facts change) + flags drift |
| **Reference scan** | `scripts/docs_check.mjs` | Stop hook + `/sync-docs` | **Dead refs** (path to a deleted file) + **stale folder-docs** (folder changed, its CONTEXT.md didn't) | Reports; Stop hook makes Claude reconcile |
| **Reconcile** | `.claude/skills/sync-docs/SKILL.md` | `/sync-docs` (manual) + Stop-hook auto-prompt | Prose that contradicts the snapshot | Claude edits the prose docs (DOCS ONLY) |

## How it runs

- **Every Claude Code session start** → the SessionStart hook runs `doc_sync.mjs --session`:
  refreshes `LIVE_STATE.md` and prints the live state + any FACT DRIFT into the session context,
  so Claude begins each session knowing the truth. (Wired in `.claude/settings.json`.)
- **End of every turn** → the Stop hook (`docs_check_stop_hook.mjs`) re-scans; on dead-ref/stale
  drift it asks Claude to do a focused, docs-only reconciliation (loop-guarded, runs at most once).
- **On demand / in Cowork** → run the `/sync-docs` skill (or `node scripts/doc_sync.mjs --write`).
  Cowork doesn't run the hooks, so `/sync-docs` is the way to sync there.

## The single source of live facts

`00_MASTER/LIVE_STATE.md` is **machine-generated** — never hand-edit it. It carries the live
Supabase counts (leads / cities / niches / market_insights / report_assets) + deploy state, and
changes **only when those facts change** (idempotent — no per-session git churn). Drift is detected
by comparing the live pull to the `<!-- FACTS … -->` block in the previous snapshot, so it works on
any machine with no extra cache file. Build-status truth still lives in
`00_MASTER/FMOS_System_Design_And_Tasks.md` + `FMOS_Execution_Roadmap.md`.

## Requirements
- Node ≥ 18 (global `fetch`).
- the app's `fmos/.env.local` with `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
  (read-only REST counts). If absent/offline, `doc_sync` fails open and keeps the last-known snapshot.

## Kill switches
- `DOC_SYNC=off` — disable the snapshot/SessionStart layer.
- `DOCS_STOP_HOOK=off` — disable the Stop-hook reconciliation.
- Remove the hook entries from `.claude/settings.json` to disable permanently.

## Manual commands
```bash
node scripts/doc_sync.mjs            # read-only report (git + DB + drift + docs_check)
node scripts/doc_sync.mjs --write    # also refresh 00_MASTER/LIVE_STATE.md if facts changed
node scripts/doc_sync.mjs --json     # machine-readable
node scripts/docs_check.mjs --mode worktree   # dead refs / stale folder-docs
```
