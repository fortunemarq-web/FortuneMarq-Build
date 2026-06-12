import CsvUploader from "@/components/dashboard/csv-uploader";
import Link from "next/link";
import { FileText, History, ShieldAlert } from "lucide-react";
import { createServerClientWithCookies } from "@/lib/supabase-server";

export default async function AdminUploadPage() {
  // Admin-only: bulk imports can overwrite real data
  const supabase = await createServerClientWithCookies();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

  if ((profile as any)?.role !== "admin") {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50 px-4">
        <div className="text-center text-slate-500">
          <ShieldAlert className="h-10 w-10 mx-auto mb-3 text-red-400" />
          <p className="font-semibold text-slate-900">Admins only</p>
          <p className="text-sm mt-1">Bulk lead upload is restricted to the admin role.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-4xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 md:text-4xl font-mono tabular-nums">
            Upload Leads via CSV
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/upload/debug"
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:border-[#42CA80]/50"
              title="Debug upload issues"
            >
              Debug
            </Link>
            <Link
              href="/admin/upload/history"
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:border-[#42CA80]/50"
            >
              <History className="h-4 w-4" />
              <span>View History</span>
            </Link>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 md:p-8">
          <div className="mb-6 space-y-2">
            <p className="text-sm text-slate-500 md:text-base">
              Upload a CSV file with lead information. See{" "}
              <Link
                href="/CSV_UPLOAD_FORMAT.md"
                className="text-[#42CA80] hover:underline"
                target="_blank"
              >
                CSV format guide
              </Link>{" "}
              for supported columns.
            </p>
          </div>
          <CsvUploader />
        </div>
      </div>
    </div>
  );
}
