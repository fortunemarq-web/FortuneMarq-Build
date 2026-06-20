import { createServerClientWithCookies } from "@/lib/supabase-server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ProjectsList from "@/components/lists/ProjectsList";
import { PageHeader } from "@/components/ui/page-header";

export default async function ProjectsListPage() {
    const supabase = await createServerClientWithCookies();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Unauthorized</div>;

    return (
        <div className="min-h-full bg-canvas px-4 py-6">
            <div className="mx-auto max-w-7xl">
                <Link href="/projects" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-brand-deep">
                    <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </Link>
                <PageHeader
                    className="mb-6"
                    title="All Projects"
                    subtitle="List view with bulk actions."
                />
                <ProjectsList userId={user.id} />
            </div>
        </div>
    );
}
