/**
 * 4.5 — Plan deliverables parser.
 *
 * Turns a Cowork-style bulk paste into structured milestones + nested tasks.
 *
 * Expected format:
 *   Milestone: <name> (due <date>)
 *   - task
 *   - task @owner due <date>
 *   Milestone: <name>
 *   - task
 *
 * Rules:
 *   - Blank lines are ignored.
 *   - Milestone due date is optional: "Milestone: Foo" is valid.
 *   - Tasks may optionally carry "@owner" and "due <date>" inline; both optional.
 *   - Tasks appearing BEFORE the first milestone are bucketed under "General".
 *   - A line that is neither a milestone header nor blank is treated as a task
 *     (people paste lists with and without bullets) — flagged in warnings if it
 *     had no bullet marker.
 *   - Unparseable dates are kept as raw text with dueValid=false so the preview
 *     can warn before writing.
 *
 * Pure — no DB, no side effects. Safe to unit-test in isolation.
 */

export interface ParsedTask {
  title: string;
  owner: string | null;
  dueRaw: string | null;
  dueIso: string | null;   // ISO yyyy-mm-dd, or null
  dueValid: boolean;       // false when dueRaw is present but couldn't be parsed
}

export interface ParsedMilestone {
  name: string;
  dueRaw: string | null;
  dueIso: string | null;
  dueValid: boolean;
  isGeneral: boolean;      // the implicit catch-all bucket for orphan tasks
  tasks: ParsedTask[];
}

export interface ParseResult {
  milestones: ParsedMilestone[];
  warnings: string[];
  taskCount: number;
}

const MILESTONE_RX = /^\s*milestone\s*:\s*(.*?)\s*$/i;
const BULLET_RX = /^\s*[-*•·–]\s+(.+)$/;
const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** Pull a trailing "(due <date>)" or "due <date>" off the end of a string. */
function extractDue(text: string): { rest: string; dueRaw: string | null } {
  // Parenthesised form first: "... (due 20 Jun)"
  const paren = text.match(/^(.*?)\s*\(\s*due\s+([^)]+?)\s*\)\s*$/i);
  if (paren) return { rest: paren[1].trim(), dueRaw: paren[2].trim() };
  // Bare trailing form: "... due 2026-06-20"
  const bare = text.match(/^(.*?)\s+due\s+(\S.*?)\s*$/i);
  if (bare) return { rest: bare[1].trim(), dueRaw: bare[2].trim() };
  return { rest: text.trim(), dueRaw: null };
}

/** Pull an "@owner" token off a task body. */
function extractOwner(text: string): { rest: string; owner: string | null } {
  const m = text.match(/(^|\s)@([A-Za-z][\w.-]*)/);
  if (!m) return { rest: text.trim(), owner: null };
  const owner = m[2];
  const rest = (text.slice(0, m.index) + text.slice((m.index ?? 0) + m[0].length))
    .replace(/\s{2,}/g, " ")
    .trim();
  return { rest, owner };
}

/** Tolerant date parser. Returns ISO yyyy-mm-dd or null. */
export function parseDueDate(raw: string | null, today = new Date()): string | null {
  if (!raw) return null;
  const s = raw.trim();

  // ISO yyyy-mm-dd
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return iso(+m[1], +m[2] - 1, +m[3]);

  // dd/mm/yyyy or dd-mm-yyyy (Indian convention: day first)
  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (m) {
    const yr = +m[3] < 100 ? 2000 + +m[3] : +m[3];
    return iso(yr, +m[2] - 1, +m[1]);
  }

  // "20 Jun" / "20 Jun 2026" / "20 June"
  m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,})\.?\s*(\d{4})?$/);
  if (m && MONTHS[m[2].slice(0, 3).toLowerCase()] !== undefined) {
    const mon = MONTHS[m[2].slice(0, 3).toLowerCase()];
    return resolveYear(+m[3] || 0, mon, +m[1], today);
  }

  // "Jun 20" / "June 20, 2026" / "Jun 20 2026"
  m = s.match(/^([A-Za-z]{3,})\.?\s+(\d{1,2})(?:,?\s*(\d{4}))?$/);
  if (m && MONTHS[m[1].slice(0, 3).toLowerCase()] !== undefined) {
    const mon = MONTHS[m[1].slice(0, 3).toLowerCase()];
    return resolveYear(+m[3] || 0, mon, +m[2], today);
  }

  return null;
}

function iso(y: number, mZero: number, d: number): string | null {
  const dt = new Date(Date.UTC(y, mZero, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mZero || dt.getUTCDate() !== d) return null;
  return dt.toISOString().slice(0, 10);
}

/** When the year is omitted, pick this year — bump to next year if already well past. */
function resolveYear(year: number, mZero: number, d: number, today: Date): string | null {
  if (year) return iso(year, mZero, d);
  const y = today.getFullYear();
  const candidate = iso(y, mZero, d);
  if (!candidate) return null;
  // If the date is more than ~6 months in the past, assume they mean next year.
  const cand = new Date(candidate + "T00:00:00Z");
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  if (cand < sixMonthsAgo) return iso(y + 1, mZero, d);
  return candidate;
}

export function parseMilestones(input: string, today = new Date()): ParseResult {
  const warnings: string[] = [];
  const milestones: ParsedMilestone[] = [];
  let current: ParsedMilestone | null = null;
  let taskCount = 0;

  const lines = (input || "").split(/\r?\n/);

  const ensureGeneral = (): ParsedMilestone => {
    let general = milestones.find((m) => m.isGeneral);
    if (!general) {
      general = { name: "General", dueRaw: null, dueIso: null, dueValid: true, isGeneral: true, tasks: [] };
      // General always sits first
      milestones.unshift(general);
      warnings.push("Tasks appeared before any milestone — bucketed under “General”.");
    }
    return general;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue; // blank line

    const ms = line.match(MILESTONE_RX);
    if (ms) {
      const { rest, dueRaw } = extractDue(ms[1]);
      const dueIso = parseDueDate(dueRaw, today);
      const dueValid = dueRaw === null || dueIso !== null;
      if (dueRaw !== null && !dueValid) {
        warnings.push(`Couldn’t read the date “${dueRaw}” for milestone “${rest}” — left blank.`);
      }
      current = {
        name: rest || "Untitled milestone",
        dueRaw,
        dueIso,
        dueValid,
        isGeneral: false,
        tasks: [],
      };
      milestones.push(current);
      continue;
    }

    // Task line — bulleted or bare
    const bullet = line.match(BULLET_RX);
    const body = bullet ? bullet[1] : line;
    if (!bullet) {
      warnings.push(`Line without a bullet treated as a task: “${body}”.`);
    }

    const { rest: afterDue, dueRaw } = extractDue(body);
    const { rest: afterOwner, owner } = extractOwner(afterDue);
    const dueIso = parseDueDate(dueRaw, today);
    const dueValid = dueRaw === null || dueIso !== null;
    if (dueRaw !== null && !dueValid) {
      warnings.push(`Couldn’t read the date “${dueRaw}” for task “${afterOwner}” — left blank.`);
    }

    const task: ParsedTask = {
      title: afterOwner || body.trim(),
      owner,
      dueRaw,
      dueIso,
      dueValid,
    };

    const bucket = current ?? ensureGeneral();
    bucket.tasks.push(task);
    taskCount++;
  }

  return { milestones, warnings, taskCount };
}
