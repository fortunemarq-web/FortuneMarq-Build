import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";
import { BarChart2, ArrowRight } from "lucide-react";

const SYSTEM_COLORS = [
  { borderColor: "#42CA80", barColor: "bg-[#42CA80]", textColor: "text-[#42CA80]" },
  { borderColor: "#3b82f6", barColor: "bg-blue-500", textColor: "text-blue-600" },
  { borderColor: "#a855f7", barColor: "bg-purple-500", textColor: "text-purple-600" },
];

async function fetchBuildSummary() {
  const supabase = await createServerClientWithCookies();

  const { data } = await supabase
    .from("build_tracker_modules" as any)
    .select("system_id, system_name, status");

  if (!data || data.length === 0) return null;

  const systems: Record<
    number,
    { name: string; total: number; done: number }
  > = {};

  for (const mod of (data ?? []) as any[]) {
    if (!systems[mod.system_id]) {
      systems[mod.system_id] = { name: mod.system_name, total: 0, done: 0 };
    }
    systems[mod.system_id].total++;
    if (mod.status === "done") systems[mod.system_id].done++;
  }

  return Object.entries(systems)
    .map(([id, sys]) => ({
      id: parseInt(id),
      ...sys,
      pct: sys.total > 0 ? Math.round((sys.done / sys.total) * 100) : 0,
    }))
    .sort((a, b) => a.id - b.id);
}

export default async function BuildProgressSummary() {
  const systems = await fetchBuildSummary();

  if (!systems) {
    return null; // Don't show if DB not yet seeded
  }

  const totalModules = systems.reduce((a, s) => a + s.total, 0);
  const doneModules = systems.reduce((a, s) => a + s.done, 0);
  const overallPct =
    totalModules > 0 ? Math.round((doneModules / totalModules) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      style={{ borderTop: "3px solid #42CA80" }}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-[#42CA80]" />
          <h2 className="text-sm font-bold text-slate-900">Build Progress</h2>
          <span className="text-xs text-slate-400">— All 3 systems</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xl font-black font-mono tabular-nums text-[#42CA80]">
            {overallPct}%
          </span>
          <Link
            href="/admin/build-tracker"
            className="flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white hover:border-slate-300 transition-all min-h-[36px]"
          >
            View Full Tracker
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
        {systems.map((sys) => {
          const colors = SYSTEM_COLORS[sys.id - 1] ?? SYSTEM_COLORS[0];
          return (
            <div key={sys.id} className="px-6 py-4">
              <p className="text-xs font-semibold text-slate-500 mb-2 truncate">
                {sys.name}
              </p>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${colors.barColor}`}
                    style={{ width: `${sys.pct}%` }}
                  />
                </div>
                <span
                  className={`text-sm font-black font-mono tabular-nums flex-shrink-0 ${colors.textColor}`}
                >
                  {sys.pct}%
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {sys.done} of {sys.total} modules done
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
