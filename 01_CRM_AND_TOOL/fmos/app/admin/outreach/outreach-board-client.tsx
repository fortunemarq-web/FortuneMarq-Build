"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  Phone,
  MessageCircle,
  FileText,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { toast } from "@/components/ui/toast";
import { logAudit } from "@/lib/audit";
import { PIPELINE_STAGES, leadStageUpdate } from "@/lib/pipeline";

// ─── Stage Config (single source of truth: lib/pipeline.ts) ──
const stageByKey = Object.fromEntries(PIPELINE_STAGES.map((s) => [s.key, s]));

// Workflow tabs — the 17-stage pipeline split into 4 groups so each view shows
// ≤5 columns and fits on one screen (no giant horizontal strip, no per-column
// scrolling for the whole board). Drag-and-drop between columns still works.
const STAGE_TABS: { key: string; label: string; stages: (typeof PIPELINE_STAGES) }[] = [
  { key: "pipeline", label: "Pipeline", stages: ["touch1_pending", "curiosity_sent", "pdf_sent", "meeting_booked", "proposal_sent"].map((k) => stageByKey[k]).filter(Boolean) },
  { key: "followups", label: "Follow-ups", stages: ["no_answer", "follow_back", "follow_up_due", "gatekeeper"].map((k) => stageByKey[k]).filter(Boolean) },
  { key: "parked", label: "Parked", stages: ["unreachable", "gatekeeper_flagged", "language_barrier", "revival"].map((k) => stageByKey[k]).filter(Boolean) },
  { key: "closed", label: "Closed", stages: ["not_interested", "won", "lost", "dead"].map((k) => stageByKey[k]).filter(Boolean) },
];

// Stages that surface a one-tap action on the card.
const QUICK_ACTION_STAGES = new Set([
  "touch1_pending", "curiosity_sent", "pdf_sent", "follow_up_due", "meeting_booked", "proposal_sent",
]);

const LEAD_TYPE_COLORS: Record<string, string> = {
  A: "bg-green-100 text-green-700 border border-green-300",
  B: "bg-blue-100 text-blue-700 border border-blue-300",
  C: "bg-purple-100 text-purple-700 border border-purple-300",
  D: "bg-amber-100 text-amber-700 border border-amber-300",
};

// ─── Types ────────────────────────────────────────────────────
interface Lead {
  id: string;
  company_name: string;
  industry: string | null;
  city: string | null;
  lead_type: string | null;
  outreach_stage: string | null;
  follow_up_date: string | null;
  last_outreach_at: string | null;
  assigned_sales_exec: string | null;
  last_activity_at: string | null;
  created_at: string;
  phone: string | null;
  status: string | null;
}

interface Profile { id: string; full_name: string; role: string; }

interface OutreachBoardClientProps {
  initialLeads: Lead[];
  profiles: Profile[];
  isAdmin: boolean;
  userId: string | null;
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function QuickActionButton({ lead }: { lead: Lead }) {
  const stage = lead.outreach_stage;
  if (stage === "touch1_pending") return (
    <a href={`https://wa.me/${lead.phone?.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
      className="flex items-center gap-1 text-[10px] font-bold bg-green-600 text-white px-2 py-1 rounded-lg hover:bg-green-700 transition-colors">
      <MessageCircle className="h-2.5 w-2.5" /> WhatsApp
    </a>
  );
  if (stage === "curiosity_sent") return (
    <Link href={`/admin/leads/${lead.id}`}
      className="flex items-center gap-1 text-[10px] font-bold bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700 transition-colors">
      <FileText className="h-2.5 w-2.5" /> Send PDF
    </Link>
  );
  if (stage === "pdf_sent" || stage === "follow_up_due") return (
    <Link href={`/admin/leads/${lead.id}`}
      className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors ${
        stage === "follow_up_due" && lead.follow_up_date && new Date(lead.follow_up_date) < new Date()
          ? "bg-red-600 text-white hover:bg-red-700"
          : "bg-slate-700 text-white hover:bg-slate-800"
      }`}>
      <Phone className="h-2.5 w-2.5" /> Log Call
    </Link>
  );
  if (stage === "meeting_booked") return (
    <Link href={`/admin/leads/${lead.id}`}
      className="flex items-center gap-1 text-[10px] font-bold bg-green-600 text-white px-2 py-1 rounded-lg hover:bg-green-700 transition-colors">
      <Calendar className="h-2.5 w-2.5" /> Open Lead
    </Link>
  );
  if (stage === "proposal_sent") return (
    <Link href={`/admin/leads/${lead.id}`}
      className="flex items-center gap-1 text-[10px] font-bold bg-purple-600 text-white px-2 py-1 rounded-lg hover:bg-purple-700 transition-colors">
      <ArrowRight className="h-2.5 w-2.5" /> Open Proposal
    </Link>
  );
  return null;
}

export default function OutreachBoardClient({ initialLeads, profiles, isAdmin }: OutreachBoardClientProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [activeTab, setActiveTab] = useState("pipeline");
  const [query, setQuery] = useState("");
  const [filterNiche, setFilterNiche] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterAssigned, setFilterAssigned] = useState("");
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const supabase = createClient();

