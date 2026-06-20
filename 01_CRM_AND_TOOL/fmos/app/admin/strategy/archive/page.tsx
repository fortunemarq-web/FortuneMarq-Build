import { fetchStrategyArchive, fetchStrategyRunCompletion, fetchStrategyRunOutcome } from "@/app/admin/strategy/actions";
import Link from "next/link";
import { ArrowLeft, Archive } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export const metadata = {
  title: "Strategy Archive — FortuneMarq",
};

export default async function StrategyArchivePage() {
  const archives = await fetchStrategyArchive() as any[];

  // Map progress counters + real outcomes async
  const progressMap = new Map();
  const outcomeMap = new Map();
  for (const item of archives) {
    const [counts, outcome] = await Promise.all([
      fetchStrategyRunCompletion(item.id),
      fetchStrategyRunOutcome(item),
    ]);
    progressMap.set(item.id, counts);
    outcomeMap.set(item.id, outcome);
  }

  return (
    <div className="min-h-full bg-canvas px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div>
          <Link href="/admin/strategy" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-brand-deep">
            <ArrowLeft className="h-4 w-4" /> Back to Strategy Engine
          </Link>

          <PageHeader
            title="Strategy Archive"
            subtitle="Plan → work → result. Outcome counts real content published or leads/clients won in each strategy's destination & timeframe."
          />
        </div>

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[800px]">
              <THead>
                <TR className="hover:bg-transparent">
                  <TH>Date Run</TH>
                  <TH>Strategy Name</TH>
                  <TH>Destination</TH>
                  <TH>Timeframe</TH>
                  <TH className="text-right">Progress</TH>
                  <TH className="text-right">Outcome</TH>
                  <TH className="text-right">Generated</TH>
                </TR>
              </THead>
              <TBody>
                {archives.length === 0 ? (
                  <TR className="hover:bg-transparent">
                    <TD colSpan={7} className="py-12 text-center text-sm text-slate-400">
                      No strategies have been run yet.
                    </TD>
                  </TR>
                ) : (
                  archives.map((run: any) => {
                    const counts = progressMap.get(run.id) || { total: 0, completed: 0, remaining: 0 };
                    const progress = counts.total > 0 ? (counts.completed / counts.total) * 100 : 0;
                    const outcome = outcomeMap.get(run.id) || { kind: "other", label: "—", value: 0, windowElapsed: false };

                    return (
                      <TR key={run.id}>
                        <TD>
                          <span className="text-sm font-semibold text-slate-900">
                            {new Date(run.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                          <p className="truncate text-[11px] text-slate-400">By {run.profiles?.full_name}</p>
                        </TD>
                        <TD>
                          <span className="text-sm font-semibold text-slate-800">
                            {run.title}
                          </span>
                        </TD>
                        <TD className="text-xs tabular-nums text-slate-600">
                          {run.destination}
                        </TD>
                        <TD className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {run.timeframe.replace('_', ' ')}
                        </TD>
                        <TD className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs font-semibold tabular-nums text-slate-400">{Math.round(progress)}%</span>
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full bg-brand" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="min-w-[30px] text-[11px] font-semibold tabular-nums text-slate-400">{counts.completed}/{counts.total}</span>
                          </div>
                        </TD>
                        <TD className="text-right">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                              outcome.value > 0 ? "text-brand-deep" : "text-slate-400"
                            }`}
                            title={outcome.windowElapsed ? "Timeframe complete" : "In progress — timeframe not yet elapsed"}
                          >
                            {outcome.label}
                            {!outcome.windowElapsed && outcome.kind !== "other" && (
                              <Badge tone="warning" size="sm">live</Badge>
                            )}
                          </span>
                        </TD>
                        <TD className="text-right">
                          <span className="inline-flex items-center justify-center rounded-md bg-slate-100 px-2 py-0.5 text-sm font-semibold tabular-nums text-slate-600">
                            {run.tasks_generated} tasks
                          </span>
                        </TD>
                      </TR>
                    );
                  })
                )}
              </TBody>
            </Table>
          </div>
        </Card>

      </div>
    </div>
  );
}
