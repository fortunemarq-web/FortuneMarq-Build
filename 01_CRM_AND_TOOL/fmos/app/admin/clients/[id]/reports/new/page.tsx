"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import {
    Zap,
    ArrowLeft,
    FileText,
    Send,
    CheckCircle,
    Loader2,
    Sparkles
} from "lucide-react";
import Link from "next/link";
import { sendNotification } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { toast } from "@/components/ui/toast";
import { notifyReportReady } from "@/actions/notify-report-ready";

// Public report magic links expire this many days after creation.
const REPORT_LINK_TTL_DAYS = 30;

export default function AdminNewReportPage() {
    const { id: clientId } = useParams();
    const router = useRouter();
    const [client, setClient] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [reportMonth, setReportMonth] = useState("");
    const [reportType, setReportType] = useState("monthly");
    const [aiSummary, setAiSummary] = useState("");
    const [pdfUrl, setPdfUrl] = useState("");

    const supabase = createClient();

    useEffect(() => {
        async function fetchClient() {
            setLoading(true);
            const { data } = await supabase.from("clients").select("*").eq("id", clientId as string).single();
            setClient(data);
            setLoading(false);
        }
        if (clientId) fetchClient();
    }, [clientId]);

    const handleSave = async (publish: boolean = false) => {
        setIsSaving(true);
        try {
            const { data: userData } = await supabase.auth.getUser();
            const { data: rawData, error } = await supabase
                .from("client_reports")
                .insert({
                    client_id: clientId,
                    report_month: `${reportMonth}-01`,
                    report_type: reportType,
                    ai_summary: aiSummary,
                    pdf_url: pdfUrl,
                    is_published: publish,
                    magic_link_expires_at: new Date(
                        Date.now() + REPORT_LINK_TTL_DAYS * 24 * 60 * 60 * 1000
                    ).toISOString(),
                    created_by: userData.user?.id
                } as any)
                .select()
                .single();

            const data = rawData as any;


            if (error) throw error;

            // Notify Client if published
            if (publish && (client as any)?.primary_email) {
                const { data: clientProfile } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("email", (client as any).primary_email)
                    .maybeSingle();

                if (clientProfile && (clientProfile as any).id) {
                    await sendNotification({
                        userId: (clientProfile as any).id,
                        type: 'report_published',
                        title: 'New Report Published',
                        body: `Your ${reportType} performance report for ${reportMonth} is ready.`,
                        link: '/client/dashboard'
                    });
                }
            }

            // Log Audit
            await logAudit({
                action: publish ? 'update' : 'create',
                resourceType: 'report',
                resourceId: data.id,
                resourceLabel: `${publish ? 'Published' : 'Created'} ${reportType} report for ${client?.business_name}`,
                newValue: { report_month: reportMonth, report_type: reportType, is_published: publish }
            });

            // monthly_report_ready WA — only on publish, only for monthly reports.
            // Sets the magic-link token + sends the public report link to the client.
            if (publish && reportType === "monthly") {
                const notify = await notifyReportReady(data.id);
                if (notify.ok) {
                    toast.success("Report published — client notified on WhatsApp.");
                } else if (notify.skipped === "no_phone") {
                    toast.info("Report published. No client phone on file — WhatsApp skipped.");
                } else if (notify.error) {
                    toast.error(`Report published, but WhatsApp failed: ${notify.error}`);
                }
            }

            router.push(`/admin/clients/${clientId}`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to save report");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-full bg-slate-50 p-4 md:p-12">
            <div className="max-w-2xl mx-auto">
                <Link href={`/admin/clients/${clientId}`} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-8 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-sm font-bold uppercase tracking-widest">Back to Client</span>
                </Link>

                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl p-8 md:p-12">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                            <Zap className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900">New Report</h1>
                            <p className="text-sm font-bold text-[#42CA80] uppercase tracking-widest">{client?.business_name}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Report Month</label>
                                <input
                                    type="month"
                                    value={reportMonth}
                                    onChange={(e) => setReportMonth(e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold focus:ring-2 focus:ring-slate-900 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Report Type</label>
                                <select
                                    value={reportType}
                                    onChange={(e) => setReportType(e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold focus:ring-2 focus:ring-slate-900 transition-all"
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">PDF URL</label>
                            <input
                                type="url"
                                placeholder="https://..."
                                value={pdfUrl}
                                onChange={(e) => setPdfUrl(e.target.value)}
                                className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold focus:ring-2 focus:ring-slate-900 transition-all"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2 px-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Performance Summary</label>
                                <button className="flex items-center gap-1 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-500 transition-colors">
                                    <Sparkles className="h-3 w-3" />
                                    Synthesize
                                </button>
                            </div>
                            <textarea
                                rows={8}
                                placeholder="Highlight strategic wins, KPI progress, and next steps..."
                                value={aiSummary}
                                onChange={(e) => setAiSummary(e.target.value)}
                                className="w-full bg-slate-50 border-none rounded-3xl p-6 font-medium focus:ring-2 focus:ring-slate-900 transition-all placeholder:text-slate-300"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => handleSave(false)}
                                disabled={isSaving}
                                className="flex-1 py-4 bg-slate-100 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                            >
                                Save Draft
                            </button>
                            <button
                                onClick={() => handleSave(true)}
                                disabled={isSaving}
                                className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2"
                            >
                                <Send className="h-4 w-4" />
                                Publish to Portal
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
