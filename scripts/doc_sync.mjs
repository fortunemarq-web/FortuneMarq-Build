#!/usr/bin/env node
/**
 * doc_sync.mjs — live ground-truth tracker for the FortuneMarq docs.
 *
 * The companion to docs_check.mjs. docs_check catches DEAD REFERENCES and STALE
 * folder-docs (file-mtime based). This script catches the other failure mode that
 * let the docs rot to "858 leads / 11 niches": **FACT DRIFT** — the live system
 * (Supabase counts, git/deploy state) moving away from what the prose docs assume.
 *
 * It:
 *   1. Reads git/deploy state + live Supabase counts (leads / cities / niches /
 *      market_insights / report_assets) via the REST API using 01_CRM_AND_TOOL/fmos/.env.local.
 *   2. Writes 00_MASTER/LIVE_STATE.md — the machine-owned snapshot — but ONLY when the
 *      facts actually change (idempotent; no per-session git churn). A `<!-- FACTS … -->`
 *      block makes the prior snapshot the drift baseline (works across machines, no cache file).
 *   3. Folds in docs_check (dead refs / stale folder-docs) for one combined status.
 *
 * Read-only by default. Flags:
 *   --write      persist LIVE_STATE.md when facts changed
 *   --session    --write + print a compact SessionStart context block (fail-open, fast)
 *   --json       machine-readable output
 *
 * Disable entirely: env DOC_SYNC=off.  Zero deps; native Node >= 18 (global fetch).
 * DOCS-ONLY: this script only ever writes 00_MASTER/LIVE_STATE.md. Never touches code/data/secrets.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const WRITE = has("--write") || has("--session");
const SESSION = has("--session");
const JSON_OUT = has("--json");

if (process.env.DOC_SYNC === "off") {
  if (!JSON_OUT && !SESSION) console.log("doc_sync: disabled (DOC_SYNC=off)");
  process.exit(0);
}

const HERE = dirname(fileURLToPath(import.meta.url));
let REPO;
try { REPO = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim(); }
catch { REPO = resolve(HERE, ".."); }

const g = (args, d = "") => {
  try { return execFileSync("git", args, { cwd: REPO, encoding: "utf8" }).trim(); }
  catch { return d; }
};

// ── git / deploy ground truth (always local, fast) ──────────────────────────
const branch = g(["rev-parse", "--abbrev-ref", "HEAD"], "?");
const head = g(["rev-parse", "--short", "HEAD"], "?");
const lastCommitDate = g(["log", "-1", "--format=%cs"], "?");
let ahead = "?", behind = "?";
const ab = g(["rev-list", "--left-right", "--count", `origin/${branch}...HEAD`], "");
if (ab) { const m = ab.split(/\s+/); behind = m[0]; ahead = m[1]; }
const deployState = (branch === "main" || branch === "continue-on-mac")
  ? "LIVE (Vercel · fmos.fortunemarq.com)"
  : `feature branch (${branch}) — not the deploy branch`;

// ── live Supabase counts (fail-open, time-boxed) ────────────────────────────
async function pullSupabase() {
  const envPath = join(REPO, "01_CRM_AND_TOOL/fmos/.env.local");
  if (!existsSync(envPath)) return { ok: false, reason: "no .env.local on this machine" };
  let env;
  try { env = readFileSync(envPath, "utf8"); } catch { return { ok: false, reason: "cannot read .env.local" }; }
  const pick = (k) => (env.match(new RegExp("^" + k + "=(.+)$", "m")) || [])[1]?.trim().replace(/^['"]|['"]$/g, "");
  const url = pick("NEXT_PUBLIC_SUPABASE_URL");
  const key = pick("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return { ok: false, reason: "missing SUPABASE url/key in .env.local" };
  const auth = { apikey: key, Authorization: `Bearer ${key}` };
  const timed = async (fn, ms = 5000) => {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), ms);
    try { return await fn(c.signal); } catch { return null; } finally { clearTimeout(t); }
  };
  const count = (table) => timed(async (signal) => {
    const r = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`,
      { headers: { ...auth, Prefer: "count=exact", Range: "0-0" }, signal });
    const n = parseInt((r.headers.get("content-range") || "").split("/")[1], 10);
    return Number.isFinite(n) ? n : null;
  });
  const rows = (table, sel) => timed(async (signal) => {
    const r = await fetch(`${url}/rest/v1/${table}?select=${sel}`, { headers: auth, signal });
    return r.ok ? await r.json() : null;
  });

  const [leads, mi, report_assets] = await Promise.all([
    count("leads"),
    rows("market_insights", "city,industry"), // 117 tiny rows → exact distinct cities/niches
    count("report_assets"),
  ]);
  let cities = null, niches = null, market_insights = null;
  if (Array.isArray(mi)) {
    market_insights = mi.length;
    cities = new Set(mi.map((r) => r.city)).size;
    niches = new Set(mi.map((r) => r.industry)).size;
  }
  const ok = leads != null || market_insights != null || report_assets != null;
  return ok ? { ok, leads, cities, niches, market_insights, report_assets } : { ok: false, reason: "no rows returned (auth/network?)" };
}

// ── prior snapshot (drift baseline) from the committed LIVE_STATE.md ─────────
const liveStatePath = join(REPO, "00_MASTER/LIVE_STATE.md");
function priorFacts() {
  if (!existsSync(liveStatePath)) return null;
  try {
    const m = readFileSync(liveStatePath, "utf8").match(/<!--\s*FACTS\s*(\{.*?\})\s*-->/s);
    return m ? JSON.parse(m[1]) : null;
  } catch { return null; }
}
function priorDate() {
  if (!existsSync(liveStatePath)) return null;
  const m = readFileSync(liveStatePath, "utf8").match(/\*\*Facts last changed:\*\*\s*([0-9-]+)/);
  return m ? m[1] : null;
}

const db = await pullSupabase();
const prev = priorFacts() || {};

// merge: only overwrite a field with a fresh non-null value; keep prior on a blip
const FACT_KEYS = ["leads", "cities", "niches", "market_insights", "report_assets", "branch", "deployState"];
const live = { branch, deployState };
if (db.ok) for (const k of ["leads", "cities", "niches", "market_insights", "report_assets"])
  if (db[k] != null) live[k] = db[k];
const facts = {};
for (const k of FACT_KEYS) facts[k] = live[k] != null ? live[k] : (prev[k] != null ? prev[k] : null);

const drift = [];
for (const k of FACT_KEYS) {
  if (prev[k] != null && facts[k] != null && String(prev[k]) !== String(facts[k]))
    drift.push({ field: k, from: prev[k], to: facts[k] });
}
const factsChanged = drift.length > 0 || priorFacts() === null;

// ── docs_check (dead refs / stale folder-docs) ──────────────────────────────
let dc = { deadRefs: [], stale: [], scanned: 0 };
try {
  dc = JSON.parse(execFileSync("node", [join(HERE, "docs_check.mjs"), "--mode", "worktree", "--json"],
    { cwd: REPO, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }));
} catch (e) { try { dc = JSON.parse(e.stdout || "{}"); } catch { /* ignore */ } }

