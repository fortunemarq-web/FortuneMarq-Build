"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Megaphone,
    Plus,
    ArrowUpRight,
    Pause,
    CheckCircle2,
    ExternalLink,
    Info,
    Crown,
    Play,
    X,
    AlertCircle,
    Check
} from "lucide-react"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts"
import { useAdCampaigns } from "@/lib/hooks/use-marketing-data"
import { createClient } from "@/lib/supabase"
import { AdPlatform, CampaignStatus, CampaignObjective } from "@/types/marketing.types"

// Inline Edit Component for Spend
const InlineSpendEdit = ({ id, initialValue, onSave }: { id: string, initialValue: number, onSave: () => void }) => {
    const [isEditing, setIsEditing] = useState(false)
    const [value, setValue] = useState(initialValue.toString())
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSave = async () => {
        if (parseFloat(value) === initialValue) {
            setIsEditing(false)
            return
        }

        setIsSubmitting(true)
        try {
            const supabase = createClient()
            await supabase.from('ad_campaigns').update({ spend_mtd: parseFloat(value) || 0 } as any).eq('id', id)
            onSave()
            setIsEditing(false)
        } catch (err) {
            console.error("Error updating spend:", err)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-1">
                <input
                    autoFocus
                    type="number"
                    className="w-20 bg-[#111] border border-[#42CA80]/50 rounded px-1.5 py-0.5 text-white text-xs font-mono outline-none"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    disabled={isSubmitting}
                />
                {isSubmitting && <div className="h-3 w-3 border border-[#42CA80] border-t-transparent animate-spin rounded-full" />}
            </div>
        )
    }

    return (
        <span
            onClick={() => setIsEditing(true)}
            className="cursor-pointer hover:text-[#42CA80] transition-colors decoration-dotted underline-offset-4 hover:underline"
        >
            ₹{initialValue.toLocaleString()}
        </span>
    )
}

