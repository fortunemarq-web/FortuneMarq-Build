"use client";

import { useState } from "react";
import { generateWeeklyAgencyReport } from "@/app/api/ai/actions";
import {
    BarChart3,
    Zap,
    Copy,
    Download,
    Loader2,
    CheckCircle2,
    TrendingUp,
    Users,
    Target,
    AlertCircle,
    Building2,
    ArrowRight
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import clsx from "clsx";

export default function WeeklyReportPage() {
    const [report, setReport] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const supabase = createClient();

    const fetchReport = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch real data from Supabase
            // (In a real scenario, we'd aggregate call_logs, deals, etc.
            // For this demo, let's pull some actual counts to make it feel real)

            // Exact counts via head queries — a plain select() is capped at 1000
            // rows, which silently undercounted total/interested leads.
            const [totalRes, interestedRes, nichesRes] = await Promise.all([
                supabase.from("leads").select("id", { count: "exact", head: true }),
                supabase.from("leads").select("id", { count: "exact", head: true }).in("status", ["qualified", "strategy_booked", "strategy_completed", "proposal_sent"]),
                supabase.from("niches").select("name"),
            ]);

            const stats = {
                total_leads: totalRes.count || 0,
                interested_leads: interestedRes.count || 0,
                niche_count: nichesRes.data?.length || 0,
                report_date: new Date().toISOString()
            };

            const result = await generateWeeklyAgencyReport(stats);
            setReport(result);
        } catch (error) {
            setReport("Error generating report. Please check your AI configuration.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(report);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!report) return;
        const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `weekly-report-${new Date().toISOString().split("T")[0]}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Executive Intelligence</h1>
                    <p className="text-slate-500 font-medium">AI-Generated Business Performance Reports</p>
                </div>
                <button
                    onClick={fetchReport}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <BarChart3 className="h-5 w-5" />}
                    Generate Weekly Summary
                </button>
            </div>

            {!report && !isLoading ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                        <Zap className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-slate-800">No report generated yet</h3>
                        <p className="text-slate-500 max-w-md mx-auto">Click the button above to analyze your agency's performance data and generate a strategic summary.</p>
                    </div>
                </div>
            ) : (
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Report Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-500">
                            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="bg-emerald-500/10 p-2 rounded-xl">
                                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <span className="font-bold text-slate-800">Weekly Performance Audit</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCopy}
                                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
                                    >
                                        {copied ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
                                    </button>
                                    <button
                                        onClick={handleDownload}
                                        title="Download as Markdown"
                                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500">
                                        <Download className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                {isLoading ? (
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <div className="h-4 bg-slate-100 rounded-full w-full animate-pulse" />
                                            <div className="h-4 bg-slate-100 rounded-full w-5/6 animate-pulse" />
                                            <div className="h-4 bg-slate-100 rounded-full w-4/6 animate-pulse" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-4 bg-slate-100 rounded-full w-full animate-pulse" />
                                            <div className="h-4 bg-slate-100 rounded-full w-11/12 animate-pulse" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-p:text-slate-600 prose-headings:text-slate-900 whitespace-pre-line">
                                        {report}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats Sidebar */}
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-700">
                        <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full" />

                            <h3 className="font-bold text-emerald-400 text-sm uppercase tracking-widest flex items-center gap-2">
                                <Target className="h-4 w-4" /> Snapshot Data
                            </h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                    <span className="text-white/60 text-sm">Leads Generated</span>
                                    <span className="font-bold">142</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                    <span className="text-white/60 text-sm">Connected Rate</span>
                                    <span className="font-bold text-emerald-400">68%</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                    <span className="text-white/60 text-sm">Top Niche</span>
                                    <span className="font-bold">Dental</span>
                                </div>
                            </div>

                            <div className="pt-4">
                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex gap-3">
                                    <AlertCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                                    <p className="text-[11px] text-emerald-100/60 leading-relaxed font-medium">
                                        Conversion rates are up 12% compared to last week. The new "Dental Clinic" VSL landing page is the primary driver.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Tooltip */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-slate-400" /> Agency Insights
                            </h4>
                            <div className="space-y-4">
                                <div className="flex gap-4 items-start group">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                                        <ArrowRight className="h-3 w-3 text-slate-400 group-hover:text-emerald-500" />
                                    </div>
                                    <p className="text-xs text-slate-500 leading-normal">Telecaller productivity peaked on Tuesday morning with an average of 42 calls/hour.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
