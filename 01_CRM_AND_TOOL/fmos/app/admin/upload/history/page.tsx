import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";
import { ArrowLeft, FileText, Calendar, Users, Building2, MapPin, TrendingUp, Flame } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

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
      <div className="flex min-h-full items-center justify-center bg-canvas px-4">
        <div className="text-center">
          <p className="text-danger">Error loading upload history: {error.message}</p>
          <Link
            href="/admin/upload"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-deep hover:underline"
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
    <div className="min-h-full bg-canvas px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/admin/upload"
            className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-brand-deep"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Upload
          </Link>
          <PageHeader
            title="CSV Upload History"
            subtitle="View all uploaded CSV files and their details"
            actions={
              <Link href="/admin/upload" className={buttonVariants({ variant: "primary" })}>
                Upload New CSV
              </Link>
            }
          />
        </div>

        {/* Uploads List */}
        {uploadsList.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-slate-500">No CSV uploads found</p>
            <Link
              href="/admin/upload"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-deep hover:underline"
            >
              Upload your first CSV file
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {uploadsList.map((upload) => (
              <Card
                key={upload.id}
                className="p-5 transition-colors hover:border-line-strong"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  {/* Left: File Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft">
                        <FileText className="h-5 w-5 text-brand-deep" />
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
                            <span className="tabular-nums">{upload.leads_count} lead(s)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap gap-2">
                      {upload.industry && (
                        <Badge tone="neutral" variant="soft" size="sm">
                          <Building2 className="h-3.5 w-3.5" />
                          {upload.industry}
                        </Badge>
                      )}
                      {upload.city && (
                        <Badge tone="info" variant="soft" size="sm">
                          <MapPin className="h-3.5 w-3.5" />
                          {upload.city}
                        </Badge>
                      )}
                      {upload.lead_type && (
                        <Badge
                          tone={upload.lead_type === "inbound" ? "warning" : "brand"}
                          variant="soft"
                          size="sm"
                          className="capitalize"
                        >
                          {upload.lead_type === "inbound" ? (
                            <Flame className="h-3.5 w-3.5" />
                          ) : (
                            <TrendingUp className="h-3.5 w-3.5" />
                          )}
                          {upload.lead_type}
                        </Badge>
                      )}
                      {upload.source && (
                        <Badge tone="neutral" variant="outline" size="sm">
                          Source: {upload.source}
                        </Badge>
                      )}
                      {upload.has_market_data && (
                        <Badge tone="info" variant="soft" size="sm">
                          Market Data Included
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    {upload.import_batch_id && (
                      <Link
                        href={`/admin/sales?batch=${upload.import_batch_id}`}
                        className={buttonVariants({ variant: "secondary", size: "sm" })}
                        title="View leads from this upload"
                      >
                        View Leads
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        {uploadsList.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Total Uploads" value={uploadsList.length} />
            <StatCard
              label="Total Leads Imported"
              value={uploadsList.reduce((sum, u) => sum + (u.leads_count || 0), 0)}
            />
            <StatCard
              label="With Market Data"
              value={uploadsList.filter((u) => u.has_market_data).length}
            />
          </div>
        )}
      </div>
    </div>
  );
}
