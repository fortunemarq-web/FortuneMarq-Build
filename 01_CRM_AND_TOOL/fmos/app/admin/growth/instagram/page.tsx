import { fetchContentPieces } from "@/app/admin/growth/actions";
import Link from "next/link";
import { ArrowLeft, Instagram } from "lucide-react";
import ContentCalendar from "@/components/admin/growth/ContentCalendar";
import ContentKanbanBoard from "@/components/admin/growth/ContentKanbanBoard";
import StrategyInputPanel from "@/components/admin/growth/StrategyInputPanel";

export const metadata = {
  title: "Instagram Tracker — FortuneMarq",
};

const INS_TYPES = [
  { id: "reel", label: "Reel" },
  { id: "carousel", label: "Carousel" },
  { id: "static", label: "Static Image" },
  { id: "story", label: "Story" },
];

export default async function InstagramTrackerPage() {
  const pieces = await fetchContentPieces("instagram");

  // Real metrics derived from content_pieces. Follower count needs an Instagram API
  // integration we don't have yet, so it stays an honest "—".
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const publishedThisMonth = (pieces as any[]).filter(
    (p) => p.status === "published" && p.published_date && new Date(p.published_date) >= monthStart
  );
  const withEng = publishedThisMonth.filter((p) => p.engagement_rate != null);
  const avgEng = withEng.length
    ? withEng.reduce((s, p) => s + Number(p.engagement_rate || 0), 0) / withEng.length
    : null;
  const stats = [
    { label: "Followers", value: "—" },
    { label: "Posts This Month", value: String(publishedThisMonth.length) },
    { label: "Engagement Rate", value: avgEng != null ? `${avgEng.toFixed(1)}%` : "—" },
  ];

  return (
    <div className="min-h-full bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div>
          <Link
            href="/admin/growth"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Agency Growth
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 text-white shadow-sm">
                <Instagram className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Instagram Tracker
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {stats.map((stat, i) => (
                <div key={i} className="bg-surface rounded-lg border border-slate-200 px-4 py-2 shadow-sm flex flex-col min-w-[120px]">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</span>
                  <span className="text-lg font-mono font-bold text-slate-900">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 1: Content Calendar */}
        <section>
          <ContentCalendar channel="instagram" initialPieces={pieces} availableTypes={INS_TYPES} />
        </section>

        {/* Section 2: Content Pipeline */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Content Pipeline</h2>
            <p className="text-sm text-slate-500 mt-1">Drag and drop posts to update their status</p>
          </div>
          <ContentKanbanBoard channel="instagram" initialPieces={pieces} availableTypes={INS_TYPES} />
        </section>

        {/* Section 3: Performance Log */}
        <section className="bg-surface rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">
              Performance Log (Published)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Type</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Topic</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Reach</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Likes</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Comments</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Eng %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-medium">
                {pieces.filter(p => p.status === 'published').length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-normal">
                      No published posts tracked yet. Check back soon.
                    </td>
                  </tr>
                ) : (
                  pieces.filter(p => p.status === 'published')
                   .sort((a,b) => new Date(b.published_date || 0).getTime() - new Date(a.published_date || 0).getTime())
                   .map(p => {
                    const type = INS_TYPES.find(t => t.id === p.content_type) || { label: "Post" };
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                          {p.published_date ? new Date(p.published_date).toLocaleDateString("en-IN", { day:'2-digit', month:'short', year:'numeric' }) : 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                            {type.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-900 truncate max-w-[200px]">{p.title}</td>
                        <td className="px-4 py-3 text-right text-slate-600 font-mono">{p.reach?.toLocaleString() || 0}</td>
                        <td className="px-4 py-3 text-right text-slate-600 font-mono">{p.likes?.toLocaleString() || 0}</td>
                        <td className="px-4 py-3 text-right text-slate-600 font-mono">{p.comments?.toLocaleString() || 0}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600">{p.engagement_rate}%</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4: Strategy Input Panel */}
        <StrategyInputPanel destination="agency_growth.instagram" />
        
      </div>
    </div>
  );
}
