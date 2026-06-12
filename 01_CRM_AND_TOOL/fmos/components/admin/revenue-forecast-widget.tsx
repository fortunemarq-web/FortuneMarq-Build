import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";
import { TrendingUp, Target, ArrowRight } from "lucide-react";

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
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-slate-900">Revenue Forecast</h3>
      </div>

      <div className="p-5 space-y-5">
        {/* Current MRR */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">Current MRR</span>
            <div className="text-right">
              <span className="text-base font-bold font-mono text-slate-900">{formatINR(currentMRR)}</span>
              {hasTarget && <span className="text-xs text-slate-400 ml-1">/ {formatINR(MRR_TARGET)} target</span>}
            </div>
          </div>
          {hasTarget ? (
            <>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${targetHit ? "bg-emerald-500" : "bg-indigo-500"}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] text-slate-400">{progressPct}% of target</span>
                {targetHit ? (
                  <span className="text-[10px] font-bold text-emerald-600">🎯 Target hit! Next: ₹1L MRR</span>
                ) : (
                  <span className="text-[10px] text-slate-400">{formatINR(gapToTarget)} to go</span>
                )}
              </div>
            </>
          ) : (
            <p className="text-[10px] text-slate-400 mt-1">Build month — no revenue target set</p>
          )}
        </div>

        {/* Pipeline */}
        {proposalCount > 0 && (
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Pipeline Forecast ({proposalCount} open proposal{proposalCount !== 1 ? "s" : ""})
            </p>

            {/* If all convert */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">If all proposals convert</span>
              <span className="text-sm font-bold font-mono text-slate-900">{formatINR(projectedFull)}</span>
            </div>

            {/* Conservative */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Conservative (30% close rate)</span>
                <span className="text-sm font-bold font-mono text-indigo-600">{formatINR(projectedConservative)}</span>
              </div>
              <span className="text-[10px] text-slate-400 italic">(estimated close rate — updates with real data)</span>
            </div>

            {/* Pipeline value */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Pipeline monthly value</span>
              <span className="text-xs font-semibold font-mono text-emerald-600">{formatINR(pipelineMonthly)}/mo potential</span>
            </div>
          </div>
        )}

        {proposalCount === 0 && (
          <div className="bg-slate-50 rounded-xl p-4 text-center text-slate-400">
            <p className="text-xs">No proposals in pipeline yet.</p>
            <Link href="/admin/proposals" className="text-xs font-semibold text-indigo-600 hover:underline mt-1 block">View Proposals</Link>
          </div>
        )}

        {/* Gap to target — only shown when a target is set */}
        {hasTarget && !targetHit && (
          <div className={`rounded-xl p-3 flex items-center justify-between ${projectedConservative >= MRR_TARGET ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
            <div className="flex items-center gap-2">
              <Target className={`h-4 w-4 ${projectedConservative >= MRR_TARGET ? "text-emerald-600" : "text-amber-600"}`} />
              <span className="text-xs font-semibold text-slate-700">
                {projectedConservative >= MRR_TARGET
                  ? "On track to hit target"
                  : `₹${(MRR_TARGET - projectedConservative).toLocaleString("en-IN")} short (conservative)`}
              </span>
            </div>
          </div>
        )}

        <Link href="/admin/finance" className="flex items-center justify-between text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors pt-1">
          Full Finance Dashboard <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
