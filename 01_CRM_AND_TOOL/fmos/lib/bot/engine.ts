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

// ─── Main entry point ─────────────────────────────────────────────────────────

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

  // 2. Log inbound user turn first (always, even if we don't reply)
  await logTurn({ leadId, channel, role: "user", content: userText });

  // 3. Opt-out — check before anything else
  const escalation = checkUserEscalation(userText);
  if (escalation?.trigger === "opt_out") {
    await optOutLead(leadId);
    await sendWhatsAppText(phone, OPT_OUT_REPLY, { leadId });
    await logTurn({ leadId, channel, role: "assistant", content: OPT_OUT_REPLY, escalated: true });
    return { handled: true, reply: OPT_OUT_REPLY, skipped: "opt_out" };
  }

  // 4. Other escalation triggers
  if (escalation) {
    const { lead } = await fetchLeadName(leadId);
    const detail = `${lead} — ${escalation.summary}`;
    await sendAdminAlert(`Escalation: ${escalation.trigger.replace(/_/g, " ")}`, detail);
    if (escalation.pauseBot) await pauseBot(leadId);
    await sendWhatsAppText(phone, ESCALATION_HANDOFF_REPLY, { leadId });
    await logTurn({ leadId, channel, role: "assistant", content: ESCALATION_HANDOFF_REPLY, escalated: true });
    return { handled: true, reply: ESCALATION_HANDOFF_REPLY, skipped: "escalated", escalationTrigger: escalation.trigger };
  }

  // 5. Booking intent
  const booking = detectBookingIntent(userText);

  if (booking.hasIntent && booking.needsTime) {
    // Ask for time — no Anthropic call needed
    await sendWhatsAppText(phone, ASK_FOR_TIME_PROMPT, { leadId });
    await logTurn({ leadId, channel, role: "assistant", content: ASK_FOR_TIME_PROMPT });
    return { handled: true, reply: ASK_FOR_TIME_PROMPT, skipped: "needs_time" };
  }

  if (booking.hasIntent && booking.isoStart) {
    // Book directly
    const result = await bookMeeting({ leadId, startIso: booking.isoStart });
    const confirmMsg = result.ok
      ? `Done! Your meeting with Jabeer is set. ${result.meetLink ? `Join here: ${result.meetLink}` : "You'll receive the details shortly."} See you then!`
      : `I'll have Jabeer reach out to confirm a time — he'll WhatsApp you shortly!`;
    await sendWhatsAppText(phone, confirmMsg, { leadId });
    await logTurn({ leadId, channel, role: "assistant", content: confirmMsg });
    return { handled: true, reply: confirmMsg, skipped: "booking_confirmed" };
  }

  // 6. Anthropic call
  const history = await loadHistory(leadId, channel);
  const draft = await callAnthropic(history, userText);

  if (!draft) {
    // API error — static fallback
    const fallback = staticFallback();
    await sendWhatsAppText(phone, fallback, { leadId });
    await logTurn({ leadId, channel, role: "assistant", content: fallback });
    return { handled: true, reply: fallback };
  }

  // 7. Draft guardrail check
  const draftCheck = checkBotDraft(draft);

  if (!draftCheck.safe) {
    console.warn("[bot/engine] Draft rejected:", draftCheck.reason);

    // Log escalation if it warrants one
    if (draftCheck.escalation) {
      const { lead } = await fetchLeadName(leadId);
      await sendAdminAlert(
        `Bot draft rejected: ${draftCheck.escalation.trigger}`,
        `${lead} — ${draftCheck.escalation.summary}`
      );
      if (draftCheck.escalation.pauseBot) await pauseBot(leadId);
    }

    // Send the safe fallback instead
    await sendWhatsAppText(phone, GUARDRAIL_FALLBACK_REPLY, { leadId });
    await logTurn({ leadId, channel, role: "assistant", content: GUARDRAIL_FALLBACK_REPLY, escalated: !!draftCheck.escalation });
    return { handled: true, reply: GUARDRAIL_FALLBACK_REPLY, escalationTrigger: draftCheck.escalation?.trigger };
  }

  // 8. Send approved draft
  await sendWhatsAppText(phone, draft, { leadId });
  await logTurn({ leadId, channel, role: "assistant", content: draft });
  return { handled: true, reply: draft };
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
