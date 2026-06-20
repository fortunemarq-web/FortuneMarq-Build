"use client";

import { useState } from "react";
import { Search, MousePointerClick, Facebook, Instagram, LayoutTemplate, CalendarSync, FileText, CheckCircle2, CircleDashed } from "lucide-react";
import StrategyGeneratorModal from "./StrategyGeneratorModal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

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
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-500">Generate Client Strategy</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {STRATEGY_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.id} className="group relative p-5">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-brand-soft p-2.5 text-brand-deep">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display font-semibold text-slate-900">{card.label}</h3>
                  </div>

                  <button
                    onClick={() => handleOpenModal(card.id, card.label)}
                    className="w-full rounded-lg border border-line bg-slate-50 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-brand-deep hover:bg-brand-deep hover:text-white"
                  >
                    Generate Tasks →
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* History Area */}
      <section>
        <div className="mb-4">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-slate-500">Strategy History</h2>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[700px]">
              <THead>
                <TR className="hover:bg-transparent">
                  <TH>Date Run</TH>
                  <TH>Strategy Type</TH>
                  <TH className="text-right">Tasks Generated</TH>
                  <TH className="text-right">Progress</TH>
                  <TH className="text-center">Action</TH>
                </TR>
              </THead>
              <TBody>
                {strategyRuns.length === 0 ? (
                  <TR className="hover:bg-transparent">
                    <TD colSpan={5} className="py-12 text-center text-sm text-slate-400">
                      No strategies have been run for this client yet.
                    </TD>
                  </TR>
                ) : (
                  strategyRuns.map((run: any) => {
                    const progress = run.counts.total > 0 ? (run.counts.completed / run.counts.total) * 100 : 0;
                    return (
                      <TR key={run.id}>
                        <TD>
                          <span className="text-sm font-semibold text-slate-900">
                            {new Date(run.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </TD>
                        <TD>
                          <span className="text-sm font-semibold text-slate-700">
                            {run.strategy_type || run.destination || "General Strategy"}
                          </span>
                        </TD>
                        <TD className="text-right">
                          <Badge tone="neutral" size="sm" className="tabular-nums">
                            {run.tasks_generated} tasks
                          </Badge>
                        </TD>
                        <TD className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs font-semibold tabular-nums text-slate-400">{Math.round(progress)}%</span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-brand" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-[11px] font-semibold tabular-nums text-slate-400 min-w-[30px]">{run.counts.completed}/{run.counts.total}</span>
                          </div>
                        </TD>
                        <TD className="text-center">
                          <button className="text-xs font-semibold text-brand-deep hover:text-brand-deeper transition-colors">
                            View Tasks
                          </button>
                        </TD>
                      </TR>
                    );
                  })
                )}
              </TBody>
            </Table>
          </div>
        </Card>
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
