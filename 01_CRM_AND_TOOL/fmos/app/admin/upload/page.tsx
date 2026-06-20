import CsvUploader from "@/components/dashboard/csv-uploader";
import Link from "next/link";
import { History, ShieldAlert } from "lucide-react";
import { createServerClientWithCookies } from "@/lib/supabase-server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default async function AdminUploadPage() {
  // Admin-only: bulk imports can overwrite real data
  const supabase = await createServerClientWithCookies();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

  if ((profile as any)?.role !== "admin") {
    return (
      <div className="flex min-h-full items-center justify-center bg-canvas px-4">
        <div className="text-center text-slate-500">
          <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-danger" />
          <p className="font-semibold text-slate-900">Admins only</p>
          <p className="mt-1 text-sm">Bulk lead upload is restricted to the admin role.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-4xl space-y-6">
        <PageHeader
          title="Upload Leads via CSV"
          subtitle="Bulk-import leads with industry, city and source metadata."
          actions={
            <>
              <Link
                href="/admin/upload/debug"
                className={buttonVariants({ variant: "secondary", size: "sm" })}
                title="Debug upload issues"
              >
                Debug
              </Link>
              <Link
                href="/admin/upload/history"
                className={buttonVariants({ variant: "secondary" })}
              >
                <History className="h-4 w-4" />
                View History
              </Link>
            </>
          }
        />
        <Card className="p-6 md:p-8">
          <div className="mb-6 space-y-2">
            <p className="text-sm text-slate-500 md:text-base">
              Upload a CSV file with lead information. See{" "}
              <Link
                href="/CSV_UPLOAD_FORMAT.md"
                className="font-medium text-brand-deep hover:underline"
                target="_blank"
              >
                CSV format guide
              </Link>{" "}
              for supported columns.
            </p>
          </div>
          <CsvUploader />
        </Card>
      </div>
    </div>
  );
}
