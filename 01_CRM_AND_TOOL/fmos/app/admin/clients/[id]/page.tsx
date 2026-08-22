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
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
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

  // Delivery plan: milestones + nested tasks across this client's projects (4.5)
  const projectIds = (projects as any[]).map((p) => p.id);
  let milestones: any[] = [];
  let deliveryTasks: any[] = [];
  if (projectIds.length > 0) {
    const supabaseAny: any = supabase;
    const [{ data: ms }, { data: tk }] = await Promise.all([
      supabaseAny
        .from("project_milestones")
        .select("*")
        .in("project_id", projectIds)
        .order("order_index", { ascending: true }),
      supabaseAny
        .from("tasks")
        .select("id, title, status, due_date, milestone_id, assigned_to, description, drive_raw_url, drive_edited_url, drive_final_url, assigned_profile:profiles!tasks_assigned_to_fkey(full_name)")
        .in("project_id", projectIds)
        .not("milestone_id", "is", null),
    ]);
    milestones = ms ?? [];
    deliveryTasks = tk ?? [];
  }

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

  // Every status maps to one of the five tones — no per-status rainbow.
  const STATUS_TONE: Record<string, Tone> = {
    active: "brand",
    onboarding: "info",
    paused: "warning",
    churned: "danger",
  };

  return (
    <div className="min-h-full bg-canvas px-4 py-6">
      <div className="mx-auto max-w-6xl">
        {/* Back */}
        <Link
          href="/admin/clients"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Link>

        {/* Header Card */}
        <Card className="mb-6 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              {/* Name & Core Info */}
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-slate-900">
                  {client.business_name}
                </h1>
                <Badge tone={STATUS_TONE[client.status || ""] ?? "neutral"} size="sm" className="uppercase">
                  {client.status}
                </Badge>
                {client.package_tier && (
                  <Badge tone="neutral" variant="outline" size="sm" className="uppercase">
                    {client.package_tier}
                  </Badge>
                )}
                {client.upsell_eligible && (
                  <Badge tone="warning" size="sm" className="uppercase" title="Flagged for upsell">
                    <Zap className="h-3 w-3" /> Upsell Opportunity
                  </Badge>
                )}
              </div>

              {/* Contact Row */}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                {client.owner_name && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    {client.owner_name}
                  </span>
                )}
                {client.phone && (
                  <a
                    href={`tel:${client.phone}`}
                    className="flex items-center gap-1.5 transition-colors hover:text-brand-deep"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {client.phone}
                  </a>
                )}
                {client.primary_email && (
                  <a
                    href={`mailto:${client.primary_email}`}
                    className="flex items-center gap-1.5 transition-colors hover:text-brand-deep"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {client.primary_email}
                  </a>
                )}
              </div>

              {/* Details Row */}
              <div className="mt-3 flex flex-wrap items-center gap-4">
                {client.city && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="h-3 w-3" />
                    {client.city}
                  </span>
                )}
                {client.niche && (
                  <Badge tone="neutral" variant="outline" size="sm" className="uppercase">
                    {client.niche}
                  </Badge>
                )}
                <HealthScoreStars score={client.health_score ?? 3} size="md" />
              </div>

              {/* Services & Metrics */}
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <ServicePills services={client.services_active || client.services} max={6} />
                <span className="text-sm font-semibold tabular-nums text-brand-deep">
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
        </Card>

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
              <ProjectsTab projects={projects} clientId={id} clientName={client.business_name} milestones={milestones} deliveryTasks={deliveryTasks} />
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
                clientPhone={client.phone}
              />
            ),
          }}
        />
      </div>
    </div>
  );
}
