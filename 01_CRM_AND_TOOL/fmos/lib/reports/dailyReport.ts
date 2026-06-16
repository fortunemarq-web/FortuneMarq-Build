// Phase 1 of the FMOS AI assistant: a daily activity report, summarised by Claude,
// delivered to admin WhatsApp numbers. SERVER-SIDE ONLY (uses service-role + API keys).
//
// Wiring: called from /api/cron/daily-digest (runs daily via GitHub Actions / Vercel cron).
//
// Config (env, added when ready — code no-ops safely until then):
//   ADMIN_WHATSAPP_NUMBERS      comma-separated, e.g. "917975918980,919353082656"
//   DAILY_REPORT_TEMPLATE       approved Meta template name (default "daily_report")
//   DAILY_REPORT_TEMPLATE_LANG  template language code (default "en")
//
// Meta template to submit (named params report_date + summary):
//   Body:  "FortuneMarq Daily — {{report_date}}\n\n{{summary}}\n\nOpen FMOS for full detail."
//   (Static newlines in the template body are fine; the {{summary}} VALUE must stay single-line,
//    which buildDailySummary() guarantees.)

import { sendWhatsAppTemplate } from "@/lib/whatsapp/send";
import { ANTHROPIC_MODELS } from "@/lib/ai-models";

export interface DailyMetrics {
  date: string;          // e.g. "15 Jun"
  newLeads: number;
  calls: number;
  meetingsBooked: number;
  proposalsSent: number;
  dealsWon: number;
  followUpsDue: number;
  overdueInvoices: number;
  outstanding: number;   // ₹ outstanding across overdue invoices
  adSpendYesterday: number;
  inboundYesterday: number;
}

export function fmtINR(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

/** Pull the day's activity from real tables (admin client passed in). */
export async function gatherDailyMetrics(supabase: any): Promise<DailyMetrics> {
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart.getTime() + 86400000);
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const iso = (d: Date) => d.toISOString();

  const [
    newLeadsRes, callsRes, meetingsRes, proposalsRes, agreementsRes,
    followUpsRes, invoicesRes, ySpendRes, yInboundRes,
  ] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", iso(todayStart)),
    supabase.from("outreach_logs").select("id", { count: "exact", head: true }).eq("touch_type", "call").gte("created_at", iso(todayStart)),
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("meeting_booked_at", iso(todayStart)),
    supabase.from("proposals").select("id", { count: "exact", head: true }).eq("status", "sent").gte("sent_at", iso(todayStart)),
    supabase.from("agreements").select("id", { count: "exact", head: true }).eq("status", "confirmed").gte("confirmed_at", iso(todayStart)),
    supabase.from("leads").select("id", { count: "exact", head: true }).in("outreach_stage", ["follow_up_due", "no_answer", "follow_back"]).lt("follow_up_date", iso(tomorrowStart)),
    supabase.from("invoices").select("total_amount, paid_amount").not("status", "in", "(paid,cancelled,draft)").lt("due_date", iso(todayStart)),
    supabase.from("ad_insights_daily").select("spend").eq("date", iso(yesterdayStart).split("T")[0]),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("lead_type", "inbound").gte("captured_at", iso(yesterdayStart)).lt("captured_at", iso(todayStart)),
  ]);

  const invoices = (invoicesRes.data as any[]) || [];
  const outstanding = invoices.reduce((s, i) => s + (Number(i.total_amount) || 0) - (Number(i.paid_amount) || 0), 0);
  const adSpend = ((ySpendRes.data as any[]) || []).reduce((s, r) => s + Number(r.spend || 0), 0);

  return {
    date: now.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    newLeads: newLeadsRes.count || 0,
    calls: callsRes.count || 0,
    meetingsBooked: meetingsRes.count || 0,
    proposalsSent: proposalsRes.count || 0,
    dealsWon: agreementsRes.count || 0,
    followUpsDue: followUpsRes.count || 0,
    overdueInvoices: invoices.length,
    outstanding,
    adSpendYesterday: adSpend,
    inboundYesterday: yInboundRes.count || 0,
  };
}

