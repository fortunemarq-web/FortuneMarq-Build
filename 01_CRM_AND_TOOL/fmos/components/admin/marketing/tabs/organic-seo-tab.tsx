"use client";

import React, { useState } from "react";
import {
    RefreshCw,
    Zap,
    ArrowUp,
    ArrowDown,
    BookOpen,
    Video,
    LayoutGrid,
    Star,
    TrendingUp,
    X,
    AlertCircle,
    Search,
    ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";
import { useSeoKeywords, useContentPieces } from "@/lib/hooks/use-marketing-data";
import { createClient } from "@/lib/supabase";

// No GSC integration — traffic chart shows placeholder until connected

export default function OrganicSeoTab() {
    const { data: keywords, loading: keywordsLoading, error: keywordsError, refetch: refetchKeywords } = useSeoKeywords();
    const { data: content, loading: contentLoading, error: contentError, refetch: refetchContent } = useContentPieces({ status: 'published' });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        keyword: "",
        current_position: "",
        search_volume: "",
        difficulty: "low" as "low" | "medium" | "high",
        target_url: "",
        notes: ""
    });

    const stats = [
        { label: "Organic Sessions", value: "—", delta: "GSC not connected", positive: true },
        { label: "Avg. Position", value: "—", delta: "GSC not connected", positive: true },
        { label: "Total Impressions", value: "—", delta: "GSC not connected", positive: true },
        { label: "Click-Through Rate", value: "—", delta: "GSC not connected", positive: false }
    ];

    const getPositionColor = (pos: number | null) => {
        if (pos === null) return "text-[#666]";
        if (pos <= 3) return "text-[#42CA80]";
        if (pos <= 10) return "text-[#3b82f6]";
        if (pos <= 20) return "text-[#fbbf24]";
        return "text-[#a1a1aa]";
    };

    const getDifficultyBadge = (difficulty: string | null) => {
        switch (difficulty) {
            case "low":
                return "bg-[#42CA80]/10 text-[#42CA80] border border-[#42CA80]/30";
            case "medium":
                return "bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/30";
            case "high":
                return "bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30";
            default:
                return "bg-[#333] text-[#a1a1aa] border border-[#444]";
        }
    };

    const getContentTypeIcon = (type: string) => {
        switch (type) {
            case "blog": return { icon: BookOpen, color: "text-[#3b82f6]", bg: "bg-[#3b82f6]/10" };
            case "reel": return { icon: Video, color: "text-[#a855f7]", bg: "bg-[#a855f7]/10" };
            case "carousel": return { icon: LayoutGrid, color: "text-[#fbbf24]", bg: "bg-[#fbbf24]/10" };
            case "case_study": return { icon: Star, color: "text-[#42CA80]", bg: "bg-[#42CA80]/10" };
            default: return { icon: BookOpen, color: "text-slate-400", bg: "bg-slate-400/10" };
        }
    };

    const handleSaveKeyword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const supabase = createClient();
            const { error: insertError } = await supabase
                .from('seo_keywords' as any)
                .insert({
                    keyword: formData.keyword,
                    current_position: formData.current_position ? parseInt(formData.current_position) : null,
                    search_volume: formData.search_volume ? parseInt(formData.search_volume) : 0,
                    difficulty: formData.difficulty,
                    target_url: formData.target_url || null,
                    notes: formData.notes || null,
                    is_tracking: true,
                });

            if (insertError) throw insertError;

            setIsModalOpen(false);
            refetchKeywords();
            setFormData({
                keyword: "",
                current_position: "",
                search_volume: "",
                difficulty: "low",
                target_url: "",
                notes: ""
            });
        } catch (err) {
            console.error("Error saving keyword:", err);
            setSubmitError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const quickWins = keywords.filter(k => k.current_position && k.current_position >= 11 && k.current_position <= 20);

    const TableSkeleton = ({ cols = 7 }: { cols?: number }) => (
        <>
            {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#1f1f1f]">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                            <div className="bg-[#333] animate-pulse rounded h-3.5 w-full" />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );

    return (
        <div className="space-y-6">
            {/* Traffic Overview Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 flex flex-col gap-1 hover:border-[#444] transition-colors"
                    >
                        <span className="text-[#a1a1aa] text-[10px] uppercase tracking-wider font-semibold">
                            {stat.label}
                        </span>
                        <div className="flex items-center justify-between">
                            <span className="text-white text-xl font-bold font-mono">{stat.value}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${stat.positive ? "bg-[#42CA80]/10 text-[#42CA80]" : "bg-[#ef4444]/10 text-[#ef4444]"
                                }`}>
                                {stat.delta}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {keywordsError && (
                <div className="bg-[#1a1a1a] border border-[#ef4444]/20 rounded-xl p-4 flex items-center justify-between text-[#ef4444] text-sm">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-4 w-4" />
                        <span>Failed to load keyword rankings. Please try again.</span>
                    </div>
                    <button
                        onClick={() => refetchKeywords()}
                        className="text-[#42CA80] text-xs underline cursor-pointer hover:text-[#3ab872] transition-colors"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Keyword Rankings Table Card */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden hover:border-[#444] transition-colors"
            >
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-white font-semibold text-lg">Keyword Rankings</h3>
                        <p className="text-[#a1a1aa] text-xs">Track your agency website's search positions</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-[#42CA80] text-black text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#3ab872] transition-colors flex items-center gap-1.5 active:scale-95"
                        >
                            <span>+ Add Keyword</span>
                        </button>
                        <button
                            onClick={() => refetchKeywords()}
                            className="border border-[#333] text-[#a1a1aa] text-xs px-3 py-1.5 rounded-lg hover:bg-[#222] transition-colors flex items-center gap-1.5 active:scale-95"
                        >
                            <RefreshCw className={`h-3 w-3 ${keywordsLoading ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Quick Wins Banner */}
                <AnimatePresence>
                    {quickWins.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-[#42CA80]/5 border border-[#42CA80]/20 rounded-xl px-4 py-3 mx-5 mt-2 flex items-center gap-3 overflow-hidden"
                        >
                            <Zap className="h-4 w-4 text-[#42CA80] flex-shrink-0" />
                            <p className="text-[#a1a1aa] text-xs">
                                <span className="text-white font-medium mr-1 whitespace-nowrap">Quick Wins</span>
                                — {quickWins.length} keywords on positions 11–20 are close to page 1:
                                <span className="text-[#e2e2e2] ml-1">
                                    {quickWins.slice(0, 3).map(k => `"${k.keyword}"`).join(", ")}
                                    {quickWins.length > 3 ? ` and ${quickWins.length - 3} more` : ""}
                                </span>
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Table */}
                <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-[#111] border-b border-[#333]">
                                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-[#666]">Keyword</th>
                                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-[#666]">Position</th>
                                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-[#666]">Change</th>
                                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-[#666]">Volume</th>
                                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-[#666]">Difficulty</th>
                                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-[#666]">URL</th>
                                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-[#666]">Last Checked</th>
                            </tr>
                        </thead>
                        <tbody>
                            {keywordsLoading ? (
                                <TableSkeleton />
                            ) : keywords.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-20 text-center">
                                        <TrendingUp className="h-10 w-10 text-[#333] mx-auto" />
                                        <h4 className="text-[#666] text-sm font-medium mt-3">No keywords tracked yet</h4>
                                        <p className="text-[#555] text-xs mt-1">Add your first keyword to start tracking your SEO positions.</p>
                                        <button
                                            onClick={() => setIsModalOpen(true)}
                                            className="mt-6 text-[#42CA80] text-sm font-semibold hover:underline flex items-center gap-1.5 mx-auto transition-all"
                                        >
                                            + Add Keyword
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                keywords.map((kw, i) => {
                                    const change = (kw.previous_position || 0) - (kw.current_position || 0);
                                    return (
                                        <tr key={kw.id} className="border-b border-[#1f1f1f] hover:bg-[#222]/50 transition-colors group">
                                            <td className="px-5 py-4 text-white font-medium">{kw.keyword}</td>
                                            <td className={`px-5 py-4 font-mono font-bold text-base ${getPositionColor(kw.current_position)}`}>
                                                {kw.current_position || "--"}
                                            </td>
                                            <td className="px-5 py-4 font-mono text-xs">
                                                {kw.previous_position && kw.current_position && change > 0 ? (
                                                    <span className="text-[#42CA80] flex items-center gap-0.5">
                                                        <ArrowUp className="h-3 w-3" /> {change}
                                                    </span>
                                                ) : kw.previous_position && kw.current_position && change < 0 ? (
                                                    <span className="text-[#ef4444] flex items-center gap-0.5">
                                                        <ArrowDown className="h-3 w-3" /> {Math.abs(change)}
                                                    </span>
                                                ) : (
                                                    <span className="text-[#666]">--</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-slate-700 font-mono text-xs">{kw.search_volume?.toLocaleString() || "0"}</td>
                                            <td className="px-5 py-4">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider ${getDifficultyBadge(kw.difficulty)}`}>
                                                    {kw.difficulty || "unknown"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 font-mono text-xs text-[#a1a1aa] truncate max-w-[150px]" title={kw.target_url || ""}>{kw.target_url || "--"}</td>
                                            <td className="px-5 py-4 text-[#666] text-xs">
                                                {kw.last_checked_at ? new Date(kw.last_checked_at).toLocaleDateString() : "Never"}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Traffic Trend area chart */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 mt-6 hover:border-[#444] transition-colors"
            >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h3 className="text-white font-semibold text-base">Organic Traffic Trend</h3>
                        <p className="text-[#a1a1aa] text-xs mt-0.5 font-sans">Sessions from organic search</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1">
                        {["7D", "30D", "90D"].map((p) => (
                            <span
                                key={p}
                                className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-lg cursor-pointer border transition-all ${p === "30D" ? "bg-[#42CA80]/20 text-[#42CA80] border-[#42CA80]/30" : "text-[#666] border-[#333] hover:text-[#a1a1aa] hover:border-[#444]"
                                    }`}
                            >
                                {p}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="h-[220px] w-full relative flex flex-col items-center justify-center gap-3 border border-dashed border-[#333] rounded-xl">
                    <Search className="h-8 w-8 text-[#444]" />
                    <p className="text-[#666] text-sm font-semibold">Google Search Console not connected</p>
                    <p className="text-[#555] text-xs">Connect GSC to see real organic traffic data here</p>
                </div>
            </motion.div>

            {/* Top Performing Content Table */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden mt-6 hover:border-[#444] transition-colors"
            >
                <div className="p-5 flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-semibold text-lg">Top Performing Content</h3>
                        <p className="text-[#a1a1aa] text-xs">Content pieces driving the most organic traffic</p>
                    </div>
                </div>

                {contentError && (
                    <div className="px-5 py-4 bg-[#ef4444]/5 border-y border-[#ef4444]/10 text-[#ef4444] text-xs flex items-center justify-between">
                        <span>Failed to load top content.</span>
                        <button onClick={() => refetchContent()} className="underline font-bold">Retry</button>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#111] border-b border-[#333]">
                                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-[#666] font-bold">Content</th>
                                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-[#666] font-bold">Type</th>
                                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-[#666] font-bold">Platform</th>
                                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-[#666] font-bold">Clicks / Views</th>
                                <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider text-[#666] font-bold">Leads</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contentLoading ? (
                                <TableSkeleton cols={5} />
                            ) : content.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center">
                                        <BookOpen className="h-8 w-8 text-[#333] mx-auto" />
                                        <p className="text-[#666] text-sm mt-2 font-medium">No published content pieces found</p>
                                    </td>
                                </tr>
                            ) : (
                                content.slice(0, 5).map((item, i) => {
                                    const typeInfo = getContentTypeIcon(item.content_type);
                                    return (
                                        <tr key={item.id} className="border-b border-[#1f1f1f] hover:bg-[#222]/50 transition-colors group">
                                            <td className="px-5 py-4 text-white font-medium max-w-xs truncate">{item.title}</td>
                                            <td className="px-5 py-4">
                                                <div className={`p-1.5 rounded-lg inline-flex ${typeInfo.bg}`}>
                                                    <typeInfo.icon className={`h-4 w-4 ${typeInfo.color}`} />
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-widest ${item.platform === "instagram" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                                                    item.platform === "linkedin" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                                        "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                                    }`}>
                                                    {item.platform}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 font-mono text-[#a1a1aa] text-xs">{(item.clicks || 0).toLocaleString()}</td>
                                            <td className="px-5 py-4">
                                                {(item.leads_attributed || 0) > 0 ? (
                                                    <span className="text-[#42CA80] font-mono font-bold text-sm">{item.leads_attributed}</span>
                                                ) : (
                                                    <span className="text-[#666] font-mono whitespace-nowrap">--</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* ADD KEYWORD MODAL */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ opacity: 0, y: "100%" }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-[#111] border-t sm:border border-[#333] rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden max-h-[95vh] flex flex-col"
                        >
                            <div className="p-6 border-b border-[#333] flex items-center justify-between shrink-0">
                                <h3 className="text-white font-semibold text-lg">Add Keyword</h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-1 rounded-lg hover:bg-[#222] text-[#666] hover:text-white transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form className="p-6 space-y-4 overflow-y-auto" onSubmit={handleSaveKeyword}>
                                <div className="space-y-1.5">
                                    <label className="text-[#a1a1aa] text-[10px] font-bold uppercase tracking-widest">Keyword</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. digital marketing agency mumbai"
                                        className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#42CA80]/50 outline-none transition-all placeholder:text-[#444]"
                                        value={formData.keyword}
                                        onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[#a1a1aa] text-[10px] font-bold uppercase tracking-widest">Current Position</label>
                                        <input
                                            type="number"
                                            placeholder="e.g. 14"
                                            className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#42CA80]/50 outline-none transition-all placeholder:text-[#444]"
                                            value={formData.current_position}
                                            onChange={(e) => setFormData({ ...formData, current_position: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[#a1a1aa] text-[10px] font-bold uppercase tracking-widest">Search Volume</label>
                                        <input
                                            type="number"
                                            placeholder="e.g. 1200"
                                            className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#42CA80]/50 outline-none transition-all placeholder:text-[#444]"
                                            value={formData.search_volume}
                                            onChange={(e) => setFormData({ ...formData, search_volume: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[#a1a1aa] text-[10px] font-bold uppercase tracking-widest">Difficulty</label>
                                    <select
                                        className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#42CA80]/50 outline-none transition-all"
                                        value={formData.difficulty}
                                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[#a1a1aa] text-[10px] font-bold uppercase tracking-widest">Target URL</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. /services/seo"
                                        className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#42CA80]/50 outline-none transition-all placeholder:text-[#444]"
                                        value={formData.target_url}
                                        onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[#a1a1aa] text-[10px] font-bold uppercase tracking-widest">Notes</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Any notes or context..."
                                        className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#42CA80]/50 outline-none transition-all resize-none placeholder:text-[#444]"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>

                                {submitError && (
                                    <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg p-3 flex items-center gap-2 text-[#ef4444] text-xs">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>{submitError}</span>
                                    </div>
                                )}

                                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-[#333] text-white text-sm font-semibold hover:bg-[#222] transition-all order-2 sm:order-1"
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-[#42CA80] text-black text-sm font-bold hover:bg-[#3ab872] transition-all flex items-center justify-center gap-2 order-1 sm:order-2"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? <div className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : "Save Keyword"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
