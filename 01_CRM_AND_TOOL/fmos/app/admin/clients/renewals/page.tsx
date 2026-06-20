import type { Metadata } from "next";
import Link from "next/link";
import { createServerClientWithCookies } from "@/lib/supabase-server";
import {
  RenewalTable,
  UpsellTable,
} from "@/components/admin/renewals/RenewalAndUpsellTables";
import { ArrowLeft, CalendarClock, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Renewals & Upsells — FortuneMarq",
  description: "Track upcoming renewals and upsell opportunities",
};

export default async function RenewalsPage() {
  const supabase = await createServerClientWithCookies();

  // Upcoming renewals (active, next 60 days)
  const now = new Date();
  const sixtyDaysLater = new Date(now.getTime() + 60 * 86400000)
    .toISOString()
    .split("T")[0];
  const todayStr = now.toISOString().split("T")[0];

  const { data: renewalClients } = await supabase
    .from("clients")
    .select(
      "id, business_name, niche, services, services_active, monthly_value, renewal_date, health_score, status, start_date, last_upsell_attempt, phone"
    )
    .eq("status", "active")
    .not("renewal_date", "is", null)
    .lte("renewal_date", sixtyDaysLater)
    .order("renewal_date", { ascending: true });

  // Upsell opportunities: active 60+ days, health >= 4, not on all services
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000)
    .toISOString()
    .split("T")[0];

  const { data: upsellClients } = await supabase
    .from("clients")
    .select(
      "id, business_name, niche, services, services_active, monthly_value, renewal_date, health_score, status, start_date, last_upsell_attempt, phone"
    )
    .eq("status", "active")
    .gte("health_score", 4)
    .lte("start_date", sixtyDaysAgo);

  // Filter: not on all 7 services
  const allServices = [
    "website",
    "seo",
    "local_seo",
    "meta_ads",
    "google_ads",
    "smm",
    "whatsapp",
  ];
  const filteredRenewal = (renewalClients ?? []).map(c => ({
    ...c,
    monthly_value: c.monthly_value ?? 0,
    health_score: c.health_score ?? 0,
    status: c.status as any
  }));

  const filteredUpsell = (upsellClients ?? []).filter(
    (c: { services: string[] | null }) => {
      const svc = c.services ?? [];
      return svc.length < allServices.length;
    }
  ).map(c => ({
    ...c,
    monthly_value: c.monthly_value ?? 0,
    health_score: c.health_score ?? 0,
    status: c.status as any
  }));

  return (
    <div className="min-h-full bg-canvas px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <Link
            href="/admin/clients"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Clients
          </Link>
          <PageHeader
            title="Renewals & Upsells"
            subtitle="Never miss a renewal. Identify upsell opportunities."
          />
        </div>

        {/* Section 1: Upcoming Renewals */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="h-5 w-5 text-danger" />
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Upcoming Renewals
            </h2>
            <span className="text-xs font-medium text-slate-400">
              (next 60 days)
            </span>
          </div>
          <RenewalTable clients={filteredRenewal as any[]} />
        </div>

        {/* Section 2: Upsell Opportunities */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-brand-deep" />
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Upsell Opportunities
            </h2>
            <span className="text-xs font-medium text-slate-400">
              (active 60+ days, health 4+, not on all services)
            </span>
          </div>
          <UpsellTable clients={filteredUpsell as any[]} />
        </div>
      </div>
    </div>
  );
}
