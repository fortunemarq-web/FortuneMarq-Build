import { createServerClientWithCookies } from "@/lib/supabase-server";
import { ArrowLeft, Save, Trash2, Plus, GripVertical } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import SopEditor from "@/components/team/sop-editor";
import { updateSopAction } from "@/app/admin/team/actions";
import DeleteSopButton from "@/components/team/delete-sop-button";
import { revalidatePath } from "next/cache";

export default async function SopDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createServerClientWithCookies();
  const id = (await params).id;
  
  if (id === "new") redirect("/admin/team/sops/new");

  const { data: sop, error: fetchError } = await supabase
    .from("sops")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !sop) {
    redirect("/admin/team/sops");
  }

  // Handle Save (Server Action wrapper)
  async function saveSop(formData: FormData) {
    "use server";
    await updateSopAction(id, formData);
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 md:p-8 lg:p-12">
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
          
          <div className="flex items-center gap-2">
            {id !== "new" && (
                <DeleteSopButton sopId={id} sopTitle={(sop as any).title} />
            )}
          </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-200 p-8 md:p-12 shadow-xl shadow-slate-900/5">
            <h1 className="text-3xl font-black text-slate-900 mb-8">
                {id === "new" ? "Create New SOP" : "Edit Procedure"}
            </h1>
            
            <SopEditor sop={sop} onSave={saveSop} />
        </div>
      </div>
    </div>
  );
}
