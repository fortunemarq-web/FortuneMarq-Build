import { createAdminClient } from "@/lib/supabase-admin";
import { BACKUP_BUCKET } from "@/lib/backup/export";
import { runBackupNow } from "./actions";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Download, Database, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

function fmtBytes(n: number) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

async function runBackupAction() {
  "use server";
  await runBackupNow();
}

export default async function BackupsPage() {
  const sb = createAdminClient() as any;
  const { data: list, error } = await sb.storage
    .from(BACKUP_BUCKET)
    .list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });

  const bucketMissing = !!error;
  const files = ((list || []) as any[]).filter((f) => f.name?.endsWith(".json"));
  const withUrls = await Promise.all(
    files.map(async (f) => {
      const { data } = await sb.storage.from(BACKUP_BUCKET).createSignedUrl(f.name, 3600);
      return { name: f.name, url: data?.signedUrl as string | undefined, size: f.metadata?.size ?? 0, created: f.created_at };
    }),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Backups"
        subtitle="Daily snapshots of the core business data — leads, clients, invoices, proposals, market insights."
      />

      <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <ShieldCheck className="h-5 w-5 text-emerald-500" />
          A snapshot runs automatically every day. Snapshots older than 30 days are pruned. Download links are valid for 1 hour.
        </div>
        <form action={runBackupAction}>
          <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 transition-colors">
            <Database className="h-4 w-4" /> Run backup now
          </button>
        </form>
      </Card>

      {bucketMissing ? (
        <Card className="p-5">
          <div className="text-sm font-medium">Storage bucket not set up yet</div>
          <p className="text-sm text-muted-foreground mt-2">
            Run <code>supabase/2026-06-23_backups_bucket.sql</code> in the Supabase dashboard to create the private <code>{BACKUP_BUCKET}</code> bucket, then click <b>Run backup now</b>.
          </p>
        </Card>
      ) : (
        <Card className="p-5">
          <div className="text-sm font-semibold mb-4">Snapshots ({withUrls.length})</div>
          {withUrls.length === 0 ? (
            <div className="text-sm text-muted-foreground">No snapshots yet — click <b>Run backup now</b> to create the first one.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border/60">
                    <th className="py-2 font-medium">File</th>
                    <th className="py-2 font-medium text-right">Size</th>
                    <th className="py-2 font-medium text-right">Created</th>
                    <th className="py-2 font-medium text-right">Download</th>
                  </tr>
                </thead>
                <tbody>
                  {withUrls.map((f) => (
                    <tr key={f.name} className="border-b border-border/40 last:border-0">
                      <td className="py-2.5 font-mono text-xs">{f.name}</td>
                      <td className="py-2.5 text-right tabular-nums">{fmtBytes(f.size)}</td>
                      <td className="py-2.5 text-right text-muted-foreground whitespace-nowrap">{fmtDate(f.created)}</td>
                      <td className="py-2.5 text-right">
                        {f.url ? (
                          <a href={f.url} className="inline-flex items-center gap-1.5 text-emerald-600 hover:underline" download>
                            <Download className="h-4 w-4" /> JSON
                          </a>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
