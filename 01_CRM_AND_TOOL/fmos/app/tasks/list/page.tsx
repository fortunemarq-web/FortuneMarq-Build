import { createServerClientWithCookies } from "@/lib/supabase-server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import TasksList from "@/components/lists/TasksList";
import { PageHeader } from "@/components/ui/page-header";

export default async function TasksListPage() {
    const supabase = await createServerClientWithCookies();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Unauthorized</div>;

    return (
        <div className="min-h-full bg-canvas px-4 py-6">
            <div className="mx-auto max-w-7xl">
                {/* Assuming /tasks exists, otherwise back to home or dashboard */}
                <Link href="/staff" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand-deep">
                    <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </Link>
                <PageHeader title="Tasks Management" className="mb-6" />
                <TasksList userId={user.id} />
            </div>
        </div>
    );
}
