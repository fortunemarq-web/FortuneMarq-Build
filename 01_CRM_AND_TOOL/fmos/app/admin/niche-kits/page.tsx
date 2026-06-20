import { createServerClientWithCookies } from "@/lib/supabase-server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import NicheKitGrid from "@/components/admin/niche-kit-grid";
import { PageHeader } from "@/components/ui/page-header";

export default async function AdminNicheKitsPage() {
    const supabase = await createServerClientWithCookies();

    // Fetch all niches
    const { data: niches } = await supabase
        .from("niches")
        .select("*")
        .order("name", { ascending: true });

    // Fetch existing kits
    const { data: kits } = await supabase
        .from("niche_kits")
        .select("*");

    return (
        <div className="min-h-full bg-canvas px-4 py-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div>
                    <Link
                        href="/admin"
                        className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-brand-deep"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Command Hub
                    </Link>
                    <PageHeader
                        title="Niche Kit Manager"
                        subtitle="Manage marketing assets, case studies, and landing pages per niche."
                    />
                </div>

                <NicheKitGrid initialNiches={(niches || []) as any} initialKits={(kits || []) as any} />
            </div>
        </div>
    );
}
