#!/usr/bin/env node
/**
 * docs_check_stop_hook.mjs — Claude Code **Stop** hook.
 *
 * Runs after Claude finishes a turn. Re-runs the docs scanner against the working tree and,
 * if it finds dead references or stale docs, returns `{decision:"block", reason:"…"}` so Claude
 * continues and performs a FOCUSED, doc-only reconciliation of just the flagged folders.
 *
 * Guards:
 *   • `stop_hook_active` (from the hook input) → exit 0, so we trigger the reconciliation at most
 *     once and never loop.
 *   • Kill switch: set env `DOCS_STOP_HOOK=off` to disable without editing settings.
 *
 * Scope is enforced in the reason text: DOCS ONLY — never code logic, data, or secrets.
 * This wrapper itself only reads; it never edits files.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SCANNER = resolve(dirname(fileURLToPath(import.meta.url)), "docs_check.mjs");

let input = {};
try { input = JSON.parse(readFileSync(0, "utf8") || "{}"); } catch { /* no stdin */ }

if (process.env.DOCS_STOP_HOOK === "off") process.exit(0);
if (input.stop_hook_active) process.exit(0); // already reconciling — let Claude stop

let report;
try {
  report = JSON.parse(execFileSync("node", [SCANNER, "--mode", "worktree", "--json"], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }));
} catch (e) {
  // scanner exits 2 on dead refs but still prints JSON to stdout
  try { report = JSON.parse(e.stdout || "{}"); } catch { process.exit(0); }
}

const dead = report.deadRefs || [];
const stale = report.stale || [];
if (!dead.length && !stale.length) process.exit(0);

let reason = "docs_check flagged documentation drift. Fix it now, DOCS ONLY — do not touch app source, data files, or secrets.\n\n";
if (dead.length) {
  reason += "DEAD REFERENCES (fix the path, update the doc, or remove the reference):\n";
  for (const r of dead) reason += `  • ${r.doc}:${r.line} → ${r.ref}\n`;
  reason += "\n";
}
if (stale.length) {
  reason += "STALE DOCS (these folders changed but their CONTEXT/README was not updated — run a FOCUSED reconciliation on ONLY these folders):\n";
  for (const s of stale) reason += `  • ${s.doc}  (changed: ${s.folders.join(", ")})\n`;
  reason += "\n";
}
reason +=
  "Reconcile against the source of truth: 00_MASTER/FMOS_System_Design_And_Tasks.md (newest dated progress entries) + 00_MASTER/FMOS_Execution_Roadmap.md. " +
  "For each flagged doc: refresh its 'Current status (date)' + progress to match what actually changed, and fix the dead references. " +
  "Keep every edit limited to .md docs in the flagged folders. After you finish, this check runs once more and then lets you stop.";

process.stdout.write(JSON.stringify({ decision: "block", reason }) + "\n");
process.exit(0);
