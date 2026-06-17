"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

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
      .select("id, message_sent, direction, sent_at, message_type, template_name")
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
      meta: l.template_name || undefined,
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