export default function PaidCampaignsTab() {
    const { data: campaigns, loading, error, refetch } = useAdCampaigns()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)

    // Form State
    const [formData, setFormData] = useState({
        campaign_name: "",
        platform: "meta" as AdPlatform,
        status: "active" as CampaignStatus,
        objective: "lead_generation" as CampaignObjective,
        monthly_budget: "",
        spend_mtd: "",
        leads_generated: "",
        notes: ""
    })

    // Calculate Platform Stats
    const getPlatformStats = (platformName: string) => {
        const platformCampaigns = campaigns?.filter(c => c.platform.toLowerCase() === platformName.toLowerCase() && c.status === 'active') || []
        const spent = platformCampaigns.reduce((sum, c) => sum + (c.spend_mtd || 0), 0)
        const budget = platformCampaigns.reduce((sum, c) => sum + (c.monthly_budget || 0), 0)
        const leads = platformCampaigns.reduce((sum, c) => sum + (c.leads_generated || 0), 0)
        const cpl = leads > 0 ? spent / leads : 0
        const percentage = budget > 0 ? (spent / budget) * 100 : 0

        return { spent, budget, leads, cpl, percentage, overBudget: percentage > 100 }
    }

    const platformPills = [
        { name: "Meta Ads", id: "meta", color: "#42CA80" },
        { name: "Google Ads", id: "google", color: "#fbbf24" },
        { name: "LinkedIn Ads", id: "linkedin", color: "#ef4444" }
    ]

    const cplTrendData = [
        { week: "W1", meta: 620, google: 780, linkedin: 900 },
        { week: "W2", meta: 580, google: 720, linkedin: 850 },
        { week: "W3", meta: 540, google: 700, linkedin: 880 },
        { week: "W4", meta: 510, google: 680, linkedin: 760 },
        { week: "W5", meta: 490, google: 640, linkedin: 800 },
        { week: "W6", meta: 500, google: 620, linkedin: 733 },
        { week: "W7", meta: 470, google: 600, linkedin: 710 },
        { week: "W8", meta: 485, google: 600, linkedin: 733 },
    ]

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "active":
                return "bg-[#42CA80]/10 text-[#42CA80] border-[#42CA80]/20"
            case "paused":
                return "bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/20"
            case "completed":
                return "bg-[#333] text-[#a1a1aa] border-[#444]"
            default:
                return "bg-[#333] text-[#a1a1aa]"
        }
    }

    const getPlatformBadge = (platform: string) => {
        switch (platform.toLowerCase()) {
            case "meta":
                return (
                    <div className="flex items-center gap-1.5 bg-blue-600/10 text-blue-500 px-2 py-0.5 rounded-md border border-blue-600/20">
                        <span className="font-bold text-[10px]">M</span>
                        <span className="text-[10px] font-semibold">Meta</span>
                    </div>
                )
            case "google":
                return (
                    <div className="flex items-center gap-1.5 bg-red-600/10 text-red-500 px-2 py-0.5 rounded-md border border-red-600/20">
                        <span className="font-bold text-[10px]">G</span>
                        <span className="text-[10px] font-semibold">Google</span>
                    </div>
                )
            case "linkedin":
                return (
                    <div className="flex items-center gap-1.5 bg-blue-700/10 text-blue-600 px-2 py-0.5 rounded-md border border-blue-700/20">
                        <span className="font-bold text-[10px]">in</span>
                        <span className="text-[10px] font-semibold">LinkedIn</span>
                    </div>
                )
            default:
                return (
                    <div className="flex items-center gap-1.5 bg-slate-500/10 text-slate-400 px-2 py-0.5 rounded-md border border-slate-500/20">
                        <span className="text-[10px] font-semibold uppercase">{platform}</span>
                    </div>
                )
        }
    }

    const getCplColor = (cpl: number) => {
        if (cpl < 400) return "text-[#42CA80]"
        if (cpl <= 700) return "text-[#fbbf24]"
        return "text-[#ef4444]"
    }

    const handleSaveCampaign = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setSubmitError(null)

        try {
            const supabase = createClient()
            const { error: insertError } = await supabase
                .from('ad_campaigns')
                .insert({
                    campaign_name: formData.campaign_name,
                    platform: formData.platform,
                    status: formData.status,
                    objective: formData.objective,
                    monthly_budget: parseFloat(formData.monthly_budget) || 0,
                    spend_mtd: parseFloat(formData.spend_mtd) || 0,
                    leads_generated: parseInt(formData.leads_generated) || 0,
                    notes: formData.notes || null,
                })

            if (insertError) throw insertError

            setIsModalOpen(false)
            refetch()
            setFormData({
                campaign_name: "",
                platform: "meta",
                status: "active",
                objective: "lead_generation",
                monthly_budget: "",
                spend_mtd: "",
                leads_generated: "",
                notes: ""
            })
        } catch (err) {
            console.error("Error saving campaign:", err)
            setSubmitError(err instanceof Error ? err.message : "Unknown error")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6 pb-8">
            {error && (
                <div className="bg-[#1a1a1a] border border-[#ef4444]/20 rounded-xl p-4 text-[#ef4444] text-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5" />
                        <span>Failed to load campaigns. Please try again.</span>
                    </div>
                    <button
                        onClick={() => refetch()}
                        className="text-[#42CA80] text-xs underline hover:text-[#3ab872] transition-colors"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* SECTION 1: BUDGET PACING OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {platformPills.map((platform, idx) => {
                    const p = getPlatformStats(platform.id)
                    // Only show platform cards for platforms that have at least one active or paused campaign
                    const hasCampaigns = campaigns?.some(c => c.platform.toLowerCase() === platform.id && (c.status === 'active' || c.status === 'paused'))
                    if (!hasCampaigns && !loading) return null

                    return (
                        <motion.div
                            key={platform.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`bg-[#1a1a1a] border rounded-2xl p-5 hover:border-[#444] transition-colors group ${p.overBudget ? "border-[#ef4444]/40 shadow-[0_0_15px_rgba(239,68,68,0.05)]" : "border-[#333]"
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-semibold text-base">{platform.name}</span>
                                    {p.overBudget && (
                                        <span className="bg-[#ef4444]/10 text-[#ef4444] text-[10px] px-1.5 py-0.5 rounded-full border border-[#ef4444]/20 font-medium whitespace-nowrap">
                                            Over Budget
                                        </span>
                                    )}
                                </div>
                                <span className="bg-[#42CA80]/10 text-[#42CA80] text-[10px] px-2 py-0.5 rounded-full border border-[#42CA80]/20 font-medium font-mono uppercase tracking-wider">
                                    Active
                                </span>
                            </div>

                            {loading ? (
                                <div className="mt-4 space-y-4">
                                    <div className="h-8 bg-[#333] animate-pulse rounded w-3/4" />
                                    <div className="h-2 bg-[#333] animate-pulse rounded w-full" />
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="h-8 bg-[#333] animate-pulse rounded" />
                                        <div className="h-8 bg-[#333] animate-pulse rounded" />
                                        <div className="h-8 bg-[#333] animate-pulse rounded" />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="mt-3 flex items-baseline gap-2">
                                        <span className="text-white text-2xl font-bold font-mono">₹{p.spent.toLocaleString()}</span>
                                        <span className="text-[#a1a1aa] text-sm italic font-mono">of ₹{p.budget.toLocaleString()}</span>
                                    </div>

                                    <div className="mt-3">
                                        <div className="w-full bg-[#111] rounded-full h-2 overflow-hidden shadow-inner">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(p.percentage, 100)}%` }}
                                                transition={{ duration: 1.2, ease: "circOut" }}
                                                className={`h-full rounded-full ${p.percentage > 100 ? "bg-[#ef4444]" :
                                                    p.percentage >= 90 ? "bg-[#ef4444]" :
                                                        p.percentage >= 75 ? "bg-[#fbbf24]" : "bg-[#42CA80]"
                                                    }`}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center mt-1.5">
                                            <span className="text-[#666] text-[10px] font-medium tracking-tight">PACING PROGRESS</span>
                                            <span className={`text-xs font-mono font-bold ${p.percentage > 100 ? "text-[#ef4444]" : "text-[#a1a1aa]"}`}>
                                                {p.percentage.toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#333]">
                                        <div className="flex flex-col">
                                            <span className="text-[#666] text-[10px] uppercase font-bold tracking-widest">CPL</span>
                                            <span className="text-white text-sm font-mono font-bold mt-0.5">₹{p.cpl.toFixed(0)}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[#666] text-[10px] uppercase font-bold tracking-widest">Leads</span>
                                            <span className="text-white text-sm font-mono font-bold mt-0.5">{p.leads}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[#666] text-[10px] uppercase font-bold tracking-widest">Status</span>
                                            <span className="text-[#42CA80] text-[10px] font-bold mt-0.5">HEALTHY</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )
                })}
            </div>

            {/* SECTION 2: CAMPAIGN PERFORMANCE TABLE */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden hover:border-[#444] transition-colors"
            >
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#333]">
                    <div>
                        <h3 className="text-white font-semibold text-lg">Active Campaigns</h3>
                        <p className="text-[#a1a1aa] text-xs">All running campaigns across platforms</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-[#42CA80] text-black text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#3ab872] transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" strokeWidth={3} />
                        <span>Add Campaign</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-[#111] border-b border-[#333]">
                                <th className="px-6 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-[#666]">Campaign</th>
                                <th className="px-6 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-[#666]">Platform</th>
                                <th className="px-6 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-[#666]">Objective</th>
                                <th className="px-6 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-[#666]">Budget</th>
                                <th className="px-6 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-[#666]">Spend</th>
                                <th className="px-6 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-[#666]">Leads</th>
                                <th className="px-6 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-[#666]">CPL</th>
                                <th className="px-6 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-[#666]">ROAS</th>
                                <th className="px-6 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-[#666]">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i} className="border-b border-[#1f1f1f]">
                                        {Array.from({ length: 9 }).map((_, j) => (
                                            <td key={j} className="px-6 py-4">
                                                <div className="h-4 bg-[#333] animate-pulse rounded w-full" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : campaigns.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-20 text-center">
                                        <Megaphone className="h-10 w-10 text-[#333] mx-auto" />
                                        <p className="text-[#666] text-sm mt-3 font-medium">No campaigns tracked yet</p>
                                        <p className="text-[#555] text-xs mt-1">Start tracking your ad performance by adding your first campaign.</p>
                                        <button
                                            onClick={() => setIsModalOpen(true)}
                                            className="mt-6 text-[#42CA80] text-sm font-semibold hover:underline flex items-center gap-1.5 mx-auto"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add Campaign
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                campaigns.map((c, idx) => (
                                    <tr key={c.id} className="border-b border-[#1f1f1f] hover:bg-[#222]/30 transition-colors group/row last:border-0">
                                        <td className="px-6 py-4">
                                            <div className="text-white font-medium max-w-xs truncate">{c.campaign_name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getPlatformBadge(c.platform)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[#a1a1aa] text-xs capitalize whitespace-nowrap">
                                                {c.objective?.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-white font-mono font-medium whitespace-nowrap">₹{c.monthly_budget.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-white font-mono font-medium whitespace-nowrap">
                                            <InlineSpendEdit id={c.id} initialValue={c.spend_mtd} onSave={refetch} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-mono font-bold ${(c.leads_generated || 0) > 10 ? "text-[#42CA80]" : "text-white"}`}>
                                                {c.leads_generated || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-mono font-bold ${getCplColor(c.cpl)}`}>
                                                ₹{c.cpl?.toFixed(0) || "0"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {c.roas ? (
                                                <span className={`font-mono font-bold ${c.roas > 2 ? "text-[#42CA80]" : "text-[#fbbf24]"}`}>
                                                    {c.roas.toFixed(1)}x
                                                </span>
                                            ) : (
                                                <span className="text-[#666] font-mono">--</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusStyle(c.status)}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* SECTION 3: CPL TREND CHART + BEST PERFORMING AD */}
            <div className="flex flex-col lg:flex-row gap-4 mt-6">
                {/* LEFT: CPL TREND CHART */}
                <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 }}
                    className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 shadow-sm hover:border-[#444] transition-colors"
                >
                    <div className="mb-6">
                        <h3 className="text-white font-semibold text-base">Cost Per Lead Trend</h3>
                        <p className="text-[#a1a1aa] text-xs mt-0.5">Is your CPL improving or worsening?</p>
                    </div>

                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={cplTrendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f1f" />
                                <XAxis
                                    dataKey="week"
                                    tick={{ fill: "#666", fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fill: "#666", fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(value) => `₹${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#111", border: "1px solid #333", borderRadius: "8px" }}
                                    itemStyle={{ fontSize: "12px" }}
                                    labelStyle={{ color: "#a1a1aa", fontSize: "10px", marginBottom: "4px" }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", paddingTop: "20px" }} />
                                <Line
                                    type="monotone"
                                    dataKey="meta"
                                    name="Meta"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                                    activeDot={{ r: 5, strokeWidth: 0 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="google"
                                    name="Google"
                                    stroke="#42CA80"
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: "#42CA80", strokeWidth: 0 }}
                                    activeDot={{ r: 5, strokeWidth: 0 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="linkedin"
                                    name="LinkedIn"
                                    stroke="#a855f7"
                                    strokeWidth={2}
                                    strokeDasharray="4 4"
                                    dot={{ r: 3, fill: "#a855f7", strokeWidth: 0 }}
                                    activeDot={{ r: 5, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* RIGHT: BEST PERFORMING CREATIVE CARD */}
                <motion.div
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 }}
                    className="lg:w-80 shrink-0 bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 flex flex-col justify-between hover:border-[#444] transition-colors"
                >
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Crown className="h-4 w-4 text-[#fbbf24]" />
                                <h3 className="text-white font-semibold text-base">Top Creative</h3>
                            </div>
                            <span className="text-[#666] text-[10px] font-bold uppercase tracking-widest">This Month</span>
                        </div>

                        <div className="flex gap-2 mb-4">
                            <span className="bg-blue-600/10 text-blue-500 border border-blue-600/20 text-[10px] font-bold px-1.5 py-0.5 rounded">META</span>
                            <span className="bg-purple-600/10 text-purple-500 border border-purple-600/20 text-[10px] font-bold px-1.5 py-0.5 rounded">VIDEO</span>
                        </div>

                        <div className="bg-[#111] border border-[#222] rounded-xl h-32 flex flex-col items-center justify-center relative overflow-hidden group/creative">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/creative:opacity-100 transition-opacity z-10" />
                            <Play className="h-8 w-8 text-[#333] group-hover/creative:text-white transition-colors z-20" />
                            <span className="text-[#555] text-[10px] mt-2 group-hover/creative:text-white transition-colors z-20 font-medium">Click to Preview</span>
                        </div>

                        <h4 className="text-white text-sm font-medium mt-4 leading-relaxed line-clamp-2">
                            3 Restaurant Clients Scaled to ₹1L/month — Case Study Video
                        </h4>

                        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#222]">
                            <div className="flex flex-col">
                                <span className="text-[#42CA80] font-mono font-bold text-lg">3.8%</span>
                                <span className="text-[#666] text-[10px] uppercase tracking-wider font-bold">CTR</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-white font-mono font-bold text-lg">42K</span>
                                <span className="text-[#666] text-[10px] uppercase tracking-wider font-bold">IMPR</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[#42CA80] font-mono font-bold text-lg">16</span>
                                <span className="text-[#666] text-[10px] uppercase tracking-wider font-bold">LEADS</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => console.log("View All Creatives")}
                        className="w-full mt-6 py-2.5 rounded-xl border border-[#333] text-[#a1a1aa] text-xs font-semibold hover:bg-[#222] hover:text-white hover:border-[#444] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <span>View All Creatives</span>
                        <ExternalLink className="h-3 w-3" />
                    </button>
                </motion.div>
            </div>

            {/* ADD CAMPAIGN MODAL */}
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
                            className="bg-[#111] border-t sm:border border-[#333] rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-2xl relative z-10 overflow-hidden max-h-[95vh] flex flex-col"
                        >
                            <div className="p-6 border-b border-[#333] flex items-center justify-between shrink-0">
                                <h3 className="text-white font-semibold text-lg">Add Ad Campaign</h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-1 rounded-lg hover:bg-[#222] text-[#666] hover:text-white transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form className="p-6 space-y-4 overflow-y-auto" onSubmit={handleSaveCampaign}>
                                <div className="space-y-1.5">
                                    <label className="text-[#a1a1aa] text-[10px] font-bold uppercase tracking-widest">Campaign Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Mumbai Kitchens — Performance"
                                        className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#42CA80]/50 outline-none transition-all placeholder:text-[#444]"
                                        value={formData.campaign_name}
                                        onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[#a1a1aa] text-[10px] font-bold uppercase tracking-widest">Platform</label>
                                        <select
                                            className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#42CA80]/50 outline-none transition-all"
                                            value={formData.platform}
                                            onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })}
                                        >
                                            <option value="meta">Meta</option>
                                            <option value="google">Google</option>
                                            <option value="linkedin">LinkedIn</option>
                                            <option value="youtube">YouTube</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[#a1a1aa] text-[10px] font-bold uppercase tracking-widest">Objective</label>
                                        <select
                                            className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#42CA80]/50 outline-none transition-all"
                                            value={formData.objective}
                                            onChange={(e) => setFormData({ ...formData, objective: e.target.value as any })}
                                        >
                                            <option value="lead_generation">Lead Gen</option>
                                            <option value="conversions">Conversions</option>
                                            <option value="traffic">Traffic</option>
                                            <option value="brand_awareness">Awareness</option>
                                            <option value="reach">Reach</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[#a1a1aa] text-[10px] font-bold uppercase tracking-widest">Monthly Budget (₹)</label>
                                        <input
                                            type="number"
                                            placeholder="e.g. 15000"
                                            className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#42CA80]/50 outline-none transition-all placeholder:text-[#444]"
                                            value={formData.monthly_budget}
                                            onChange={(e) => setFormData({ ...formData, monthly_budget: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[#a1a1aa] text-[10px] font-bold uppercase tracking-widest">Spend MTD (₹)</label>
                                        <input
                                            type="number"
                                            placeholder="e.g. 4200"
                                            className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#42CA80]/50 outline-none transition-all placeholder:text-[#444]"
                                            value={formData.spend_mtd}
                                            onChange={(e) => setFormData({ ...formData, spend_mtd: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[#a1a1aa] text-[10px] font-bold uppercase tracking-widest">Leads Generated</label>
                                        <input
                                            type="number"
                                            placeholder="e.g. 12"
                                            className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#42CA80]/50 outline-none transition-all placeholder:text-[#444]"
                                            value={formData.leads_generated}
                                            onChange={(e) => setFormData({ ...formData, leads_generated: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[#a1a1aa] text-[10px] font-bold uppercase tracking-widest">Status</label>
                                        <select
                                            className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#42CA80]/50 outline-none transition-all"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        >
                                            <option value="active">Active</option>
                                            <option value="paused">Paused</option>
                                            <option value="completed">Completed</option>
                                            <option value="draft">Draft</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[#a1a1aa] text-[10px] font-bold uppercase tracking-widest">Notes</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Campaign notes, targeting details, etc..."
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
                                        {isSubmitting ? <div className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : "Save Campaign"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
