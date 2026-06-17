#!/usr/bin/env node
/**
 * docs_check.mjs — "docs never go stale" scanner.  Read-only, native Node, zero deps.
 *
 * Reports, for the repo's documentation (.md / CONTEXT / README):
 *   (a) DEAD REFERENCES — a link/path in a doc that points to a file that no longer exists.
 *   (b) STALE DOCS      — a folder had non-doc changes in the change-set, but the folder's
 *                         own doc (CONTEXT.md / README.md) was NOT updated alongside.
 *
 * Scope: DOCS ONLY. This script never writes anything — it only reads files and git metadata.
 *
 * Usage:
 *   node scripts/docs_check.mjs [--mode staged|worktree|all] [--base <ref>] [--json] [--show-unverified]
 *     --mode staged    change-set = staged files            (used by the git pre-commit hook)
 *     --mode worktree  change-set = staged+unstaged+untracked (default; used by the Stop hook)
 *     --mode all       change-set = working tree vs HEAD
 *     --base <ref>     change-set = diff against <ref>
 *     --json           machine-readable output (consumed by the Stop hook wrapper)
 *
 * Exit code: 2 if any DEAD references (so the pre-commit hook can block); else 0.
 * Staleness is a WARNING only (never changes the exit code).
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, dirname, join, extname, basename } from "node:path";

const SOURCE_OF_TRUTH = "00_MASTER/FMOS_System_Design_And_Tasks.md";
const ROADMAP = "00_MASTER/FMOS_Execution_Roadmap.md";

const argv = process.argv.slice(2);
const has = (n) => argv.includes(n);
const opt = (n, d) => {
  const i = argv.indexOf(n);
  if (i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--")) return argv[i + 1];
  const pre = argv.find((a) => a.startsWith(n + "="));
  return pre ? pre.slice(n.length + 1) : d;
};
const MODE = opt("--mode", "worktree");
const BASE = opt("--base", null);
const JSON_OUT = has("--json");

const g = (args) => execFileSync("git", args, { encoding: "utf8" });
const REPO = g(["rev-parse", "--show-toplevel"]).trim();
const gr = (args) => execFileSync("git", args, { cwd: REPO, encoding: "utf8" });
const lines = (s) => s.split("\n").map((x) => x.trim()).filter(Boolean);

// Repo top-level directories — used to decide whether a path is "anchored" (clearly repo-rooted).
const TOPLEVEL = new Set(
  readdirSync(REPO, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
);

// Doc inventory: tracked + untracked .md (so brand-new docs are scanned too).
const allDocs = Array.from(
  new Set([...lines(gr(["ls-files", "*.md"])), ...lines(gr(["ls-files", "--others", "--exclude-standard", "*.md"]))])
);
const isDoc = (f) => f.toLowerCase().endsWith(".md");
// "Owner" docs represent a folder's documentation.
const ownerDocs = new Set(allDocs.filter((f) => ["context.md", "readme.md"].includes(basename(f).toLowerCase())));

function changedFiles() {
  const A = ["--name-only", "--diff-filter=ACMR"];
  if (MODE === "staged") return lines(gr(["diff", "--cached", ...A]));
  if (BASE) return lines(gr(["diff", ...A, BASE]));
  if (MODE === "all") return lines(gr(["diff", ...A, "HEAD"]));
  // worktree (default)
  return Array.from(
    new Set([
      ...lines(gr(["diff", ...A])),
      ...lines(gr(["diff", "--cached", ...A])),
      ...lines(gr(["ls-files", "--others", "--exclude-standard"])),
    ])
  );
}

// Files whose change should NOT, on its own, mark a folder's doc stale.
const STALE_IGNORE = [
  /(^|\/)package-lock\.json$/, /(^|\/)pnpm-lock\.yaml$/, /(^|\/)yarn\.lock$/, /\.lock$/,
  /(^|\/)\.env/, /(^|\/)\.gitignore$/, /(^|\/)\.DS_Store$/, /(^|\/)\.git/,
];
const ignoredForStale = (f) => STALE_IGNORE.some((re) => re.test(f));

// Nearest ancestor folder that owns a CONTEXT.md / README.md.
function owningDoc(file) {
  let dir = dirname(file);
  while (true) {
    for (const name of ["CONTEXT.md", "README.md"]) {
      const cand = dir === "." ? name : join(dir, name);
      if (ownerDocs.has(cand)) return cand;
    }
    if (dir === "." || dir === "") break;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

// ── Dead-reference detection ───────────────────────────────────────────────
const KNOWN_EXT = new Set([
  ".md", ".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".sql", ".py", ".sh",
  ".css", ".html", ".yml", ".yaml", ".txt", ".pdf", ".docx", ".csv", ".toml",
]);
const cleanTarget = (t) => t.replace(/^<|>$/g, "").split("#")[0].replace(/:\d+(:\d+)?$/, "").trim();

function isPathLike(s) {
  if (!s) return false;
  if (/^(https?:|mailto:|tel:|data:|ftp:|#|\/\/)/i.test(s)) return false; // urls / anchors
  if (/^[a-zA-Z]:[\\/]/.test(s)) return false; // windows absolute (C:\...)
  if (s.startsWith("~")) return false; // home-relative
  if (/[*?<>{}|[\]]/.test(s)) return false; // glob / placeholder ([Niche], *.html, <domain>)
  if (s.includes("...")) return false; // ellipsis placeholder (a/.../b)
  if (/\s/.test(s)) return false; // paths with spaces → treat as prose, skip
  const hasSlash = s.includes("/");
  if (!hasSlash && !KNOWN_EXT.has(extname(s).toLowerCase())) return false;
  return true;
}

function refResolves(target, docDir) {
  const tries = target.startsWith("/")
    ? [join(REPO, target.slice(1))]
    : [resolve(REPO, docDir, target), resolve(REPO, target)];
  return tries.some((p) => existsSync(p));
}

const isAnchored = (s) => TOPLEVEL.has(s.replace(/^\.\//, "").split("/")[0]);

// Only block on refs we can resolve unambiguously: links, anchored paths, or explicit
// relative paths that contain a separator. Bare filenames / ambiguous bare `lib/x.ts`
// paths are reported as "unverified" (warning) instead of blocking the commit.
function blockworthy(target, kind) {
  if (!target.includes("/")) return false;
  if (kind === "link") return true;
  if (isAnchored(target)) return true;
  if (target.startsWith("./") || target.startsWith("../")) return true;
  return false;
}

function scanDoc(docPath) {
  const abs = resolve(REPO, docPath);
  if (!existsSync(abs)) return [];
  const docDir = dirname(docPath);
  const rows = readFileSync(abs, "utf8").split("\n");
  const out = [];
  let inFence = false;
  for (let i = 0; i < rows.length; i++) {
    const line = rows[i];
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; continue; } // skip fenced code blocks
    if (inFence) continue;
    const cands = [];
    for (const m of line.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g)) cands.push({ target: m[1], kind: "link" });
    for (const m of line.matchAll(/`([^`\n]+)`/g)) cands.push({ target: m[1], kind: "code" });
    for (const c of cands) {
      const t = cleanTarget(c.target);
      if (!isPathLike(t)) continue;
      if (refResolves(t, docDir)) continue;
      out.push({ doc: docPath, line: i + 1, ref: t, kind: c.kind, block: blockworthy(t, c.kind) });
    }
  }
  return out;
}

// ── Run ─────────────────────────────────────────────────────────────────────
const refs = allDocs.flatMap(scanDoc);
const dead = refs.filter((r) => r.block);
const unverified = refs.filter((r) => !r.block);

const changed = changedFiles();
const changedSet = new Set(changed);
const staleMap = new Map();
for (const f of changed) {
  if (isDoc(f) || ignoredForStale(f)) continue;
  const owner = owningDoc(f);
  if (!owner || changedSet.has(owner)) continue;
  if (!staleMap.has(owner)) staleMap.set(owner, new Set());
  staleMap.get(owner).add(dirname(f));
}
const stale = Array.from(staleMap, ([doc, folders]) => ({ doc, folders: Array.from(folders).sort() }));

const report = {
  mode: BASE ? `base:${BASE}` : MODE,
  scanned: allDocs.length,
  changed: changed.length,
  sourceOfTruth: [SOURCE_OF_TRUTH, ROADMAP],
  deadRefs: dead.map(({ doc, line, ref }) => ({ doc, line, ref })),
  stale,
  unverifiedCount: unverified.length,
};

if (JSON_OUT) {
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
} else {
  const p = (...a) => console.log(...a);
  p(`Docs check (mode: ${report.mode}) — ${report.scanned} docs scanned, ${report.changed} changed file(s)`);
  p("");
  if (dead.length) {
    p(`✗ DEAD REFERENCES (${dead.length})  [blocks commit]`);
    for (const r of dead) p(`   ${r.doc}:${r.line}  →  ${r.ref}`);
    p("");
  }
  if (stale.length) {
    p(`⚠ STALE DOCS (${stale.length})  [warning]`);
    for (const s of stale) p(`   ${s.doc}  ← changed but not updated: ${s.folders.join(", ")}`);
    p(`   reconcile against: ${SOURCE_OF_TRUTH} + ${ROADMAP}`);
    p("");
  }
  if (unverified.length && has("--show-unverified")) {
    p(`ℹ Unverified refs (${unverified.length})  [info — ambiguous base, not blocking]`);
    for (const r of unverified) p(`   ${r.doc}:${r.line}  →  ${r.ref}`);
    p("");
  }
  if (!dead.length && !stale.length) p("✓ No dead references, no stale docs.");
}

// Use exitCode (not process.exit) so piped stdout fully flushes before we exit.
process.exitCode = dead.length ? 2 : 0;
