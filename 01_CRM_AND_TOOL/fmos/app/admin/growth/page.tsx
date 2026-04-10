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
  CheckCircle2,
  Circle
} from "lucide-react";
import OrganicTrendChart from "@/components/admin/growth/OrganicTrendChart";
import CityOverviewTable from "@/components/admin/growth/CityOverviewTable";
import ActiveCampaignsTable from "@/components/admin/growth/ActiveCampaignsTable";

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
    .eq("tag", "agency_growth")
    .neq("status", "completed")
    .order("due_date", { ascending: true })
    .limit(10);

  // 2. Mock/Fetch High-Level Stats for the Header
  const headerStats = [
    { label: "Instagram Followers", value: "1,245", change: 5.2, positive: true },
    { label: "LinkedIn Followers", value: "3,892", change: 12.4, positive: true },
    { label: "Facebook Followers", value: "854", change: -1.2, positive: false },
    { label: "GMB Views (MTD)", value: "12,450", change: 18.5, positive: true },
    { label: "Website Sessions (MTD)", value: "4,210", change: 8.7, positive: true },
  ];

  const platforms = [
    { name: "Instagram", icon: Instagram, metric: "1,245 followers", lastPost: "2 days ago", postsThisMonth: 8, href: "/admin/growth/instagram" },
    { name: "LinkedIn", icon: Linkedin, metric: "3,892 followers", lastPost: "1 day ago", postsThisMonth: 12, href: "/admin/growth/linkedin" },
    { name: "Facebook", icon: Facebook, metric: "854 followers", lastPost: "5 days ago", postsThisMonth: 4, href: "/admin/growth/facebook" },
    { name: "Google My Business", icon: MapPin, metric: "12,450 views", lastPost: "3 days ago", postsThisMonth: 5, href: "/admin/growth/gmb" },
    { name: "Website/SEO", icon: Search, metric: "24 top 10 keywords", lastPost: "Updated today", postsThisMonth: 2, href: "/admin/growth/seo" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
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
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold font-mono text-slate-900">{stat.value}</p>
                <div className={`flex items-center text-xs font-bold ${stat.positive ? 'text-emerald-600' : 'text-red-500'}`}>
                  {stat.positive ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                  {stat.change}%
                </div>
              </div>
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
                
                {(!pendingTasks || pendingTasks.length === 0) ? (
                  <div className="text-center py-12 m-auto">
                    <CheckCircle2 className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-500">All marketing tasks complete!</p>
                  </div>
                ) : (
                  <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                    {pendingTasks.map((task: any) => (
                      <label key={task.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors group">
                        <input type="checkbox" className="mt-1 flex-shrink-0 appearance-none h-4 w-4 rounded-full border-2 border-slate-300 checked:bg-[#42CA80] checked:border-[#42CA80] transition-all cursor-pointer" />
                        <div>
                          <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{task.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Due {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
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
