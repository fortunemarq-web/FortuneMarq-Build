import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";

const PIPELINE_STAGES = [
  { key: "new", label: "New" },
  { key: "first_call_pending", label: "1st Call Pending" },
  { key: "calling", label: "Calling" },
  { key: "contacted", label: "Contacted" },
  { key: "qualified", label: "Qualified" },
  { key: "strategy_booked", label: "Strategy Booked" },
  { key: "strategy_completed", label: "Strategy Done" },
];

async function fetchPipelineData() {
  const supabase = await createServerClientWithCookies();

  const { data } = await supabase
    .from("leads")
    .select("status")
    .not("status", "in", '("closed_won","closed_lost","disqualified","nurture")');

  const counts: Record<string, number> = {};
  for (const stage of PIPELINE_STAGES) {
    counts[stage.key] = 0;
  }
  for (const lead of (data ?? []) as any[]) {
    if (counts[lead.status] !== undefined) {
      counts[lead.status]++;
    }
  }

  return counts;
}

export default async function PipelineSnapshot() {
  const counts = await fetchPipelineData();
  const maxCount = Math.max(...Object.values(counts), 1);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-full">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-bold text-slate-900">Pipeline Snapshot</h2>
        <span className="text-xs text-slate-400 font-medium">{total} active</span>
      </div>

      <div className="p-4 space-y-2">
        {PIPELINE_STAGES.map((stage) => {
          const count = counts[stage.key] ?? 0;
          const barPct = maxCount > 0 ? (count / maxCount) * 100 : 0;

          return (
            <Link
              key={stage.key}
              href={`/manager/pipeline`}
              className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50 transition-colors min-h-[44px]"
            >
              <span className="w-32 text-xs text-slate-600 font-medium truncate group-hover:text-slate-900 flex-shrink-0">
                {stage.label}
              </span>
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#42CA80] transition-all"
                  style={{ width: `${barPct}%` }}
                />
              </div>
              <span className="w-6 text-right text-xs font-bold font-mono tabular-nums text-slate-700 flex-shrink-0">
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="border-t border-slate-100 px-5 py-3">
        <Link
          href="/manager/pipeline"
          className="text-xs font-medium text-[#42CA80] hover:text-emerald-700 transition-colors"
        >
          View full pipeline →
        </Link>
      </div>
    </div>
  );
}
