/**
 * PHASE F STAGE 1 — Button-tap actions + auto-reply content.
 *
 * SOURCE OF TRUTH for the copy:
 * 03_SALES_SYSTEM/WhatsApp_Templates/FMOS_Template_Data/curiosity_templates.json
 * (autoReplies + buttonActions blocks). Mirrored here because the app can't
 * import outside its root. Keep in sync if templates change.
 *
 * All auto-replies are SESSION messages (sent inside the 24h window opened by
 * the lead's button tap) — no Meta template approval needed.
 */

export interface ButtonAction {
  /** tag appended to leads.tags */
  tag?: "tapped_book_meeting" | "tapped_tell_me_more" | "tapped_kannada_report";
  /** bump lead to top of the follow-up queue */
  priorityQueue: boolean;
  /** schedule follow-up N days out instead of bumping */
  followUpDays?: number;
  /** key into AUTO_REPLIES */
  autoReply?: keyof typeof AUTO_REPLIES;
  /** send the lead their market report in this language (cover + PDF) */
  sendReportLang?: "en" | "kn";
  /** human label for notifications / cockpit badge */
  label: string;
}

export const AUTO_REPLIES = {
  MEETING_REQUEST_REPLY: {
    message:
      "Perfect! 🙌 Jabeer will reach out shortly to confirm a time that works for you. You'll get a WhatsApp message with the Zoom link once it's booked.\n\nTalk soon!\n— FortuneMarq",
    buttons: [] as { id: string; title: string }[],
  },
  TELL_ME_MORE_REPLY: {
    message:
      "Thanks for your interest! 😊\n\nFortuneMarq is a digital marketing agency based right here in {{city}}. We build complete online growth systems for local businesses — website, Google visibility, lead generation, all connected and built specifically for your business.\n\nSee our work here: {{landingPageLink}}\n\nOur founder Jabeer does a free 15-minute Zoom call where he walks you through exactly what the opportunity looks like for {{businessName}}. No commitment, no pressure.\n\nWould you like to book that call?",
    buttons: [
      { id: "book_meeting", title: "Book a meeting 📅" },
      { id: "not_right_now", title: "Not right now" },
    ],
  },
  NOT_RIGHT_NOW_REPLY: {
    message: "No problem at all! We'll check back in a few days. 😊\n— FortuneMarq",
    buttons: [] as { id: string; title: string }[],
  },
} as const;

/**
 * Resolve a button tap (by payload id or visible title) to its FMOS action.
 * Matching is fuzzy on title so template wording tweaks don't break the flow.
 */
export function resolveButtonAction(idOrTitle: string): ButtonAction | null {
  const raw = idOrTitle || "";
  const norm = raw.toLowerCase().replace(/[^a-z_ ]/g, "").trim();
  // "ಕನ್ನಡ ವರದಿ" (Kannada report) — match the Kannada substring (norm strips it) or "kannada".
  if (raw.includes("ಕನ್ನಡ") || norm.includes("kannada")) {
    return {
      tag: "tapped_kannada_report",
      priorityQueue: false,
      sendReportLang: "kn",
      label: "Kannada report",
    };
  }
  if (norm.includes("book") && norm.includes("meeting")) {
    return {
      tag: "tapped_book_meeting",
      priorityQueue: true,
      autoReply: "MEETING_REQUEST_REPLY",
      label: "Book a meeting",
    };
  }
  if (norm.includes("tell") && norm.includes("more")) {
    return {
      tag: "tapped_tell_me_more",
      priorityQueue: true,
      autoReply: "TELL_ME_MORE_REPLY",
      label: "Tell me more",
    };
  }
  if (norm.includes("not") && (norm.includes("right now") || norm.includes("now"))) {
    return {
      priorityQueue: false,
      followUpDays: 3,
      autoReply: "NOT_RIGHT_NOW_REPLY",
      label: "Not right now",
    };
  }
  return null;
}

/** {{placeholder}} fill — same convention as the template system. */
export function fillTemplate(message: string, vars: Record<string, string | undefined>): string {
  return message.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}
