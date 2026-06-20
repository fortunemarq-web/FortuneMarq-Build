import { createServerClientWithCookies } from "@/lib/supabase-server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import LeadsList from "@/components/lists/LeadsList";
import { PageHeader } from "@/components/ui/page-header";

export default async function AdminLeadsPage() {
    const supabase = await createServerClientWithCookies();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div>Unauthorized</div>;
    }

    return (
        <div className="min-h-full bg-canvas px-4 py-6">
            <div className="mx-auto max-w-7xl space-y-6">
                <div>
                    <Link
                        href="/admin/sales"
                        className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-brand-deep"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Sales Dashboard
                    </Link>
                    <PageHeader
                        title="Leads Management"
                        subtitle="Manage all leads, create saved views, and perform bulk actions."
                    />
                </div>

                <LeadsList userId={user.id} />
            </div>
        </div>
    );
}
