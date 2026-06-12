import DataManager from "@/components/admin/data-manager";
import { createServerClientWithCookies } from "@/lib/supabase-server";
import { ShieldAlert } from "lucide-react";

export default function AdminDataManagementPage() {
    return (
        <div className="min-h-full bg-slate-50 px-4 py-12">
            <div className="mx-auto max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-4xl font-mono tabular-nums font-bold text-slate-900 flex items-center gap-3">
                        <ShieldAlert className="h-8 w-8 text-red-500" />
                        Data Management
                    </h1>
                    <p className="text-slate-500 mt-2">Manage your dataset. Bulk delete industries or find and remove specific bad leads.</p>
                </div>

                <DataManager />
            </div>
        </div>
    );
}
