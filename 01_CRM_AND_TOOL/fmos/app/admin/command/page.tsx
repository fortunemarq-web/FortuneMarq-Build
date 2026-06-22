import { createServerClientWithCookies } from "@/lib/supabase-server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DollarSign, Users, Trophy, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

// Funnel buckets are cumulative (reached-this-stage-or-beyond), mapped from
// lib/pipeline.ts outreach_stage values.
const ENGAGED = ["curiosity_sent", "pdf_sent", "follow_up_due", "gatekeeper", "revival", "meeting_booked", "proposal_sent", "won"];
const MEETINGS = ["meeting_booked", "proposal_sent", "won"];
const PROPOSALS = ["proposal_sent", "won"];

function inr(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
}
function pct(part: number, whole: number) {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

export default async function CommandCenterPage() {
  const sb = (await createServerClientWithCookies()) as any;
  const leads = () => sb.from("leads").select("id", { count: "exact", head: true });

  const [
    total, touch1, engaged, meetings, proposals, won,
    inbound, outbound, wonInbound, wonOutbound,
    activeClients, unpaidInvoices,
  ] = await Promise.all([
    leads(),
    leads().eq("outreach_stage", "touch1_pending"),
    leads().in("outreach_stage", ENGAGED),
    leads().in("outreach_stage", MEETINGS),
    leads().in("outreach_stage", PROPOSALS),
    leads().eq("outreach_stage", "won"),
    leads().eq("lead_type", "inbound"),
    leads().eq("lead_type", "outbound"),
    leads().eq("outreach_stage", "won").eq("lead_type", "inbound"),
    leads().eq("outreach_stage", "won").eq("lead_type", "outbound"),
    sb.from("clients").select("monthly_value").eq("status", "active"),
    sb.from("invoices").select("total_amount, paid_amount").not("status", "in", "(paid,cancelled,draft)"),
  ]);

  const totalLeads = total.count || 0;
  const contacted = totalLeads - (touch1.count || 0);

  const steps = [
    { label: "Leads", count: totalLeads },
    { label: "Contacted", count: contacted },
    { label: "Engaged", count: engaged.count || 0 },
    { label: "Meetings", count: meetings.count || 0 },
    { label: "Proposals", count: proposals.count || 0 },
    { label: "Won", count: won.count || 0 },
  ];

  const activeRows = (activeClients.data || []) as { monthly_value: number | null }[];
  const mrr = activeRows.reduce((s, c) => s + (Number(c.monthly_value) || 0), 0);
  const clientCount = activeRows.length;
  const outstanding = ((unpaidInvoices.data || []) as { total_amount: number | null; paid_amount: number | null }[])
    .reduce((s, i) => s + ((Number(i.total_amount) || 0) - (Number(i.paid_amount) || 0)), 0);

  const inboundN = inbound.count || 0;
  const outboundN = outbound.count || 0;
  const otherN = Math.max(0, totalLeads - inboundN - outboundN);
  const sources = [
    { label: "Outbound", leads: outboundN, won: wonOutbound.count || 0 },
    { label: "Inbound", leads: inboundN, won: wonInbound.count || 0 },
    { label: "Other / unset", leads: otherN, won: Math.max(0, (won.count || 0) - (wonInbound.count || 0) - (wonOutbound.count || 0)) },
  ];

  const kpis = [
    { label: "MRR (active clients)", value: inr(mrr), icon: DollarSign },
    { label: "Active clients", value: String(clientCount), icon: Users },
    { label: "Won (all-time)", value: String(won.count || 0), icon: Trophy },
    { label: "Outstanding", value: inr(outstanding), icon: AlertCircle },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Command Center" subtitle="The whole business on one screen — every engine, leads to MRR." />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><k.icon className="h-4 w-4" /> {k.label}</div>
            <div className="text-2xl font-semibold mt-2">{k.value}</div>
          </Card>
        ))}
      </div>

      {/* Funnel */}
      <Card className="p-5">
        <div className="text-sm font-semibold mb-4">Conversion funnel</div>
        <div className="space-y-3">
          {steps.map((s, i) => {
            const prev = i === 0 ? s.count : steps[i - 1].count;
            const width = pct(s.count, totalLeads || 1);
            return (
              <div key={s.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">{s.label}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {s.count.toLocaleString("en-IN")}
                    {i > 0 && <span className="ml-2 text-xs">({pct(s.count, prev)}% of prev · {pct(s.count, totalLeads)}% of leads)</span>}
                  </span>
                </div>
                <div className="h-7 rounded-md bg-muted/40 overflow-hidden">
                  <div className="h-full rounded-md bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all" style={{ width: `${Math.max(width, s.count > 0 ? 2 : 0)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-4">Cumulative — each stage counts leads that reached it or beyond. Mapped from the pipeline stages.</p>
      </Card>

      {/* Source split */}
      <Card className="p-5">
        <div className="text-sm font-semibold mb-4">By source / engine</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border/60">
                <th className="py-2 font-medium">Source</th>
                <th className="py-2 font-medium text-right">Leads</th>
                <th className="py-2 font-medium text-right">Won</th>
                <th className="py-2 font-medium text-right">Win rate</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.label} className="border-b border-border/40 last:border-0">
                  <td className="py-2.5">{s.label}</td>
                  <td className="py-2.5 text-right tabular-nums">{s.leads.toLocaleString("en-IN")}</td>
                  <td className="py-2.5 text-right tabular-nums">{s.won.toLocaleString("en-IN")}</td>
                  <td className="py-2.5 text-right tabular-nums">{pct(s.won, s.leads)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
