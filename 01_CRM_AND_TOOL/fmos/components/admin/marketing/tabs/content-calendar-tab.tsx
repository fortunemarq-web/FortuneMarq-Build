"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    LayoutGrid,
    CalendarDays,
    Plus,
    ChevronLeft,
    ChevronRight,
    BookOpen,
    Video,
    Layout,
    Star,
    Search,
    MoreVertical,
    CheckCircle2,
    Clock,
    X,
    FileText,
    AlertCircle
} from "lucide-react"
import { useContentPieces } from "@/lib/hooks/use-marketing-data"
import { createClient } from "@/lib/supabase"
import { ContentStatus, ContentType, ContentPlatform } from "@/types/marketing.types"

type ViewMode = "pipeline" | "calendar"

export default function ContentCalendarTab() {
    const [viewMode, setViewMode] = useState<ViewMode>("pipeline")
    const [currentDate, setCurrentDate] = useState(() => {
        const now = new Date()
        return new Date(now.getFullYear(), now.getMonth(), 1) // current month
    })
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    const { data: contentPieces, loading, error, refetch } = useContentPieces()

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        type: "blog" as ContentType,
        platform: "website" as ContentPlatform,
        status: "idea" as ContentStatus,
        keyword: "",
        date: "",
        notes: ""
    })

    useEffect(() => {
        async function getAuth() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) setCurrentUserId(user.id)
        }
        getAuth()
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setSubmitError(null)

        try {
            const supabase = createClient()
            const { error: insertError } = await supabase
                .from('content_pieces' as any)
                // content_pieces has no target_keyword/notes columns — omit them so the
                // insert succeeds. (Add columns + re-include if those fields are needed.)
                .insert({
                    title: formData.title,
                    content_type: formData.type,
                    platform: formData.platform,
                    scheduled_date: formData.date || null,
                    status: formData.status,
                    author_id: currentUserId,
                })

            if (insertError) throw insertError

            setIsModalOpen(false)
            refetch()
            // Reset form
            setFormData({
                title: "",
                type: "blog",
                platform: "website",
                status: "idea",
                keyword: "",
                date: "",
                notes: ""
            })
        } catch (err) {
            console.error("Error saving content piece:", err)
            setSubmitError(err instanceof Error ? err.message : "Unknown error")
        } finally {
            setIsSubmitting(false)
        }
    }

    const columns: { id: ContentStatus; label: string }[] = [
        { id: "idea", label: "Idea" },
        { id: "draft", label: "Draft" },
        { id: "in_review", label: "In Review" },
        { id: "scheduled", label: "Scheduled" },
        { id: "published", label: "Published" },
    ]

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "blog": return <BookOpen className="h-3 w-3 text-blue-400" />
            case "video": return <Video className="h-3 w-3 text-red-500" />
            case "reel": return <Video className="h-3 w-3 text-purple-500" />
            case "carousel": return <Layout className="h-3 w-3 text-yellow-500" />
            case "case_study": return <Star className="h-3 w-3 text-green-400" />
            default: return <BookOpen className="h-3 w-3 text-slate-400" />
        }
    }

    const getDayDetails = (day: number) => {
        if (!contentPieces) return []
        return contentPieces.filter(c => {
            if (!c.scheduled_date) return false
            const d = new Date(c.scheduled_date)
            return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear()
        })
    }

    const SkeletonCard = () => (
        <div className="bg-[#1a1a1a] border border-[#222] rounded-xl p-3 space-y-3 animate-pulse">
            <div className="flex justify-between">
                <div className="h-4 bg-[#333] rounded w-16" />
                <div className="h-4 bg-[#333] rounded w-4" />
            </div>
            <div className="h-4 bg-[#333] rounded w-full" />
            <div className="h-3 bg-[#333] rounded w-2/3" />
            <div className="flex justify-between pt-2 border-t border-[#333]/50">
                <div className="h-3 bg-[#333] rounded w-12" />
                <div className="h-6 w-6 rounded-full bg-[#333]" />
            </div>
        </div>
    )

    return (
        <div className="space-y-6">
            {/* HEADER SECTION: TITLE + TOGGLE + BUTTON */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1a1a1a] p-4 rounded-2xl border border-[#333] hover:border-[#444] transition-colors">
                <div>
                    <h3 className="text-white font-semibold text-lg">Content Calendar</h3>
                    <p className="text-[#a1a1aa] text-xs font-sans">Plan and track your agency's content pipeline</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-[#111] border border-[#333] rounded-xl p-1">
                        <button
                            onClick={() => setViewMode("pipeline")}
                            className={`p-2 rounded-lg transition-all ${viewMode === "pipeline"
                                ? "bg-[#42CA80]/20 text-[#42CA80] border border-[#42CA80]/20 shadow-sm"
                                : "text-[#666] hover:text-[#a1a1aa]"
                                }`}
                            title="Pipeline View"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("calendar")}
                            className={`p-2 rounded-lg transition-all ${viewMode === "calendar"
                                ? "bg-[#42CA80]/20 text-[#42CA80] border border-[#42CA80]/20 shadow-sm"
                                : "text-[#666] hover:text-[#a1a1aa]"
                                }`}
                            title="Calendar View"
                        >
                            <CalendarDays className="h-4 w-4" />
                        </button>
                    </div>

                    <button
                        className="bg-[#42CA80] text-black text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-[#3ab872] transition-all active:scale-[0.98] flex items-center gap-2 shadow-lg shadow-[#42CA80]/10"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <Plus className="h-4 w-4" strokeWidth={3} />
                        <span>New Content</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-[#1a1a1a] border border-[#ef4444]/20 rounded-xl p-4 text-[#ef4444] text-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5" />
                        <span>Failed to load content. Please try again.</span>
                    </div>
                    <button
                        onClick={() => refetch()}
                        className="underline font-bold text-[#42CA80]"
                    >
                        Retry
                    </button>
                </div>
            )}

            <AnimatePresence mode="wait">
                {viewMode === "pipeline" ? (
                    <motion.div
                        key="pipeline"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide"
                    >
                        {!loading && contentPieces.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-20 bg-[#1a1a1a] border border-dashed border-[#333] rounded-2xl">
                                <FileText className="h-12 w-12 text-[#333]" />
                                <h4 className="text-[#666] text-sm font-medium mt-3">No content pieces yet</h4>
                                <p className="text-[#555] text-xs mt-1 font-sans">Start building your content pipeline by adding your first piece.</p>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="mt-6 text-[#42CA80] text-sm font-semibold hover:underline flex items-center gap-1.5 transition-all"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Content
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-4 min-w-max sm:min-w-0">
                                {columns.map((col) => {
                                    const colContent = contentPieces?.filter(c => c.status === col.id) || []
                                    return (
                                        <div key={col.id} className="min-w-[280px] w-[280px] sm:w-auto sm:flex-1 flex flex-col gap-3">
                                            <div className="flex items-center justify-between px-2 mb-1">
                                                <span className="text-[#a1a1aa] text-[11px] uppercase tracking-widest font-bold">
                                                    {col.label}
                                                </span>
                                                <span className="bg-[#111] text-[#a1a1aa] text-[10px] px-2 py-0.5 rounded-full font-mono border border-[#333]">
                                                    {loading ? "..." : colContent.length}
                                                </span>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                {loading ? (
                                                    <>
                                                        <SkeletonCard />
                                                        <SkeletonCard />
                                                        <SkeletonCard />
                                                    </>
                                                ) : (
                                                    colContent.map((card) => (
                                                        <motion.div
                                                            key={card.id}
                                                            className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3 cursor-pointer hover:border-[#444] hover:bg-[#222]/50 transition-all group relative overflow-hidden"
                                                            whileHover={{ y: -2 }}
                                                        >
                                                            {/* Top row */}
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="p-1 rounded bg-[#111] border border-[#333]">
                                                                        {getTypeIcon(card.content_type)}
                                                                    </div>
                                                                    <span className="text-[10px] text-[#a1a1aa] font-bold uppercase tracking-tight border border-[#333] rounded px-1.5 py-0.5 bg-[#111]">
                                                                        {card.platform}
                                                                    </span>
                                                                </div>
                                                                <MoreVertical className="h-3 w-3 text-[#333] group-hover:text-[#666]" />
                                                            </div>

                                                            {/* Title */}
                                                            <h4 className="text-white text-sm font-medium mt-3 leading-snug line-clamp-2 min-h-[40px] font-sans">
                                                                {card.title}
                                                            </h4>

                                                            {/* Keyword */}
                                                            {card.target_keyword && (
                                                                <div className="flex items-center gap-1 mt-2 text-[#a1a1aa] text-[10px] font-medium italic">
                                                                    <Search className="h-3 w-3" />
                                                                    <span className="truncate">{card.target_keyword}</span>
                                                                </div>
                                                            )}

                                                            {/* Bottom row */}
                                                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#333]/50">
                                                                <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#666]">
                                                                    {card.scheduled_date ? (
                                                                        <>
                                                                            <CalendarDays className="h-3 w-3" />
                                                                            <span>{new Date(card.scheduled_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Clock className="h-3 w-3" />
                                                                            <span>TBD</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <div className="w-6 h-6 rounded-full bg-[#111] border border-[#333] text-[#666] text-[10px] flex items-center justify-center font-bold uppercase overflow-hidden" title={card.author_name || 'Admin'}>
                                                                    {card.author_name ? card.author_name.substring(0, 2) : "AD"}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="calendar"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4 sm:p-6 shadow-sm overflow-hidden hover:border-[#444] transition-colors"
                    >
                        {/* Calendar Header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                            <div className="flex items-center gap-4">
                                <h4 className="text-white font-bold text-xl tracking-tight font-sans">
                                    {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                </h4>
                                <div className="flex gap-1.5">
                                    <button
                                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                                        className="p-1.5 rounded-lg border border-[#333] text-[#a1a1aa] hover:text-white hover:bg-[#222] transition-all active:scale-90"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                                        className="p-1.5 rounded-lg border border-[#333] text-[#a1a1aa] hover:text-white hover:bg-[#222] transition-all active:scale-90"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-4 overflow-x-auto w-full sm:w-auto pb-1">
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]"></div>
                                    <span className="text-[#a1a1aa] text-[9px] font-bold uppercase tracking-widest font-sans">Blog</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.3)]"></div>
                                    <span className="text-[#a1a1aa] text-[9px] font-bold uppercase tracking-widest font-sans">Video</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(251,191,36,0.3)]"></div>
                                    <span className="text-[#a1a1aa] text-[9px] font-bold uppercase tracking-widest font-sans">Carousel</span>
                                </div>
                            </div>
                        </div>

                        {/* Days Header */}
                        <div className="grid grid-cols-7 mb-2 border-b border-[#333]/50">
                            {["M", "T", "W", "T", "F", "S", "S"].map((day, dIdx) => (
                                <div key={dIdx} className="text-[#666] text-[10px] uppercase tracking-widest font-bold text-center py-3">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                            {Array.from({ length: 35 }).map((_, i) => {
                                const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
                                const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1
                                const day = i - offset + 1
                                const totalDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()

                                const isToday = day === new Date().getDate() &&
                                    currentDate.getMonth() === new Date().getMonth() &&
                                    currentDate.getFullYear() === new Date().getFullYear()

                                const isPast = day < new Date().getDate() &&
                                    currentDate.getMonth() <= new Date().getMonth() &&
                                    currentDate.getFullYear() <= new Date().getFullYear()

                                const dayContent = getDayDetails(day)

                                return (
                                    <div
                                        key={i}
                                        className={`min-h-[70px] sm:min-h-[110px] bg-[#111] rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 border transition-all ${isPast ? "opacity-30" : "opacity-100"
                                            } ${day > 0 && day <= totalDays ? "border-[#1f1f1f] hover:border-[#333]" : "border-transparent opacity-0"
                                            }`}
                                    >
                                        {day > 0 && day <= totalDays && (
                                            <>
                                                <div className="flex justify-between items-center mb-1 sm:mb-2">
                                                    <span className={`text-[10px] font-mono font-bold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full ${isToday ? "bg-[#42CA80] text-black" : "text-[#666]"
                                                        }`}>
                                                        {day}
                                                    </span>
                                                </div>

                                                <div className="space-y-1 overflow-y-auto max-h-[40px] sm:max-h-[70px] scrollbar-hide">
                                                    {dayContent.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            className={`text-[9px] font-bold truncate rounded-md px-1 sm:px-1.5 py-0.5 sm:py-1 flex items-center gap-1 border ${item.content_type === "blog" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                                                item.content_type === "reel" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                                                                    item.content_type === "carousel" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                                                                        "bg-green-500/10 text-green-400 border-green-500/20"
                                                                }`}
                                                            title={item.title}
                                                        >
                                                            <span className="hidden sm:inline shrink-0">{getTypeIcon(item.content_type)}</span>
                                                            <span className="truncate">{item.title}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ADD CONTENT MODAL */}
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
                                <h3 className="text-white font-semibold text-lg font-sans">Add Content Piece</h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-1 rounded-lg hover:bg-[#222] text-[#666] hover:text-white transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form className="p-6 space-y-4 overflow-y-auto" onSubmit={handleSave}>
                                <div className="space-y-1.5">
                                    <label className="text-[#a1a1aa] text-[10px] font-bold uppercase tracking-widest">Content Title</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. 5 Signs Your Website Needs SEO"
                                        className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#42CA80]/50 outline-none transition-all placeholder:text-[#444] font-sans"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[#a1a1aa] text-[10px] font-bold uppercase tracking-widest">Content Type</label>
                                        <select
                                            className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#42CA80]/50 outline-none transition-all font-bold"
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value as ContentType })}
                                        >
                                            <option value="blog">Blog Post</option>
                                            <option value="reel">Reel / Short Video</option>
                                            <option value="carousel">Carousel</option>
                                            <option value="story">Story</option>
                                            <option value="video">Long Video</option>
                                            <option value="email">Email</option>
                                            <option value="case_study">Case Study</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[#a1a1aa] text-[10px] font-bold uppercase tracking-widest">Platform</label>
                                        <select
                                            className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#42CA80]/50 outline-none transition-all font-bold"
                                            value={formData.platform}
                                            onChange={(e) => setFormData({ ...formData, platform: e.target.value as ContentPlatform })}
                                        >
                                            <option value="instagram">Instagram</option>
                                            <option value="linkedin">LinkedIn</option>
                                            <option value="website">Website / Blog</option>
                                            <option value="youtube">YouTube</option>
                                            <option value="facebook">Facebook</option>
                                            <option value="whatsapp">WhatsApp</option>
                                            <option value="multiple">Multiple</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[#a1a1aa] text-[10px] font-bold uppercase tracking-widest">Target Keyword (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. digital marketing agency mumbai"
                                        className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#42CA80]/50 outline-none transition-all placeholder:text-[#444] font-sans"
                                        value={formData.keyword}
                                        onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[#a1a1aa] text-[10px] font-bold uppercase tracking-widest">Scheduled Date</label>
                                        <input
                                            type="date"
                                            className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#42CA80]/50 outline-none transition-all [color-scheme:dark] font-mono"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[#a1a1aa] text-[10px] font-bold uppercase tracking-widest">Initial Status</label>
                                        <select
                                            className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#42CA80]/50 outline-none transition-all font-bold"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as ContentStatus })}
                                        >
                                            <option value="idea">Idea</option>
                                            <option value="draft">Draft</option>
                                            <option value="in_review">In Review</option>
                                            <option value="scheduled">Scheduled</option>
                                            <option value="published">Published</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[#a1a1aa] text-[10px] font-bold uppercase tracking-widest">Notes (Optional)</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Any additional context..."
                                        className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#42CA80]/50 outline-none transition-all resize-none font-sans"
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
                                        {isSubmitting ? (
                                            <div className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                        ) : (
                                            "Save Content"
                                        )}
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
