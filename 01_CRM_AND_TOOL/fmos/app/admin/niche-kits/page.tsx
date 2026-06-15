import { createServerClientWithCookies } from "@/lib/supabase-server";
import { FolderHeart, ArrowLeft } from "lucide-react";
import Link from "next/link";
import NicheKitGrid from "@/components/admin/niche-kit-grid";

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
        <div className="min-h-full bg-slate-50 px-4 py-8">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <Link
                            href="/admin"
                            className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-[#42CA80]"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Command Hub
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#42CA80] to-emerald-600 shadow-lg shadow-emerald-500/20">
                                <FolderHeart className="h-6 w-6 text-slate-900" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 md:text-4xl">
                                    Niche Kit Manager
                                </h1>
                                <p className="text-sm text-slate-500">Manage marketing assets, case studies, and landing pages per niche.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <NicheKitGrid initialNiches={(niches || []) as any} initialKits={(kits || []) as any} />
            </div>
        </div>
    );
}
