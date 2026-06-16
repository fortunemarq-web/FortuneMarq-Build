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

    if (isLoading) return <div className="p-8">Loading pipeline...</div>;

    const niches = Array.from(new Set(leads.map(l => l.industry).filter(Boolean)));

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {/* Toolbar */}
            <div className="bg-white border-b border-slate-200 px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 shadow-sm relative z-20">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-900 p-2 rounded-xl text-white">
                        <ArrowRightLeft className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Niche Pipeline</h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sales Funnel Management</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search leads..."
                            className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm w-64 focus:ring-2 focus:ring-slate-900/5 transition-all font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <select
                        value={nicheFilter}
                        onChange={(e) => setNicheFilter(e.target.value)}
                        className="px-4 py-2 bg-slate-100 border-none rounded-xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-slate-900/5 transition-all"
                    >
                        <option value="all">All Niches</option>
                        {niches.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
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
                                "flex flex-col w-80 rounded-3xl bg-slate-200/40 border border-transparent transition-all",
                                draggingId && "border-slate-300 ring-2 ring-slate-400/10"
                            )}
                        >
                            {/* Column Header */}
                            <div className="p-4 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className={clsx(
                                        "p-1.5 rounded-lg",
                                        stage.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                                            stage.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                                                stage.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                                                    stage.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                                                        stage.color === 'green' ? 'bg-green-100 text-green-600' :
                                                            stage.color === 'rose' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'
                                    )}>
                                        <stage.icon className="h-4 w-4" />
                                    </div>
                                    <h3 className="font-bold text-slate-900">{stage.label}</h3>
                                    <span className="text-xs font-bold text-slate-400 ml-1">
                                        {groupedLeads[stage.id]?.length || 0}
                                    </span>
                                </div>
                                {/* (kebab menu removed — no column actions exist yet) */}
                            </div>

                            {/* Cards Container */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
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
                                                "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:border-slate-300 transition-all group relative",
                                                draggingId === lead.id && "opacity-40 grayscale scale-95"
                                            )}
                                        >
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <span className={clsx(
                                                        "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest",
                                                        "bg-indigo-50 text-indigo-600 border border-indigo-100"
                                                    )}>
                                                        {lead.industry}
                                                    </span>
                                                    {lead.lead_quality_score && (
                                                        <div className={clsx(
                                                            "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold",
                                                            lead.lead_quality_score >= 8 ? "bg-emerald-50 text-emerald-600" :
                                                                lead.lead_quality_score >= 5 ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                                                        )}>
                                                            <div className={clsx("h-1.5 w-1.5 rounded-full", lead.lead_quality_score >= 8 ? "bg-emerald-500" : lead.lead_quality_score >= 5 ? "bg-amber-500" : "bg-rose-500")} />
                                                            {lead.lead_quality_score}/10
                                                        </div>
                                                    )}
                                                </div>

                                                <h4 className="font-bold text-slate-900 leading-tight group-hover:text-slate-900 transition-colors">
                                                    {lead.company_name || "Prospect"}
                                                </h4>

                                                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{Math.floor((new Date().getTime() - new Date(lead.last_activity_at ?? lead.created_at).getTime()) / (1000 * 60 * 60 * 24))}d ago</span>
                                                    </div>

                                                    <div className="flex items-center -space-x-1.5">
                                                        {lead.telecaller ? (
                                                            <div className="h-6 w-6 rounded-full border-2 border-white bg-slate-200 overflow-hidden" title={lead.telecaller.full_name}>
                                                                {lead.telecaller.avatar_url ? (
                                                                    <img src={lead.telecaller.avatar_url} alt="" className="h-full w-full object-cover" />
                                                                ) : (
                                                                    <div className="h-full w-full flex items-center justify-center text-[8px] font-black text-slate-500 uppercase">
                                                                        {lead.telecaller.full_name.charAt(0)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="h-6 w-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center">
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
                                    <div className="flex flex-col items-center justify-center py-8 text-slate-400 border-2 border-dashed border-slate-300/50 rounded-2xl">
                                        <Plus className="h-5 w-5 mb-1 opacity-20" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Empty Stage</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Funnel insight strip — real numbers only */}
            <div className="bg-white border-t border-slate-200 px-8 py-3 flex items-center justify-between shrink-0 relative z-30">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="text-xs font-bold text-slate-500">Leads on board: <span className="text-slate-900 text-sm">{filteredLeads.length}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs font-bold text-slate-500">Meetings booked: <span className="text-slate-900 text-sm">{groupedLeads["meeting_booked"]?.length || 0}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-500">Won: <span className="text-slate-900 text-sm">{groupedLeads["won"]?.length || 0}</span></span>
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
