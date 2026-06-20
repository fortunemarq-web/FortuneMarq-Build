import { fetchSeoPages, fetchAgencyKeywords, fetchBacklinks } from "@/app/admin/growth/actions";
import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";
import { ArrowLeft, Search, Link as LinkIcon, FileText, BarChart } from "lucide-react";
import StrategyInputPanel from "@/components/admin/growth/StrategyInputPanel";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";

export const metadata = {
  title: "Website & SEO — FortuneMarq",
};

export default async function WebsiteSEOTrackerPage() {
  const [pages, keywords, backlinks] = await Promise.all([
    fetchSeoPages(),
    fetchAgencyKeywords(),
    fetchBacklinks(),
  ]);

  const supabase = await createServerClientWithCookies();
  const { data: traffic } = await supabase
    .from("organic_traffic_snapshots")
    .select("*")
    .order("snapshot_date", { ascending: false })
    .limit(12);

  // Page status → one of the five tones (no per-status rainbow).
  const PAGE_STATUS: Record<string, { tone: Tone; label: string }> = {
    ranking: { tone: "brand", label: "Ranking" },
    optimized: { tone: "info", label: "Optimized" },
    exists_not_optimized: { tone: "warning", label: "Needs SEO" },
  };
  const statusBadge = (s: string) => {
    const meta = PAGE_STATUS[s] ?? { tone: "neutral" as Tone, label: "Not Created" };
    return <Badge tone={meta.tone} size="sm" className="uppercase">{meta.label}</Badge>;
  };

  return (
    <div className="min-h-full bg-canvas px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <Link href="/admin/growth" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-700">
            <ArrowLeft className="h-4 w-4" /> Back to Agency Growth
          </Link>

          <PageHeader
            eyebrow="Growth"
            title="Website & SEO"
            actions={
              <Link
                href="/admin/marketing"
                className="text-sm font-semibold text-brand-deep transition-colors hover:underline"
              >
                Go to Agency Marketing Hub &rarr;
              </Link>
            }
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section 1: Target Keywords */}
          <Card className="flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-line bg-slate-50/50 px-6 py-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-slate-400" />
                <h3 className="font-display text-sm font-semibold text-slate-900">Target Keywords</h3>
              </div>
              <span className="text-xs font-medium text-slate-400">{keywords?.length || 0} tracking</span>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-slate-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Keyword</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Vol</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Pos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {keywords?.map((k: any) => (
                    <tr key={k.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-6 py-3 text-sm font-semibold text-slate-900">{k.keyword}</td>
                      <td className="px-6 py-3 text-right text-sm tabular-nums text-slate-600">{k.search_volume || '—'}</td>
                      <td className="px-6 py-3 text-right">
                        <span className={`inline-flex min-w-[32px] items-center justify-center rounded px-1.5 py-0.5 text-sm font-semibold tabular-nums ${k.current_position <= 3 ? 'bg-brand-soft text-brand-deep' : k.current_position <= 10 ? 'bg-warn-soft text-warn' : 'bg-slate-100 text-slate-600'}`}>
                          {k.current_position || '>100'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!keywords || keywords.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-6 py-6 text-center text-sm text-slate-400">No agency keywords tracked.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Section 2: Pages Tracker */}
          <Card className="flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-line bg-slate-50/50 px-6 py-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <h3 className="font-display text-sm font-semibold text-slate-900">Pages Tracker</h3>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-slate-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Page URL</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Target KW</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pages?.map((p: any) => (
                    <tr key={p.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-6 py-3">
                        <p className="text-sm font-semibold text-slate-900">{p.page_name}</p>
                        <p className="max-w-[150px] truncate text-xs text-slate-400">{p.url}</p>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-600">{p.target_keyword || '—'}</td>
                      <td className="px-6 py-3">{statusBadge(p.status)}</td>
                    </tr>
                  ))}
                  {(!pages || pages.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-6 py-6 text-center text-sm text-slate-400">No SEO pages configured.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Section 3: Traffic Log */}
          <Card className="flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-line bg-slate-50/50 px-6 py-4">
              <div className="flex items-center gap-2">
                <BarChart className="h-4 w-4 text-slate-400" />
                <h3 className="font-display text-sm font-semibold text-slate-900">Traffic Log (Monthly)</h3>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-slate-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Month</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Organic</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Total</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">New Users</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {traffic?.map((t: any) => (
                    <tr key={t.id} className="border-l-2 border-transparent transition-colors hover:border-brand hover:bg-slate-50/70">
                      <td className="px-6 py-3 text-sm font-semibold text-slate-900">
                        {new Date(t.snapshot_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-semibold tabular-nums text-brand-deep">{t.organic_sessions?.toLocaleString()}</td>
                      <td className="px-6 py-3 text-right text-sm tabular-nums text-slate-700">{t.total_sessions?.toLocaleString()}</td>
                      <td className="px-6 py-3 text-right text-sm tabular-nums text-slate-600">{t.new_users?.toLocaleString()}</td>
                    </tr>
                  ))}
                  {(!traffic || traffic.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-6 py-6 text-center text-sm text-slate-400">No traffic logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Section 4: Backlink Log */}
          <Card className="flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-line bg-slate-50/50 px-6 py-4">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-slate-400" />
                <h3 className="font-display text-sm font-semibold text-slate-900">Backlink Log</h3>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-slate-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Domain</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Anchor</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">DA</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {backlinks?.map((b: any) => (
                    <tr key={b.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-6 py-3">
                        <p className="max-w-[150px] truncate text-sm font-semibold text-slate-900" title={b.source_domain}>{b.source_domain}</p>
                        <p className="text-[11px] text-slate-400">
                          {b.acquired_date ? new Date(b.acquired_date).toLocaleDateString() : ''}
                        </p>
                      </td>
                      <td className="max-w-[120px] truncate px-6 py-3 text-sm text-slate-600">{b.anchor_text}</td>
                      <td className="px-6 py-3">
                        <span className="inline-flex min-w-[28px] items-center justify-center rounded bg-slate-100 px-1.5 py-0.5 text-sm font-semibold tabular-nums text-slate-700">
                          {b.domain_authority || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {b.status === 'active' ? (
                          <Badge tone="brand" size="sm">Active</Badge>
                        ) : (
                          <Badge tone="danger" size="sm">Lost</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!backlinks || backlinks.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-6 py-6 text-center text-sm text-slate-400">No backlinks logged.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Section 5: Strategy Panel placeholder */}
        <StrategyInputPanel destination="agency_growth.seo" />

      </div>
    </div>
  );
}
