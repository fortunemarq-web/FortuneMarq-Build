"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Search, Copy, BookOpen, AlertCircle } from "lucide-react";
import clsx from "clsx";
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
        <div className="flex flex-col h-full bg-slate-50 rounded-xl border border-[#222] overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-[#222]">
                <button
                    onClick={() => setActiveTab("scripts")}
                    className={clsx(
                        "flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors",
                        activeTab === "scripts" ? "bg-white text-slate-900 border-b-2 border-[#42CA80]" : "text-slate-600 hover:bg-[#151515]"
                    )}
                >
                    Scripts
                </button>
                <button
                    onClick={() => setActiveTab("objections")}
                    className={clsx(
                        "flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors",
                        activeTab === "objections" ? "bg-white text-slate-900 border-b-2 border-[#42CA80]" : "text-slate-600 hover:bg-[#151515]"
                    )}
                >
                    Objections
                </button>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-[#222]">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
                    <input
                        type="text"
                        placeholder="Search library..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg bg-slate-50 border border-[#222] pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#42CA80]"
                    />
                </div>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {loading ? (
                    <div className="text-center text-slate-600 text-xs py-8">Loading library...</div>
                ) : filteredData.length === 0 ? (
                    <div className="text-center text-slate-600 text-xs py-8">No matching items found</div>
                ) : (
                    filteredData.map((item) => (
                        <div key={item.id} className="group rounded-lg border border-[#222] bg-[#161616] p-4 hover:border-slate-300">
                            {activeTab === "scripts" ? (
                                <>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold text-slate-900 text-sm">{item.script_title}</h4>
                                        {item.industry && <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded uppercase">{item.industry}</span>}
                                    </div>
                                    <p className="text-xs text-slate-500 whitespace-pre-wrap leading-relaxed">{item.script_body}</p>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 mb-2">"{item.objection}"</p>
                                            <div className="bg-slate-100 rounded p-2 text-xs text-[#ccc] leading-relaxed">
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
                                className="mt-3 w-full flex items-center justify-center gap-2 rounded bg-slate-50 py-1.5 text-xs font-medium text-slate-600 opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-100 hover:text-slate-900"
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
