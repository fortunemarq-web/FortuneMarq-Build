"use server";

/**
 * FortuneMarq Bot Engine — 6.1
 *
 * Entry point: runBot(opts)
 *
 * Flow:
 *   1. Load bot_threads history for the lead (last 20 turns)
 *   2. Check leads.bot_paused → skip if human has taken over
 *   3. checkUserEscalation → if triggered: send handoff reply, alert Jabeer, pause, return
 *   4. Detect booking intent BEFORE calling Anthropic
 *      a. If isoStart extracted → call bookMeeting directly, confirm in-thread
 *      b. If needsTime → send ASK_FOR_TIME_PROMPT (no Anthropic call needed)
 *   5. Call Anthropic (claude-haiku-4-5) with KB system prompt + history
 *   6. checkBotDraft on response → if rejected: send GUARDRAIL_FALLBACK_REPLY, log escalation
 *   7. Send the reply via sendWhatsAppText (session / 24h window)
 *   8. Log both turns to bot_threads
 *
 * Fallback: if Anthropic call errors → use static AUTO_REPLIES.TELL_ME_MORE_REPLY
 */

import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase-admin";
import { sendWhatsAppText } from "@/lib/whatsapp/send";
import { sendAdminAlert } from "@/lib/whatsapp/admin-alert";
import { bookMeeting } from "@/actions/book-meeting";
import { KB_SYSTEM_PROMPT } from "@/lib/bot/kb";
import {
  checkUserEscalation,
  checkBotDraft,
  GUARDRAIL_FALLBACK_REPLY,
  ESCALATION_HANDOFF_REPLY,
  OPT_OUT_REPLY,
} from "@/lib/bot/guardrails";
import {
  detectBookingIntent,
  ASK_FOR_TIME_PROMPT,
} from "@/lib/bot/booking-intent";
import { AUTO_REPLIES } from "@/lib/whatsapp/auto-replies";

const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const MAX_HISTORY_TURNS = 20; // user+assistant pairs kept in context
const MAX_REPLY_TOKENS = 300;

/**
 * SEND_MODE guard for the bot.
 *
 * When WHATSAPP_SEND_MODE=test the bot may only respond to inbound messages
 * that came from a WHATSAPP_TEST_RECIPIENTS number. This prevents the bot from
 * accidentally replying to real leads while QA is in progress.
 *
 * In live mode (or when the env var is absent) all senders are allowed.
 */
function isSenderAllowedInTestMode(senderPhone: string): boolean {
  const mode = process.env.WHATSAPP_SEND_MODE?.trim().toLowerCase();
  if (mode !== "test") return true; // live — allow all

  const raw = process.env.WHATSAPP_TEST_RECIPIENTS || "";
  const testNumbers = raw
    .split(",")
    .map((n) => n.trim().replace(/^\+/, "")) // strip leading +
    .filter(Boolean);

  const normalized = senderPhone.replace(/^\+/, "");
  return testNumbers.some(
    (t) => normalized === t || normalized.endsWith(t) || t.endsWith(normalized)
  );
}

export interface BotRunOpts {
  leadId: string;
  phone: string;         // E.164 sender phone (used to send reply)
  userText: string;      // raw inbound message text
  channel?: string;      // "whatsapp" | "web" | "instagram" — default "whatsapp"
  waMessageId?: string;
}

