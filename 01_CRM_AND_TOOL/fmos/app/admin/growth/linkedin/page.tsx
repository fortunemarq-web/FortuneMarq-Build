import { fetchContentPieces } from "@/app/admin/growth/actions";
import Link from "next/link";
import { ArrowLeft, Linkedin } from "lucide-react";
import ContentCalendar from "@/components/admin/growth/ContentCalendar";
import ContentKanbanBoard from "@/components/admin/growth/ContentKanbanBoard";
import StrategyInputPanel from "@/components/admin/growth/StrategyInputPanel";

export const metadata = {
  title: "LinkedIn Tracker — FortuneMarq",
};

const LNK_TYPES = [
  { id: "article", label: "Article" },
  { id: "post", label: "Post" },
  { id: "carousel", label: "Carousel" },
  { id: "poll", label: "Poll" },
];

export default async function LinkedInTrackerPage() {
  const pieces = await fetchContentPieces("linkedin");

  const stats = [
    { label: "Followers", value: "3,892" },
    { label: "Posts This Month", value: "12" },
    { label: "Profile Visits", value: "481" },
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
              <div className="p-3 rounded-xl bg-[#0077B5] text-white shadow-sm">
                <Linkedin className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">LinkedIn Tracker</h1>
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
          <ContentCalendar channel="linkedin" initialPieces={pieces} availableTypes={LNK_TYPES} />
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Content Pipeline</h2>
          </div>
          <ContentKanbanBoard channel="linkedin" initialPieces={pieces} availableTypes={LNK_TYPES} />
        </section>

        {/* ... Performance log omitted for brevity but keeping StrategyInputPanel ... */}

        <StrategyInputPanel />
      </div>
    </div>
  );
}
