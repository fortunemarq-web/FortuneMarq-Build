"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink, Activity } from "lucide-react";
import { updateAcquisitionTarget } from "@/app/admin/growth/actions";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export interface NichePipelineCounts {
  new: number;
  engaged: number;
  meeting: number;
  proposal: number;
  won: number;
}

interface NicheAccordionProps {
  target: any;
  campaigns?: any[];
  /** Real per-niche stage counts, computed server-side from leads */
  pipeline?: NichePipelineCounts;
}

const EMPTY_PIPELINE: NichePipelineCounts = { new: 0, engaged: 0, meeting: 0, proposal: 0, won: 0 };

export default function NicheAccordion({ target, campaigns = [], pipeline = EMPTY_PIPELINE }: NicheAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(target.is_active);
  const [notes, setNotes] = useState(target.notes || "");
  const [isSaving, setIsSaving] = useState(false);

  const totalLeads = Object.values(pipeline).reduce((a, b) => a + b, 0);

  const handleToggleActive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsActive(!isActive);
    await updateAcquisitionTarget(target.id, { is_active: !isActive });
  };

  const handleSaveNotes = async () => {
    setIsSaving(true);
    await updateAcquisitionTarget(target.id, { notes });
    setIsSaving(false);
  };

  return (
    <div className={`bg-surface rounded-xl border transition-colors ${isOpen ? 'border-brand-line ring-1 ring-brand-line' : 'border-line hover:border-line-strong'}`}>

      {/* Accordion Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-6 py-4 flex items-center justify-between cursor-pointer group"
      >
        <div className="flex items-center gap-4">
          <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand-deep' : ''}`} />
          <h3 className="font-display text-lg font-semibold text-slate-900">{target.niche}</h3>

          <Badge tone={isActive ? 'brand' : 'neutral'} variant="outline" size="sm" dot className="uppercase">
            {isActive ? 'Active' : 'Paused'}
          </Badge>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-slate-400">
            <span>{totalLeads} Leads</span>
            <span>{campaigns.length} Campaigns</span>
          </div>
          <button
            onClick={handleToggleActive}
            className={`text-xs font-semibold uppercase transition-colors ${isActive ? 'text-danger hover:text-red-700' : 'text-brand-deep hover:text-brand-deeper'}`}
          >
            {isActive ? 'Pause' : 'Activate'}
          </button>
        </div>
      </div>

      {/* Accordion Content */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[800px] border-t border-line' : 'max-h-0'}`}>
        <div className="p-6 bg-slate-50 space-y-6">
          
          {/* Top Row: Pipeline & Campaigns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Pipeline Overview */}
            <div className="bg-surface rounded-xl border border-line p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pipeline Snapshot</h4>
                <Link
                  href={`/manager/pipeline?city=${encodeURIComponent(target.city)}&niche=${encodeURIComponent(target.niche)}`}
                  className="flex items-center gap-1.5 text-xs font-semibold text-brand-deep hover:text-brand-deeper bg-brand-soft hover:bg-brand-soft/70 px-2 py-1 rounded transition-colors"
                >
                  <ExternalLink className="h-3 w-3" /> Full Pipeline
                </Link>
              </div>

              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
                {[
                  { label: "New", count: pipeline.new, color: "text-slate-700", bg: "bg-slate-100 border-line" },
                  { label: "Engaged", count: pipeline.engaged, color: "text-info", bg: "bg-info-soft border-info-line" },
                  { label: "Meeting", count: pipeline.meeting, color: "text-info", bg: "bg-info-soft border-info-line" },
                  { label: "Proposal", count: pipeline.proposal, color: "text-warn", bg: "bg-warn-soft border-warn-line" },
                  { label: "Won", count: pipeline.won, color: "text-brand-deep", bg: "bg-brand-soft border-brand-line" },
                ].map(stage => (
                  <Link
                    key={stage.label}
                    href={`/manager/pipeline?city=${encodeURIComponent(target.city)}&niche=${encodeURIComponent(target.niche)}&stage=${stage.label.toLowerCase()}`}
                    className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg border min-w-[80px] hover:-translate-y-0.5 transition-all ${stage.bg}`}
                  >
                    <span className={`text-2xl font-semibold tabular-nums ${stage.color}`}>{stage.count}</span>
                    <span className={`text-[11px] font-semibold uppercase mt-1 text-slate-500`}>{stage.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Active Campaigns */}
            <div className="bg-surface rounded-xl border border-line p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active Campaigns</h4>
                <span className="text-xs font-semibold text-slate-500">{campaigns.length} running</span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[140px] pr-2">
                {campaigns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Activity className="h-8 w-8 text-slate-800 mb-2" />
                    <span className="text-xs">No active campaigns for this niche.</span>
                  </div>
                ) : (
                  campaigns.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg border border-line bg-slate-50">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{c.campaign_name}</p>
                        <p className="text-[11px] uppercase font-semibold text-slate-500">{c.platform}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums text-brand-deep">₹{c.spend_mtd}</p>
                        <p className="text-[11px] font-semibold text-slate-400">{c.leads_generated} leads</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* ("New Campaign Draft" button removed — it did nothing) */}
            </div>

          </div>

          {/* Bottom Row: Notes & Plan */}
          <div className="bg-surface rounded-xl border border-line p-5">
            <h4 className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              <span>Strategy Notes</span>
              <button
                onClick={handleSaveNotes}
                disabled={isSaving || notes === target.notes}
                className="text-brand-deep hover:text-brand-deeper disabled:opacity-50 disabled:hidden transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Notes'}
              </button>
            </h4>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="min-h-[60px]"
              placeholder="E.g. Scraping Google Maps for new dental clinics. Focusing on teeth whitening offers..."
            />
          </div>

        </div>
      </div>
    </div>
  );
}
