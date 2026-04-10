import { createServerClientWithCookies } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import SopEditor from "@/components/team/sop-editor";
import { createSopAction } from "@/app/admin/team/actions";
import { BookOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewSopPage() {
  const supabase = await createServerClientWithCookies();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 lg:p-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link 
            href="/admin/team/sops"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-bold">Back to Library</span>
          </Link>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-200 p-8 md:p-12 shadow-xl shadow-slate-900/5">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
              <BookOpen className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-black text-slate-900">Create SOP</h1>
          </div>
          <SopEditor sop={null} onSave={createSopAction} />
        </div>
      </div>
    </div>
  );
}
