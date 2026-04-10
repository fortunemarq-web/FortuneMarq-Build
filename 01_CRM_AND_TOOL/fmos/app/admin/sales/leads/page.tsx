import { createServerClientWithCookies } from "@/lib/supabase-server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import LeadsList from "@/components/lists/LeadsList";

export default async function AdminLeadsPage() {
    const supabase = await createServerClientWithCookies();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div>Unauthorized</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-6">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6">
                    <Link
                        href="/admin/sales"
                        className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-[#42CA80] mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Sales Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900">Leads Management</h1>
                    <p className="text-sm text-slate-500">Manage all leads, create saved views, and perform bulk actions.</p>
                </div>

                <LeadsList userId={user.id} />
            </div>
        </div>
    );
}
