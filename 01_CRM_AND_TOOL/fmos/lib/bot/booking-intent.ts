/**
 * Booking-intent detection + date/time extraction for the FortuneMarq bot.
 *
 * detectBookingIntent(text) → { hasIntent, isoStart?, needsTime }
 *
 * If the lead says "yes book it" or "let's meet tomorrow at 3pm" we extract
 * an ISO datetime in IST; if they express intent but no time, needsTime=true
 * so the bot asks for a slot.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30

/** Return today's date in IST as a Date (midnight IST). */
function todayIST(): Date {
  const now = new Date();
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  istNow.setUTCHours(0, 0, 0, 0);
  return new Date(istNow.getTime() - IST_OFFSET_MS);
}

// ─── Intent patterns ──────────────────────────────────────────────────────────

const BOOKING_INTENT_PATTERNS: RegExp[] = [
  /\b(book|schedule|set\s+up|arrange|fix)\s+(a\s+)?(call|meeting|demo|appointment|zoom|meet)\b/i,
  /\b(yes|yeah|sure|ok|okay|sounds\s+good|let'?s\s+do\s+it|go\s+ahead)\b.*\b(call|meeting|book)\b/i,
  /\b(call|meeting|book)\b.*\b(yes|yeah|sure|ok|okay|sounds\s+good)\b/i,
  /i'?d?\s+(like|want|love)\s+(to\s+)?(book|schedule|talk|speak|chat|meet)/i,
  /when\s+(is|are)\s+(jabeer|you)\s+(free|available)/i,
  /free\s+(call|chat|talk)|quick\s+(call|chat|talk)/i,
  /let'?s\s+(talk|meet|connect|chat)/i,
  /\bbook\s+it\b|\bset\s+it\s+up\b|\bconfirm\s+(the\s+)?(call|meeting|slot)\b/i,
];

export function hasBookingIntent(text: string): boolean {
  return BOOKING_INTENT_PATTERNS.some((rx) => rx.test(text));
}

// ─── Day extraction ───────────────────────────────────────────────────────────

function extractDayOffset(text: string): number | null {
  if (/\btoday\b|\babhi\b|\baaj\b/i.test(text)) return 0;
  if (/\btomorrow\b|\bkal\b|\bkaal\b/i.test(text)) return 1;
  if (/\bday\s+after\s+tomorrow\b|\bparso\b/i.test(text)) return 2;

  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const todayDow = new Date(todayIST().getTime() + IST_OFFSET_MS).getUTCDay();
  for (let i = 0; i < weekdays.length; i++) {
    if (new RegExp(`\\b${weekdays[i]}\\b`, "i").test(text)) {
      const diff = (i - todayDow + 7) % 7 || 7; // next occurrence (min 1 day out)
      return diff;
    }
  }
  return null;
}

// ─── Time extraction ──────────────────────────────────────────────────────────

/** Returns { hour, minute } in 24h IST, or null. */
function extractTime(text: string): { hour: number; minute: number } | null {
  // "3pm", "3:30pm", "15:00", "3 pm", "3:30 pm"
  const rx = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i;
  const m = rx.exec(text);
  if (!m) return null;

  let hour = parseInt(m[1], 10);
  const minute = m[2] ? parseInt(m[2], 10) : 0;
  const meridiem = m[3]?.toLowerCase();

  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;

  // Reject clearly out-of-range or unlikely values
  if (hour < 7 || hour > 22 || minute > 59) return null;

  return { hour, minute };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface BookingIntentResult {
  hasIntent: boolean;
  /** ISO 8601 string in UTC if both day + time could be extracted */
  isoStart?: string;
  /** True when intent is present but time is missing — bot should ask */
  needsTime: boolean;
}

export function detectBookingIntent(text: string): BookingIntentResult {
  if (!hasBookingIntent(text)) {
    return { hasIntent: false, needsTime: false };
  }

  const dayOffset = extractDayOffset(text);
  const time = extractTime(text);

  if (dayOffset === null || time === null) {
    return { hasIntent: true, needsTime: true };
  }

  // Build ISO start: todayIST + dayOffset days + time in IST → UTC
  const base = todayIST();
  base.setDate(base.getDate() + dayOffset);
  // Set IST time by adding offset
  const istMs =
    base.getTime() +
    IST_OFFSET_MS +
    time.hour * 3600_000 +
    time.minute * 60_000;
  const isoStart = new Date(istMs - IST_OFFSET_MS).toISOString();

  return { hasIntent: true, isoStart, needsTime: false };
}

/** Prompt the bot asks when intent is clear but time is unknown. */
export const ASK_FOR_TIME_PROMPT =
  "What day and time works best for you? " +
  "(e.g. \"tomorrow at 3pm\" or \"Monday 11am\") — I'll get it booked right away.";
