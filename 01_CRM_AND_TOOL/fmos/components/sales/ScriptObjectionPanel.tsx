"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Search, Copy, AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { inputClasses } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";

interface ScriptObjectionPanelProps {
    leadIndustry?: string | null;
    leadCity?: string | null;
}

export default function ScriptObjectionPanel({ leadIndustry, leadCity }: ScriptObjectionPanelProps) {
    const [activeTab, setActiveTab] = useState<"scripts" | "objections">("scripts");
    const [search, setSearch] = useState("");
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [activeTab, leadIndustry]);

    const fetchData = async () => {
        setLoading(true);
        const supabase = createClient();
        let query: any;

        if (activeTab === "scripts") {
            query = supabase.from("sales_scripts").select("*");
            // Logic for relevant scripts: specific to industry OR global (null)
            // Supabase OR syntax: industry.eq.Tech,industry.is.null
            // But query builder is safer with .or()
            if (leadIndustry) {
                query = query.or(`industry.eq.${leadIndustry},industry.is.null`);
            } else {
                query = query.is("industry", null);
            }
        } else {
            query = supabase.from("objection_bank").select("*");
            if (leadIndustry) {
                query = query.or(`industry.eq.${leadIndustry},industry.is.null`);
            } else {
                query = query.is("industry", null);
            }
        }

        const { data: results, error } = await query;
        if (!error) {
            setData(results || []);
        }
        setLoading(false);
    };

    const filteredData = data.filter(item => {
        const term = search.toLowerCase();
        if (activeTab === "scripts") {
            return item.script_title.toLowerCase().includes(term) || item.script_body.toLowerCase().includes(term);
        } else {
            return item.objection.toLowerCase().includes(term) || item.rebuttal.toLowerCase().includes(term);
        }
    });

    return (
        <div className="flex flex-col h-full bg-surface rounded-xl border border-line overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-line">
                <button
                    onClick={() => setActiveTab("scripts")}
                    className={cn(
                        "flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors",
                        activeTab === "scripts" ? "bg-slate-50 text-slate-900 border-b-2 border-brand-deep" : "text-slate-600 hover:bg-slate-50"
                    )}
                >
                    Scripts
                </button>
                <button
                    onClick={() => setActiveTab("objections")}
                    className={cn(
                        "flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors",
                        activeTab === "objections" ? "bg-slate-50 text-slate-900 border-b-2 border-brand-deep" : "text-slate-600 hover:bg-slate-50"
                    )}
                >
                    Objections
                </button>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-line">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search library..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={cn(inputClasses, "pl-9 text-xs")}
                    />
                </div>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {loading ? (
                    <div className="text-center text-slate-500 text-xs py-8">Loading library...</div>
                ) : filteredData.length === 0 ? (
                    <div className="text-center text-slate-500 text-xs py-8">No matching items found</div>
                ) : (
                    filteredData.map((item) => (
                        <div key={item.id} className="group rounded-lg border border-line bg-slate-50 p-4 transition-colors hover:border-line-strong">
                            {activeTab === "scripts" ? (
                                <>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold text-slate-900 text-sm">{item.script_title}</h4>
                                        {item.industry && <Badge tone="info" size="sm">{item.industry}</Badge>}
                                    </div>
                                    <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{item.script_body}</p>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="h-4 w-4 text-warn mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 mb-2">&quot;{item.objection}&quot;</p>
                                            <div className="bg-surface border border-line rounded-lg p-2 text-xs text-slate-600 leading-relaxed">
                                                {item.rebuttal}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            <button
                                onClick={() => {
                                    const text = activeTab === "scripts" ? item.script_body : item.rebuttal;
                                    navigator.clipboard.writeText(text);
                                    toast.success("Copied to clipboard");
                                }}
                                className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg bg-surface border border-line py-1.5 text-xs font-medium text-slate-600 opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-100 hover:text-slate-900"
                            >
                                <Copy className="h-3 w-3" /> Copy Text
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
