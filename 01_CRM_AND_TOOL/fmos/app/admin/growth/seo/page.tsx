import { fetchSeoPages, fetchAgencyKeywords, fetchBacklinks } from "@/app/admin/growth/actions";
import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";
import { ArrowLeft, Search, Link as LinkIcon, FileText, BarChart } from "lucide-react";
import StrategyInputPanel from "@/components/admin/growth/StrategyInputPanel";

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

  const statusBadge = (s: string) => {
    switch (s) {
      case 'ranking': return <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 uppercase">Ranking</span>;
      case 'optimized': return <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200 uppercase">Optimized</span>;
      case 'exists_not_optimized': return <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200 uppercase">Needs SEO</span>;
      default: return <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-200 uppercase">Not Created</span>;
    }
  };

  return (
    <div className="min-h-full bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <Link href="/admin/growth" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Agency Growth
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-slate-800 text-white shadow-sm border border-slate-700">
                <Search className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Website & SEO</h1>
            </div>
            
            <Link 
              href="/admin/marketing" 
              className="text-sm font-semibold text-[#42CA80] hover:text-[#38b571] transition-colors"
            >
              Go to Agency Marketing Hub &rarr;
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section 1: Target Keywords */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">Target Keywords</h3>
              </div>
              <span className="text-xs font-bold text-slate-400">{keywords?.length || 0} tracking</span>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100">
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Keyword</th>
                    <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Vol</th>
                    <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Pos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {keywords?.map((k: any) => (
                    <tr key={k.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3 font-semibold text-slate-900 text-sm">{k.keyword}</td>
                      <td className="px-6 py-3 text-right font-mono text-sm text-slate-600">{k.search_volume || '—'}</td>
                      <td className="px-6 py-3 text-right">
                        <span className={`inline-flex items-center justify-center min-w-[32px] rounded font-mono text-sm font-bold px-1.5 py-0.5 ${k.current_position <= 3 ? 'bg-emerald-100 text-emerald-800' : k.current_position <= 10 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
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
          </section>

          {/* Section 2: Pages Tracker */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">Pages Tracker</h3>
              </div>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100">
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Page URL</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Target KW</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pages?.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3">
                        <p className="font-semibold text-slate-900 text-sm">{p.page_name}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[150px]">{p.url}</p>
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
          </section>

          {/* Section 3: Traffic Log */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <BarChart className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">Traffic Log (Monthly)</h3>
              </div>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100">
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Month</th>
                    <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Organic</th>
                    <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Total</th>
                    <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">New Users</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {traffic?.map((t: any) => (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors border-l-2 border-transparent hover:border-[#42CA80]">
                      <td className="px-6 py-3 font-semibold text-slate-900 text-sm">
                        {new Date(t.snapshot_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-sm font-bold text-[#42CA80]">{t.organic_sessions?.toLocaleString()}</td>
                      <td className="px-6 py-3 text-right font-mono text-sm text-slate-700">{t.total_sessions?.toLocaleString()}</td>
                      <td className="px-6 py-3 text-right font-mono text-sm text-slate-600">{t.new_users?.toLocaleString()}</td>
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
          </section>

          {/* Section 4: Backlink Log */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">Backlink Log</h3>
              </div>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100">
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Domain</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Anchor</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">DA</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {backlinks?.map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3">
                        <p className="font-semibold text-slate-900 text-sm truncate max-w-[150px]" title={b.source_domain}>{b.source_domain}</p>
                        <p className="text-[10px] text-slate-400">
                          {b.acquired_date ? new Date(b.acquired_date).toLocaleDateString() : ''}
                        </p>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-600 truncate max-w-[120px]">{b.anchor_text}</td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center justify-center min-w-[28px] rounded font-mono text-sm font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700">
                          {b.domain_authority || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {b.status === 'active' ? (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Active</span>
                        ) : (
                          <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">Lost</span>
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
          </section>
        </div>

        {/* Section 5: Strategy Panel placeholder */}
        <StrategyInputPanel />

      </div>
    </div>
  );
}
