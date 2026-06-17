/**
 * Guardrail + pricing-rejection logic for the FortuneMarq bot.
 *
 * Two passes:
 *   1. checkUserEscalation(userText) — run BEFORE the Anthropic call.
 *      Catches inbound triggers: price negotiation, complaints, human request.
 *
 *   2. checkBotDraft(draftText) — run AFTER the Anthropic call, BEFORE sending.
 *      Rejects the draft if it contains a made-up rupee amount, a results
 *      guarantee, or anything that matches an escalation pattern the model
 *      should have caught but didn't.
 *
 * Both return null (safe) or an EscalationReason describing why the thread
 * must be handed to Jabeer.
 */

export interface EscalationReason {
  trigger: string;       // short machine key, e.g. "price_negotiation"
  summary: string;       // human-readable, goes into the admin alert
  pauseBot: boolean;     // whether to set leads.bot_paused = true
}

// ─── Locked price set from pricing.md ────────────────────────────────────────
// Every rupee amount the bot is ALLOWED to state. Any amount outside this set
// in a bot draft triggers rejection. Amounts are stored as integers (paise-free).

export const LOCKED_PRICES: ReadonlySet<number> = new Set([
  3500,
  4500, 2500,
  5000,
  7000, 10000, 12000, 15000,
  5000, 8000,          // landing pages
  8000, 15000,         // standard website
  15000, 20000,        // premium website
]);

// ─── Inbound escalation patterns (user → bot) ────────────────────────────────

interface InboundPattern {
  trigger: string;
  summary: string;
  pauseBot: boolean;
  patterns: RegExp[];
}

const INBOUND_PATTERNS: InboundPattern[] = [
  {
    trigger: "price_negotiation",
    summary: "Lead asked for a discount or custom price",
    pauseBot: true,
    patterns: [
      /discount|cheaper|reduce(\s+the)?\s+(price|cost|rate)|nego(tiate)?|kam\s+karo|kam\s+price|price\s+kam|low(er)?\s+(price|cost|rate)/i,
      /can\s+you\s+(do|make)\s+it\s+(for\s+)?(less|cheaper|lower)/i,
      /too\s+expensive|can'?t\s+afford|out\s+of\s+(my\s+)?budget|budget\s+(is\s+)?(tight|low|less)/i,
    ],
  },
  {
    trigger: "human_request",
    summary: "Lead asked to speak to a human or the founder",
    pauseBot: true,
    patterns: [
      /speak\s+to\s+(a\s+)?(human|person|someone|agent|founder|jabeer|owner)/i,
      /talk\s+to\s+(a\s+)?(human|person|real|someone|jabeer)/i,
      /connect\s+me\s+(with|to)\s+(jabeer|founder|owner|someone|a\s+person)/i,
      /real\s+person|actual\s+person|not\s+(a\s+)?bot|not\s+automated/i,
      /call\s+me\s+(now|please|back)|please\s+call/i,
    ],
  },
  {
    trigger: "complaint",
    summary: "Lead expressed anger or dissatisfaction",
    pauseBot: true,
    patterns: [
      /worst|terrible|horrible|fraud|scam|cheat(ing)?|waste\s+of\s+(time|money)/i,
      /useless|pathetic|disgusting|angry|furious|fed\s+up|very\s+upset/i,
      /refund|money\s+back|cancel\s+(my\s+)?service|stop\s+(my\s+)?service/i,
      /complaint|complain|report\s+you|consumer\s+forum/i,
    ],
  },
  {
    trigger: "legal_contract",
    summary: "Lead raised a legal, contract, or refund question",
    pauseBot: true,
    patterns: [
      /legal|contract\s+(terms|clause|issue)|sue\s+you|court|lawyer|advocate/i,
      /refund\s+policy|money\s+back\s+guarantee|breach\s+of\s+contract/i,
    ],
  },
  {
    trigger: "opt_out",
    summary: "Lead requested opt-out / stop",
    pauseBot: true,
    patterns: [
      /^stop$/i,
      /\bstop\b.*messag|\bunsubscribe\b|\bopt.?out\b|\bdo not (contact|message|call)\b/i,
      /don'?t\s+(contact|message|call|whatsapp)\s+me/i,
    ],
  },
];

