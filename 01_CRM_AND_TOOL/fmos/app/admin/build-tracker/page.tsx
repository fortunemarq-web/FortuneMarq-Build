import { Suspense } from "react";
import type { Metadata } from "next";
import { fetchBuildTrackerModules } from "@/app/admin/build-tracker/actions";
import SystemCard from "@/components/admin/build-tracker/SystemCard";
import RefreshButton from "@/components/admin/build-tracker/RefreshButton";
import { BarChart2 } from "lucide-react";
import type { BuildTrackerModule } from "@/app/admin/build-tracker/actions";
import Link from "next/link";

// ── Loading Skeleton ───────────────────────────────────────────────────────
function SkeletonSystemCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-t-4 border-t-slate-200 animate-pulse">
      <div className="px-6 py-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-5 w-48 rounded bg-slate-100" />
          <div className="h-7 w-12 rounded bg-slate-100" />
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-100" />
      </div>
      <div className="border-t border-slate-100 p-6 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-4 flex-1 rounded bg-slate-100" />
            <div className="h-7 w-24 rounded-full bg-slate-100" />
            <div className="h-5 w-16 rounded-full bg-slate-100" />
            <div className="h-4 w-32 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Overall Stats Bar ──────────────────────────────────────────────────────
function OverallStats({ modules }: { modules: BuildTrackerModule[] }) {
  const total = modules.length;
  const done = modules.filter((m) => m.status === "done").length;
  const inProgress = modules.filter((m) => m.status === "in_progress").length;
  const blocked = modules.filter((m) => m.status === "blocked").length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4" style={{ borderTop: "3px solid #42CA80" }}>
        <p className="text-xs text-slate-500 font-medium">Overall Complete</p>
        <p className="text-3xl font-black font-mono tabular-nums text-[#42CA80] mt-1">{pct}%</p>
        <p className="text-xs text-slate-400 mt-0.5">{done} of {total} modules done</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4" style={{ borderTop: "3px solid #f59e0b" }}>
        <p className="text-xs text-slate-500 font-medium">In Progress</p>
        <p className="text-3xl font-black font-mono tabular-nums text-amber-500 mt-1">{inProgress}</p>
        <p className="text-xs text-slate-400 mt-0.5">modules active</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4" style={{ borderTop: "3px solid #ef4444" }}>
        <p className="text-xs text-slate-500 font-medium">Blocked</p>
        <p className="text-3xl font-black font-mono tabular-nums text-red-500 mt-1">{blocked}</p>
        <p className="text-xs text-slate-400 mt-0.5">need attention</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4" style={{ borderTop: "3px solid #64748b" }}>
        <p className="text-xs text-slate-500 font-medium">Not Started</p>
        <p className="text-3xl font-black font-mono tabular-nums text-slate-600 mt-1">
          {total - done - inProgress - blocked}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">in backlog</p>
      </div>
    </div>
  );
}

// ── Main Content ───────────────────────────────────────────────────────────
async function BuildTrackerContent() {
  const allModules = await fetchBuildTrackerModules();

  // Group by system
  const systems: Record<number, { id: number; name: string; modules: BuildTrackerModule[] }> = {};
  for (const mod of allModules) {
    if (!systems[mod.system_id]) {
      systems[mod.system_id] = {
        id: mod.system_id,
        name: mod.system_name,
        modules: [],
      };
    }
    systems[mod.system_id].modules.push(mod);
  }

  const systemList = Object.values(systems).sort((a, b) => a.id - b.id);

  return (
    <>
      <OverallStats modules={allModules} />
      <div className="space-y-6">
        {systemList.map((sys) => (
          <SystemCard
            key={sys.id}
            systemId={sys.id}
            systemName={sys.name}
            modules={sys.modules}
          />
        ))}
        {systemList.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-500">No modules found. Run the migration SQL to seed the data.</p>
          </div>
        )}
      </div>
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function BuildTrackerPage() {
  const now = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-full bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#42CA80]/10">
                <BarChart2 className="h-5 w-5 text-[#42CA80]" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Build Tracker
              </h1>
            </div>
            <p className="text-sm text-slate-500 ml-12">
              Track progress across all 3 systems being built
            </p>
            <p className="text-xs text-slate-400 ml-12 mt-1">
              Last refreshed: {now}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
            >
              ← Command Hub
            </Link>
            <RefreshButton />
          </div>
        </div>

        {/* Content with Suspense */}
        <Suspense
          fallback={
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 rounded-xl bg-white border border-slate-200 animate-pulse" />
                ))}
              </div>
              <SkeletonSystemCard />
              <SkeletonSystemCard />
              <SkeletonSystemCard />
            </div>
          }
        >
          <BuildTrackerContent />
        </Suspense>
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: "Build Tracker — FortuneMarq",
  description: "Track development progress across all 3 systems",
};
