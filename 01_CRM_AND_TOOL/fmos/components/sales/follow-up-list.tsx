"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import {
    Phone,
    MessageCircle,
    Mail,
    CheckCircle2,
    Clock,
    Calendar,
    ChevronRight,
    Loader2,
    RefreshCcw,
    User,
    Building2
} from "lucide-react";
import clsx from "clsx";
import { format, isToday, isPast } from "date-fns";

interface FollowUp {
    id: string;
    lead_id: string;
    scheduled_at: string;
    follow_up_type: 'call' | 'whatsapp' | 'email';
    notes: string;
    status: 'pending' | 'completed' | 'missed' | 'rescheduled';
    lead: {
        company_name: string;
        contact_person: string;
        phone: string;
        industry: string | null;
        city: string | null;
    };
}

interface FollowUpListProps {
    onSelectLead: (leadId: string) => void;
}

export default function FollowUpList({ onSelectLead }: FollowUpListProps) {
    const supabase = createClient();
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [nicheFilter, setNicheFilter] = useState<string>("all");
    const [cityFilter, setCityFilter] = useState<string>("all");

    useEffect(() => {
        fetchFollowUps();
    }, []);

    const fetchFollowUps = async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await (supabase.from("follow_ups" as any)
            .select("*, lead:leads(company_name, contact_person, phone, industry, city)")
            .eq("status", "pending")
            .order("scheduled_at", { ascending: true }) as any);

        if (data) setFollowUps(data);
        setIsLoading(false);
    };

    const handleComplete = async (id: string, leadId: string) => {
        const { error } = await supabase.from("follow_ups" as any)
            .update({
                status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq("id", id);

        if (!error) {
            setFollowUps(prev => prev.filter(f => f.id !== id));
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'call': return <Phone className="h-4 w-4" />;
            case 'whatsapp': return <MessageCircle className="h-4 w-4" />;
            case 'email': return <Mail className="h-4 w-4" />;
            default: return <Clock className="h-4 w-4" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'call': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'whatsapp': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'email': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        }
    };

    const getPriority = (scheduledAt: string): 0 | 1 | 2 => {
        const date = new Date(scheduledAt);
        if (isPast(date) && !isToday(date)) return 0; // overdue — highest
        if (isToday(date)) return 1;                   // today
        return 2;                                       // upcoming
    };

    const uniqueNiches = Array.from(new Set(followUps.map(f => f.lead?.industry).filter(Boolean))).sort() as string[];
    const uniqueCities = Array.from(new Set(followUps.map(f => f.lead?.city).filter(Boolean))).sort() as string[];

    const displayedFollowUps = followUps
        .filter(fu => {
            if (nicheFilter !== "all" && fu.lead?.industry !== nicheFilter) return false;
            if (cityFilter !== "all" && fu.lead?.city !== cityFilter) return false;
            return true;
        })
        .sort((a, b) => {
            const pa = getPriority(a.scheduled_at);
            const pb = getPriority(b.scheduled_at);
            if (pa !== pb) return pa - pb; // overdue first
            return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(); // then by time
        });

    return (
        <div className="flex flex-col h-full bg-white border-l border-slate-200 w-80 shrink-0 hidden xl:flex">
            <div className="border-b border-slate-100 bg-slate-50/50">
                {/* Title row */}
                <div className="p-4 pb-2 flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-emerald-500" />
                            Follow-ups
                        </h3>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                            {displayedFollowUps.length} of {followUps.length} Pending
                        </p>
                    </div>
                    <button
                        onClick={fetchFollowUps}
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <RefreshCcw className={clsx("h-4 w-4", isLoading && "animate-spin")} />
                    </button>
                </div>

                {/* Filter dropdowns */}
                {followUps.length > 0 && (
                    <div className="px-3 pb-3 flex gap-2">
                        <select
                            value={nicheFilter}
                            onChange={e => setNicheFilter(e.target.value)}
                            className="flex-1 min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                        >
                            <option value="all">All Niches</option>
                            {uniqueNiches.map(n => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                        <select
                            value={cityFilter}
                            onChange={e => setCityFilter(e.target.value)}
                            className="flex-1 min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                        >
                            <option value="all">All Cities</option>
                            {uniqueCities.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Priority breakdown bar */}
                {followUps.length > 0 && (
                    <div className="px-3 pb-3 flex gap-2 text-[9px] font-bold uppercase tracking-widest">
                        {(() => {
                            const overdue = displayedFollowUps.filter(f => getPriority(f.scheduled_at) === 0).length;
                            const today = displayedFollowUps.filter(f => getPriority(f.scheduled_at) === 1).length;
                            const upcoming = displayedFollowUps.filter(f => getPriority(f.scheduled_at) === 2).length;
                            return (
                                <>
                                    {overdue > 0 && <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{overdue} Overdue</span>}
                                    {today > 0 && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{today} Today</span>}
                                    {upcoming > 0 && <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{upcoming} Later</span>}
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                        <span className="text-xs font-medium italic">Loading follow-ups...</span>
                    </div>
                ) : followUps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                        </div>
                        <p className="text-sm font-bold text-slate-900">All caught up!</p>
                        <p className="text-xs text-slate-500 mt-1">No pending follow-ups for today.</p>
                    </div>
                ) : (
                    displayedFollowUps.map(fu => {
                        const priority = getPriority(fu.scheduled_at);
                        const cardBorder = priority === 0
                            ? "bg-red-50/40 border-red-200"      // overdue
                            : priority === 1
                            ? "bg-amber-50/30 border-amber-200"  // today
                            : "bg-white border-slate-100 hover:border-emerald-200"; // upcoming
                        const timeColor = priority === 0 ? "text-red-500" : priority === 1 ? "text-amber-500" : "text-emerald-500";
                        return (
                            <div
                                key={fu.id}
                                className={clsx(
                                    "group relative p-3 rounded-xl border transition-all hover:shadow-md cursor-pointer",
                                    cardBorder
                                )}
                                onClick={() => onSelectLead(fu.lead_id)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={clsx(
                                        "p-1.5 rounded-lg border",
                                        getTypeColor(fu.follow_up_type)
                                    )}>
                                        {getIcon(fu.follow_up_type)}
                                    </span>
                                    <div className="text-right">
                                        <div className={clsx(
                                            "text-[10px] font-bold uppercase",
                                            timeColor
                                        )}>
                                            {format(new Date(fu.scheduled_at), "h:mm a")}
                                        </div>
                                        <div className="text-[8px] text-slate-400 font-bold uppercase">
                                            {isToday(new Date(fu.scheduled_at)) ? "Today" : format(new Date(fu.scheduled_at), "MMM d")}
                                        </div>
                                    </div>
                                </div>

                                <h4 className="text-xs font-bold text-slate-900 truncate pr-6">{fu.lead?.company_name}</h4>
                                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
                                    <User className="h-3 w-3" />
                                    <span className="truncate">{fu.lead?.contact_person}</span>
                                </div>

                                {(fu.lead?.industry || fu.lead?.city) && (
                                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                        {fu.lead?.industry && (
                                            <span className="bg-violet-50 text-violet-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-violet-100">
                                                {fu.lead.industry}
                                            </span>
                                        )}
                                        {fu.lead?.city && (
                                            <span className="bg-slate-50 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-slate-100">
                                                {fu.lead.city}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {fu.notes && (
                                    <p className="mt-2 text-[10px] text-slate-500 line-clamp-2 italic leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        "{fu.notes}"
                                    </p>
                                )}

                                <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleComplete(fu.id, fu.lead_id);
                                        }}
                                        className="flex-1 bg-emerald-500 text-white py-1.5 rounded-lg font-bold text-[10px] hover:bg-emerald-600 transition-colors shadow-sm"
                                    >
                                        Complete
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectLead(fu.lead_id); // Opens lead for rescheduling
                                        }}
                                        className="px-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors transition-colors"
                                    >
                                        <ChevronRight className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/30">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pro Tip</p>
                    <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                        Click on a follow-up to load the lead into your dialer instantly.
                    </p>
                </div>
            </div>
        </div>
    );
}
