import { createServerClientWithCookies } from "@/lib/supabase-server";
import { StatCard } from "@/components/ui/stat-card";
import { Users, TrendingUp, Target, ListTodo, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface KpiCard {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
}

async function fetchKpiData() {
  const supabase = await createServerClientWithCookies();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();
  const tomorrowISO = new Date(today.getTime() + 86400000).toISOString();

  // Active Clients count + MRR
  const { data: clientsData } = await supabase
    .from("clients")
    .select("monthly_value")
    .eq("status", "active");

  const activeClients = (clientsData ?? []).length;
  const mrr = (clientsData ?? []).reduce(
    (sum: number, c: any) => sum + (parseFloat(c.monthly_value) || 0),
    0
  );

  // Open Leads (not closed)
  const { count: openLeads } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .not("status", "in", '("closed_won","closed_lost","disqualified")');

  // Tasks Due Today
  const { count: tasksDueToday } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .gte("due_date", todayISO)
    .lt("due_date", tomorrowISO)
    .neq("status", "completed")
    .neq("status", "pending");

  // Outstanding Invoices
  const { data: unpaidInvoices } = await supabase
    .from("invoices")
    .select("total_amount")
    .in("status", ["unpaid", "overdue"]);

  const outstandingInvoices = (unpaidInvoices ?? []).reduce(
    (sum: number, inv: any) => sum + (parseFloat(inv.total_amount) || 0),
    0
  );

  return {
    activeClients,
    mrr,
    openLeads: openLeads ?? 0,
    tasksDueToday: tasksDueToday ?? 0,
    outstandingInvoices,
  };
}

export default async function KpiBar() {
  const kpis = await fetchKpiData();

  const mrrFormatted =
    kpis.mrr >= 100000
      ? `₹${(kpis.mrr / 100000).toFixed(1)}L`
      : kpis.mrr >= 1000
      ? `₹${(kpis.mrr / 1000).toFixed(1)}K`
      : `₹${kpis.mrr.toFixed(0)}`;

  const outstandingFormatted =
    kpis.outstandingInvoices >= 100000
      ? `₹${(kpis.outstandingInvoices / 100000).toFixed(1)}L`
      : kpis.outstandingInvoices >= 1000
      ? `₹${(kpis.outstandingInvoices / 1000).toFixed(1)}K`
      : `₹${kpis.outstandingInvoices.toFixed(0)}`;

  const cards: KpiCard[] = [
    { label: "Active Clients", value: kpis.activeClients, subtext: "Currently engaged", icon: Users },
    { label: "Monthly Revenue", value: mrrFormatted, subtext: "MRR from active clients", icon: TrendingUp },
    { label: "Open Leads", value: kpis.openLeads, subtext: "In active pipeline", icon: Target },
    { label: "Tasks Due Today", value: kpis.tasksDueToday, subtext: "Need completion", icon: ListTodo },
    { label: "Outstanding Invoices", value: outstandingFormatted, subtext: "Awaiting payment", icon: Clock },
  ];

  return (
    <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <StatCard
          key={card.label}
          label={card.label}
          value={card.value}
          icon={card.icon}
          hint={card.subtext}
        />
      ))}
    </div>
  );
}
