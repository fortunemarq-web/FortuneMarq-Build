import { fetchContentPieces } from "@/app/admin/growth/actions";
import Link from "next/link";
import { ArrowLeft, Facebook } from "lucide-react";
import ContentCalendar from "@/components/admin/growth/ContentCalendar";
import ContentKanbanBoard from "@/components/admin/growth/ContentKanbanBoard";
import StrategyInputPanel from "@/components/admin/growth/StrategyInputPanel";

export const metadata = {
  title: "Facebook Tracker — FortuneMarq",
};

const FB_TYPES = [
  { id: "post", label: "Post" },
  { id: "reel", label: "Reel" },
  { id: "image", label: "Image" },
  { id: "event", label: "Event" },
];

export default async function FacebookTrackerPage() {
  const pieces = await fetchContentPieces("facebook");

  // Real metrics from content_pieces; follower count needs a Facebook API we don't have.
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
    { label: "Page Engagement", value: avgEng != null ? `${avgEng.toFixed(1)}%` : "—" },
  ];

  return (
    <div className="min-h-full bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <Link href="/admin/growth" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Agency Growth
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-[#1877F2] text-white shadow-sm">
                <Facebook className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Facebook Tracker</h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white rounded-lg border border-slate-200 px-4 py-2 shadow-sm flex flex-col min-w-[120px]">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</span>
                  <span className="text-lg font-mono font-bold text-slate-900">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <section>
          <ContentCalendar channel="facebook" initialPieces={pieces} availableTypes={FB_TYPES} />
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Content Pipeline</h2>
          </div>
          <ContentKanbanBoard channel="facebook" initialPieces={pieces} availableTypes={FB_TYPES} />
        </section>

        <StrategyInputPanel destination="agency_growth.facebook" />
      </div>
    </div>
  );
}
