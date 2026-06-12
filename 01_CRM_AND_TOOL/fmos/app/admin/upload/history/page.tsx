import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";
import { ArrowLeft, FileText, Calendar, Users, Building2, MapPin, TrendingUp, Flame } from "lucide-react";

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function CsvUploadHistoryPage() {
  const supabase = await createServerClientWithCookies();

  // Fetch CSV uploads ordered by most recent first
  const { data: uploads, error } = await supabase
    .from("csv_uploads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <p className="text-red-500">Error loading upload history: {error.message}</p>
          <Link
            href="/admin/upload"
            className="mt-4 inline-flex items-center gap-2 text-[#42CA80] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Upload
          </Link>
        </div>
      </div>
    );
  }

  const uploadsList = (uploads || []) as Array<{
    id: string;
    filename: string;
    created_at: string;
    leads_count: number;
    industry: string | null;
    city: string | null;
    lead_type: string | null;
    source: string | null;
    has_market_data: boolean;
    import_batch_id: string | null;
    uploaded_by: string | null;
  }>;

  return (
    <div className="min-h-full bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/admin/upload"
              className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-[#42CA80]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Upload
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 md:text-4xl font-mono tabular-nums">CSV Upload History</h1>
            <p className="mt-2 text-sm text-slate-500">
              View all uploaded CSV files and their details
            </p>
          </div>
          <Link
            href="/admin/upload"
            className="rounded-lg bg-[#42CA80] text-white shadow-sm transition-all duration-150 hover:bg-[#35A66A] hover:shadow active:scale-[0.98] active:bg-[#2d9960] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#42CA80] focus-visible:ring-offset-2 px-4 py-2 text-sm font-medium text-white hover:bg-[#42CA80]/90"
          >
            Upload New CSV
          </Link>
        </div>

        {/* Uploads List */}
        {uploadsList.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-600" />
            <p className="mt-4 text-slate-500">No CSV uploads found</p>
            <Link
              href="/admin/upload"
              className="mt-4 inline-flex items-center gap-2 text-[#42CA80] hover:underline"
            >
              Upload your first CSV file
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {uploadsList.map((upload) => (
              <div
                key={upload.id}
                className="rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:border-[#42CA80]/30"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  {/* Left: File Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#42CA80] text-white shadow-sm transition-all duration-150 hover:bg-[#35A66A] hover:shadow active:scale-[0.98] active:bg-[#2d9960] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#42CA80] focus-visible:ring-offset-2 /10">
                        <FileText className="h-5 w-5 text-[#42CA80]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-slate-900">{upload.filename}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(upload.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4" />
                            <span>{upload.leads_count} lead(s)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap gap-2">
                      {upload.industry && (
                        <div className="flex items-center gap-1.5 rounded-lg bg-purple-500/20 px-3 py-1.5">
                          <Building2 className="h-3.5 w-3.5 text-purple-400" />
                          <span className="text-xs font-medium text-purple-400">
                            {upload.industry}
                          </span>
                        </div>
                      )}
                      {upload.city && (
                        <div className="flex items-center gap-1.5 rounded-lg bg-blue-500/20 px-3 py-1.5">
                          <MapPin className="h-3.5 w-3.5 text-blue-400" />
                          <span className="text-xs font-medium text-blue-400">{upload.city}</span>
                        </div>
                      )}
                      {upload.lead_type && (
                        <div
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 ${
                            upload.lead_type === "inbound"
                              ? "bg-orange-500/20"
                              : "bg-[#42CA80]/20"
                          }`}
                        >
                          {upload.lead_type === "inbound" ? (
                            <Flame className="h-3.5 w-3.5 text-orange-400" />
                          ) : (
                            <TrendingUp className="h-3.5 w-3.5 text-[#42CA80]" />
                          )}
                          <span
                            className={`text-xs font-medium capitalize ${
                              upload.lead_type === "inbound"
                                ? "text-orange-400"
                                : "text-[#42CA80]"
                            }`}
                          >
                            {upload.lead_type}
                          </span>
                        </div>
                      )}
                      {upload.source && (
                        <div className="rounded-lg bg-white px-3 py-1.5">
                          <span className="text-xs font-medium text-slate-500">
                            Source: {upload.source}
                          </span>
                        </div>
                      )}
                      {upload.has_market_data && (
                        <div className="rounded-lg bg-purple-500/20 px-3 py-1.5">
                          <span className="text-xs font-medium text-purple-400">
                            Market Data Included
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    {upload.import_batch_id && (
                      <Link
                        href={`/admin/sales?batch=${upload.import_batch_id}`}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:border-[#42CA80]/50"
                        title="View leads from this upload"
                      >
                        View Leads
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        {uploadsList.length > 0 && (
          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-base font-semibold text-slate-900">Summary</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-slate-500">Total Uploads</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{uploadsList.length}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Leads Imported</p>
                <p className="mt-1 text-2xl font-bold text-[#42CA80]">
                  {uploadsList.reduce((sum, u) => sum + (u.leads_count || 0), 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">With Market Data</p>
                <p className="mt-1 text-2xl font-bold text-purple-400">
                  {uploadsList.filter((u) => u.has_market_data).length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