// ── render + (optionally) write LIVE_STATE.md ───────────────────────────────
const today = new Date().toISOString().slice(0, 10);
const factsChangedDate = factsChanged ? today : (priorDate() || today);
const f = (v) => (v == null ? "—" : v);
const ratio = (facts.report_assets && facts.market_insights)
  ? `${(facts.report_assets / facts.market_insights).toFixed(0)} (expect 8 = 4 types × EN/KN)` : "—";

const md = `# FMOS — LIVE STATE (auto-generated)
<!-- AUTO-GENERATED by scripts/doc_sync.mjs — DO NOT EDIT BY HAND.
     Regenerate: node scripts/doc_sync.mjs --write   (refreshes only when the facts below change) -->
<!-- FACTS ${JSON.stringify(facts)} -->
**Facts last changed:** ${factsChangedDate}

Machine-tracked snapshot of the live system. The prose docs — \`CONTINUE_HERE.md\`,
the \`00_MASTER/\` set, \`CLAUDE.md\` — must not contradict this. When this file changes,
reconcile them (run the \`sync-docs\` skill, or fix by hand).

## Live ground truth
| Field | Value |
|---|---|
| Deploy | ${f(facts.deployState)} |
| Leads | **${f(facts.leads)}** |
| Cities | **${f(facts.cities)}** |
| Niches | **${f(facts.niches)}** |
| market_insights rows | **${f(facts.market_insights)}** (= cities × niches) |
| report_assets rows | **${f(facts.report_assets)}** |
| report_assets ÷ market_insights | ${ratio} |

> Live counts come from Supabase via \`scripts/doc_sync.mjs\` (service-role REST, read-only).
> Git HEAD / ahead-behind and the docs_check status are session-volatile and are NOT stored
> here — they are printed by \`doc_sync\` at session start. Source of truth for build status:
> \`00_MASTER/FMOS_System_Design_And_Tasks.md\` + \`FMOS_Execution_Roadmap.md\`.
`;

