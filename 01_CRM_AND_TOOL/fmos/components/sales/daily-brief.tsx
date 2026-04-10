"use client";

import { useState, useEffect } from "react";
import { generateDailyBrief } from "@/app/api/ai/actions";
import { Sun, RefreshCcw, Loader2 } from "lucide-react";
import { format } from "date-fns";
import clsx from "clsx";

interface DailyBriefProps {
    userName: string;
    followUpCount: number;
    freshLeadCount: number;
    warmLeads: { name: string; niche: string }[];
    callsYesterday: number;
    bestNiche: string;
}

export default function DailyBrief({
    userName,
    followUpCount,
    freshLeadCount,
    warmLeads,
    callsYesterday,
    bestNiche
}: DailyBriefProps) {
    const [brief, setBrief] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const cached = localStorage.getItem(`daily_brief_${format(new Date(), "yyyy-MM-dd")}`);
        if (cached) {
            setBrief(cached);
        } else {
            fetchBrief();
        }
    }, [userName]);

    const fetchBrief = async () => {
        setIsLoading(true);
        try {
            const result = await generateDailyBrief({
                userName,
                followUpCount,
                freshLeadCount,
                warmLeads,
                callsYesterday,
                bestNiche
            });
            setBrief(result);
            localStorage.setItem(`daily_brief_${format(new Date(), "yyyy-MM-dd")}`, result);
        } catch (error) {
            setBrief("Good morning! Ready to dominate the day? No brief available right now.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isClient) return null;

    return (
        <div className="bg-gradient-to-br from-[#020617] to-slate-900 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
            {/* Ambient background glow */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/10 blur-[60px] rounded-full group-hover:bg-amber-500/15 transition-all duration-700" />

            <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-500/20 p-2 rounded-2xl border border-amber-500/30">
                            <Sun className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold leading-tight">Your Day at a Glance</h2>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{format(new Date(), "EEEE, MMM do")}</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchBrief}
                        disabled={isLoading}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-slate-400 border border-white/5"
                    >
                        <RefreshCcw className={clsx("h-3 w-3", isLoading && "animate-spin")} />
                    </button>
                </div>

                <div className="min-h-[60px]">
                    {isLoading ? (
                        <div className="space-y-3 animate-pulse">
                            <div className="h-3 bg-white/10 rounded-full w-4/5" />
                            <div className="h-3 bg-white/10 rounded-full w-full" />
                            <div className="h-3 bg-white/10 rounded-full w-2/3" />
                        </div>
                    ) : (
                        <p className="text-slate-300 text-sm leading-relaxed italic pr-4">
                            "{brief}"
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
