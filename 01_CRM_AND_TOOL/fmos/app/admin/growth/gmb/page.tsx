import { fetchContentPieces, fetchGmbChecklist, fetchGmbSnapshots, fetchReviewRequests } from "@/app/admin/growth/actions";
import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";
import { ArrowLeft, MapPin, Eye, Map, Phone, MousePointerClick, Image as ImageIcon } from "lucide-react";
import ContentCalendar from "@/components/admin/growth/ContentCalendar";
import GMBChecklist from "@/components/admin/growth/GMBChecklist";
import ReviewRequestsTable from "@/components/admin/growth/ReviewRequestsTable";

export const metadata = {
  title: "GMB Manager — FortuneMarq",
};

const GMB_TYPES = [
  { id: "update", label: "What's New", icon: "📢" },
  { id: "offer", label: "Offer", icon: "🏷️" },
  { id: "event", label: "Event", icon: "📅" },
  { id: "product", label: "Product", icon: "📦" },
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
    { label: "Profile Views", value: currentSnapshot.profile_views, icon: Eye, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Direction Requests", value: currentSnapshot.direction_requests, icon: Map, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Calls from GMB", value: currentSnapshot.calls, icon: Phone, color: "text-[#42CA80]", bg: "bg-emerald-50" },
    { label: "Website Clicks", value: currentSnapshot.website_clicks, icon: MousePointerClick, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Photo Views", value: currentSnapshot.photo_views, icon: ImageIcon, color: "text-amber-500", bg: "bg-amber-50" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <Link href="/admin/growth" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Agency Growth
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-tr from-green-500 to-emerald-700 text-white shadow-sm border border-emerald-600">
                <MapPin className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Google My Business</h1>
            </div>
            
            <button className="rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
              Update Metrics
            </button>
          </div>
        </div>

        {/* Section 1: Performance */}
        <section>
          <div className="flex items-center justify-between mb-4 mt-2">
            <h2 className="text-lg font-bold text-slate-900">Performance Metrics</h2>
            <span className="text-xs font-semibold text-slate-400">Current Month Snapshot</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {metrics.map(m => (
              <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm relative overflow-hidden group">
                <div className={`absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110`}>
                  <m.icon className={`h-12 w-12 ${m.color}`} />
                </div>
                <div className={`p-2 rounded-lg inline-flex mb-3 ${m.bg}`}>
                  <m.icon className={`h-4 w-4 ${m.color}`} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{m.label}</p>
                <p className="text-2xl font-mono font-bold text-slate-900">{m.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sections 2 & 3: Calendar and Checklist side by side on large screens */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Content Calendar</h2>
            <ContentCalendar channel="gmb" initialPieces={pieces} availableTypes={GMB_TYPES} />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Checklist</h2>
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