/**
 * Check a user's raw inbound message for escalation triggers.
 * Call this BEFORE the Anthropic API request.
 */
export function checkUserEscalation(userText: string): EscalationReason | null {
  for (const p of INBOUND_PATTERNS) {
    if (p.patterns.some((rx) => rx.test(userText))) {
      return { trigger: p.trigger, summary: p.summary, pauseBot: p.pauseBot };
    }
  }
  return null;
}

// ─── Bot draft guardrails ─────────────────────────────────────────────────────

/** Extract all rupee amounts from a string (₹ or Rs prefix, with/without commas). */
function extractRupeeAmounts(text: string): number[] {
  const amounts: number[] = [];
  // Matches ₹3,500 / ₹3500 / Rs 3500 / Rs. 3,500
  const rx = /(?:₹|Rs\.?\s*)(\d[\d,]*)/gi;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(text)) !== null) {
    const n = parseInt(m[1].replace(/,/g, ""), 10);
    if (!isNaN(n)) amounts.push(n);
  }
  return amounts;
}

/** Hard strings the bot must never output. */
const FORBIDDEN_DRAFT_PATTERNS: { pattern: RegExp; trigger: string; summary: string }[] = [
  {
    pattern: /guarantee(d)?(\s+(result|roi|return|ranking|lead|sale|conversion|traffic|top|first)|\s+you|\s+to\b|\s*!)/i,
    trigger: "guarantee_claim",
    summary: "Bot draft contained a results guarantee",
  },
  {
    pattern: /100\s*%\s*(guarantee|sure|certain|result)/i,
    trigger: "guarantee_claim",
    summary: "Bot draft contained a 100% guarantee claim",
  },
  {
    pattern: /\bother\s+client['s]?\s+data\b|\bconfidential\s+client\b/i,
    trigger: "client_data_leak",
    summary: "Bot draft referenced another client's private data",
  },
];

export interface DraftCheckResult {
  safe: boolean;
  /** Populated when safe=false — reason to log + use fallback reply */
  reason?: string;
  /** The specific escalation reason if this warrants pausing the bot */
  escalation?: EscalationReason;
}

/**
 * Validate a bot-generated draft BEFORE sending it.
 * Returns { safe: true } or { safe: false, reason, escalation? }.
 */
export function checkBotDraft(draftText: string): DraftCheckResult {
  // 1. Forbidden pattern check
  for (const { pattern, trigger, summary } of FORBIDDEN_DRAFT_PATTERNS) {
    if (pattern.test(draftText)) {
      return {
        safe: false,
        reason: `Forbidden pattern matched: ${trigger}`,
        escalation: { trigger, summary, pauseBot: false },
      };
    }
  }

  // 2. Pricing guard — reject any rupee amount not in the locked set
  const amounts = extractRupeeAmounts(draftText);
  for (const amount of amounts) {
    if (!LOCKED_PRICES.has(amount)) {
      return {
        safe: false,
        reason: `Unlocked price in draft: ₹${amount.toLocaleString("en-IN")}`,
        escalation: {
          trigger: "unlocked_price",
          summary: `Bot quoted ₹${amount.toLocaleString("en-IN")} which is not in pricing.md`,
          pauseBot: false,
        },
      };
    }
  }

  return { safe: true };
}

/**
 * Canned fallback reply when a draft is rejected by guardrails.
 * Safe to send — contains no prices, no guarantees.
 */
export const GUARDRAIL_FALLBACK_REPLY =
  "Let me connect you with Jabeer directly — he can walk you through everything. " +
  "You can WhatsApp him at +91 93530 82656 or I can set up a quick 15-min call. " +
  "Which works better for you?";

/**
 * Canned reply for opt-out.
 */
export const OPT_OUT_REPLY =
  "Got it — I've noted your preference and won't message you again. " +
  "If you ever want to connect, you're always welcome to reach out. Take care!";

/**
 * Canned reply when the bot is handing off to Jabeer (escalation).
 */
export const ESCALATION_HANDOFF_REPLY =
  "I'll get Jabeer to connect with you directly on this — he's the best person to help. " +
  "Expect a message from him shortly!";
