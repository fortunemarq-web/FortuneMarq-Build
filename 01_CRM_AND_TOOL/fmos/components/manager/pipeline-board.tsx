"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Search,
    Filter,
    ChevronRight,
    MoreHorizontal,
    Clock,
    User,
    ArrowRightLeft,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Plus,
    Building2,
    MapPin
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { sendNotification, NotificationType } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { leadStageUpdate } from "@/lib/pipeline";
import { toast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Stage accent → one of the five tones (icon-box chrome only).
const STAGE_TONE: Record<string, string> = {
    emerald: "bg-brand-soft text-brand-deep",
    green: "bg-brand-soft text-brand-deep",
    blue: "bg-info-soft text-info",
    amber: "bg-warn-soft text-warn",
    purple: "bg-info-soft text-info",
    rose: "bg-danger-soft text-danger",
    slate: "bg-slate-100 text-slate-600",
};

// Columns map 1:1 to outreach_stage — the single source of truth for
// pipeline position (see lib/pipeline.ts). Never invent parallel stages.
const STAGES = [
    { id: "touch1_pending", label: "New", color: "slate", icon: Building2 },
    { id: "no_answer", label: "No Answer", color: "amber", icon: AlertCircle },
    { id: "follow_up_due", label: "Follow-up Due", color: "amber", icon: Clock },
    { id: "curiosity_sent", label: "Direct Report Sent", color: "purple", icon: ArrowRightLeft },
    { id: "pdf_sent", label: "PDF Sent", color: "purple", icon: FileText },
    { id: "meeting_booked", label: "Meeting Booked", color: "emerald", icon: CheckCircle2 },
    { id: "proposal_sent", label: "Proposal Sent", color: "blue", icon: FileText },
    { id: "won", label: "Won", color: "green", icon: Award },
    { id: "lost", label: "Lost", color: "rose", icon: XCircle },
];

// Helper for Lucide icons because I can't import dynamically easily in this snippet
import { FileText, Award } from "lucide-react";

interface Lead {
    id: string;
    company_name: string;
    industry: string;
    city: string;
    outreach_stage: string;
    lead_quality_score?: number;
    last_activity_at: string | null;
    created_at: string;
    assigned_sales_exec?: string | null;
    telecaller?: {
        full_name: string;
        avatar_url: string;
    };
}

export default function PipelineBoard() {
    const [leads, setLeads] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [nicheFilter, setNicheFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    // UI State
    const [draggingId, setDraggingId] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        fetchLeads();
    }, []);

    async function fetchLeads() {
        setIsLoading(true);
        try {
            // leads has NO updated_at / assigned_to columns — use
            // last_activity_at / assigned_sales_exec (see CLAUDE.md).
            const { data, error } = await supabase
                .from("leads")
                .select("id, company_name, industry, city, outreach_stage, lead_quality_score, last_activity_at, created_at, assigned_sales_exec")
                .order("last_activity_at", { ascending: false, nullsFirst: false });

            if (error) throw error;
            setLeads(data || []);
        } catch (error: any) {
            console.error("Error fetching leads for pipeline:", error);
            toast.error("Could not load pipeline", error?.message ?? "");
        } finally {
            setIsLoading(false);
        }
    }

    const filteredLeads = useMemo(() => {
        return leads.filter(l => {
            const matchesNiche = nicheFilter === "all" || l.industry === nicheFilter;
            const matchesSearch = !searchQuery ||
                l.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                l.industry?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesNiche && matchesSearch;
        });
    }, [leads, nicheFilter, searchQuery]);

    const groupedLeads = useMemo(() => {
        const groups: Record<string, Lead[]> = {};
        STAGES.forEach(s => groups[s.id] = []);
        filteredLeads.forEach(l => {
            const stage = l.outreach_stage || "touch1_pending";
            if (groups[stage]) groups[stage].push(l);
            // Closed stages without a column (not_interested, dead, revival)
            // are intentionally not shown on the manager board.
        });
        return groups;
    }, [filteredLeads]);

    async function moveLead(leadId: string, toStage: string) {
        // Optimistic UI update
        const updatedLeads = (leads.map(l => l.id === leadId ? { ...l, outreach_stage: toStage, last_activity_at: new Date().toISOString() } : l) as any[]);
        setLeads(updatedLeads);

        try {
            // Stage writes ONLY via lib/pipeline.ts helpers
            const { error } = await (supabase
                .from("leads") as any)
                .update(leadStageUpdate(toStage))
                .eq("id", leadId);


            if (error) throw error;

            // Notify Manager for critical stage changes
            if (toStage === 'meeting_booked' || toStage === 'won') {
                const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
                const lead = leads.find(l => l.id === leadId);

                if (admins) {
                    for (const admin of admins) {
                        await sendNotification({
                            userId: (admin as any).id,
                            type: (toStage === 'won' ? 'deal_closed' : 'lead_status_changed') as NotificationType,
                            title: toStage === 'won' ? 'Deal Closed Won' : 'Meeting Booked',
                            body: `${lead?.company_name || 'A lead'} has moved to ${toStage.replace('_', ' ')}.`,
                            link: `/manager/pipeline`
                        });
                    }
                }
            }

            // Log Audit
            const lead = leads.find(l => l.id === leadId);
            await logAudit({
                action: 'stage_change',
                resourceType: 'lead',
                resourceId: leadId,
                resourceLabel: `Moved ${lead?.company_name || 'lead'} to ${toStage}`,
                oldValue: { stage: lead?.outreach_stage },
                newValue: { stage: toStage }
            });

        } catch (error) {
            console.error("Error moving lead:", error);
            // Rollback on error
            fetchLeads();
        }
    }

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData("leadId", id);
        setDraggingId(id);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, stageId: string) => {
        const leadId = e.dataTransfer.getData("leadId");
        setDraggingId(null);
        if (leadId) {
            moveLead(leadId, stageId);
        }
    };

    if (isLoading) return <div className="p-8 text-sm text-slate-500">Loading pipeline...</div>;

    const niches = Array.from(new Set(leads.map(l => l.industry).filter(Boolean)));

    return (
        <div className="flex h-full flex-col overflow-hidden bg-canvas">
            {/* Toolbar */}
            <div className="relative z-20 flex shrink-0 flex-col items-center justify-between gap-4 border-b border-line bg-surface px-8 py-4 md:flex-row">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand-deep">
                        <ArrowRightLeft className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="font-display text-lg font-semibold text-slate-900">Niche Pipeline</h1>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Sales Funnel Management</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Search leads..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Select
                        value={nicheFilter}
                        onChange={(e) => setNicheFilter(e.target.value)}
                        className="w-44"
                    >
                        <option value="all">All Niches</option>
                        {niches.map(n => <option key={n} value={n}>{n}</option>)}
                    </Select>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto p-6 scrollbar-hide">
                <div className="flex gap-6 h-full min-w-max pb-4">
                    {STAGES.map((stage) => (
                        <div
                            key={stage.id}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, stage.id)}
                            className={clsx(
                                "flex w-80 flex-col rounded-xl border border-transparent bg-slate-100/70 transition-all",
                                draggingId && "border-line-strong ring-2 ring-brand-ring/40"
                            )}
                        >
                            {/* Column Header */}
                            <div className="flex shrink-0 items-center justify-between p-4">
                                <div className="flex items-center gap-2">
                                    <div className={clsx(
                                        "rounded-lg p-1.5",
                                        STAGE_TONE[stage.color] || "bg-slate-100 text-slate-600"
                                    )}>
                                        <stage.icon className="h-4 w-4" />
                                    </div>
                                    <h3 className="font-display font-semibold text-slate-900">{stage.label}</h3>
                                    <span className="ml-1 text-xs font-semibold tabular-nums text-slate-400">
                                        {groupedLeads[stage.id]?.length || 0}
                                    </span>
                                </div>
                                {/* (kebab menu removed — no column actions exist yet) */}
                            </div>

                            {/* Cards Container */}
                            <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-3">
                                <AnimatePresence mode="popLayout">
                                    {groupedLeads[stage.id]?.map((lead) => (
                                        <motion.div
                                            key={lead.id}
                                            layoutId={lead.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e as any, lead.id)}
                                            className={clsx(
                                                "group relative cursor-grab rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-all hover:border-line-strong hover:shadow-md active:cursor-grabbing",
                                                draggingId === lead.id && "scale-95 opacity-40 grayscale"
                                            )}
                                        >
                                            <div className="space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <Badge tone="neutral" variant="soft" size="sm" className="uppercase tracking-wide">
                                                        {lead.industry}
                                                    </Badge>
                                                    {lead.lead_quality_score && (
                                                        <Badge
                                                            tone={lead.lead_quality_score >= 8 ? "brand" : lead.lead_quality_score >= 5 ? "warning" : "danger"}
                                                            variant="soft"
                                                            size="sm"
                                                            dot
                                                        >
                                                            {lead.lead_quality_score}/10
                                                        </Badge>
                                                    )}
                                                </div>

                                                <h4 className="font-semibold leading-tight text-slate-900">
                                                    {lead.company_name || "Prospect"}
                                                </h4>

                                                <div className="flex items-center justify-between border-t border-line pt-2">
                                                    <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                                                        <Clock className="h-3 w-3" />
                                                        <span className="tabular-nums">{Math.floor((new Date().getTime() - new Date(lead.last_activity_at ?? lead.created_at).getTime()) / (1000 * 60 * 60 * 24))}d ago</span>
                                                    </div>

                                                    <div className="flex items-center -space-x-1.5">
                                                        {lead.telecaller ? (
                                                            <div className="h-6 w-6 overflow-hidden rounded-full border-2 border-white bg-slate-200" title={lead.telecaller.full_name}>
                                                                {lead.telecaller.avatar_url ? (
                                                                    <img src={lead.telecaller.avatar_url} alt="" className="h-full w-full object-cover" />
                                                                ) : (
                                                                    <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold uppercase text-slate-500">
                                                                        {lead.telecaller.full_name.charAt(0)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-100">
                                                                <User className="h-3 w-3 text-slate-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {(!groupedLeads[stage.id] || groupedLeads[stage.id].length === 0) && (
                                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line py-8 text-slate-400">
                                        <Plus className="mb-1 h-5 w-5 opacity-30" />
                                        <span className="text-[11px] font-medium uppercase tracking-wide opacity-50">Empty Stage</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Funnel insight strip — real numbers only */}
            <div className="relative z-30 flex shrink-0 items-center justify-between border-t border-line bg-surface px-8 py-3">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-medium text-slate-500">Leads on board: <span className="text-sm font-semibold tabular-nums text-slate-900">{filteredLeads.length}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-brand-deep" />
                        <span className="text-xs font-medium text-slate-500">Meetings booked: <span className="text-sm font-semibold tabular-nums text-slate-900">{groupedLeads["meeting_booked"]?.length || 0}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-brand-deep" />
                        <span className="text-xs font-medium text-slate-500">Won: <span className="text-sm font-semibold tabular-nums text-slate-900">{groupedLeads["won"]?.length || 0}</span></span>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0,0,0,0.05);
                    border-radius: 20px;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}

// Helper icons
import { Users } from "lucide-react";
