import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import DataResetButton from "@/components/admin/data-reset-button";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";

export default async function UploadDebugPage() {
  const supabase = await createServerClientWithCookies();

  // Get current user
  const { data: userData } = await supabase.auth.getUser();

  // Check if csv_uploads table exists
  const { data: uploads, error: uploadsError } = await supabase
    .from("csv_uploads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  // Check recent leads
  const { data: recentLeads, error: leadsError } = await supabase
    .from("leads")
    .select("id, company_name, lead_type, industry, city, created_at, import_batch_id")
    .order("created_at", { ascending: false })
    .limit(10);

  // Determine RLS status based on whether we can read leads
  const canReadLeads = !leadsError;

  return (
    <div className="min-h-full bg-canvas px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href="/admin/upload"
          className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-brand-deep"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Upload
        </Link>

        <PageHeader title="Upload Debug Info" actions={<DataResetButton />} />

        {/* User Info */}
        <Card className="p-6">
          <h2 className="mb-4 font-display text-base font-semibold text-slate-900">Current User</h2>
          {userData?.user ? (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-brand-deep">
                <CheckCircle2 className="h-4 w-4" /> Authenticated
              </p>
              <div className="space-y-1 text-sm text-slate-500">
                <p>Email: {userData.user.email}</p>
                <p>User ID: {userData.user.id}</p>
              </div>
            </div>
          ) : (
            <p className="flex items-center gap-1.5 text-sm font-medium text-warn">
              <AlertTriangle className="h-4 w-4" /> Not authenticated (server-side session not detected)
            </p>
          )}
        </Card>

        {/* RLS Check */}
        <Card className="p-6">
          <h2 className="mb-4 font-display text-base font-semibold text-slate-900">Row Level Security (RLS)</h2>
          {canReadLeads ? (
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium text-brand-deep">
                <CheckCircle2 className="h-4 w-4" /> Can read leads table
              </p>
              <p className="mt-2 text-sm text-slate-500">
                If uploads fail, run this SQL in Supabase:
              </p>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                {`-- Fix RLS policies for leads and csv_uploads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for leads" ON public.leads;
CREATE POLICY "Enable all for leads" ON public.leads
    FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.csv_uploads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for csv_uploads" ON public.csv_uploads;
CREATE POLICY "Enable all for csv_uploads" ON public.csv_uploads
    FOR ALL USING (true) WITH CHECK (true);`}
              </pre>
            </div>
          ) : (
            <div className="rounded-lg border border-danger-line bg-danger-soft p-4">
              <p className="flex items-center gap-1.5 font-medium text-danger">
                <XCircle className="h-4 w-4" /> Cannot read leads
              </p>
              <p className="mt-2 text-sm text-danger">Error: {leadsError?.message}</p>
            </div>
          )}
        </Card>

        {/* CSV Uploads Table Status */}
        <Card className="p-6">
          <h2 className="mb-4 font-display text-base font-semibold text-slate-900">CSV Uploads Table</h2>
          {uploadsError ? (
            <div className="rounded-lg border border-danger-line bg-danger-soft p-4">
              <p className="font-medium text-danger">Error: {uploadsError.message}</p>
              <p className="mt-2 text-sm text-danger">
                The csv_uploads table may not exist. Run this migration:
              </p>
              <code className="mt-2 block rounded-lg bg-slate-50 p-2 text-xs text-slate-500">
                supabase/migrations/create_csv_uploads_table.sql
              </code>
            </div>
          ) : (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-brand-deep">
                <CheckCircle2 className="h-4 w-4" /> Table exists
              </p>
              <p className="text-sm text-slate-500">
                Found {uploads?.length || 0} upload(s) in history
              </p>
              {uploads && uploads.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploads.map((upload: any) => (
                    <div key={upload.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                      <p className="text-slate-900">{upload.filename}</p>
                      <p className="text-slate-500">
                        {upload.leads_count} leads • {upload.lead_type} • {new Date(upload.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Recent Leads */}
        <Card className="p-6">
          <h2 className="mb-4 font-display text-base font-semibold text-slate-900">Recent Leads</h2>
          {leadsError ? (
            <div className="rounded-lg border border-danger-line bg-danger-soft p-4">
              <p className="text-danger">Error: {leadsError.message}</p>
            </div>
          ) : (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-brand-deep">
                <CheckCircle2 className="h-4 w-4" /> Leads table accessible
              </p>
              <p className="mb-4 text-sm text-slate-500">
                Showing {recentLeads?.length || 0} most recent leads
              </p>
              {recentLeads && recentLeads.length > 0 ? (
                <div className="space-y-2">
                  {recentLeads.map((lead: any) => (
                    <div key={lead.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                      <p className="font-medium text-slate-900">{lead.company_name || "Unknown"}</p>
                      <div className="mt-1 flex gap-4 text-xs text-slate-500">
                        <span>Type: {lead.lead_type || "outbound"}</span>
                        <span>Industry: {lead.industry || "N/A"}</span>
                        <span>City: {lead.city || "N/A"}</span>
                        <span>{new Date(lead.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">No leads found</p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
