import { fetchContentPieces, fetchGmbChecklist, fetchGmbSnapshots, fetchReviewRequests } from "@/app/admin/growth/actions";
import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";
import { ArrowLeft, Eye, Map, Phone, MousePointerClick, Image as ImageIcon } from "lucide-react";
import ContentCalendar from "@/components/admin/growth/ContentCalendar";
import GMBChecklist from "@/components/admin/growth/GMBChecklist";
import ReviewRequestsTable from "@/components/admin/growth/ReviewRequestsTable";
import GmbUpdateMetricsButton from "@/components/admin/growth/GmbUpdateMetricsButton";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";

export const metadata = {
  title: "GMB Manager — FortuneMarq",
};

const GMB_TYPES = [
  { id: "update", label: "What's New" },
  { id: "offer", label: "Offer" },
  { id: "event", label: "Event" },
  { id: "product", label: "Product" },
];

export default async function GMBManagerPage() {
  const [pieces, checklist, snapshots, reviews] = await Promise.all([
    fetchContentPieces("gmb"),
    fetchGmbChecklist(),
    fetchGmbSnapshots(),
    fetchReviewRequests(),
  ]);

  const supabase = await createServerClientWithCookies();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, business_name, services")
    .eq("status", "active")
    .order("business_name");

  // Get current snapshot (this month) or empty
  const currentSnapshot = (snapshots[0] || {
    profile_views: 0, direction_requests: 0, calls: 0, website_clicks: 0, photo_views: 0
  }) as any;

  const metrics = [
    { label: "Profile Views", value: currentSnapshot.profile_views, icon: Eye },
    { label: "Direction Requests", value: currentSnapshot.direction_requests, icon: Map },
    { label: "Calls from GMB", value: currentSnapshot.calls, icon: Phone },
    { label: "Website Clicks", value: currentSnapshot.website_clicks, icon: MousePointerClick },
    { label: "Photo Views", value: currentSnapshot.photo_views, icon: ImageIcon },
  ];

  return (
    <div className="min-h-full bg-canvas px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <Link href="/admin/growth" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Agency Growth
          </Link>

          <PageHeader
            title="Google My Business"
            eyebrow="Agency Growth"
            actions={<GmbUpdateMetricsButton current={currentSnapshot} />}
          />
        </div>

        {/* Section 1: Performance */}
        <section>
          <div className="flex items-center justify-between mb-4 mt-2">
            <h2 className="font-display text-lg font-semibold text-slate-900">Performance Metrics</h2>
            <span className="text-xs font-semibold text-slate-400">Current Month Snapshot</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {metrics.map(m => (
              <StatCard key={m.label} label={m.label} value={m.value.toLocaleString()} icon={m.icon} />
            ))}
          </div>
        </section>

        {/* Sections 2 & 3: Calendar and Checklist side by side on large screens */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-display text-lg font-semibold text-slate-900">Content Calendar</h2>
            <ContentCalendar channel="gmb" initialPieces={pieces} availableTypes={GMB_TYPES} />
          </div>

          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-slate-900">Checklist</h2>
            <div className="h-[calc(100%-2.5rem)]">
              <GMBChecklist items={checklist} />
            </div>
          </div>
        </section>

        {/* Section 4: Review Request Tracker */}
        <section>
          <ReviewRequestsTable requests={reviews} activeClients={(clients || []) as any} />
        </section>

      </div>
    </div>
  );
}
