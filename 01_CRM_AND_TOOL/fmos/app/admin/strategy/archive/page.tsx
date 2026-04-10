import { fetchStrategyArchive, fetchStrategyRunCompletion } from "@/app/admin/strategy/actions";
import Link from "next/link";
import { ArrowLeft, Archive, CheckCircle2, CircleDashed } from "lucide-react";

export const metadata = {
  title: "Strategy Archive — FortuneMarq",
};

export default async function StrategyArchivePage() {
  const archives = await fetchStrategyArchive() as any[];

  // Map progress counters async 
  const progressMap = new Map();
  for (const item of archives) {
    const counts = await fetchStrategyRunCompletion(item.id);
    progressMap.set(item.id, counts);
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Header */}
        <div>
          <Link href="/admin/strategy" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Strategy Engine
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-slate-800 text-white shadow-sm border border-slate-700">
                <Archive className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Strategy Archive</h1>
                <p className="text-sm text-slate-500 mt-1">History of all generated tasks and AI strategy runs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Date Run</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Strategy Name</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Destination</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Timeframe</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Progress</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {archives.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                      No strategies have been run yet.
                    </td>
                  </tr>
                ) : (
                  archives.map((run: any) => {
                    const counts = progressMap.get(run.id) || { total: 0, completed: 0, remaining: 0 };
                    const progress = counts.total > 0 ? (counts.completed / counts.total) * 100 : 0;
                    
                    return (
                      <tr key={run.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-slate-900">
                            {new Date(run.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                          <p className="text-[10px] text-slate-400 truncate">By {run.profiles?.full_name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-indigo-700 cursor-pointer hover:underline" title="View Document (Coming Soon)">
                            {run.title}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-600">
                          {run.destination}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                          {run.timeframe.replace('_',' ')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs font-bold text-slate-400">{Math.round(progress)}%</span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-[#42CA80]" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 min-w-[30px]">{counts.completed}/{counts.total}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center justify-center font-mono text-sm font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {run.tasks_generated} tasks
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}
