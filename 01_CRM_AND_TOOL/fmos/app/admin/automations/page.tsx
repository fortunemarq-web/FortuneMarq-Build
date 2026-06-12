import { createServerClientWithCookies } from "@/lib/supabase-server";
import { Plus, Play, Pause, Zap } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default async function AutomationsPage() {
    const supabase = await createServerClientWithCookies();
    const { data: rules } = await supabase
        .from("automation_rules" as any)
        .select("*")
        .order("priority", { ascending: true });

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Automation Rules</h1>
                    <p className="text-slate-500">Manage enterprise workflow triggers and actions.</p>
                </div>
                {/* "New Rule" button removed — /admin/automations/new doesn't
                    exist yet. Re-add when the rule builder is built. */}
            </div>

            <div className="grid gap-4">
                {rules && rules.map((rule: any) => (
                    <div key={rule.id} className="bg-slate-50 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${rule.is_enabled ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-100 text-slate-500'}`}>
                                    {rule.is_enabled ? 'Active' : 'Paused'}
                                </span>
                                <h3 className="font-bold text-slate-900">{rule.name}</h3>
                            </div>
                            <p className="text-sm text-slate-600 flex items-center gap-2">
                                <Zap className="h-3 w-3" /> Trigger: <span className="text-slate-600 font-mono">{rule.trigger}</span>
                                <span className="text-zinc-700">|</span>
                                Target: <span className="text-slate-600">{rule.entity_type}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden md:block">
                                <p className="text-xs text-slate-600">Priority</p>
                                <p className="text-sm font-bold text-slate-900">{rule.priority}</p>
                            </div>
                            <div className="h-8 w-px bg-slate-100 hidden md:block"></div>
                            <Link href={`/admin/automations/${rule.id}`} className="text-sm text-slate-600 hover:text-slate-900 border border-slate-300 px-3 py-1.5 rounded bg-white">
                                Edit
                            </Link>
                        </div>
                    </div>
                ))}

                {(!rules || rules.length === 0) && (
                    <div className="text-center py-12 text-slate-500">
                        No rules defined yet.
                    </div>
                )}
            </div>
        </div>
    );
}
