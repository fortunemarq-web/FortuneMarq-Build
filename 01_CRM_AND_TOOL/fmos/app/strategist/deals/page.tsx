import { createServerClientWithCookies } from "@/lib/supabase-server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import DealsList from "@/components/lists/DealsList";
import { PageHeader } from "@/components/ui/page-header";

export default async function StrategistDealsPage() {
    const supabase = await createServerClientWithCookies();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    return (
        <div className="min-h-full bg-canvas px-4 py-6">
            <div className="mx-auto max-w-7xl space-y-6">
                <div>
                    <Link href="/strategist" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-brand-deep">
                        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                    </Link>
                    <PageHeader
                        title="Deals Management"
                        subtitle="Manage open and closed deals."
                    />
                </div>
                <DealsList userId={user.id} />
            </div>
        </div>
    );
}