export interface BotRunResult {
  handled: boolean;
  reply?: string;
  skipped?: "bot_paused" | "opt_out" | "escalated" | "booking_confirmed" | "needs_time";
  escalationTrigger?: string;
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function isBotPaused(leadId: string): Promise<boolean> {
  const supabase = createAdminClient() as any;
  const { data } = await supabase
    .from("leads")
    .select("bot_paused")
    .eq("id", leadId)
    .maybeSingle();
  return data?.bot_paused === true;
}

async function pauseBot(leadId: string): Promise<void> {
  const supabase = createAdminClient() as any;
  await supabase.from("leads").update({ bot_paused: true }).eq("id", leadId);
}

async function optOutLead(leadId: string): Promise<void> {
  const supabase = createAdminClient() as any;
  await supabase
    .from("leads")
    .update({ wa_opt_out: true, bot_paused: true })
    .eq("id", leadId);
}

interface ThreadMessage {
  role: "user" | "assistant";
  content: string;
}

async function loadHistory(leadId: string, channel: string): Promise<ThreadMessage[]> {
  const supabase = createAdminClient() as any;
  const { data } = await supabase
    .from("bot_threads")
    .select("role, content")
    .eq("lead_id", leadId)
    .eq("channel", channel)
    .order("created_at", { ascending: false })
    .limit(MAX_HISTORY_TURNS);

  if (!data?.length) return [];
  // Reverse so oldest-first for Anthropic (it wants chronological order)
  return (data as ThreadMessage[]).reverse();
}

async function logTurn(opts: {
  leadId: string;
  channel: string;
  role: "user" | "assistant";
  content: string;
  escalated?: boolean;
}): Promise<void> {
  const supabase = createAdminClient() as any;
  await supabase.from("bot_threads").insert({
    lead_id: opts.leadId,
    channel: opts.channel,
    role: opts.role,
    content: opts.content,
    escalated: opts.escalated ?? false,
  });
}

// ─── Anthropic call ───────────────────────────────────────────────────────────

async function callAnthropic(
  history: ThreadMessage[],
  userText: string
): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  try {
    const client = new Anthropic({ apiKey: key });
    const messages: Anthropic.MessageParam[] = [
      ...history,
      { role: "user", content: userText },
    ];

    const response = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: MAX_REPLY_TOKENS,
      system: KB_SYSTEM_PROMPT,
      messages,
    });

    const block = response.content[0];
    if (block.type === "text") return block.text.trim();
    return null;
  } catch (e) {
    console.error("[bot/engine] Anthropic error:", e);
    return null;
  }
}

// ─── Static fallback ──────────────────────────────────────────────────────────

function staticFallback(): string {
  return AUTO_REPLIES.TELL_ME_MORE_REPLY.message
    .replace("{{city}}", "Hubli")
    .replace("{{landingPageLink}}", "https://fortunemarq.com")
    .replace("{{businessName}}", "your business");
}

// ─── Shared reply generator (channel-agnostic brain) ───────────────────────────

export interface GenerateReplyInput {
  userText: string;
  history: ThreadMessage[];
  channel: string;
  /** present once a lead exists (WhatsApp always; web after capture). When
   *  absent (anonymous web visitor) the DB-mutating side effects are skipped. */
  leadId?: string;
  /** label used in admin alerts when there is no leadId yet. */
  leadLabel?: string;
}

export interface GenerateReplyResult {
  reply: string;
  kind: "opt_out" | "escalated" | "needs_time" | "booking_confirmed" | "reply" | "guardrail_fallback";
  /** true when the visitor should be handed to a human (opt-out/escalation/rejected draft). */
  escalate: boolean;
  escalationTrigger?: string;
  /** the visitor expressed booking/contact intent — callers can surface a lead form. */
  bookingIntent: boolean;
  meetLink?: string;
  /** the opt-out confirmation must bypass the central opt-out send guard. */
  bypassOptOut?: boolean;
}

/**
 * The shared bot brain used by BOTH WhatsApp (runBot) and the website chat
 * (/api/webchat). It runs the identical guardrail + escalation + booking + KB
 * pipeline and returns the SAFE reply text plus classification flags. It does
 * NOT send any message and does NOT log turns — each caller does that for its
 * own channel (WhatsApp send vs. JSON to the browser). Cross-channel side
 * effects that must happen regardless of channel — admin escalation alerts,
 * pausing the bot, flagging opt-out, booking a meeting — run here, but every
 * DB mutation is guarded on `leadId` so an anonymous web visitor is safe.
 */
