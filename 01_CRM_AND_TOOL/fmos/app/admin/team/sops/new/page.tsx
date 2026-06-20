import { createServerClientWithCookies } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import SopEditor from "@/components/team/sop-editor";
import { createSopAction } from "@/app/admin/team/actions";
import { BookOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export default async function NewSopPage() {
  const supabase = await createServerClientWithCookies();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-full bg-canvas px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/admin/team/sops"
            className="flex items-center gap-2 text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Library</span>
          </Link>
        </div>

        <Card className="p-8 md:p-10">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-brand-line bg-brand-soft text-brand-deep">
              <BookOpen className="h-5 w-5" />
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-slate-900">Create SOP</h1>
          </div>
          <SopEditor sop={null} onSave={createSopAction} />
        </Card>
      </div>
    </div>
  );
}
