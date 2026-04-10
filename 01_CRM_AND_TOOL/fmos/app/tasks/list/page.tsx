import { createServerClientWithCookies } from "@/lib/supabase-server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import TasksList from "@/components/lists/TasksList";

export default async function TasksListPage() {
    const supabase = await createServerClientWithCookies();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Unauthorized</div>;

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-6">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6">
                    {/* Assuming /tasks exists, otherwise back to home or dashboard */}
                    <Link href="/staff" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#42CA80] mb-4">
                        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900">Tasks Management</h1>
                </div>
                <TasksList userId={user.id} />
            </div>
        </div>
    );
}