/** Deterministic single-line summary — the fallback when AI is unavailable. */
export function deterministicSummary(m: DailyMetrics): string {
  const parts = [
    `${m.calls} calls`,
    `${m.newLeads} new leads`,
    `${m.meetingsBooked} meetings booked`,
    `${m.proposalsSent} proposals sent`,
    `${m.dealsWon} deals closed`,
    `${m.followUpsDue} follow-ups due`,
  ];
  if (m.overdueInvoices > 0) parts.push(`⚠️ ${m.overdueInvoices} overdue invoices (${fmtINR(m.outstanding)})`);
  if (m.adSpendYesterday > 0 || m.inboundYesterday > 0) parts.push(`yest: ${fmtINR(m.adSpendYesterday)} ads → ${m.inboundYesterday} inbound`);
  return parts.join(" · ");
}

/** Ask Claude for a crisp single-line WhatsApp summary. Returns null on any failure. */
async function aiSummary(m: DailyMetrics): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: ANTHROPIC_MODELS.smart,
        max_tokens: 300,
        temperature: 0.3,
        system:
          "You write the daily WhatsApp summary for FortuneMarq, a marketing agency CRM. " +
          "Given today's metrics, write ONE single line (no newlines, no markdown), max ~280 chars, " +
          "plain text with ' · ' separators. Lead with the most important number. Be specific and " +
          "action-oriented. A couple of emoji are fine. Flag anything that needs attention.",
        messages: [{ role: "user", content: `Today's metrics (JSON): ${JSON.stringify(m)}` }],
      }),
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    const text = (data?.content?.[0]?.text || "").trim();
    return text || null;
  } catch {
    return null;
  }
}

/** Single-line, WhatsApp-template-safe summary (AI if available, else deterministic). */
export async function buildDailySummary(m: DailyMetrics): Promise<string> {
  const raw = (await aiSummary(m)) || deterministicSummary(m);
  // Template parameter values must be single-line and not have long whitespace runs.
  return raw.replace(/\s*\n+\s*/g, " · ").replace(/\s{3,}/g, " ").trim().slice(0, 900);
}

/**
 * Build + send the daily report to admin WhatsApp numbers.
 * Idempotent per day (won't double-send). No-ops safely if numbers/template missing.
 */
export async function sendDailyReport(supabase: any): Promise<{ sent: number; skipped?: string; results?: any[] }> {
  const numbersRaw = (process.env.ADMIN_WHATSAPP_NUMBERS || "").trim();
  if (!numbersRaw) return { sent: 0, skipped: "ADMIN_WHATSAPP_NUMBERS not configured" };
  const numbers = numbersRaw.split(",").map((n) => n.trim()).filter(Boolean);
  if (numbers.length === 0) return { sent: 0, skipped: "no admin numbers" };

  const templateName = process.env.DAILY_REPORT_TEMPLATE || "daily_report";
  const lang = process.env.DAILY_REPORT_TEMPLATE_LANG || "en";

  // Dedupe: skip if a daily report already went out today.
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  try {
    const { data: prior } = await supabase
      .from("whatsapp_logs")
      .select("id")
      .eq("message_type", "template")
      .ilike("message_sent", `%${templateName}%`)
      .gte("created_at", todayStart.toISOString())
      .limit(1);
    if (prior && prior.length > 0) return { sent: 0, skipped: "already sent today" };
  } catch {
    // If the dedupe check fails, continue — better a possible duplicate than no report.
  }

  const metrics = await gatherDailyMetrics(supabase);
  const summary = await buildDailySummary(metrics);

  const components = [
    {
      type: "body",
      parameters: [
        { type: "text", text: metrics.date },
        { type: "text", text: summary },
      ],
    },
  ];

  const results: any[] = [];
  let sent = 0;
  for (const phone of numbers) {
    const r = await sendWhatsAppTemplate(phone, templateName, { language: lang, components });
    results.push({ phone, success: r.success, error: r.error });
    if (r.success) sent++;
  }
  return { sent, results };
}
