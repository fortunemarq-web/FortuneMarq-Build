import { createServerClientWithCookies } from "@/lib/supabase-server";
import AlertsManager from "@/components/admin/alerts-manager";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function AdminAlertsPage() {
    const supabase = await createServerClientWithCookies();

    const { data: alerts } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8">
            <div className="mx-auto max-w-5xl">
                <div className="mb-6">
                    <Link href="/admin" className="text-slate-500 hover:text-slate-900 flex items-center gap-2 mb-4 text-sm transition-colors">
                        <ArrowLeft className="h-4 w-4" /> Back to Command Hub
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900">System Alerts</h1>
                    <p className="text-slate-600">Monitor and resolve system anomalies and SLA breaches.</p>
                </div>

                <AlertsManager initialAlerts={(alerts || []) as any[]} />
            </div>
        </div>
    );
}
