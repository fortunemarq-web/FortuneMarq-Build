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
  Inbox,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { toast } from "@/components/ui/toast";
import { logAudit } from "@/lib/audit";
import { PIPELINE_STAGES, leadStageUpdate } from "@/lib/pipeline";
import { Badge, type Tone } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";

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

// Lead-type → one of the five tones (no per-type rainbow).
const LEAD_TYPE_TONES: Record<string, Tone> = {
  A: "brand",
  B: "info",
  C: "neutral",
  D: "warning",
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
      className={buttonVariants({ variant: "primary", size: "sm", className: "w-full" })}>
      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
    </a>
  );
  if (stage === "curiosity_sent") return (
    <Link href={`/admin/leads/${lead.id}`}
      className={buttonVariants({ variant: "primary", size: "sm", className: "w-full" })}>
      <FileText className="h-3.5 w-3.5" /> Send PDF
    </Link>
  );
  if (stage === "pdf_sent" || stage === "follow_up_due") {
    const isOverdue = stage === "follow_up_due" && !!lead.follow_up_date && new Date(lead.follow_up_date) < new Date();
    return (
      <Link href={`/admin/leads/${lead.id}`}
        className={buttonVariants({ variant: isOverdue ? "danger" : "secondary", size: "sm", className: "w-full" })}>
        <Phone className="h-3.5 w-3.5" /> Log Call
      </Link>
    );
  }
  if (stage === "meeting_booked") return (
    <Link href={`/admin/leads/${lead.id}`}
      className={buttonVariants({ variant: "primary", size: "sm", className: "w-full" })}>
      <Calendar className="h-3.5 w-3.5" /> Open Lead
    </Link>
  );
  if (stage === "proposal_sent") return (
    <Link href={`/admin/leads/${lead.id}`}
      className={buttonVariants({ variant: "secondary", size: "sm", className: "w-full" })}>
      <ArrowRight className="h-3.5 w-3.5" /> Open Proposal
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
    <div className="min-h-full bg-canvas">
      {/* Header (sticky) — title, filters, and the workflow tabs all live here so
          the board itself only ever shows one screen-width of columns. */}
      <div className="sticky top-0 z-20 border-b border-line bg-surface shadow-sm">
        <div className="px-4 py-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl font-semibold tracking-[-0.02em] text-slate-900">Outreach Board</h1>
              <p className="mt-0.5 text-xs text-slate-500 tabular-nums">{totalActive} active · {totalClosed} closed</p>
            </div>
            <Link
              href="/admin/outreach/pdf-log"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <FileText className="h-3.5 w-3.5" /> PDF Log
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[160px] max-w-xs flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-8"
                placeholder="Search business name…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <Select value={filterNiche} onChange={e => setFilterNiche(e.target.value)} className="w-auto min-w-[130px]">
              <option value="">All Niches</option>
              {niches.map(n => <option key={n} value={n}>{n}</option>)}
            </Select>
            <Select value={filterCity} onChange={e => setFilterCity(e.target.value)} className="w-auto min-w-[120px]">
              <option value="">All Cities</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-auto min-w-[120px]">
              <option value="">All Types</option>
              {["A", "B", "C", "D"].map(t => <option key={t} value={t}>Type {t}</option>)}
            </Select>
            <Select value={filterAssigned} onChange={e => setFilterAssigned(e.target.value)} className="w-auto min-w-[140px]">
              <option value="">All Assignees</option>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </Select>
          </div>

          {/* Workflow tabs */}
          <div className="mt-3 overflow-x-auto">
            <Tabs
              tabs={STAGE_TABS.map(tab => ({ value: tab.key, label: tab.label, count: tabCount(tab.key) }))}
              value={activeTab}
              onValueChange={setActiveTab}
            />
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
                className={cn(
                  "flex-1 min-w-[210px] max-w-[360px] rounded-xl border border-line bg-surface transition-all",
                  isOver && "ring-2 ring-brand ring-offset-1"
                )}
              >
                {/* Column header */}
                <div className="border-b border-line px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-xs font-semibold text-slate-700">{stage.label}</span>
                    <Badge tone={stage.tone} size="sm">{stageLeads.length}</Badge>
                  </div>
                </div>

                {/* Cards — taller scroll area now that the board is only one tab deep */}
                <div className="max-h-[calc(100dvh-250px)] space-y-2 overflow-y-auto p-2">
                  {stageLeads.length === 0 && (
                    <div className="flex h-20 flex-col items-center justify-center gap-1 text-center text-slate-300">
                      <Inbox className="h-5 w-5" />
                      <span className="text-[11px] font-medium">Empty</span>
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
                        className={cn(
                          "rounded-lg border bg-surface p-3 transition-all",
                          isAdmin && "cursor-grab active:cursor-grabbing",
                          isStalled ? "border-l-[3px] border-l-warn border-r border-t border-b border-line" : "border-line",
                          draggedLeadId === lead.id ? "scale-[0.97] opacity-50" : "hover:shadow-md"
                        )}
                      >
                        {isStalled && (
                          <div className="mb-1.5 flex items-center gap-1">
                            <Badge tone="warning" size="sm" className="uppercase">
                              Stalled {daysInStage}d
                            </Badge>
                          </div>
                        )}

                        <Link href={`/admin/leads/${lead.id}`} className="block transition-colors hover:text-brand-deep">
                          <p className="line-clamp-1 text-xs font-semibold leading-snug text-slate-900">{lead.company_name}</p>
                        </Link>

                        <p className="mt-0.5 truncate text-[11px] text-slate-400">
                          {lead.industry || "—"} · {lead.city || "—"}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {typeKey && (
                            <Badge tone={LEAD_TYPE_TONES[typeKey] || "neutral"} size="sm">
                              {typeKey}
                            </Badge>
                          )}
                          <Badge tone={daysInStage > 5 ? "danger" : "neutral"} variant="outline" size="sm" className="tabular-nums">
                            {daysInStage}d
                          </Badge>
                          {assignee && (
                            <span className="ml-auto max-w-[60px] truncate text-[11px] text-slate-400">
                              {assignee.full_name.split(" ")[0]}
                            </span>
                          )}
                        </div>

                        {hasQuickAction && (
                          <div className="mt-2.5 border-t border-line pt-2">
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
