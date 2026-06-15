import { createServerClientWithCookies } from "@/lib/supabase-server";
import TemplateManager from "@/components/admin/template-manager";
import { MessageSquare, LayoutDashboard, Settings } from "lucide-react";
import Link from "next/link";
import SeedTemplatesButton from "./seed-button";
import AutoGreetingToggle from "@/components/admin/auto-greeting-toggle";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "WhatsApp Template Manager | FortuneMarq Admin",
    description: "Manage automated WhatsApp message templates for lead outcomes.",
};

export default async function WhatsappTemplatesPage() {
    const supabase = await createServerClientWithCookies();

    // Preliminary check for admin access if necessary, 
    // currently following project pattern of letting RLS handle it or broad auth check.
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <p className="text-slate-500 font-medium">Please sign in to access admin tools.</p>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-slate-50 px-4 py-8">
            <div className="mx-auto max-w-7xl">

                {/* Breadcrumbs / Header */}
                <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                            <Link href="/admin" className="hover:text-emerald-500 transition-colors">Admin Hub</Link>
                            <span>/</span>
                            <span className="text-slate-900">WhatsApp Templates</span>
                        </div>
                        <h1 className="text-4xl font-mono tabular-nums font-bold text-slate-900 flex items-center gap-3">
                            <MessageSquare className="h-9 w-9 text-emerald-500" />
                            Template Engine
                        </h1>
                        <p className="text-slate-500 text-sm max-w-lg">
                            Build and manage the WhatsApp template library used by the sales
                            template picker. Organize by category and lead type (A/B/C/D).
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <AutoGreetingToggle />
                        <SeedTemplatesButton />
                        <Link
                            href="/admin"
                            className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
                        >
                            <LayoutDashboard className="h-4 w-4 opacity-50" /> Back to Hub
                        </Link>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Live Template Engine
                        </div>
                    </div>
                </div>

                <TemplateManager />

            </div>
        </div>
    );
}
