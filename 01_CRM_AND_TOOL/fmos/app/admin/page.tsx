import { createServerClientWithCookies } from "@/lib/supabase-server";
import {
  DollarSign,
  Users,
  Target,
  ArrowRight,
  Phone,
  AlertTriangle,
  Coffee,
  CheckSquare,
  CalendarDays,
  FileText,
  Zap,
  CalendarClock,
  TrendingUp,
  Flame,
  CheckCircle,
  Clock,
  ClipboardList,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import KpiBar from "@/components/admin/dashboard/KpiBar";
import RevenueForecastWidget from "@/components/admin/revenue-forecast-widget";

// Phase B1: Admin Morning Dashboard — pure operational intelligence

export default async function AdminCommandHub() {
  const supabase = await createServerClientWithCookies();
  const today = new Date().toISOString().split("T")[0];
  const todayStart = today + "T00:00:00";
  const todayEnd = today + "T23:59:59";
  const now = new Date().toISOString();
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 3600000).toISOString();

  // Fetch all dashboard data in parallel
  const [
    mrrResult,
    outstandingResult,
    activeClientsResult,
    leadsInPipelineResult,
    meetingsTodayResult,
    overdueInvoicesResult,
    staleProposalsResult,
    tasksDueTodayResult,
    onboardingClientsResult,
    pipelineStagesResult,
    telecallerCallsTodayResult,
    telecallerMeetingsTodayResult,
    telecallerPdfsTodayResult,
  ] = await Promise.all([
    // MRR this month
    supabase
      .from("invoices")
      .select("amount")
      .eq("revenue_type", "mrr")
      .eq("status", "paid")
      .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),

    // Outstanding invoices
    supabase
      .from("invoices")
      .select("id, amount, status")
      .in("status", ["unpaid", "overdue"]),

    // Active clients
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "active"),

    // Leads in pipeline (not won/lost)
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .not("status", "in", '("closed_won","closed_lost","disqualified")'),

    // Meetings today
    supabase
      .from("leads")
      .select("id, company_name, industry, city, follow_up_date")
      .eq("status", "meeting_booked" as any)
      .gte("follow_up_date", todayStart)
      .lte("follow_up_date", todayEnd),

    // Overdue invoices with client info
    supabase
      .from("invoices")
      .select("id, amount, created_at, status, client:clients(business_name)")
      .eq("status", "overdue")
      .order("created_at", { ascending: true }),

    // Proposals sent 48h+ with no response
    supabase
      .from("proposals")
      .select("id, amount, sent_at, lead:leads(company_name, phone)")
      .eq("status", "sent")
      .lte("sent_at", fortyEightHoursAgo)
      .order("sent_at", { ascending: true }),

    // Tasks due today (not completed)
    supabase
      .from("tasks")
      .select("id, title, due_date, assigned_to, assignee:profiles(full_name), projects(name)")
      .eq("due_date", today)
      .not("status", "eq", "completed")
      .order("due_date", { ascending: true }),

    // Clients currently onboarding
    supabase
      .from("clients")
      .select("id, business_name, onboarding_completed")
      .eq("status", "active")
      .eq("onboarding_completed", false),

    // Pipeline stage breakdown
    supabase
      .from("leads")
      .select("status")
      .not("status", "in", '("closed_won","closed_lost","disqualified")'),

    // Telecaller calls today (lead_outcomes)
    supabase
      .from("lead_outcomes")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart),

    // Meetings booked today
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("status", "meeting_booked" as any)
      .gte("updated_at", todayStart),

    // PDFs/curiosity sent today (outreach_logs)
    supabase
      .from("outreach_logs" as any)
      .select("id", { count: "exact", head: true })
      .eq("touch_type", "pdf_sent")
      .gte("created_at", todayStart),
  ]);

  // ── KPI Values ──────────────────────────────────────────
  const mrr = (mrrResult.data || []).reduce((s: number, i: any) => s + (i.amount || 0), 0);
  const mrrTarget = 50000;
  const mrrPct = Math.min(100, Math.round((mrr / mrrTarget) * 100));
  const mrrColor = mrrPct >= 80 ? "text-emerald-600" : mrrPct >= 50 ? "text-amber-600" : "text-red-600";
  const mrrBarColor = mrrPct >= 80 ? "bg-emerald-500" : mrrPct >= 50 ? "bg-amber-400" : "bg-red-500";

  const outstanding = outstandingResult.data || [];
  const outstandingTotal = outstanding.reduce((s: number, i: any) => s + (i.amount || 0), 0);

  const activeClients = activeClientsResult.count || 0;
  const leadsInPipeline = leadsInPipelineResult.count || 0;
  const meetingsToday = meetingsTodayResult.data || [];
  const overdueInvoices = overdueInvoicesResult.data || [];
  const staleProposals = staleProposalsResult.data || [];
  const tasksDueToday = tasksDueTodayResult.data || [];
  const onboardingClients = onboardingClientsResult.data || [];
  const pipelineLeads = pipelineStagesResult.data || [];

  const callsToday = telecallerCallsTodayResult.count || 0;
  const meetingsBookedToday = telecallerMeetingsTodayResult.count || 0;
  const pdfsSentToday = telecallerPdfsTodayResult.count || 0;

  // Pipeline stage counts
  const stageCounts: Record<string, number> = {};
  pipelineLeads.forEach((l: any) => {
    const s = l.status || "new";
    stageCounts[s] = (stageCounts[s] || 0) + 1;
  });

  const pipelineStages = [
    { key: "new", label: "New / Untouched", color: "bg-slate-400" },
    { key: "first_call_pending", label: "1st Call Pending", color: "bg-blue-400" },
    { key: "calling", label: "Calling", color: "bg-blue-500" },
    { key: "contacted", label: "Contacted", color: "bg-indigo-500" },
    { key: "qualified", label: "Qualified", color: "bg-purple-500" },
    { key: "strategy_booked", label: "Strategy Booked", color: "bg-violet-600" },
    { key: "nurture", label: "Nurture", color: "bg-amber-500" },
    { key: "proposal_sent", label: "Proposal Sent", color: "bg-orange-500" },
  ];

  const totalActionItems =
    meetingsToday.length +
    overdueInvoices.length +
    staleProposals.length +
    tasksDueToday.length +
    onboardingClients.length;

  const formatINR = (n: number) =>
    n >= 100000
      ? `₹${(n / 100000).toFixed(1)}L`
      : `₹${n.toLocaleString("en-IN")}`;

  const daysSince = (dateStr: string) =>
    Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">

        {/* ── HEADER ─────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Coffee className="h-7 w-7 text-[#42CA80]" />
              Good Morning, Jabeer
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
              {totalActionItems > 0
                ? ` · ${totalActionItems} item${totalActionItems > 1 ? "s" : ""} need your attention`
                : " · All clear — nothing urgent"}
            </p>
          </div>
          <Link
            href="/admin/briefing"
            className="flex items-center gap-2 bg-[#42CA80] hover:bg-[#35A66A] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <CalendarDays className="h-4 w-4" /> Daily Briefing
          </Link>
        </div>

        {/* E4: Monthly Invoice Reminder (1st-5th of month) */}
        {new Date().getDate() <= 5 && activeClients > 0 && (
          <div className="mb-6 flex items-center justify-between border border-amber-200 bg-amber-50 px-5 py-3 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-amber-500" />
              <p className="text-sm font-semibold text-amber-800">
                📋 Monthly invoices due. <span className="font-bold">{activeClients}</span> active clients need invoices raised.
              </p>
            </div>
            <Link href="/admin/finance/invoices" className="text-xs font-bold bg-amber-200 text-amber-800 px-3 py-1.5 rounded-lg hover:bg-amber-300 transition-colors">
              Go to Finance
            </Link>
          </div>
        )}

        {/* ── 5 KPI CARDS ───────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {[
            {
              label: "MRR This Month",
              value: formatINR(mrr),
              sub: `${mrrPct}% of ₹50k target`,
              icon: DollarSign,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              label: "Outstanding",
              value: formatINR(outstandingTotal),
              sub: `${outstanding.length} invoice${outstanding.length !== 1 ? "s" : ""}`,
              icon: AlertTriangle,
              color: outstanding.length > 0 ? "text-red-600" : "text-slate-400",
              bg: outstanding.length > 0 ? "bg-red-50" : "bg-slate-50",
            },
            {
              label: "Active Clients",
              value: activeClients.toString(),
              sub: "Currently on retainer",
              icon: Users,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              label: "Leads in Pipeline",
              value: leadsInPipeline.toString(),
              sub: "Not won or lost",
              icon: Target,
              color: "text-purple-600",
              bg: "bg-purple-50",
            },
            {
              label: "Meetings Today",
              value: meetingsToday.length.toString(),
              sub: meetingsToday.length > 0 ? "On the books" : "None scheduled",
              icon: CalendarDays,
              color: meetingsToday.length > 0 ? "text-indigo-600" : "text-slate-400",
              bg: meetingsToday.length > 0 ? "bg-indigo-50" : "bg-slate-50",
            },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 flex flex-col gap-2">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${kpi.bg}`}>
                  <Icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <p className="text-2xl font-bold font-mono tabular-nums text-slate-900">{kpi.value}</p>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{kpi.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* MRR Progress Bar */}
        <div className="mb-8 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> MRR vs Target
            </span>
            <span className={`text-sm font-bold font-mono ${mrrColor}`}>
              {formatINR(mrr)} / ₹50,000 ({mrrPct}%)
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${mrrBarColor}`}
              style={{ width: `${mrrPct}%` }}
            />
          </div>
        </div>

        {/* ── MAIN GRID: Left Action List + Right Column ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: Today's Action List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-slate-500" />
              Today&apos;s Action List
            </h2>

            {totalActionItems === 0 && meetingsToday.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/50 py-16 text-center">
                <CheckCircle className="h-10 w-10 text-emerald-500 mb-3" />
                <p className="text-lg font-semibold text-emerald-700">Nothing urgent today.</p>
                <p className="text-sm text-emerald-600 mt-1">Good morning, Jabeer.</p>
              </div>
            )}

            {/* 1. Meetings Today */}
            {meetingsToday.length > 0 && (
              <ActionSection title="Meetings Today" icon={CalendarDays} color="text-green-600" bg="bg-green-50 border-green-200" count={meetingsToday.length}>
                {meetingsToday.map((lead: any) => (
                  <ActionCard key={lead.id}>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{lead.company_name}</p>
                      <p className="text-xs text-slate-500">{lead.industry} · {lead.city}</p>
                      {lead.follow_up_date && (
                        <p className="text-xs text-green-600 mt-0.5 font-medium">
                          {new Date(lead.follow_up_date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                    <Link href={`/sales/leads/${lead.id}`} className="action-btn bg-green-600 hover:bg-green-700 text-white">
                      Open Lead
                    </Link>
                  </ActionCard>
                ))}
              </ActionSection>
            )}

            {/* 2. Overdue Invoices */}
            {overdueInvoices.length > 0 && (
              <ActionSection title="Overdue Invoices" icon={AlertTriangle} color="text-red-600" bg="bg-red-50 border-red-200" count={overdueInvoices.length}>
                {overdueInvoices.map((inv: any) => {
                  const days = daysSince(inv.created_at);
                  return (
                    <ActionCard key={inv.id}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 text-sm truncate">{(inv.client as any)?.business_name || "Unknown"}</p>
                          {days >= 7 && (
                            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                              <Flame className="h-2.5 w-2.5" /> PAUSE ADS
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{formatINR(inv.amount)} · {days}d overdue</p>
                      </div>
                      <Link href="/admin/finance" className="action-btn bg-red-600 hover:bg-red-700 text-white">
                        View Invoice
                      </Link>
                    </ActionCard>
                  );
                })}
              </ActionSection>
            )}

            {/* 3. Stale Proposals (48h+) */}
            {staleProposals.length > 0 && (
              <ActionSection title="Proposals Not Replied (48h+)" icon={FileText} color="text-amber-600" bg="bg-amber-50 border-amber-200" count={staleProposals.length}>
                {staleProposals.map((p: any) => (
                  <ActionCard key={p.id}>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{(p.lead as any)?.company_name || "Unknown"}</p>
                      <p className="text-xs text-slate-500">
                        {p.amount ? formatINR(p.amount) : "—"} · Sent {daysSince(p.sent_at)}d ago
                      </p>
                    </div>
                    <Link href="/sales/outreach" className="action-btn bg-amber-600 hover:bg-amber-700 text-white">
                      Open Proposal
                    </Link>
                  </ActionCard>
                ))}
              </ActionSection>
            )}

            {/* 4. Tasks Due Today */}
            {tasksDueToday.length > 0 && (
              <ActionSection title="Tasks Due Today" icon={CheckSquare} color="text-indigo-600" bg="bg-indigo-50 border-indigo-200" count={tasksDueToday.length}>
                {tasksDueToday.slice(0, 5).map((task: any) => (
                  <ActionCard key={task.id}>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{task.title}</p>
                      <p className="text-xs text-slate-500">
                        {(task.projects as any)?.name || "No project"} · {(task.assignee as any)?.full_name || "Unassigned"}
                      </p>
                    </div>
                    <Link href="/tasks" className="action-btn bg-indigo-600 hover:bg-indigo-700 text-white">
                      Open Task
                    </Link>
                  </ActionCard>
                ))}
              </ActionSection>
            )}

            {/* 5. Onboarding Pending */}
            {onboardingClients.length > 0 && (
              <ActionSection title="Onboarding Pending" icon={UserCheck} color="text-purple-600" bg="bg-purple-50 border-purple-200" count={onboardingClients.length}>
                {onboardingClients.map((client: any) => (
                  <ActionCard key={client.id}>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{client.business_name}</p>
                      <p className="text-xs text-slate-500">Onboarding checklist incomplete</p>
                    </div>
                    <Link href={`/admin/clients/${client.id}`} className="action-btn bg-purple-600 hover:bg-purple-700 text-white">
                      Open Client
                    </Link>
                  </ActionCard>
                ))}
              </ActionSection>
            )}
          </div>

          {/* RIGHT: Pipeline + Telecaller Activity */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Target className="h-5 w-5 text-slate-500" />
              Pipeline Snapshot
            </h2>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-2">
              {pipelineStages.map((stage) => {
                const count = stageCounts[stage.key] || 0;
                const maxCount = Math.max(...pipelineStages.map((s) => stageCounts[s.key] || 0), 1);
                return (
                  <Link
                    key={stage.key}
                    href={`/sales?stage=${stage.key}`}
                    className="flex items-center gap-3 group py-1.5 hover:bg-slate-50 rounded-lg transition-colors px-2 -mx-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate group-hover:text-[#42CA80] transition-colors">
                        {stage.label}
                      </p>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${stage.color} transition-all`}
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-bold font-mono tabular-nums text-slate-900 shrink-0 w-8 text-right">
                      {count}
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-300 group-hover:text-[#42CA80] transition-colors shrink-0" />
                  </Link>
                );
              })}
              {pipelineLeads.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4 italic">No active leads</p>
              )}
            </div>

            {/* E2: Revenue Forecast Widget */}
            <Suspense fallback={<div className="h-48 bg-white border border-slate-200 rounded-2xl shadow-sm animate-pulse" />}>
              <RevenueForecastWidget />
            </Suspense>

            {/* Telecaller Activity Today */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Telecaller Activity Today
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Calls Made", value: callsToday, icon: Phone, color: "text-blue-600" },
                  { label: "Meetings Booked", value: meetingsBookedToday, icon: CalendarDays, color: "text-green-600" },
                  { label: "PDFs Sent", value: pdfsSentToday, icon: FileText, color: "text-purple-600" },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs text-slate-600">
                        <Icon className={`h-3.5 w-3.5 ${stat.color}`} />
                        {stat.label}
                      </span>
                      <span className="text-sm font-bold font-mono tabular-nums text-slate-900">
                        {stat.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/admin/users" className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors">
                  <Users className="h-4 w-4 text-slate-400" /> Manage Users
                </Link>
                <Link href="/admin/finance" className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors">
                  <DollarSign className="h-4 w-4 text-slate-400" /> Finance Dashboard
                </Link>
                <Link href="/tasks" className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors">
                  <CheckSquare className="h-4 w-4 text-slate-400" /> All Tasks
                </Link>
                <Link href="/admin/team" className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors">
                  <Clock className="h-4 w-4 text-slate-400" /> Team SOPs
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Small helper components (server-side, no "use client" needed) ──

function ActionSection({
  title, icon: Icon, color, bg, count, children
}: {
  title: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border overflow-hidden bg-white shadow-sm">
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${bg}`}>
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-sm font-bold text-slate-800">{title}</span>
        <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-white/70 ${color}`}>
          {count}
        </span>
      </div>
      <div className="divide-y divide-slate-50">{children}</div>
    </div>
  );
}

function ActionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
      {children}
    </div>
  );
}
