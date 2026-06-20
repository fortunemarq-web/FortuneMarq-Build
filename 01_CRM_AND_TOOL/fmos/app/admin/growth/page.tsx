import type { Metadata } from "next";
import Link from "next/link";
import { createServerClientWithCookies } from "@/lib/supabase-server";
import {
  Instagram,
  Linkedin,
  Facebook,
  MapPin,
  Search,
} from "lucide-react";
import OrganicTrendChart from "@/components/admin/growth/OrganicTrendChart";
import CityOverviewTable from "@/components/admin/growth/CityOverviewTable";
import ActiveCampaignsTable from "@/components/admin/growth/ActiveCampaignsTable";
import GrowthTaskChecklist from "@/components/admin/growth/GrowthTaskChecklist";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    <div className="min-h-full bg-canvas px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header Setup */}
        <PageHeader
          eyebrow="Growth"
          title="Agency Growth"
          subtitle="Track and accelerate FortuneMarq's organic and acquisition growth."
          actions={
            <div className="inline-flex rounded-lg bg-slate-100 p-1">
              <Link
                href="?tab=organic"
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  currentTab === "organic"
                    ? "bg-surface text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Organic Presence
              </Link>
              <Link
                href="?tab=acquisition"
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  currentTab === "acquisition"
                    ? "bg-surface text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Client Acquisition
              </Link>
            </div>
          }
        />

        {/* Top Stats Row (Always visible) */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {headerStats.map((stat, i) => (
            <StatCard key={i} label={stat.label} value={stat.value} />
          ))}
        </div>

        {currentTab === "organic" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <OrganicTrendChart />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {platforms.map((p, i) => (
                  <Card key={i} className="flex flex-col p-5 transition-colors hover:border-brand-line">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg border border-line bg-slate-50 p-2">
                          <p.icon className="h-5 w-5 text-slate-600" />
                        </div>
                        <h3 className="font-display font-semibold text-slate-900">{p.name}</h3>
                      </div>
                    </div>

                    <div className="mb-4 mt-auto grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Current</p>
                        <p className="text-sm font-medium text-slate-700">{p.metric}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Output (MTD)</p>
                        <p className="text-sm font-medium tabular-nums text-slate-700">{p.postsThisMonth} posts</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-line pt-4">
                      <p className="text-xs text-slate-400">Last: {p.lastPost}</p>
                      <Link href={p.href} className="text-xs font-semibold text-brand-deep hover:underline">
                        Manage &rarr;
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <Card className="flex min-h-[500px] flex-col overflow-hidden p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold text-slate-900">Pending Tasks</h3>
                  <Badge tone="neutral" size="sm">This Week</Badge>
                </div>

                <GrowthTaskChecklist initialTasks={(pendingTasks || []) as any} />
              </Card>
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
