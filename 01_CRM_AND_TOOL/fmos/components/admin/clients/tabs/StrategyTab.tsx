"use client";

import { useState } from "react";
import { Search, MousePointerClick, Facebook, Instagram, LayoutTemplate, CalendarSync, FileText, CheckCircle2, CircleDashed } from "lucide-react";
import StrategyGeneratorModal from "./StrategyGeneratorModal";

const STRATEGY_CARDS = [
  { id: "client_seo", label: "SEO Strategy", icon: Search },
  { id: "client_google_ads", label: "Google Ads Strategy", icon: MousePointerClick },
  { id: "client_meta_ads", label: "Meta Ads Strategy", icon: Facebook },
  { id: "client_social", label: "Social Media Strategy", icon: Instagram },
  { id: "client_website_build", label: "Website Build Plan", icon: LayoutTemplate },
  { id: "client_retainer", label: "Monthly Retainer Plan", icon: CalendarSync }
];

export default function StrategyTab({
  clientId,
  client,
  team,
  strategyRuns,
}: {
  clientId: string;
  client: any;
  team: any[];
  strategyRuns: any[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeStrategy, setActiveStrategy] = useState<{ id: string; label: string } | null>(null);

  const handleOpenModal = (id: string, label: string) => {
    setActiveStrategy({ id, label });
    setModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Strategy Generator Grid */}
      <section>
        <div className="mb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Generate Client Strategy</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STRATEGY_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow relative group">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-slate-900">{card.label}</h3>
                  </div>
                  
                  <button
                    onClick={() => handleOpenModal(card.id, card.label)}
                    className="w-full rounded-lg bg-slate-50 border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-[#42CA80] hover:text-white hover:border-[#42CA80] transition-colors"
                  >
                    Generate Tasks →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* History Area */}
      <section>
        <div className="mb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Strategy History</h2>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Date Run</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Strategy Type</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Tasks Generated</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Progress</th>
                  <th className="px-6 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {strategyRuns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                      No strategies have been run for this client yet.
                    </td>
                  </tr>
                ) : (
                  strategyRuns.map((run: any) => {
                    const progress = run.counts.total > 0 ? (run.counts.completed / run.counts.total) * 100 : 0;
                    return (
                      <tr key={run.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-slate-900">
                            {new Date(run.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-indigo-700">
                            {run.strategy_type || run.destination || "General Strategy"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center font-mono text-sm font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {run.tasks_generated} tasks
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs font-bold text-slate-400">{Math.round(progress)}%</span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-[#42CA80]" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 min-w-[30px]">{run.counts.completed}/{run.counts.total}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                            View Tasks
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Generator Modal */}
      {modalOpen && activeStrategy && (
        <StrategyGeneratorModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          client={client}
          team={team}
          strategyId={activeStrategy.id}
          strategyLabel={activeStrategy.label}
        />
      )}
    </div>
  );
}