let wrote = false;
if (WRITE && factsChanged && db.ok) { writeFileSync(liveStatePath, md); wrote = true; }
else if (WRITE && !existsSync(liveStatePath) && (db.ok || prev.leads != null)) { writeFileSync(liveStatePath, md); wrote = true; }

// ── output ──────────────────────────────────────────────────────────────────
const status = {
  generatedDate: today,
  git: { branch, head, lastCommitDate, ahead, behind },
  facts,
  dbReached: db.ok, dbReason: db.ok ? null : db.reason,
  drift,
  docsCheck: { deadRefs: (dc.deadRefs || []).length, stale: (dc.stale || []).length, scanned: dc.scanned || 0 },
  liveStateWritten: wrote,
};

if (JSON_OUT) { process.stdout.write(JSON.stringify(status, null, 2) + "\n"); process.exit(0); }

const dead = status.docsCheck.deadRefs, stale = status.docsCheck.stale;
const driftLine = drift.length
  ? `⚠ FACT DRIFT — reconcile the prose docs: ${drift.map((d) => `${d.field} ${d.from}→${d.to}`).join(", ")}`
  : "✓ no fact drift since last snapshot";
const dbLine = db.ok
  ? `data: ${f(facts.leads)} leads · ${f(facts.cities)} cities · ${f(facts.niches)} niches · ${f(facts.market_insights)} market_insights · ${f(facts.report_assets)} report_assets`
  : `data: Supabase not reached (${db.reason}) — using last-known snapshot`;

if (SESSION) {
  // Compact context injected into each Claude Code session.
  const lines = [
    `[doc_sync] FMOS live state — ${today}`,
    `- branch ${branch} (HEAD ${head}, last ${lastCommitDate}; ${ahead} ahead / ${behind} behind origin) · deploy ${facts.deployState}`,
    `- ${dbLine}`,
    `- docs_check: ${dead} dead refs, ${stale} stale folder-docs (${status.docsCheck.scanned} scanned)`,
    `- ${driftLine}`,
  ];
  if (drift.length || dead || stale)
    lines.push(`- to reconcile: run the /sync-docs skill (DOCS-ONLY; ground truth = 00_MASTER/LIVE_STATE.md + the 00_MASTER set).`);
  if (wrote) lines.push(`- 00_MASTER/LIVE_STATE.md refreshed (facts changed).`);
  process.stdout.write(lines.join("\n") + "\n");
  process.exit(0);
}

// default human report
console.log(`doc_sync — FortuneMarq docs ground-truth (${today})`);
console.log("");
console.log(`  git     : ${branch} @ ${head} (last ${lastCommitDate}; ${ahead} ahead / ${behind} behind origin)`);
console.log(`  deploy  : ${facts.deployState}`);
console.log(`  ${dbLine}`);
console.log(`  reports : ${ratio} per niche×city`);
console.log(`  docs    : ${dead} dead refs, ${stale} stale folder-docs (${status.docsCheck.scanned} scanned)`);
console.log(`  drift   : ${driftLine}`);
console.log(`  write   : ${wrote ? "LIVE_STATE.md refreshed" : (WRITE ? "no change (facts unchanged or DB unreached)" : "(read-only; pass --write to persist)")}`);
process.exit(0);
