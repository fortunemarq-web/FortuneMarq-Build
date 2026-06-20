import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";
import { Activity, PauseCircle } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export default async function ActiveCampaignsTable() {
  const supabase = await createServerClientWithCookies();
  const { data: campaigns } = await supabase
    .from("ad_campaigns")
    .select("*")
    .order("status", { ascending: true }); // Active first if status is 'active'

  return (
    <Card className="overflow-hidden flex flex-col">
      <CardHeader>
        <CardTitle>Active Campaigns</CardTitle>
        <Link
          href="/admin/marketing"
          className="text-xs font-semibold text-brand-deep hover:text-brand-deeper transition-colors"
        >
          View All in Marketing &rarr;
        </Link>
      </CardHeader>

      <div className="overflow-x-auto">
        <Table className="min-w-[900px]">
          <THead>
            <TR className="hover:bg-transparent">
              <TH>Campaign Name</TH>
              <TH>Platform</TH>
              <TH>Status</TH>
              <TH>Spend (MTD)</TH>
              <TH>Leads</TH>
              <TH>CPL</TH>
            </TR>
          </THead>
          <TBody>
            {!campaigns || campaigns.length === 0 ? (
              <TR className="hover:bg-transparent">
                <TD colSpan={6} className="px-6 py-8 text-center text-sm text-slate-400">
                  No campaigns active right now.
                </TD>
              </TR>
            ) : (
              campaigns.map((c: any) => (
                <TR key={c.id}>
                  <TD className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-900">
                      {c.campaign_name}
                    </span>
                  </TD>
                  <TD className="px-6 py-4">
                    <Badge tone="neutral" variant="outline" size="sm" className="uppercase">
                      {c.platform}
                    </Badge>
                  </TD>
                  <TD className="px-6 py-4">
                    {c.status === "active" ? (
                      <Badge tone="brand" size="sm">
                        <Activity className="h-3 w-3" /> Active
                      </Badge>
                    ) : (
                      <Badge tone="neutral" size="sm">
                        <PauseCircle className="h-3 w-3" /> Paused
                      </Badge>
                    )}
                  </TD>
                  <TD className="px-6 py-4">
                    <span className="text-sm font-semibold tabular-nums text-slate-700">
                      ₹{c.spend_mtd?.toLocaleString("en-IN") || 0}
                    </span>
                  </TD>
                  <TD className="px-6 py-4">
                    <span className="text-sm font-semibold tabular-nums text-slate-700">
                      {c.leads_generated || 0}
                    </span>
                  </TD>
                  <TD className="px-6 py-4">
                    <span className="text-sm font-semibold tabular-nums text-brand-deep">
                      ₹{c.cpl?.toLocaleString("en-IN") || 0}
                    </span>
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </div>
    </Card>
  );
}
