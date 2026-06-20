import { Suspense } from "react";
import type { Metadata } from "next";
import { fetchBuildTrackerModules } from "@/app/admin/build-tracker/actions";
import SystemCard from "@/components/admin/build-tracker/SystemCard";
import RefreshButton from "@/components/admin/build-tracker/RefreshButton";
import type { BuildTrackerModule } from "@/app/admin/build-tracker/actions";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

// ── Loading Skeleton ───────────────────────────────────────────────────────
function SkeletonSystemCard() {
  return (
    <Card className="overflow-hidden animate-pulse">
      <div className="px-6 py-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-5 w-48 rounded bg-slate-100" />
          <div className="h-7 w-12 rounded bg-slate-100" />
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-100" />
      </div>
      <div className="border-t border-line p-6 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-4 flex-1 rounded bg-slate-100" />
            <div className="h-7 w-24 rounded-full bg-slate-100" />
            <div className="h-5 w-16 rounded-full bg-slate-100" />
            <div className="h-4 w-32 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </Card>
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
      <StatCard label="Overall Complete" value={`${pct}%`} hint={`${done} of ${total} modules done`} />
      <StatCard label="In Progress" value={inProgress} hint="modules active" />
      <StatCard label="Blocked" value={blocked} hint="need attention" />
      <StatCard
        label="Not Started"
        value={total - done - inProgress - blocked}
        hint="in backlog"
      />
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
          <Card className="p-12 text-center">
            <p className="text-slate-500">No modules found. Run the migration SQL to seed the data.</p>
          </Card>
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
    <div className="min-h-full bg-canvas px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <PageHeader
          className="mb-8"
          title="Build Tracker"
          subtitle="Track progress across all 3 systems being built"
          actions={
            <>
              <Link href="/admin" className={buttonVariants({ variant: "secondary" })}>
                ← Command Hub
              </Link>
              <RefreshButton />
            </>
          }
        />
        <p className="-mt-6 mb-8 text-xs text-slate-400">Last refreshed: {now}</p>

        {/* Content with Suspense */}
        <Suspense
          fallback={
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 rounded-xl bg-surface border border-line animate-pulse" />
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
