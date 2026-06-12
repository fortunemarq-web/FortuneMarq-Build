"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
    FileText,
    Download,
    ArrowLeft,
    Zap,
    Calendar,
    Target,
    TrendingUp,
    Layout
} from "lucide-react";
import Link from "next/link";

export default function MagicReportPage() {
    const { token } = useParams();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchReport() {
            setLoading(true);
            try {
                const res = await fetch(`/api/public/client-report/${token}`);
                if (!res.ok) throw new Error(`Report fetch failed (${res.status})`);
                const json = await res.json();
                if (!json.report) throw new Error("Report missing in response");
                setReport(json.report);
            } catch (err) {
                console.error("Error fetching report:", err);
                setError("Report not found or link expired.");
            } finally {
                setLoading(false);
            }
        }
        if (token) fetchReport();
    }, [token]);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Zap className="h-8 w-8 animate-pulse text-[#42CA80]" /></div>;
    if (error) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-center p-4"><div><p className="text-xl font-bold mb-4">{error}</p><Link href="/" className="text-indigo-600 font-bold underline">Back Home</Link></div></div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-6 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                            <Zap className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-slate-900 tracking-tight">Performance Report</h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{report.clients?.business_name}</p>
                        </div>
                    </div>
                    {report.pdf_url && (
                        <a
                            href={report.pdf_url}
                            download
                            className="flex items-center gap-2 bg-[#42CA80] text-slate-900 px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-[#42CA80]/20 hover:scale-105 transition-all"
                        >
                            <Download className="h-4 w-4" />
                            Download PDF
                        </a>
                    )}
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 mt-8">
                {/* Insights Summary */}
                <div className="grid gap-6 md:grid-cols-3 mb-8">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <Calendar className="h-6 w-6 text-indigo-500 mb-4" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Period</p>
                        <p className="text-xl font-black text-slate-900">
                            {new Date(report.report_month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <Target className="h-6 w-6 text-emerald-500 mb-4" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Type</p>
                        <p className="text-xl font-black text-slate-900 capitalize">{report.report_type} Review</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <TrendingUp className="h-6 w-6 text-orange-500 mb-4" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                        <p className="text-xl font-black text-slate-900">Live & Verified</p>
                    </div>
                </div>

                {/* AI Summary Block */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 mb-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Layout className="w-64 h-64" />
                    </div>
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#42CA80]/20 text-[#42CA80] rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-[#42CA80]/30">
                            Executive Analysis
                        </div>
                        <h2 className="text-3xl font-black mb-6 leading-tight">Key Insights & Strategic Progress</h2>
                        <div className="prose prose-invert max-w-none text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
                            {report.ai_summary || "No automated summary available for this period."}
                        </div>
                    </div>
                </div>

                {/* Data Grid if snapshots exist */}
                {Object.keys(report.data_snapshot || {}).length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                        {Object.entries(report.data_snapshot).map(([key, value]: [string, any]) => (
                            <div key={key} className="bg-white p-6 rounded-3xl border border-slate-200">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                    {key.replace(/_/g, ' ')}
                                </p>
                                <p className="text-2xl font-black text-slate-900">{String(value)}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="max-w-5xl mx-auto px-6 text-center mt-12 border-t border-slate-200 pt-8">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Secured by FortuneMarq Cloud</p>
                <Link href="/client/dashboard" className="text-indigo-600 text-sm font-black uppercase hover:underline">
                    Access Full Client Dashboard
                </Link>
            </div>
        </div>
    );
}
