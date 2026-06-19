import type { Metadata } from "next";
import Link from "next/link";
import { createServerClientWithCookies } from "@/lib/supabase-server";
import {
  TrendingUp,
  Instagram,
  Linkedin,
  Facebook,
  MapPin,
  Search,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Circle
} from "lucide-react";
import OrganicTrendChart from "@/components/admin/growth/OrganicTrendChart";
import CityOverviewTable from "@/components/admin/growth/CityOverviewTable";
import ActiveCampaignsTable from "@/components/admin/growth/ActiveCampaignsTable";
import GrowthTaskChecklist from "@/components/admin/growth/GrowthTaskChecklist";

export const metadata: Metadata = {
  title: "Agency Growth — FortuneMarq",
};

export default async function AgencyGrowthHub({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const resolvedParams = await searchParams;
  const currentTab = resolvedParams.tab || "organic";
  const supabase = await createServerClientWithCookies();

  // 1. Fetch Organic Stats (Tasks)
  const { data: pendingTasks } = await supabase
    .from("tasks")
    .select("id, title, status, due_date")
    // tasks.tags is a text[] — match membership, not a scalar `tag` column.
    .contains("tags", ["agency_growth"])
    .neq("status", "completed")
    .order("due_date", { ascending: true })
    .limit(10);

  // 2. Real per-channel publishing stats from content_pieces.
  //    Follower counts have no data source yet (no social API integration)
  //    — shown as "—" instead of fabricated numbers.
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const { data: pieces } = await supabase
    .from("content_pieces")
    .select("channel, status, published_date");

  const channelStats: Record<string, { mtd: number; last: string | null }> = {};
  ((pieces as any[]) || []).forEach((p: any) => {
    if (p.status !== "published" || !p.published_date) return;
    const c = p.channel;
    if (!channelStats[c]) channelStats[c] = { mtd: 0, last: null };
    if (p.published_date >= monthStart) channelStats[c].mtd++;
    if (!channelStats[c].last || p.published_date > channelStats[c].last!) channelStats[c].last = p.published_date;
  });

  const lastPostLabel = (c: string) => {
    const last = channelStats[c]?.last;
    if (!last) return "No posts yet";
    const days = Math.floor((Date.now() - new Date(last).getTime()) / 86400000);
    return days === 0 ? "Today" : days === 1 ? "1 day ago" : `${days} days ago`;
  };

  const totalPublishedMtd = Object.values(channelStats).reduce((s, c) => s + c.mtd, 0);
  const headerStats = [
    { label: "Posts Published (MTD)", value: String(totalPublishedMtd) },
    { label: "Instagram Posts (MTD)", value: String(channelStats["instagram"]?.mtd ?? 0) },
    { label: "LinkedIn Posts (MTD)", value: String(channelStats["linkedin"]?.mtd ?? 0) },
    { label: "Facebook Posts (MTD)", value: String(channelStats["facebook"]?.mtd ?? 0) },
    { label: "GMB Posts (MTD)", value: String(channelStats["gmb"]?.mtd ?? 0) },
  ];

  const platforms = [
    { name: "Instagram", icon: Instagram, metric: "Followers: — (not connected)", lastPost: lastPostLabel("instagram"), postsThisMonth: channelStats["instagram"]?.mtd ?? 0, href: "/admin/growth/instagram" },
    { name: "LinkedIn", icon: Linkedin, metric: "Followers: — (not connected)", lastPost: lastPostLabel("linkedin"), postsThisMonth: channelStats["linkedin"]?.mtd ?? 0, href: "/admin/growth/linkedin" },
    { name: "Facebook", icon: Facebook, metric: "Followers: — (not connected)", lastPost: lastPostLabel("facebook"), postsThisMonth: channelStats["facebook"]?.mtd ?? 0, href: "/admin/growth/facebook" },
    { name: "Google My Business", icon: MapPin, metric: "Views: — (not connected)", lastPost: lastPostLabel("gmb"), postsThisMonth: channelStats["gmb"]?.mtd ?? 0, href: "/admin/growth/gmb" },
    { name: "Website/SEO", icon: Search, metric: "Rank tracking in SEO tab", lastPost: lastPostLabel("seo"), postsThisMonth: channelStats["seo"]?.mtd ?? 0, href: "/admin/growth/seo" },
  ];

  return (
    <div className="min-h-full bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header Setup */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-[#42CA80]" />
              Agency Growth
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Track and accelerate FortuneMarq's organic and acquisition growth.
            </p>
          </div>
          
          <div className="inline-flex rounded-xl bg-slate-200/50 p-1 mt-4 md:mt-0">
            <Link
              href="?tab=organic"
              className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-all ${
                currentTab === "organic"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              Organic Presence
            </Link>
            <Link
              href="?tab=acquisition"
              className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-all ${
                currentTab === "acquisition"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              Client Acquisition
            </Link>
          </div>
        </div>

        {/* Top Stats Row (Always visible) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {headerStats.map((stat, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5" style={{ borderTop: "3px solid #42CA80" }}>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold font-mono text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {currentTab === "organic" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <OrganicTrendChart />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {platforms.map((p, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col hover:border-[#42CA80]/50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                          <p.icon className="h-5 w-5 text-slate-700" />
                        </div>
                        <h3 className="font-bold text-slate-900">{p.name}</h3>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4 mt-auto">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Current</p>
                        <p className="text-sm font-semibold text-slate-700">{p.metric}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Output (MTD)</p>
                        <p className="text-sm font-semibold text-slate-700">{p.postsThisMonth} posts</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                      <p className="text-xs text-slate-400">Last: {p.lastPost}</p>
                      <Link href={p.href} className="text-xs font-semibold text-[#42CA80] hover:text-[#38b571]">
                        Manage &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden flex flex-col min-h-[500px]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">Pending Tasks</h3>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    This Week
                  </span>
                </div>
                
                <GrowthTaskChecklist initialTasks={(pendingTasks || []) as any} />
              </div>
            </div>
          </div>
        )}

        {currentTab === "acquisition" && (
          <div className="space-y-8">
            <CityOverviewTable />
            <ActiveCampaignsTable />
          </div>
        )}
      </div>
    </div>
  );
}
