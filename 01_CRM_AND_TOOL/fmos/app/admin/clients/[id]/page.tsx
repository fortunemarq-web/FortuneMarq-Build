import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchClientById,
  fetchOnboardingItems,
  fetchClientAssets,
  fetchClientCallLogs,
  fetchClientProjects,
} from "@/app/admin/clients/actions";
import { createServerClientWithCookies } from "@/lib/supabase-server";
import ClientProfileTabs from "@/components/admin/clients/ClientProfileTabs";
import OverviewTab from "@/components/admin/clients/tabs/OverviewTab";
import OnboardingTab from "@/components/clients/onboarding-tab";
import AssetVaultTab from "@/components/admin/clients/tabs/AssetVaultTab";
import ProjectsTab from "@/components/admin/clients/tabs/ProjectsTab";
import FinanceTab from "@/components/admin/clients/tabs/FinanceTab";
import StrategyTab from "@/components/admin/clients/tabs/StrategyTab";
import { getInvoicesByClient } from "@/app/admin/finance/actions";
import CommunicationsTab from "@/components/admin/clients/tabs/CommunicationsTab";
import HealthScoreStars from "@/components/admin/clients/HealthScoreStars";
import ServicePills from "@/components/admin/clients/ServicePills";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Zap,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const client = await fetchClientById(id);
  return {
    title: client
      ? `${client.business_name} — FortuneMarq`
      : "Client Not Found",
  };
}

export default async function ClientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createServerClientWithCookies();
  // Parallel data fetching
  const [client, onboardingItems, assets, callLogs, projects, { data: onboardingTasks }, { data: assetVault }] =
    await Promise.all([
      fetchClientById(id),
      fetchOnboardingItems(id),
      fetchClientAssets(id),
      fetchClientCallLogs(id),
      fetchClientProjects(id),
      supabase.from("client_onboarding_tasks").select("*").eq("client_id", id).order("service_id"),
      supabase.from("client_asset_vault").select("*").eq("client_id", id).order("category"),
    ]);

  if (!client) notFound();

  // Fetch strategy data for Strategy tab
  const { fetchStrategyTeam, fetchClientStrategyRuns } = await import("@/app/admin/strategy/actions");
  const [team, clientStrategyRuns] = await Promise.all([
    fetchStrategyTeam(),
    fetchClientStrategyRuns(id),
  ]);

  // Fetch activity feed (recent actions for this client entity)
  const { data: activityFeed } = await supabase
    .from("activity_events")
    .select("id, title, body, created_at")
    .eq("entity_type", "client")
    .eq("entity_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Fetch Finance Data
  const invoices = await getInvoicesByClient(id);

  // Fetch WhatsApp logs via lead's phone
  let whatsappLogs: any[] = [];
  if (client.phone) {
    const supabaseAny: any = supabase;
    // WhatsApp sends are logged per-lead in whatsapp_logs; match leads by phone.
    const { data: phoneLeads } = await supabaseAny
      .from("leads")
      .select("id")
      .eq("phone", client.phone);
    if (phoneLeads?.length) {
      const { data: wlogs } = await supabaseAny
        .from("whatsapp_logs")
        .select("id, message_sent, sent_at")
        .in("lead_id", phoneLeads.map((l: any) => l.id))
        .order("sent_at", { ascending: false })
        .limit(20);
      whatsappLogs = (wlogs ?? []).map((w: any) => ({
        id: w.id,
        message_body: w.message_sent,
        sent_at: w.sent_at,
        template_name: null,
      }));
    }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: "bg-emerald-50 text-emerald-700 border-emerald-200",
      paused: "bg-amber-50 text-amber-700 border-amber-200",
      churned: "bg-red-50 text-red-700 border-red-200",
    };
    return map[status] ?? "bg-slate-50 text-slate-600 border-slate-200";
  };

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-6xl">
        {/* Back */}
        <Link
          href="/admin/clients"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Link>

        {/* Header Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6"
             style={{ borderTop: "3px solid #42CA80" }}>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              {/* Name & Core Info */}
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {client.business_name}
                </h1>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusBadge(
                    client.status || ""
                  )}`}
                >
                  {client.status}
                </span>
                {client.package_tier && (
                  <span className="rounded-full border border-indigo-200 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 uppercase tracking-wide">
                    {client.package_tier}
                  </span>
                )}
                {client.upsell_eligible && (
                  <span className="rounded-full border border-orange-200 px-2.5 py-0.5 text-[10px] font-bold text-orange-600 bg-orange-50 uppercase tracking-wide flex items-center gap-1" title="Flagged for upsell">
                    <Zap className="h-3 w-3" /> Upsell Opportunity
                  </span>
                )}
              </div>

              {/* Contact Row */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
                {client.owner_name && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    {client.owner_name}
                  </span>
                )}
                {client.phone && (
                  <a
                    href={`tel:${client.phone}`}
                    className="flex items-center gap-1.5 hover:text-[#42CA80] transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {client.phone}
                  </a>
                )}
                {client.primary_email && (
                  <a
                    href={`mailto:${client.primary_email}`}
                    className="flex items-center gap-1.5 hover:text-[#42CA80] transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {client.primary_email}
                  </a>
                )}
              </div>

              {/* Details Row */}
              <div className="flex flex-wrap items-center gap-4 mt-3">
                {client.city && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="h-3 w-3" />
                    {client.city}
                  </span>
                )}
                {client.niche && (
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                    {client.niche}
                  </span>
                )}
                <HealthScoreStars score={client.health_score ?? 3} size="md" />
              </div>

              {/* Services & Metrics */}
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <ServicePills services={client.services_active || client.services} max={6} />
                <span className="text-sm font-mono font-bold text-[#42CA80]">
                  ₹{(client.monthly_value ?? 0).toLocaleString("en-IN")}/mo
                </span>
                {client.start_date && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="h-3 w-3" />
                    Since{" "}
                    {new Date(client.start_date).toLocaleDateString("en-IN", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
                {client.renewal_date && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="h-3 w-3" />
                    Renews{" "}
                    {new Date(client.renewal_date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <ClientProfileTabs
          defaultTab="overview"
          children={{
            overview: (
              <OverviewTab
                client={client}
                projects={projects}
                activityFeed={activityFeed ?? []}
              />
            ),
            onboarding: (
              <OnboardingTab clientId={id} initialTasks={(onboardingTasks as any) ?? []} initialAssets={(assetVault as any) ?? []} isAdmin={true} />
            ),
            assets: (
              <AssetVaultTab assets={assets} clientId={id} />
            ),
            projects: (
              <ProjectsTab projects={projects} clientId={id} />
            ),
            finance: <FinanceTab clientId={id} invoices={invoices} />,
            strategy: (
              <StrategyTab
                clientId={id}
                client={client}
                team={team}
                strategyRuns={clientStrategyRuns}
              />
            ),
            communications: (
              <CommunicationsTab
                callLogs={callLogs}
                whatsappLogs={whatsappLogs}
                clientId={id}
              />
            ),
          }}
        />
      </div>
    </div>
  );
}
