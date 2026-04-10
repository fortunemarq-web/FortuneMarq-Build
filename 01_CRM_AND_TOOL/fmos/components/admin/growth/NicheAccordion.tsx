"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink, Activity, ArrowRight, Sparkles } from "lucide-react";
import { updateAcquisitionTarget } from "@/app/admin/growth/actions";

interface NicheAccordionProps {
  target: any;
  campaigns?: any[];
}

export default function NicheAccordion({ target, campaigns = [] }: NicheAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(target.is_active);
  const [notes, setNotes] = useState(target.notes || "");
  const [isSaving, setIsSaving] = useState(false);

  // Mocked pipeline counts matching the Phase 3 spec pattern
  const pipeline = {
    new: Math.floor(Math.random() * 30),
    contacted: Math.floor(Math.random() * 10),
    demo: Math.floor(Math.random() * 5),
    proposal: Math.floor(Math.random() * 3),
    closed: Math.floor(Math.random() * 2),
  };
  
  const totalLeads = Object.values(pipeline).reduce((a,b) => a+b, 0);

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
    <div className={`bg-white rounded-xl border transition-colors shadow-sm ${isOpen ? 'border-[#42CA80] ring-1 ring-[#42CA80]' : 'border-slate-200 hover:border-slate-300'}`}>
      
      {/* Accordion Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-6 py-4 flex items-center justify-between cursor-pointer group"
      >
        <div className="flex items-center gap-4">
          <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#42CA80]' : ''}`} />
          <h3 className="text-lg font-bold text-slate-900">{target.niche}</h3>
          
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-widest ${isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {isActive ? 'Active' : 'Paused'}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-slate-400">
            <span>{totalLeads} Leads</span>
            <span>{campaigns.length} Campaigns</span>
          </div>
          <button 
            onClick={handleToggleActive}
            className={`text-xs font-bold uppercase transition-colors ${isActive ? 'text-red-500 hover:text-red-600' : 'text-[#42CA80] hover:text-[#38b571]'}`}
          >
            {isActive ? 'Pause' : 'Activate'}
          </button>
        </div>
      </div>

      {/* Accordion Content */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[800px] border-t border-slate-100' : 'max-h-0'}`}>
        <div className="p-6 bg-slate-50/50 space-y-6">
          
          {/* Top Row: Pipeline & Campaigns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Pipeline Overview */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Pipeline Snapshot</h4>
                <Link 
                  href={`/manager/pipeline?city=${encodeURIComponent(target.city)}&niche=${encodeURIComponent(target.niche)}`}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#42CA80] hover:text-[#38b571] bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition-colors"
                >
                  <ExternalLink className="h-3 w-3" /> Full Pipeline
                </Link>
              </div>

              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
                {[
                  { label: "New", count: pipeline.new, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
                  { label: "Contacted", count: pipeline.contacted, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
                  { label: "Demo", count: pipeline.demo, color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
                  { label: "Proposal", count: pipeline.proposal, color: "text-orange-600", bg: "bg-orange-50 border-orange-100" },
                  { label: "Closed", count: pipeline.closed, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
                ].map(stage => (
                  <Link 
                    key={stage.label}
                    href={`/manager/pipeline?city=${encodeURIComponent(target.city)}&niche=${encodeURIComponent(target.niche)}&stage=${stage.label.toLowerCase()}`}
                    className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg border min-w-[80px] hover:shadow-sm hover:-translate-y-0.5 transition-all ${stage.bg}`}
                  >
                    <span className={`text-2xl font-bold font-mono ${stage.color}`}>{stage.count}</span>
                    <span className={`text-[10px] font-bold uppercase mt-1 text-slate-500`}>{stage.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Active Campaigns */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Active Campaigns</h4>
                <span className="text-xs font-semibold text-slate-500">{campaigns.length} running</span>
              </div>
              
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[140px] pr-2">
                {campaigns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Activity className="h-8 w-8 text-slate-200 mb-2" />
                    <span className="text-xs">No active campaigns for this niche.</span>
                  </div>
                ) : (
                  campaigns.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-2.5 rounded border border-slate-100 bg-slate-50">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{c.campaign_name}</p>
                        <p className="text-[10px] uppercase font-bold text-slate-500">{c.platform}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono font-bold text-[#42CA80]">₹{c.spend_mtd}</p>
                        <p className="text-[10px] font-semibold text-slate-400">{c.leads_generated} leads</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <button className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 hover:border-[#42CA80] hover:text-[#42CA80] transition-colors">
                <Sparkles className="h-3 w-3" /> New Campaign Draft
              </button>
            </div>
            
          </div>

          {/* Bottom Row: Notes & Plan */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h4 className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
              <span>Strategy Notes</span>
              <button 
                onClick={handleSaveNotes}
                disabled={isSaving || notes === target.notes}
                className="text-emerald-600 hover:text-emerald-700 disabled:opacity-50 disabled:hidden transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Notes'}
              </button>
            </h4>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full text-sm text-slate-700 focus:outline-none resize-y min-h-[60px] bg-transparent"
              placeholder="E.g. Scraping Google Maps for new dental clinics. Focusing on teeth whitening offers..."
            />
          </div>

        </div>
      </div>
    </div>
  );
}
