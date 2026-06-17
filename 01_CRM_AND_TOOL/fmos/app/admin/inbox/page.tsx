import type { Metadata } from "next";
import { createServerClientWithCookies } from "@/lib/supabase-server";
import InboxClient, { type Conversation } from "./inbox-client";

export const metadata: Metadata = { title: "WhatsApp Inbox — FMOS" };
export const dynamic = "force-dynamic";

const ACTIVE_WINDOW_MS =
  (parseInt(process.env.WHATSAPP_ACTIVE_THREAD_HOURS || "24", 10) || 24) * 60 * 60 * 1000;

// How much recent history to scan when building the conversation list.
const LOG_SCAN = 800;
const THREAD_SCAN = 800;

type Dir = "in" | "out" | "bot";

function statusOf(c: {
  optedOut: boolean;
  escalated: boolean;
  botPaused: boolean;
  activeInbound: boolean;
}): Conversation["status"] {
  if (c.optedOut) return "opted_out";
  if (c.escalated) return "escalated";
  if (c.botPaused) return "paused";
  if (c.activeInbound) return "active";
  return "idle";
}

export default async function InboxPage() {
  const supabase = (await createServerClientWithCookies()) as any;

  // 1. Recent message history from both engines.
  const [logsRes, threadsRes] = await Promise.all([
    supabase
      .from("whatsapp_logs")
      .select("lead_id, message_sent, direction, sent_at, message_type")
      .not("lead_id", "is", null)
      .order("sent_at", { ascending: false })
      .limit(LOG_SCAN),
    supabase
      .from("bot_threads")
      .select("lead_id, role, content, escalated, created_at")
      .order("created_at", { ascending: false })
      .limit(THREAD_SCAN),
  ]);

  const logs = (logsRes.data ?? []) as any[];
  const threads = (threadsRes.data ?? []) as any[];

  // 2. Fold both streams into a per-lead accumulator.
  interface Acc {
    leadId: string;
    lastAt: number;
    lastText: string;
    lastDir: Dir;
    hasBot: boolean;
    escalated: boolean;
    messageCount: number;
  }
  const byLead = new Map<string, Acc>();

  const touch = (leadId: string): Acc => {
    let a = byLead.get(leadId);
    if (!a) {
      a = { leadId, lastAt: 0, lastText: "", lastDir: "in", hasBot: false, escalated: false, messageCount: 0 };
      byLead.set(leadId, a);
    }
    return a;
  };

  for (const l of logs) {
    if (!l.lead_id) continue;
    const a = touch(l.lead_id);
    a.messageCount++;
    const t = l.sent_at ? new Date(l.sent_at).getTime() : 0;
    if (t > a.lastAt) {
      a.lastAt = t;
      a.lastText = l.message_sent || `[${l.message_type || "message"}]`;
      a.lastDir = l.direction === "inbound" ? "in" : "out";
    }
  }

  for (const th of threads) {
    if (!th.lead_id) continue;
    const a = touch(th.lead_id);
    a.messageCount++;
    if (th.role === "assistant") a.hasBot = true;
    if (th.escalated) a.escalated = true;
    const t = th.created_at ? new Date(th.created_at).getTime() : 0;
    if (t > a.lastAt) {
      a.lastAt = t;
      a.lastText = th.content || "";
      a.lastDir = th.role === "assistant" ? "bot" : th.role === "user" ? "in" : "out";
    }
  }

  if (byLead.size === 0) {
    return <InboxClient conversations={[]} />;
  }

  // 3. Join the lead records for names + status flags.
  const leadIds = Array.from(byLead.keys());
  const { data: leadRows } = await supabase
    .from("leads")
    .select("id, company_name, contact_person, phone, bot_paused, wa_opt_out, last_inbound_at, assigned_sales_exec")
    .in("id", leadIds);

  const leadMap = new Map<string, any>((leadRows ?? []).map((r: any) => [r.id, r]));
  const now = Date.now();

  const conversations: Conversation[] = leadIds.map((id) => {
    const a = byLead.get(id)!;
    const lead = leadMap.get(id) || {};
    const activeInbound =
      !!lead.last_inbound_at && now - new Date(lead.last_inbound_at).getTime() < ACTIVE_WINDOW_MS;
    const optedOut = lead.wa_opt_out === true;
    const botPaused = lead.bot_paused === true;
    const status = statusOf({ optedOut, escalated: a.escalated, botPaused, activeInbound });
    // Needs attention: escalated, or the customer's last message is awaiting us.
    const needsAttention = a.escalated || (activeInbound && a.lastDir === "in");

    return {
      leadId: id,
      businessName: lead.company_name || "Unknown lead",
      contactName: lead.contact_person || null,
      phone: lead.phone || null,
      lastText: (a.lastText || "").slice(0, 160),
      lastAt: a.lastAt ? new Date(a.lastAt).toISOString() : null,
      lastDir: a.lastDir,
      hasBot: a.hasBot,
      botPaused,
      optedOut,
      escalated: a.escalated,
      activeInbound,
      status,
      messageCount: a.messageCount,
      needsAttention,
    };
  });

  // 4. Sort: needs-attention first (escalated above active), then most-recent.
  const rank = (c: Conversation) => (c.escalated ? 0 : c.needsAttention ? 1 : 2);
  conversations.sort((x, y) => {
    const r = rank(x) - rank(y);
    if (r !== 0) return r;
    return (y.lastAt ? Date.parse(y.lastAt) : 0) - (x.lastAt ? Date.parse(x.lastAt) : 0);
  });

  return <InboxClient conversations={conversations} />;
}
