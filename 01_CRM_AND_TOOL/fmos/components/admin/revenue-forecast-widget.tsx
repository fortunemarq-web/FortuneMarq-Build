import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";
import { TrendingUp, Target, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

const MRR_TARGET = 0; // Build month — no target set yet (June 2026)
const CLOSE_RATE = 0.30;

export default async function RevenueForecastWidget() {
  const supabase = await createServerClientWithCookies();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  // Current MRR: paid mrr-type invoices this month
  const { data: mrrInvoices } = await supabase
    .from("invoices")
    .select("amount")
    .eq("revenue_type", "mrr")
    .eq("status", "paid")
    .gte("created_at", monthStart)
    .lte("created_at", monthEnd);

  // Pipeline: sent proposals
  const { data: sentProposals } = await supabase
    .from("proposals")
    .select("total_monthly")
    .eq("status", "sent");

  const currentMRR = (mrrInvoices || []).reduce((s: number, i: any) => s + (i.amount || 0), 0);
  const pipelineMonthly = (sentProposals || []).reduce((s: number, p: any) => s + (p.total_monthly || 0), 0);
  const proposalCount = (sentProposals || []).length;

  const projectedFull = currentMRR + pipelineMonthly;
  const projectedConservative = currentMRR + Math.round(pipelineMonthly * CLOSE_RATE);
  const hasTarget = MRR_TARGET > 0;
  const gapToTarget = hasTarget ? Math.max(0, MRR_TARGET - currentMRR) : 0;
  const targetHit = hasTarget && currentMRR >= MRR_TARGET;
  const progressPct = hasTarget ? Math.min(100, Math.round((currentMRR / MRR_TARGET) * 100)) : 0;

  const formatINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line px-5 py-4">
        <TrendingUp className="h-4 w-4 text-brand-deep" />
        <h3 className="font-display text-sm font-semibold text-slate-900">Revenue Forecast</h3>
      </div>

      <div className="space-y-5 p-5">
        {/* Current MRR */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">Current MRR</span>
            <div className="text-right">
              <span className="text-base font-semibold tabular-nums text-slate-900">{formatINR(currentMRR)}</span>
              {hasTarget && <span className="ml-1 text-xs text-slate-400">/ {formatINR(MRR_TARGET)} target</span>}
            </div>
          </div>
          {hasTarget ? (
            <>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">{progressPct}% of target</span>
                {targetHit ? (
                  <span className="text-[11px] font-semibold text-brand-deep">Target hit! Next: ₹1L MRR</span>
                ) : (
                  <span className="text-[11px] text-slate-400">{formatINR(gapToTarget)} to go</span>
                )}
              </div>
            </>
          ) : (
            <p className="mt-1 text-[11px] text-slate-400">Build month — no revenue target set</p>
          )}
        </div>

        {/* Pipeline */}
        {proposalCount > 0 && (
          <div className="space-y-3 rounded-lg bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Pipeline Forecast ({proposalCount} open proposal{proposalCount !== 1 ? "s" : ""})
            </p>

            {/* If all convert */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">If all proposals convert</span>
              <span className="text-sm font-semibold tabular-nums text-slate-900">{formatINR(projectedFull)}</span>
            </div>

            {/* Conservative */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Conservative (30% close rate)</span>
                <span className="text-sm font-semibold tabular-nums text-brand-deep">{formatINR(projectedConservative)}</span>
              </div>
              <span className="text-[11px] italic text-slate-400">(estimated close rate — updates with real data)</span>
            </div>

            {/* Pipeline value */}
            <div className="flex items-center justify-between border-t border-line pt-3">
              <span className="text-[11px] text-slate-400">Pipeline monthly value</span>
              <span className="text-xs font-semibold tabular-nums text-brand-deep">{formatINR(pipelineMonthly)}/mo potential</span>
            </div>
          </div>
        )}

        {proposalCount === 0 && (
          <div className="rounded-lg bg-slate-50 p-4 text-center text-slate-400">
            <p className="text-xs">No proposals in pipeline yet.</p>
            <Link href="/admin/proposals" className="mt-1 block text-xs font-semibold text-brand-deep hover:underline">View Proposals</Link>
          </div>
        )}

        {/* Gap to target — only shown when a target is set */}
        {hasTarget && !targetHit && (
          <div className={`flex items-center justify-between rounded-lg p-3 ${projectedConservative >= MRR_TARGET ? "border border-brand-line bg-brand-soft" : "border border-warn-line bg-warn-soft"}`}>
            <div className="flex items-center gap-2">
              <Target className={`h-4 w-4 ${projectedConservative >= MRR_TARGET ? "text-brand-deep" : "text-warn"}`} />
              <span className="text-xs font-semibold text-slate-700">
                {projectedConservative >= MRR_TARGET
                  ? "On track to hit target"
                  : `₹${(MRR_TARGET - projectedConservative).toLocaleString("en-IN")} short (conservative)`}
              </span>
            </div>
          </div>
        )}

        <Link href="/admin/finance" className="flex items-center justify-between pt-1 text-xs font-semibold text-slate-500 transition-colors hover:text-brand-deep">
          Full Finance Dashboard <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  );
}
