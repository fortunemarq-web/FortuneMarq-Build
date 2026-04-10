import { createServerClientWithCookies } from "@/lib/supabase-server";

interface KpiCard {
  label: string;
  value: string | number;
  subtext?: string;
  borderColor: string;
  textColor: string;
  comingSoon?: boolean;
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
    outstandingInvoices
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
    {
      label: "Active Clients",
      value: kpis.activeClients,
      subtext: "currently engaged",
      borderColor: "#42CA80",
      textColor: "text-[#42CA80]",
    },
    {
      label: "Monthly Revenue",
      value: mrrFormatted,
      subtext: "MRR from active clients",
      borderColor: "#3b82f6",
      textColor: "text-blue-600",
    },
    {
      label: "Open Leads",
      value: kpis.openLeads,
      subtext: "in active pipeline",
      borderColor: "#f59e0b",
      textColor: "text-amber-600",
    },
    {
      label: "Tasks Due Today",
      value: kpis.tasksDueToday,
      subtext: "need completion",
      borderColor: "#ef4444",
      textColor: "text-red-500",
    },
    {
      label: "Outstanding Invoices",
      value: outstandingFormatted,
      subtext: "awaiting payment",
      borderColor: "#f97316",
      textColor: "text-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"
          style={{ borderTop: `3px solid ${card.borderColor}` }}
        >
          <p className="text-xs font-semibold text-slate-500 tracking-wide">
            {card.label}
          </p>
          <p
            className={`text-2xl font-black font-mono tabular-nums mt-1.5 ${
              card.comingSoon ? "text-slate-300" : card.textColor
            }`}
          >
            {card.value}
          </p>
          {card.comingSoon ? (
            <p className="text-[10px] text-slate-400 mt-1 leading-tight">
              {card.subtext}
            </p>
          ) : (
            <p className="text-xs text-slate-400 mt-1">{card.subtext}</p>
          )}
        </div>
      ))}
    </div>
  );
}
