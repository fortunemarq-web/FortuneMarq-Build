import Link from "next/link";
import { fetchAcquisitionTargets } from "@/app/admin/growth/actions";
import { createServerClientWithCookies } from "@/lib/supabase-server";
import { ArrowRight } from "lucide-react";
import AddCityModal from "@/components/admin/growth/add-city-modal";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

const CLOSED_STAGES = ["won", "lost", "dead", "not_interested"];

export default async function CityOverviewTable() {
  const targets = await fetchAcquisitionTargets();

  // Real per-city lead counts (no fabricated numbers)
  const supabase = await createServerClientWithCookies();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const { data: leads } = await supabase
    .from("leads")
    .select("city, outreach_stage, meeting_booked_at, last_activity_at");

  const leadStats: Record<string, { total: number; pipeline: number; meetings_mtd: number; won_mtd: number }> = {};
  (leads || []).forEach((l: any) => {
    const key = (l.city || "").trim().toLowerCase();
    if (!key) return;
    if (!leadStats[key]) leadStats[key] = { total: 0, pipeline: 0, meetings_mtd: 0, won_mtd: 0 };
    leadStats[key].total++;
    if (!CLOSED_STAGES.includes(l.outreach_stage || "")) leadStats[key].pipeline++;
    if (l.meeting_booked_at && l.meeting_booked_at >= monthStart) leadStats[key].meetings_mtd++;
    if (l.outreach_stage === "won" && l.last_activity_at && l.last_activity_at >= monthStart) leadStats[key].won_mtd++;
  });

  // Group acquisition targets by city
  const cityGroups = targets.reduce((acc: any, t) => {
    if (!acc[t.city]) {
      const stats = leadStats[(t.city || "").trim().toLowerCase()] || { total: 0, pipeline: 0, meetings_mtd: 0, won_mtd: 0 };
      acc[t.city] = {
        city: t.city,
        city_slug: t.city_slug,
        active_niches: 0,
        total_leads: stats.total,
        in_pipeline: stats.pipeline,
        meetings_mtd: stats.meetings_mtd,
        won_mtd: stats.won_mtd,
      };
    }
    if (t.is_active) acc[t.city].active_niches++;
    return acc;
  }, {});

  const rows = Object.values(cityGroups);

  return (
    <Card className="overflow-hidden flex flex-col">
      <CardHeader>
        <CardTitle>City Overview</CardTitle>
        <AddCityModal />
      </CardHeader>

      <div className="overflow-x-auto">
        <Table className="min-w-[800px]">
          <THead>
            <TR className="hover:bg-transparent">
              <TH>City</TH>
              <TH>Active Niches</TH>
              <TH>Total Leads</TH>
              <TH>In Pipeline</TH>
              <TH>Meetings (MTD)</TH>
              <TH>Won (MTD)</TH>
              <TH className="text-right"></TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((r: any) => (
              <TR key={r.city}>
                <TD className="px-6 py-4">
                  <Link href={`/admin/growth/acquisition/${r.city_slug}`} className="text-sm font-semibold text-slate-900 hover:text-brand-deep flex items-center gap-2">
                    {r.city}
                  </Link>
                </TD>
                <TD className="px-6 py-4">
                  <Badge tone="neutral" size="sm">{r.active_niches} niches</Badge>
                </TD>
                <TD className="px-6 py-4 text-sm font-semibold tabular-nums text-slate-700">{r.total_leads}</TD>
                <TD className="px-6 py-4 text-sm font-semibold tabular-nums text-warn">{r.in_pipeline}</TD>
                <TD className="px-6 py-4 text-sm font-semibold tabular-nums text-info">{r.meetings_mtd}</TD>
                <TD className="px-6 py-4 text-sm font-semibold tabular-nums text-brand-deep">{r.won_mtd}</TD>
                <TD className="px-6 py-4 text-right">
                  <Link href={`/admin/growth/acquisition/${r.city_slug}`} className="inline-flex items-center text-xs font-semibold text-brand-deep hover:text-brand-deeper">
                    Manage <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </TD>
              </TR>
            ))}
            {rows.length === 0 && (
              <TR className="hover:bg-transparent">
                <TD colSpan={8} className="px-6 py-8 text-center text-sm text-slate-400">
                  No cities found. Add one to get started.
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </div>
    </Card>
  );
}
