import type { Metadata } from "next";
import { Suspense } from "react";
import { fetchClients } from "@/app/admin/clients/actions";
import { createServerClientWithCookies } from "@/lib/supabase-server";
import ClientsTable from "@/components/admin/clients/ClientsTable";
import AddClientModal from "@/components/admin/clients/AddClientModal";
import Link from "next/link";
import { Users, TrendingUp, Heart, CalendarClock, Zap, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Clients — FortuneMarq",
  description: "Master client list with health scores, MRR, and renewals",
};

async function ClientStats() {
  const clients = await fetchClients();
  const supabase = await createServerClientWithCookies();

  // Fetch client packages & upsell attempts
  const { data: packages } = await supabase
    .from("client_packages")
    .select("*")
    .eq("status", "active");

  const packageMap = new Map(
    (packages ?? []).map((p: any) => [p.client_id, p])
  );

  // Calculate CRM stats from packages
  const totalMRR = (packages ?? []).reduce(
    (sum: number, p: any) => sum + (p.monthly_value ?? 0),
    0
  );
  const packagesWithHealth = (packages ?? []).filter(
    (p: any) => p.health_score != null
  );
  const avgHealth =
    packagesWithHealth.length > 0
      ? Math.round(
          packagesWithHealth.reduce(
            (sum: number, p: any) => sum + p.health_score,
            0
          ) / packagesWithHealth.length
        )
      : null;
  const upsellEligible = (packages ?? []).filter(
    (p: any) => p.upsell_eligible
  ).length;
  const atRisk = (packages ?? []).filter(
    (p: any) => p.health_score != null && p.health_score < 60
  ).length;

  const active = clients.filter((c) => c.status === "active").length;

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 86400000);
  const renewalsThisMonth = clients.filter((c) => {
    if (!c.renewal_date || c.status !== "active") return false;
    const rd = new Date(c.renewal_date);
    return rd >= now && rd <= thirtyDaysFromNow;
  }).length;

  const stats = [
    {
      label: "Total Active Clients",
      value: active,
      icon: Users,
    },
    {
      label: "Total MRR",
      value: `₹${totalMRR.toLocaleString("en-IN")}`,
      icon: TrendingUp,
    },
    {
      label: "Avg Health Score",
      value: avgHealth ?? "—",
      icon: Heart,
    },
    {
      label: "Upsell Eligible",
      value: upsellEligible,
      icon: Zap,
    },
    {
      label: "At Risk",
      value: atRisk,
      icon: AlertTriangle,
    },
    {
      label: "Renewals (30d)",
      value: renewalsThisMonth,
      icon: CalendarClock,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {stats.map((stat) => (
        <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} />
      ))}
    </div>
  );
}

async function ClientsContent() {
  const clients = await fetchClients();
  const supabase = await createServerClientWithCookies();

  const { data: packages } = await supabase
    .from("client_packages")
    .select("*")
    .eq("status", "active");

  const { data: upsellAttempts } = await supabase
    .from("upsell_attempts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <ClientsTable
      clients={clients}
      upsellAttempts={upsellAttempts ?? []}
    />
  );
}

export default function ClientsPage() {
  return (
    <div className="min-h-full bg-canvas px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Clients"
          subtitle="Manage all client relationships, health, and revenue"
          actions={
            <>
              <Link
                href="/admin/clients/renewals"
                className={buttonVariants({ variant: "secondary" })}
              >
                <CalendarClock className="h-4 w-4" />
                Renewals
              </Link>
              <AddClientModal />
            </>
          }
        />

        {/* Stats */}
        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 rounded-xl border border-line bg-surface" />
              ))}
            </div>
          }
        >
          <ClientStats />
        </Suspense>

        {/* Table */}
        <Suspense
          fallback={
            <div className="h-96 rounded-xl border border-line bg-surface animate-pulse" />
          }
        >
          <ClientsContent />
        </Suspense>
      </div>
    </div>
  );
}
