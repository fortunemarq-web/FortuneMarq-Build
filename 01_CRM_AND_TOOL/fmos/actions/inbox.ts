"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";
import { sendWhatsAppText } from "@/lib/whatsapp/send";
import { revalidatePath } from "next/cache";

/**
 * Human agent reply from the WhatsApp Inbox. Pauses the bot (take over), then
 * sends a free-typed message via the WhatsApp API. Only valid inside the 24h
 * window after the customer's last message; outside it WhatsApp requires a
 * template, so we surface a clear error.
 */
export async function sendInboxReply(
  leadId: string,
  text: string
): Promise<{ ok: boolean; error?: string; at?: string }> {
  const body = (text || "").trim();
  if (!body) return { ok: false, error: "Type a message first." };
  if (body.length > 4000) return { ok: false, error: "Message too long." };

  const supabase = (await createServerClientWithCookies()) as any;
  const { data: auth } = await supabase.auth.getUser();
  const { data: lead } = await supabase
    .from("leads")
    .select("phone")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead?.phone) return { ok: false, error: "This lead has no phone number." };

  // Taking over: pause the bot so it doesn't also reply to this thread.
  await supabase.from("leads").update({ bot_paused: true }).eq("id", leadId);

  // Human reply: not subject to the bulk daily cap. Opt-out is still respected.
  const r = await sendWhatsAppText(lead.phone, body, {
    leadId,
    sentBy: auth?.user?.id ?? null,
    bypassThrottle: true,
  });

  if (!r.success) {
    let error = r.error || "Send failed.";
    if (r.suppressed === "opted_out") error = "This lead has opted out of WhatsApp.";
    else if (r.suppressed) error = `Blocked (${r.suppressed}).`;
    else if (/131047|re-?engagement|24[\s-]?hour|outside.*window/i.test(error))
      error = "Outside the 24-hour window — the customer must message again, or send an approved template.";
    return { ok: false, error };
  }

  revalidatePath("/admin/inbox");
  return { ok: true, at: new Date().toISOString() };
}

export interface TranscriptEntry {
  id: string;
  at: string;
  dir: "in" | "out" | "bot";
  text: string;
  source: "log" | "thread";
  meta?: string;
}

export async function toggleBotPaused(
  leadId: string,
  currentlyPaused: boolean
): Promise<{ ok: boolean; paused: boolean; error?: string }> {
  const supabase = (await createServerClientWithCookies()) as any;
  const { error } = await supabase
    .from("leads")
    .update({ bot_paused: !currentlyPaused })
    .eq("id", leadId);

  if (error) return { ok: false, paused: currentlyPaused, error: error.message };
  revalidatePath("/admin/inbox");
  return { ok: true, paused: !currentlyPaused };
}

export async function getTranscript(
  leadId: string
): Promise<{ ok: boolean; entries?: TranscriptEntry[]; error?: string }> {
  const supabase = (await createServerClientWithCookies()) as any;

  const [logsRes, threadsRes] = await Promise.all([
    supabase
      .from("whatsapp_logs")
      .select("id, message_sent, direction, sent_at, message_type")
      .eq("lead_id", leadId)
      .order("sent_at", { ascending: true })
      .limit(500),
    supabase
      .from("bot_threads")
      .select("id, role, content, created_at, escalated")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: true })
      .limit(500),
  ]);

  if (logsRes.error) return { ok: false, error: logsRes.error.message };
  if (threadsRes.error) return { ok: false, error: threadsRes.error.message };

  const entries: TranscriptEntry[] = [];

  for (const l of logsRes.data ?? []) {
    const dir: "in" | "out" =
      l.direction === "inbound" || l.direction === "in" ? "in" : "out";
    entries.push({
      id: `log-${l.id}`,
      at: l.sent_at || "",
      dir,
      text: l.message_sent || `[${l.message_type || "message"}]`,
      source: "log",
      meta: (l.message_sent || "").match(/\[template:([^\]]+)\]/)?.[1] || undefined,
    });
  }

  for (const th of threadsRes.data ?? []) {
    const dir: "in" | "out" | "bot" =
      th.role === "assistant" ? "bot" : th.role === "user" ? "in" : "out";
    entries.push({
      id: `thread-${th.id}`,
      at: th.created_at || "",
      dir,
      text: th.content || "",
      source: "thread",
      meta: th.escalated ? "escalated" : undefined,
    });
  }

  entries.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));

  return { ok: true, entries };
}
