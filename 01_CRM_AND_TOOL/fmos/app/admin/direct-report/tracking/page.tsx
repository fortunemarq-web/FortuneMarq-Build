import { createServerClientWithCookies } from "@/lib/supabase-server";
import { BarChart2 } from "lucide-react";
import TrackingClient from "./tracking-client";

export const metadata = {
  title: "Direct Report Tracking | FortuneMarq Admin",
  description: "Delivery, read, and engagement tracking for Direct Report sends.",
};

export default async function DirectReportTrackingPage() {
  const supabase = await createServerClientWithCookies();

  // Fetch all outbound direct_report logs joined with lead city/industry
  const { data: rawLogs } = await supabase
    .from("whatsapp_logs")
    .select("id, lead_id, phone, template_id, delivery_status, sent_at, outcome, message_sent")
    .eq("direction", "outbound")
    .like("template_id", "direct_report%")
    .order("sent_at", { ascending: false })
    .limit(2000);

  const logs = (rawLogs || []) as {
    id: string;
    lead_id: string | null;
    phone: string | null;
    template_id: string | null;
    delivery_status: string | null;
    sent_at: string | null;
    outcome: string | null;
    message_sent: string | null;
  }[];

  // Fetch lead city+industry for enrichment
  const leadIds = [...new Set(logs.map((l) => l.lead_id).filter(Boolean))] as string[];
  let leadMap: Record<string, { city: string; industry: string; company_name: string }> = {};
  if (leadIds.length > 0) {
    const { data: leads } = await supabase
      .from("leads")
      .select("id, city, industry, company_name")
      .in("id", leadIds);
    for (const l of leads || []) {
      leadMap[l.id] = { city: l.city ?? "", industry: l.industry ?? "", company_name: l.company_name ?? "" };
    }
  }

  const enriched = logs.map((log) => ({
    ...log,
    city: (log.lead_id && leadMap[log.lead_id]?.city) || null,
    industry: (log.lead_id && leadMap[log.lead_id]?.industry) || null,
    company_name: (log.lead_id && leadMap[log.lead_id]?.company_name) || null,
  }));

  return (
    <div className="min-h-full bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-brand-deep text-white shadow-sm">
            <BarChart2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Direct Report Tracking</h1>
            <p className="text-slate-500 text-sm">
              Sent / delivered / read / clicked per city and niche. Updated as Meta webhooks arrive.
            </p>
          </div>
        </div>
        <TrackingClient logs={enriched} />
      </div>
    </div>
  );
}