export async function generateBotReply(input: GenerateReplyInput): Promise<GenerateReplyResult> {
  const { userText, history, leadId } = input;
  const leadLabel = input.leadLabel || "Website visitor";

  // 1. Opt-out — check before anything else
  const escalation = checkUserEscalation(userText);
  if (escalation?.trigger === "opt_out") {
    if (leadId) await optOutLead(leadId);
    return { reply: OPT_OUT_REPLY, kind: "opt_out", escalate: true, escalationTrigger: "opt_out", bookingIntent: false, bypassOptOut: true };
  }

  // 2. Other escalation triggers — alert Jabeer + (if known lead) pause the bot
  if (escalation) {
    const label = leadId ? (await fetchLeadName(leadId)).lead : leadLabel;
    await sendAdminAlert(`Escalation: ${escalation.trigger.replace(/_/g, " ")}`, `${label} — ${escalation.summary}`);
    if (escalation.pauseBot && leadId) await pauseBot(leadId);
    return { reply: ESCALATION_HANDOFF_REPLY, kind: "escalated", escalate: true, escalationTrigger: escalation.trigger, bookingIntent: false };
  }

  // 3. Booking intent
  const booking = detectBookingIntent(userText);
  if (booking.hasIntent && booking.needsTime) {
    return { reply: ASK_FOR_TIME_PROMPT, kind: "needs_time", escalate: false, bookingIntent: true };
  }
  if (booking.hasIntent && booking.isoStart) {
    if (leadId) {
      const result = await bookMeeting({ leadId, startIso: booking.isoStart });
      const confirmMsg = result.ok
        ? `Done! Your meeting with Jabeer is set. ${result.meetLink ? `Join here: ${result.meetLink}` : "You'll receive the details shortly."} See you then!`
        : `I'll have Jabeer reach out to confirm a time — he'll WhatsApp you shortly!`;
      return { reply: confirmMsg, kind: "booking_confirmed", escalate: false, bookingIntent: true, meetLink: result.meetLink };
    }
    // Anonymous web visitor — we need their details before we can book.
    return { reply: ASK_FOR_TIME_PROMPT, kind: "needs_time", escalate: false, bookingIntent: true };
  }

  // 4. Anthropic call
  const draft = await callAnthropic(history, userText);
  if (!draft) {
    // API error — static fallback
    return { reply: staticFallback(), kind: "reply", escalate: false, bookingIntent: booking.hasIntent };
  }

  // 5. Draft guardrail check
  const draftCheck = checkBotDraft(draft);
  if (!draftCheck.safe) {
    console.warn("[bot/engine] Draft rejected:", draftCheck.reason);
    if (draftCheck.escalation) {
      const label = leadId ? (await fetchLeadName(leadId)).lead : leadLabel;
      await sendAdminAlert(`Bot draft rejected: ${draftCheck.escalation.trigger}`, `${label} — ${draftCheck.escalation.summary}`);
      if (draftCheck.escalation.pauseBot && leadId) await pauseBot(leadId);
    }
    return { reply: GUARDRAIL_FALLBACK_REPLY, kind: "guardrail_fallback", escalate: !!draftCheck.escalation, escalationTrigger: draftCheck.escalation?.trigger, bookingIntent: booking.hasIntent };
  }

  // 6. Approved draft
  return { reply: draft, kind: "reply", escalate: false, bookingIntent: booking.hasIntent };
}

// ─── Main entry point (WhatsApp) ───────────────────────────────────────────────

export async function runBot(opts: BotRunOpts): Promise<BotRunResult> {
  const { leadId, phone, userText, channel = "whatsapp" } = opts;

  // 1. SEND_MODE guard — in test mode only respond to test numbers
  if (!isSenderAllowedInTestMode(phone)) {
    return { handled: false, skipped: "bot_paused" }; // silent skip, real lead unaffected
  }

  // 2. Human takeover check
  if (await isBotPaused(leadId)) {
    return { handled: false, skipped: "bot_paused" };
  }

  // 3. Log inbound user turn first (always, even if we don't reply)
  await logTurn({ leadId, channel, role: "user", content: userText });

  // 4. Shared brain — identical guardrails/escalation/booking for every channel
  const history = await loadHistory(leadId, channel);
  const r = await generateBotReply({ userText, history, channel, leadId });

  // 5. Send + log (WhatsApp-specific). The opt-out confirmation must bypass the
  //    central opt-out send guard since we just flagged the lead.
  await sendWhatsAppText(phone, r.reply, { leadId, bypassOptOut: r.bypassOptOut });
  await logTurn({ leadId, channel, role: "assistant", content: r.reply, escalated: r.escalate });

  const skipped =
    r.kind === "opt_out" ? "opt_out" :
    r.kind === "escalated" ? "escalated" :
    r.kind === "needs_time" ? "needs_time" :
    r.kind === "booking_confirmed" ? "booking_confirmed" :
    undefined;
  return { handled: true, reply: r.reply, skipped, escalationTrigger: r.escalationTrigger };
}

// ─── Util ─────────────────────────────────────────────────────────────────────

async function fetchLeadName(leadId: string): Promise<{ lead: string }> {
  const supabase = createAdminClient() as any;
  const { data } = await supabase
    .from("leads")
    .select("company_name, city")
    .eq("id", leadId)
    .maybeSingle();
  const lead = [data?.company_name, data?.city].filter(Boolean).join(", ") || leadId;
  return { lead };
}
