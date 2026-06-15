import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { verifyCronSecret } from "@/lib/cron-auth";
import { sendDailyReport } from "@/lib/reports/dailyReport";

/**
 * Daily digest — one in-app notification per user summarising what needs
 * attention today: meetings, due follow-ups, overdue invoices, overdue tasks.
 * Schedule once per morning (see vercel.json). Idempotent per day.
 */
export async function POST(req: NextRequest) {
  const denied = verifyCronSecret(req);
  if (denied) return denied;

  const supabase = createAdminClient() as any;

  try {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart.getTime() + 86400000);

    const renewalHorizon = new Date(todayStart.getTime() + 30 * 86400000);

    const [{ data: admins }, { data: meetings }, { data: followUps }, { data: invoices }, { data: tasks }, { data: renewals }] =
      await Promise.all([
        supabase.from("profiles").select("id").eq("role", "admin"),
        supabase
          .from("leads")
          .select("id, company_name, follow_up_date")
          .eq("outreach_stage", "meeting_booked")
          .lt("follow_up_date", tomorrowStart.toISOString()),
        supabase
          .from("leads")
          .select("id, assigned_sales_exec")
          .in("outreach_stage", ["follow_up_due", "no_answer", "follow_back"])
          .lt("follow_up_date", tomorrowStart.toISOString()),
        supabase
          .from("invoices")
          .select("id, total_amount, paid_amount, clients(business_name)")
          .not("status", "in", "(paid,cancelled,draft)")
          .lt("due_date", todayStart.toISOString()),
        supabase
          .from("tasks")
          .select("id, assigned_to")
          .neq("status", "completed")
          .lt("due_date", todayStart.toISOString()),
        supabase
          .from("clients")
          .select("id, business_name, renewal_date, monthly_value")
          .eq("status", "active")
          .not("renewal_date", "is", null)
          .lt("renewal_date", renewalHorizon.toISOString()),
      ]);

    const adminIds: string[] = (admins || []).map((a: any) => a.id);

    // Per-user digest lines. Admins see everything; assignees see their own.
    const lines: Record<string, string[]> = {};
    const add = (userId: string | null, line: string) => {
      if (!userId) return;
      (lines[userId] ??= []).push(line);
    };

    const meetingCount = (meetings || []).length;
    if (meetingCount > 0) {
      const preview = (meetings || []).slice(0, 3).map((m: any) => m.company_name).join(", ");
      adminIds.forEach((id) =>
        add(id, `📅 ${meetingCount} meeting${meetingCount === 1 ? "" : "s"} due/overdue (${preview}${meetingCount > 3 ? "…" : ""})`)
      );
    }

    const fuByUser: Record<string, number> = {};
    let fuUnassigned = 0;
    (followUps || []).forEach((l: any) => {
      if (l.assigned_sales_exec) fuByUser[l.assigned_sales_exec] = (fuByUser[l.assigned_sales_exec] || 0) + 1;
      else fuUnassigned++;
    });
    Object.entries(fuByUser).forEach(([uid, n]) => add(uid, `📞 ${n} follow-up${n === 1 ? "" : "s"} due`));
    const fuTotal = (followUps || []).length;
    if (fuTotal > 0) adminIds.forEach((id) => add(id, `📞 ${fuTotal} follow-ups due across the team${fuUnassigned ? ` (${fuUnassigned} unassigned)` : ""}`));

    const invCount = (invoices || []).length;
    if (invCount > 0) {
      const outstanding = (invoices || []).reduce(
        (sum: number, i: any) => sum + (Number(i.total_amount) || 0) - (Number(i.paid_amount) || 0), 0);
      adminIds.forEach((id) =>
        add(id, `💰 ${invCount} overdue invoice${invCount === 1 ? "" : "s"} — ₹${Math.round(outstanding).toLocaleString("en-IN")} outstanding`)
      );
    }

    // Marketing: yesterday's spend + new inbound leads, for admins
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);
    const [{ data: ySpend }, { data: yLeads }] = await Promise.all([
      supabase
        .from("ad_insights_daily")
        .select("spend")
        .eq("date", yesterdayStart.toISOString().split("T")[0]),
      supabase
        .from("leads")
        .select("id, lead_source")
        .eq("lead_type", "inbound")
        .gte("captured_at", yesterdayStart.toISOString())
        .lt("captured_at", todayStart.toISOString()),
    ]);
    const spendTotal = (ySpend || []).reduce((s: number, r: any) => s + Number(r.spend || 0), 0);
    if (spendTotal > 0 || (yLeads || []).length > 0) {
      const bySource: Record<string, number> = {};
      (yLeads || []).forEach((l: any) => { bySource[l.lead_source || "Unknown"] = (bySource[l.lead_source || "Unknown"] || 0) + 1; });
      const srcStr = Object.entries(bySource).map(([s, n]) => `${n} ${s}`).join(", ");
      adminIds.forEach((id) =>
        add(id, `📣 Yesterday: ₹${Math.round(spendTotal).toLocaleString("en-IN")} ad spend, ${(yLeads || []).length} inbound lead${(yLeads || []).length === 1 ? "" : "s"}${srcStr ? ` (${srcStr})` : ""}`)
      );
    }

    // At-risk clients: overdue money or renewal within 30 days
    const atRiskNames = new Set<string>();
    (invoices || []).forEach((i: any) => { if (i.clients?.business_name) atRiskNames.add(i.clients.business_name); });
    (renewals || []).forEach((c: any) => atRiskNames.add(c.business_name));
    if (atRiskNames.size > 0) {
      const list = [...atRiskNames].slice(0, 4).join(", ");
      const renewalMrr = (renewals || []).reduce((s: number, c: any) => s + (Number(c.monthly_value) || 0), 0);
      adminIds.forEach((id) =>
        add(id, `⚠️ ${atRiskNames.size} at-risk client${atRiskNames.size === 1 ? "" : "s"} (${list}${atRiskNames.size > 4 ? "…" : ""})${renewalMrr ? ` — ₹${Math.round(renewalMrr).toLocaleString("en-IN")}/mo MRR up for renewal` : ""}`)
      );
    }

    const taskByUser: Record<string, number> = {};
    (tasks || []).forEach((t: any) => {
      if (t.assigned_to) taskByUser[t.assigned_to] = (taskByUser[t.assigned_to] || 0) + 1;
    });
    Object.entries(taskByUser).forEach(([uid, n]) => add(uid, `✅ ${n} overdue task${n === 1 ? "" : "s"}`));
    const taskTotal = (tasks || []).length;
    if (taskTotal > 0) adminIds.forEach((id) => add(id, `✅ ${taskTotal} overdue tasks across the team`));

    // One digest per user per day (skip users already notified today)
    const userIds = Object.keys(lines);
    if (userIds.length === 0) return NextResponse.json({ success: true, sent: 0, reason: "nothing to report" });

    const { data: existing } = await supabase
      .from("notifications")
      .select("user_id")
      .eq("title", "Daily Digest")
      .gte("created_at", todayStart.toISOString())
      .in("user_id", userIds);
    const alreadySent = new Set((existing || []).map((e: any) => e.user_id));

    const inserts = userIds
      .filter((uid) => !alreadySent.has(uid))
      .map((uid) => ({
        user_id: uid,
        type: "system",
        title: "Daily Digest",
        body: [...new Set(lines[uid])].join("\n"),
        link: adminIds.includes(uid) ? "/admin" : "/tasks",
      }));

    if (inserts.length > 0) {
      const { error } = await supabase.from("notifications").insert(inserts);
      if (error) throw error;
    }

    // AI daily report → admin WhatsApp (non-fatal: never let this break the digest).
    let whatsappReport: any = { sent: 0, skipped: "not attempted" };
    try {
      whatsappReport = await sendDailyReport(supabase);
    } catch (e: any) {
      whatsappReport = { sent: 0, error: e?.message || "report failed" };
    }

    return NextResponse.json({ success: true, sent: inserts.length, skippedAlreadySent: alreadySent.size, whatsappReport });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// Vercel Cron invokes via GET; same handler, same secret check.
export { POST as GET };
