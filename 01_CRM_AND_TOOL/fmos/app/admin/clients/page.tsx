import type { Metadata } from "next";
import { Suspense } from "react";
import { fetchClients } from "@/app/admin/clients/actions";
import { createServerClientWithCookies } from "@/lib/supabase-server";
import ClientsTable from "@/components/admin/clients/ClientsTable";
import AddClientModal from "@/components/admin/clients/AddClientModal";
import Link from "next/link";
import { Users, TrendingUp, Heart, CalendarClock, Zap, AlertTriangle } from "lucide-react";

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
      color: "#42CA80",
    },
    {
      label: "Total MRR",
      value: `₹${totalMRR.toLocaleString("en-IN")}`,
      icon: TrendingUp,
      color: "#3b82f6",
    },
    {
      label: "Avg Health Score",
      value: avgHealth ?? "—",
      icon: Heart,
      color: "#f59e0b",
    },
    {
      label: "Upsell Eligible",
      value: upsellEligible,
      icon: Zap,
      color: "#8b5cf6",
    },
    {
      label: "At Risk",
      value: atRisk,
      icon: AlertTriangle,
      color: "#ef4444",
    },
    {
      label: "Renewals (30d)",
      value: renewalsThisMonth,
      icon: CalendarClock,
      color: "#f97316",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"
            style={{ borderTop: `3px solid ${stat.color}` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4 text-slate-400" />
              <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {stat.value}
            </p>
          </div>
        );
      })}
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
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Clients
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage all client relationships, health, and revenue
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/clients/renewals"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors min-h-[44px]"
            >
              <CalendarClock className="h-4 w-4" />
              Renewals
            </Link>
            <AddClientModal />
          </div>
        </div>

        {/* Stats */}
        <Suspense
          fallback={
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-white border border-slate-200" />
              ))}
            </div>
          }
        >
          <ClientStats />
        </Suspense>

        {/* Table */}
        <Suspense
          fallback={
            <div className="h-96 rounded-xl bg-white border border-slate-200 animate-pulse" />
          }
        >
          <ClientsContent />
        </Suspense>
      </div>
    </div>
  );
}
