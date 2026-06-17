/**
 * Demo for lib/delivery/parseMilestones.ts — run with:
 *   node scripts/test_parse_milestones.mjs
 *
 * Pure JS mirror of the parser so we can eyeball the output on a sample paste
 * before wiring anything to the DB. The TS source is the source of truth; this
 * mirror exists only to demo without a TS loader.
 */

// ── inline mirror of the parser (kept in sync with parseMilestones.ts) ─────────
const MILESTONE_RX = /^\s*milestone\s*:\s*(.*?)\s*$/i;
const BULLET_RX = /^\s*[-*•·–]\s+(.+)$/;
const MONTHS = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };

function extractDue(text) {
  const paren = text.match(/^(.*?)\s*\(\s*due\s+([^)]+?)\s*\)\s*$/i);
  if (paren) return { rest: paren[1].trim(), dueRaw: paren[2].trim() };
  const bare = text.match(/^(.*?)\s+due\s+(\S.*?)\s*$/i);
  if (bare) return { rest: bare[1].trim(), dueRaw: bare[2].trim() };
  return { rest: text.trim(), dueRaw: null };
}
function extractOwner(text) {
  const m = text.match(/(^|\s)@([A-Za-z][\w.-]*)/);
  if (!m) return { rest: text.trim(), owner: null };
  const rest = (text.slice(0, m.index) + text.slice(m.index + m[0].length)).replace(/\s{2,}/g, " ").trim();
  return { rest, owner: m[2] };
}
function iso(y, mZero, d) {
  const dt = new Date(Date.UTC(y, mZero, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mZero || dt.getUTCDate() !== d) return null;
  return dt.toISOString().slice(0, 10);
}
function resolveYear(year, mZero, d, today) {
  if (year) return iso(year, mZero, d);
  const y = today.getFullYear();
  const candidate = iso(y, mZero, d);
  if (!candidate) return null;
  const cand = new Date(candidate + "T00:00:00Z");
  const six = new Date(today); six.setMonth(six.getMonth() - 6);
  if (cand < six) return iso(y + 1, mZero, d);
  return candidate;
}
function parseDueDate(raw, today = new Date()) {
  if (!raw) return null;
  const s = raw.trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return iso(+m[1], +m[2]-1, +m[3]);
  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (m) { const yr = +m[3] < 100 ? 2000 + +m[3] : +m[3]; return iso(yr, +m[2]-1, +m[1]); }
  m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,})\.?\s*(\d{4})?$/);
  if (m && MONTHS[m[2].slice(0,3).toLowerCase()] !== undefined) return resolveYear(+m[3]||0, MONTHS[m[2].slice(0,3).toLowerCase()], +m[1], today);
  m = s.match(/^([A-Za-z]{3,})\.?\s+(\d{1,2})(?:,?\s*(\d{4}))?$/);
  if (m && MONTHS[m[1].slice(0,3).toLowerCase()] !== undefined) return resolveYear(+m[3]||0, MONTHS[m[1].slice(0,3).toLowerCase()], +m[2], today);
  return null;
}
function parseMilestones(input, today = new Date()) {
  const warnings = [], milestones = [];
  let current = null, taskCount = 0;
  const ensureGeneral = () => {
    let g = milestones.find(m => m.isGeneral);
    if (!g) { g = { name:"General", dueRaw:null, dueIso:null, dueValid:true, isGeneral:true, tasks:[] }; milestones.unshift(g); warnings.push("Tasks appeared before any milestone — bucketed under “General”."); }
    return g;
  };
  for (const rawLine of (input||"").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const ms = line.match(MILESTONE_RX);
    if (ms) {
      const { rest, dueRaw } = extractDue(ms[1]);
      const dueIso = parseDueDate(dueRaw, today);
      const dueValid = dueRaw === null || dueIso !== null;
      if (dueRaw !== null && !dueValid) warnings.push(`Couldn’t read the date “${dueRaw}” for milestone “${rest}” — left blank.`);
      current = { name: rest || "Untitled milestone", dueRaw, dueIso, dueValid, isGeneral:false, tasks:[] };
      milestones.push(current);
      continue;
    }
    const bullet = line.match(BULLET_RX);
    const body = bullet ? bullet[1] : line;
    if (!bullet) warnings.push(`Line without a bullet treated as a task: “${body}”.`);
    const { rest: afterDue, dueRaw } = extractDue(body);
    const { rest: afterOwner, owner } = extractOwner(afterDue);
    const dueIso = parseDueDate(dueRaw, today);
    const dueValid = dueRaw === null || dueIso !== null;
    if (dueRaw !== null && !dueValid) warnings.push(`Couldn’t read the date “${dueRaw}” for task “${afterOwner}” — left blank.`);
    (current ?? ensureGeneral()).tasks.push({ title: afterOwner || body.trim(), owner, dueRaw, dueIso, dueValid });
    taskCount++;
  }
  return { milestones, warnings, taskCount };
}

// ── Sample paste (mimics a real Cowork dump, deliberately messy) ───────────────
const SAMPLE = `
- Kickoff call with client
- Collect brand assets @Jabeer

Milestone: Website Live (due 2026-07-05)
- Build homepage @Zaid due 28 Jun
- Wire contact form @Sufiyan
- SEO meta + sitemap due 2026-07-02

Milestone: GMB Optimised (due 12/07/2026)
- Verify listing @Jabeer
- Add 10 photos + services

Milestone: First Report
- Pull GA + GMB insights @Zaid due someday
Final QA pass before handover
`;

const today = new Date("2026-06-17T00:00:00Z");
const result = parseMilestones(SAMPLE, today);

console.log("=== PARSED MILESTONES (today = 2026-06-17) ===\n");
for (const m of result.milestones) {
  const due = m.dueIso ? `due ${m.dueIso}` : (m.dueRaw ? `due ?(${m.dueRaw})` : "no due date");
  console.log(`▸ ${m.name}${m.isGeneral ? " [auto-bucket]" : ""}  —  ${due}`);
  for (const t of m.tasks) {
    const owner = t.owner ? `@${t.owner}` : "unassigned";
    const td = t.dueIso ? t.dueIso : (t.dueRaw ? `?(${t.dueRaw})` : "—");
    console.log(`    • ${t.title}   [${owner}, due ${td}]`);
  }
  console.log("");
}

console.log(`Totals: ${result.milestones.length} milestones, ${result.taskCount} tasks`);
if (result.warnings.length) {
  console.log(`\nWarnings (${result.warnings.length}):`);
  for (const w of result.warnings) console.log(`  ⚠ ${w}`);
}