  // Unique filter options
  const niches = [...new Set(leads.map(l => l.industry).filter(Boolean))] as string[];
  const cities = [...new Set(leads.map(l => l.city).filter(Boolean))] as string[];

  // Apply filters
  const filtered = leads.filter(l => {
    if (query && !l.company_name.toLowerCase().includes(query.toLowerCase())) return false;
    if (filterNiche && l.industry !== filterNiche) return false;
    if (filterCity && l.city !== filterCity) return false;
    if (filterType && l.lead_type?.toUpperCase() !== filterType) return false;
    if (filterAssigned && l.assigned_sales_exec !== filterAssigned) return false;
    return true;
  });

  function getLeadsForStage(stageKey: string): Lead[] {
    return filtered.filter(l => (l.outreach_stage || "touch1_pending") === stageKey);
  }

  function tabCount(tabKey: string): number {
    const tab = STAGE_TABS.find(t => t.key === tabKey);
    if (!tab) return 0;
    return tab.stages.reduce((sum, s) => sum + getLeadsForStage(s.key).length, 0);
  }

  async function moveLeadToStage(leadId: string, newStage: string) {
    const lead = leads.find(l => l.id === leadId);
    const oldStage = lead?.outreach_stage || "touch1_pending";
    // Optimistic move; rolled back below if the write fails
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, outreach_stage: newStage } : l));
    const { error } = await supabase.from("leads").update(leadStageUpdate(newStage) as any).eq("id", leadId);
    if (error) {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, outreach_stage: oldStage } : l));
      toast.error("Could not move lead", error.message);
      return;
    }
    logAudit({ action: "stage_change", resourceType: "lead", resourceId: leadId, resourceLabel: lead?.company_name, oldValue: { stage: oldStage }, newValue: { stage: newStage }, summary: `Stage: ${oldStage.replace(/_/g, " ")} → ${newStage.replace(/_/g, " ")}` });
  }

  function handleDragStart(leadId: string) {
    if (!isAdmin) return;
    setDraggedLeadId(leadId);
  }

  function handleDrop(e: React.DragEvent, stageKey: string) {
    e.preventDefault();
    if (!draggedLeadId || !isAdmin) return;
    startTransition(() => { moveLeadToStage(draggedLeadId, stageKey); });
    setDraggedLeadId(null);
    setIsDraggingOver(null);
  }

  const currentTab = STAGE_TABS.find(t => t.key === activeTab) || STAGE_TABS[0];
  const totalActive = tabCount("pipeline") + tabCount("followups") + tabCount("parked");
  const totalClosed = tabCount("closed");

  return (
    <div className="min-h-full bg-slate-50">
      {/* Header (sticky) — title, filters, and the workflow tabs all live here so
          the board itself only ever shows one screen-width of columns. */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Outreach Board</h1>
              <p className="text-xs text-slate-500 mt-0.5">{totalActive} active · {totalClosed} closed</p>
            </div>
            <Link
              href="/admin/outreach/pdf-log"
              className="flex items-center gap-2 text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-xl transition-colors"
            >
              <FileText className="h-3.5 w-3.5" /> PDF Log
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                placeholder="Search business name…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <select value={filterNiche} onChange={e => setFilterNiche(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none">
              <option value="">All Niches</option>
              {niches.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select value={filterCity} onChange={e => setFilterCity(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none">
              <option value="">All Cities</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none">
              <option value="">All Types</option>
              {["A", "B", "C", "D"].map(t => <option key={t} value={t}>Type {t}</option>)}
            </select>
            <select value={filterAssigned} onChange={e => setFilterAssigned(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none">
              <option value="">All Assignees</option>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>

          {/* Workflow tabs */}
          <div className="flex gap-1.5 mt-3 overflow-x-auto -mb-px">
            {STAGE_TABS.map(tab => {
              const count = tabCount(tab.key);
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    active ? "bg-brand-deep text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    active ? "bg-white/25 text-white" : "bg-white text-slate-500"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Columns for the active tab — flex-fill so ≤5 columns use the full width
          (no horizontal strip on a normal screen; falls back to scroll if narrow). */}
      <div className="p-4">
        <div className="flex gap-3 overflow-x-auto">
          {currentTab.stages.map(stage => {
            const stageLeads = getLeadsForStage(stage.key);
            const isOver = isDraggingOver === stage.key;
            return (
              <div
                key={stage.key}
                onDragOver={e => { if (isAdmin) { e.preventDefault(); setIsDraggingOver(stage.key); } }}
                onDragLeave={() => setIsDraggingOver(null)}
                onDrop={e => handleDrop(e, stage.key)}
                className={`flex-1 min-w-[210px] max-w-[360px] rounded-2xl border transition-all ${stage.color} ${
                  isOver ? "ring-2 ring-brand ring-offset-1" : ""
                }`}
              >
                {/* Column header */}
                <div className="px-3 py-3 border-b border-current/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">{stage.label}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stage.badge}`}>
                      {stageLeads.length}
                    </span>
                  </div>
                </div>

                {/* Cards — taller scroll area now that the board is only one tab deep */}
                <div className="p-2 space-y-2 max-h-[calc(100dvh-250px)] overflow-y-auto">
                  {stageLeads.length === 0 && (
                    <div className="flex items-center justify-center h-16 text-[10px] text-slate-300 font-medium">
                      Empty
                    </div>
                  )}
                  {stageLeads.map(lead => {
                    const daysInStage = daysSince(lead.last_activity_at ?? lead.created_at);
                    const isStalled = daysInStage >= 7;
                    const typeKey = (lead.lead_type || "").toUpperCase();
                    const assignee = profiles.find(p => p.id === lead.assigned_sales_exec);
                    const hasQuickAction = QUICK_ACTION_STAGES.has(lead.outreach_stage || "touch1_pending");

                    return (
                      <div
                        key={lead.id}
                        draggable={isAdmin}
                        onDragStart={() => handleDragStart(lead.id)}
                        onDragEnd={() => { setDraggedLeadId(null); setIsDraggingOver(null); }}
                        className={`rounded-xl bg-white border p-3 shadow-sm transition-all ${
                          isAdmin ? "cursor-grab active:cursor-grabbing" : ""
                        } ${isStalled ? "border-l-[3px] border-l-orange-400 border-r border-t border-b border-slate-200" : "border-slate-200"} ${
                          draggedLeadId === lead.id ? "opacity-50 scale-[0.97]" : "hover:shadow-md"
                        }`}
                      >
                        {isStalled && (
                          <div className="flex items-center gap-1 mb-1.5">
                            <span className="text-[9px] font-bold uppercase text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full border border-orange-200">
                              Stalled {daysInStage}d
                            </span>
                          </div>
                        )}

                        <Link href={`/admin/leads/${lead.id}`} className="block hover:text-brand-deep transition-colors">
                          <p className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">{lead.company_name}</p>
                        </Link>

                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                          {lead.industry || "—"} · {lead.city || "—"}
                        </p>

                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {typeKey && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${LEAD_TYPE_COLORS[typeKey] || "bg-slate-100 text-slate-600"}`}>
                              {typeKey}
                            </span>
                          )}
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${daysInStage > 5 ? "bg-red-50 text-red-500" : "bg-slate-50 text-slate-400"}`}>
                            {daysInStage}d
                          </span>
                          {assignee && (
                            <span className="ml-auto text-[9px] text-slate-400 truncate max-w-[60px]">
                              {assignee.full_name.split(" ")[0]}
                            </span>
                          )}
                        </div>

                        {hasQuickAction && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100">
                            <QuickActionButton lead={lead} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
