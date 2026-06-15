"use client"

import React from "react"
import { motion } from "framer-motion"
import {
    TrendingUp,
    Users,
    Target,
    Zap,
    ArrowUpRight,
    ArrowDownRight,
    Sparkles,
    Calendar,
    ChevronRight,
    RefreshCw,
    AlertCircle,
    Search
} from "lucide-react"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts"
import { useMarketingOverviewStats, useLatestWeeklyBrief, useLeadsByDay, useLeadSourceBreakdown } from "@/lib/hooks/use-marketing-data"
import Link from "next/link"

export default function OverviewTab() {
    const { data: stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useMarketingOverviewStats()
    const { data: brief, loading: briefLoading, error: briefError, refetch: refetchBrief } = useLatestWeeklyBrief()
    const { data: performanceData } = useLeadsByDay(7)
    const { data: sourceData } = useLeadSourceBreakdown()

    const topChannel = sourceData.length > 0 ? sourceData[0].name : null
    const conversionRate = (stats as any)?.conversion_rate_pct ?? null

    const kpis = [
        {
            label: "Total Leads (MTD)",
            value: stats ? stats.total_leads_from_marketing.toString() : "0",
            delta: stats ? `${stats.leads_delta_pct > 0 ? "+" : ""}${stats.leads_delta_pct}%` : "0%",
            isPositive: stats ? stats.leads_delta_pct >= 0 : true,
            icon: Users,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        {
            label: "Avg. CPL",
            value: stats ? `₹${stats.avg_cpl.toFixed(0)}` : "₹0",
            delta: "0%", // Delta not tracked yet
            isPositive: true,
            icon: Target,
            color: "text-[#42CA80]",
            bg: "bg-[#42CA80]/10",
        },
        {
            label: "Total Spend (MTD)",
            value: stats ? `₹${stats.total_ad_spend_mtd.toLocaleString()}` : "₹0",
            delta: "0%", // Delta not tracked yet
            isPositive: true,
            icon: Zap,
            color: "text-yellow-500",
            bg: "bg-yellow-500/10",
        },
        {
            label: "Conversion Rate",
            value: conversionRate !== null ? `${conversionRate}%` : "—",
            delta: stats ? `${(stats as any).won_mtd || 0} won` : "0 won",
            isPositive: true,
            icon: TrendingUp,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
        },
    ]

    const KPISkeleton = () => (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-5 space-y-3 animate-pulse">
            <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-[#333]" />
                <div className="w-12 h-5 rounded-full bg-[#333]" />
            </div>
            <div className="space-y-2">
                <div className="h-3 bg-[#333] rounded w-2/3" />
                <div className="h-8 bg-[#333] rounded w-1/2" />
            </div>
        </div>
    )

    const BriefSkeleton = () => (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 space-y-6 animate-pulse">
            <div className="flex justify-between">
                <div className="h-6 bg-[#333] rounded w-1/3" />
                <div className="h-5 bg-[#333] rounded w-24" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <div className="h-4 bg-[#333] rounded w-1/4" />
                    <div className="h-20 bg-[#333] rounded w-full" />
                </div>
                <div className="space-y-3">
                    <div className="h-4 bg-[#333] rounded w-1/4" />
                    <div className="h-20 bg-[#333] rounded w-full" />
                </div>
            </div>
        </div>
    )

    return (
        <div className="space-y-6">
            {/* KPI GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <KPISkeleton key={i} />)
                ) : statsError ? (
                    <div className="col-span-full bg-[#1a1a1a] border border-[#ef4444]/20 rounded-xl p-4 flex items-center justify-between text-[#ef4444] text-sm font-sans">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5" />
                            <span>Failed to load marketing statistics.</span>
                        </div>
                        <button onClick={() => refetchStats()} className="underline font-bold text-[#42CA80] hover:text-[#3ab872] transition-colors">Retry</button>
                    </div>
                ) : (
                    kpis.map((kpi, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-5 hover:border-[#444] transition-all hover:translate-y-[-2px] group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                                    <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                                </div>
                                <div className={`flex items-center gap-0.5 text-[11px] font-bold font-mono ${kpi.isPositive ? "text-[#42CA80]" : "text-[#ef4444]"}`}>
                                    {kpi.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                    {kpi.delta}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-[#a1a1aa] text-xs font-medium mb-1 font-sans">{kpi.label}</h4>
                                <div className="text-white text-2xl font-bold tracking-tight font-mono">{kpi.value}</div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Performance Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 hover:border-[#444] transition-colors"
                >
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-white font-semibold text-lg font-sans">Leads Performance</h3>
                            <p className="text-[#a1a1aa] text-xs font-sans">Daily lead generation volume</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#42CA80]" />
                                <span className="text-[#666] text-[10px] font-bold uppercase tracking-widest font-sans">Leads</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData}>
                                <defs>
                                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#42CA80" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#42CA80" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#666", fontSize: 10, fontFamily: "monospace" }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#666", fontSize: 10, fontFamily: "monospace" }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#111", border: "1px solid #333", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)" }}
                                    itemStyle={{ color: "#42CA80", fontSize: "12px", fontWeight: "bold" }}
                                    labelStyle={{ color: "#a1a1aa", fontSize: "10px", marginBottom: "4px" }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="leads"
                                    stroke="#42CA80"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorLeads)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Source Breakdown */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 flex flex-col hover:border-[#444] transition-colors"
                >
                    <h3 className="text-white font-semibold text-lg font-sans">Lead Sources</h3>
                    <p className="text-[#a1a1aa] text-xs font-sans">This month, by channel</p>

                    {sourceData.length === 0 ? (
                        <div className="h-[240px] w-full mt-4 flex flex-col items-center justify-center gap-2 border border-dashed border-[#333] rounded-xl">
                            <Users className="h-8 w-8 text-[#333]" />
                            <p className="text-[#666] text-xs font-semibold">No leads this month yet</p>
                        </div>
                    ) : (
                        <>
                            <div className="h-[240px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={sourceData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {sourceData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "#111", border: "1px solid #333", borderRadius: "12px" }}
                                            itemStyle={{ fontSize: "12px" }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="space-y-3 mt-4">
                                {sourceData.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-[#a1a1aa] text-xs font-sans">{item.name}</span>
                                        </div>
                                        <span className="text-white text-xs font-bold font-mono">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </motion.div>
            </div>

            {/* WEEKLY BRIEF SECTION */}
            {briefLoading ? (
                <BriefSkeleton />
            ) : briefError ? (
                <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4">
                    <AlertCircle className="h-10 w-10 text-[#333]" />
                    <div>
                        <h4 className="text-[#666] font-medium font-sans">Failed to load weekly brief</h4>
                        <p className="text-[#555] text-xs mt-1 font-sans">There was an issue retrieving the latest marketing analysis.</p>
                    </div>
                    <button onClick={() => refetchBrief()} className="bg-[#111] border border-[#333] text-[#42CA80] text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#222] transition-all">
                        Try Again
                    </button>
                </div>
            ) : brief ? (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 relative overflow-hidden group hover:border-[#444] transition-colors"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Sparkles className="h-32 w-32 text-[#42CA80]" />
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#42CA80]/10 rounded-lg">
                                <Sparkles className="h-5 w-5 text-[#42CA80]" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg font-sans">Marketing Weekly Brief</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <Calendar className="h-3 w-3 text-[#666]" />
                                    <span className="text-[#666] text-[10px] font-bold uppercase tracking-widest font-sans">
                                        Week of {new Date(brief.week_start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => refetchBrief()}
                            className="bg-[#111] border border-[#333] text-white text-xs font-bold px-4 py-2 rounded-xl hover:border-[#42CA80]/30 hover:bg-[#222] transition-all flex items-center gap-2 font-sans active:scale-95 shadow-lg group/btn"
                        >
                            <RefreshCw className="h-3 w-3 text-[#42CA80] group-hover/btn:rotate-180 transition-transform duration-500" />
                            Generate New Brief
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[#42CA80]">
                                <TrendingUp className="h-4 w-4" />
                                <h4 className="text-[11px] font-bold uppercase tracking-widest font-sans">Performance Summary</h4>
                            </div>
                            <p className="text-[#a1a1aa] text-sm leading-relaxed font-sans">
                                {brief.summary_text || "No summary available for this week."}
                            </p>
                            <div className="bg-[#111] border border-[#333] rounded-xl p-4 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[#666] text-[10px] uppercase font-bold tracking-widest font-sans">Top Channel</span>
                                    <span className="text-white text-sm font-bold font-sans">{topChannel || "—"}</span>
                                </div>
                                <div className="h-8 w-[1px] bg-[#333]" />
                                <div className="flex flex-col">
                                    <span className="text-[#666] text-[10px] uppercase font-bold tracking-widest font-sans">Conversion Rate</span>
                                    <span className="text-[#42CA80] text-sm font-bold font-mono">{conversionRate !== null ? `${conversionRate}%` : "—"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[#fbbf24]">
                                <Target className="h-4 w-4" />
                                <h4 className="text-[11px] font-bold uppercase tracking-widest font-sans">Key Recommendations</h4>
                            </div>
                            <div className="space-y-3">
                                {brief.recommended_action ? (
                                    <div className="flex gap-3 items-start group/rec">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#fbbf24] transition-colors" />
                                        <p className="text-[#a1a1aa] text-sm leading-relaxed font-sans">{brief.recommended_action}</p>
                                    </div>
                                ) : (
                                    <p className="text-[#666] text-xs italic font-sans">No specific recommendations for this week.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <div className="bg-[#1a1a1a] border border-dashed border-[#333] rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-4">
                    <Sparkles className="h-12 w-12 text-[#333]" />
                    <div>
                        <h4 className="text-[#666] font-medium font-sans">No weekly brief available</h4>
                        <p className="text-[#555] text-xs mt-1 font-sans">Generate your first AI marketing brief to get insights.</p>
                    </div>
                    <button onClick={() => refetchBrief()} className="bg-[#42CA80] text-black text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-[#3ab872] transition-all active:scale-95 shadow-lg shadow-[#42CA80]/10 font-sans">
                        Generate First Brief
                    </button>
                </div>
            )}

            {/* QUICK LINKS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { title: "Organic & SEO", desc: "Keyword rankings and site traffic", action: "Open SEO", icon: Search, href: "/admin/growth/seo" },
                    { title: "Paid Campaigns", desc: "Budget pacing, CPL and spend", action: "Open Campaigns", icon: Zap, href: "/admin/marketing?tab=paid" },
                    { title: "Content Calendar", desc: "Plan and schedule content", action: "Open Calendar", icon: Calendar, href: "/admin/marketing?tab=content" },
                ].map((item, i) => (
                    <Link key={i} href={item.href} className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-5 flex flex-col gap-4 hover:border-[#444] hover:bg-[#222]/30 transition-all cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#111] rounded-lg group-hover:bg-[#42CA80]/10 transition-colors">
                                <item.icon className="h-4 w-4 text-[#666] group-hover:text-[#42CA80] transition-colors" />
                            </div>
                            <div>
                                <h4 className="text-white text-sm font-semibold font-sans">{item.title}</h4>
                                <p className="text-[#666] text-xs font-sans">{item.desc}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-[#42CA80] text-xs font-bold uppercase tracking-widest font-sans opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0">
                            {item.action}
                            <ChevronRight className="h-3 w-3" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
