import { createServerClientWithCookies } from "@/lib/supabase-server";
import { Zap } from "lucide-react";
import AutomationsClient from "@/components/admin/AutomationsClient";
import { APPROVED_WA_TEMPLATES } from "@/lib/whatsapp/approved-templates";

export default async function AutomationsPage() {
    const supabase = await createServerClientWithCookies();
    const { data: rules } = await supabase
        .from("automation_rules")
        .select("id, name, description, trigger, entity_type, priority, is_enabled")
        .order("priority", { ascending: true });

    // The send_whatsapp action picker MUST offer the approved Meta template HANDLES
    // (e.g. "meeting_confirmation"). whatsapp_templates.name holds display names
    // ("Meeting Confirmation") which Meta rejects — so source from the approved list.
    const templateNames = [...APPROVED_WA_TEMPLATES];

    return (
        <div className="min-h-full bg-slate-50 px-4 py-8">
            <div className="mx-auto max-w-4xl">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-tr from-violet-500 to-purple-700 text-white shadow-sm">
                            <Zap className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Automation Rules</h1>
                            <p className="text-slate-500 text-sm">Manage workflow triggers and automated actions.</p>
                        </div>
                    </div>
                </div>

                <AutomationsClient initialRules={(rules || []) as any} templates={templateNames} />
            </div>
        </div>
    );
}
