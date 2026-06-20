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
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

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

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-canvas"><Zap className="h-8 w-8 animate-pulse text-brand" /></div>;
    if (error) return <div className="min-h-screen flex items-center justify-center bg-canvas text-center p-4"><div><p className="text-xl font-semibold mb-4 text-slate-900">{error}</p><Link href="/" className="text-sm font-semibold text-brand-deep underline">Back Home</Link></div></div>;

    return (
        <div className="min-h-screen bg-canvas pb-12">
            {/* Header */}
            <div className="bg-surface border-b border-line px-6 py-6 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-brand-deep rounded-xl flex items-center justify-center text-white">
                            <Zap className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="font-display text-lg font-semibold text-slate-900 tracking-tight">Performance Report</h1>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{report.clients?.business_name}</p>
                        </div>
                    </div>
                    {report.pdf_url && (
                        <a
                            href={report.pdf_url}
                            download
                            className={buttonVariants({ variant: "primary" })}
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
                    <Card className="p-6">
                        <Calendar className="h-6 w-6 text-slate-400 mb-4" />
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Period</p>
                        <p className="font-display text-xl font-semibold text-slate-900">
                            {new Date(report.report_month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        </p>
                    </Card>
                    <Card className="p-6">
                        <Target className="h-6 w-6 text-brand-deep mb-4" />
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Type</p>
                        <p className="font-display text-xl font-semibold text-slate-900 capitalize">{report.report_type} Review</p>
                    </Card>
                    <Card className="p-6">
                        <TrendingUp className="h-6 w-6 text-slate-400 mb-4" />
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Status</p>
                        <p className="font-display text-xl font-semibold text-slate-900">Live &amp; Verified</p>
                    </Card>
                </div>

                {/* AI Summary Block */}
                <div className="bg-slate-900 rounded-2xl p-8 md:p-12 mb-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Layout className="w-64 h-64" />
                    </div>
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/20 text-brand rounded-full text-[11px] font-semibold uppercase tracking-wide mb-6 border border-brand/30">
                            Executive Analysis
                        </div>
                        <h2 className="font-display text-3xl font-semibold mb-6 leading-tight">Key Insights &amp; Strategic Progress</h2>
                        <div className="prose prose-invert max-w-none text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
                            {report.ai_summary || "No automated summary available for this period."}
                        </div>
                    </div>
                </div>

                {/* Data Grid if snapshots exist */}
                {Object.keys(report.data_snapshot || {}).length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                        {Object.entries(report.data_snapshot).map(([key, value]: [string, any]) => (
                            <Card key={key} className="p-6">
                                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                                    {key.replace(/_/g, ' ')}
                                </p>
                                <p className="font-display text-2xl font-semibold text-slate-900 tabular-nums">{String(value)}</p>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="max-w-5xl mx-auto px-6 text-center mt-12 border-t border-line pt-8">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-4">Secured by FortuneMarq Cloud</p>
                <Link href="/client/dashboard" className="text-sm font-semibold text-brand-deep uppercase hover:underline">
                    Access Full Client Dashboard
                </Link>
            </div>
        </div>
    );
}
