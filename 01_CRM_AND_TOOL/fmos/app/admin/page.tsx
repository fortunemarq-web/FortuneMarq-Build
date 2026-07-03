import { createServerClientWithCookies } from "@/lib/supabase-server";
import {
  DollarSign,
  Users,
  Target,
  ArrowRight,
  Phone,
  PhoneCall,
  AlertTriangle,
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
  History,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import KpiBar from "@/components/admin/dashboard/KpiBar";
import RevenueForecastWidget from "@/components/admin/revenue-forecast-widget";
import { PIPELINE_STAGES } from "@/lib/pipeline";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

// Phase B1: Admin Morning Dashboard — pure operational intelligence

export default async function AdminCommandHub() {
  const supabase = await createServerClientWithCookies();
  const today = new Date().toISOString().split("T")[0];
  const todayStart = today + "T00:00:00";
  const todayEnd = today + "T23:59:59";
  const now = new Date().toISOString();
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 3600000).toISOString();

  const { data: { user: authUser } } = await supabase.auth.getUser();
  const { data: userProfile } = authUser ? await supabase.from("profiles").select("full_name").eq("id", authUser.id).maybeSingle() : { data: null };
  const userName = (userProfile as any)?.full_name?.split(" ")[0] || "there";
  const hourIST = (new Date().getUTCHours() + 5) % 24 + (new Date().getUTCMinutes() >= 30 ? 0.5 : 0);
  const timeGreeting = hourIST < 12 ? "Good morning" : hourIST < 17 ? "Good afternoon" : "Good evening";

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
    telecallerCallsTodayResult,
    telecallerMeetingsTodayResult,
    telecallerPdfsTodayResult,
  ] = await Promise.all([
    // MRR this month
    supabase
      .from("invoices")
      .select("total_amount, revenue_type")
      .eq("revenue_type", "mrr")
      .eq("status", "paid")
      .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),

    // Outstanding invoices
    supabase
      .from("invoices")
      .select("id, total_amount, status")
      .in("status", ["unpaid", "overdue"]),

    // Active clients
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "active"),

    // Leads in pipeline (not closed) — outreach_stage is the source of truth
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .or("outreach_stage.is.null,outreach_stage.not.in.(won,lost,dead,not_interested)"),

    // Meetings today
    supabase
      .from("leads")
      .select("id, company_name, industry, city, follow_up_date")
      .eq("outreach_stage", "meeting_booked")
      .gte("follow_up_date", todayStart)
      .lte("follow_up_date", todayEnd),

    // Overdue invoices with client info
    supabase
      .from("invoices")
      .select("id, total_amount, due_date, status, client:clients(business_name)")
      .eq("status", "overdue")
      .order("created_at", { ascending: true }),

    // Proposals sent 48h+ with no response
    supabase
      .from("proposals")
      .select("id, monthly_value, total_monthly, sent_at, lead:leads(id, company_name, phone)")
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
      .select("id, business_name")
      .eq("status", "onboarding"),

    // Telecaller calls today — the cockpit logs calls to outreach_logs
    // (touch_type 'call'), NOT lead_outcomes (which was always ~0).
    supabase
      .from("outreach_logs")
      .select("id", { count: "exact", head: true })
      .eq("touch_type", "call")
      .gte("created_at", todayStart),

    // Meetings booked today
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("outreach_stage", "meeting_booked")
      .gte("meeting_booked_at", todayStart),

    // PDFs/curiosity sent today (outreach_logs)
    supabase
      .from("outreach_logs")
      .select("id", { count: "exact", head: true })
      .eq("touch_type", "pdf_sent")
      .gte("created_at", todayStart),
  ]);

  // ── KPI Values ──────────────────────────────────────────
  const mrr = (mrrResult.data || []).reduce((s: number, i: any) => s + (i.total_amount || 0), 0);
  // June 2026 = build month, no revenue target set yet
  const mrrTarget = 0;
  const mrrPct = 0;
  const mrrColor = "text-slate-500";
  const mrrBarColor = "bg-slate-300";

  const outstanding = outstandingResult.data || [];
  const outstandingTotal = outstanding.reduce((s: number, i: any) => s + (i.total_amount || 0), 0);

  const activeClients = activeClientsResult.count || 0;
  const leadsInPipeline = leadsInPipelineResult.count || 0;
  const meetingsToday = meetingsTodayResult.data || [];
  const overdueInvoices = overdueInvoicesResult.data || [];
  const staleProposals = staleProposalsResult.data || [];
  const tasksDueToday = tasksDueTodayResult.data || [];
  const onboardingClients = onboardingClientsResult.data || [];
  // Pipeline stage counts — page through (Supabase caps each request at 1000)
  // so the breakdown reflects all ~8k leads, not a silently-truncated sample.
  const pipelineLeads: { outreach_stage: string | null }[] = [];
  for (let from = 0; from < 50000; from += 1000) {
    const { data, error } = await supabase
      .from("leads")
      .select("outreach_stage")
      .or("outreach_stage.is.null,outreach_stage.not.in.(won,lost,dead,not_interested)")
      .range(from, from + 999);
    if (error) break;
    pipelineLeads.push(...((data as any[]) || []));
    if (!data || data.length < 1000) break;
  }

  const callsToday = telecallerCallsTodayResult.count || 0;
  const meetingsBookedToday = telecallerMeetingsTodayResult.count || 0;
  const pdfsSentToday = telecallerPdfsTodayResult.count || 0;

  // Follow-ups due today
  const { data: followUpsDue } = await supabase
    .from("leads")
    .select("id, company_name, contact_person, phone, city, industry")
    .eq("outreach_stage", "follow_up_due")
    .eq("follow_up_date", today)
    .order("company_name");

  // Overdue meetings — booked, meeting time in the past, never marked
  // attended/no-show. The most urgent thing on the board.
  const { data: overdueMeetings } = await supabase
    .from("leads")
    .select("id, company_name, industry, city, phone, follow_up_date")
    .eq("outreach_stage", "meeting_booked")
    .lt("follow_up_date", todayStart)
    .order("follow_up_date", { ascending: true });

  // Missed follow-ups — due before today and never actioned. Without this
  // they silently fall out of the "due today" view and rot.
  const { data: missedFollowUps } = await supabase
    .from("leads")
    .select("id, company_name, contact_person, phone, city, industry, follow_up_date")
    .in("outreach_stage", ["follow_up_due", "no_answer", "follow_back"])
    .lt("follow_up_date", today)
    .order("follow_up_date", { ascending: true })
    .limit(10);

  // Pipeline stage counts (outreach_stage; null = never touched)
  const stageCounts: Record<string, number> = {};
  pipelineLeads.forEach((l: any) => {
    const s = l.outreach_stage || "touch1_pending";
    stageCounts[s] = (stageCounts[s] || 0) + 1;
  });

  const pipelineStages = PIPELINE_STAGES
    .filter((s) => s.group === "active")
    .map((s) => ({
      key: s.key,
      label: s.key === "touch1_pending" ? "New / Untouched" : s.label,
    }));

  const totalActionItems =
    (overdueMeetings?.length ?? 0) +
    (missedFollowUps?.length ?? 0) +
    meetingsToday.length +
    (followUpsDue?.length ?? 0) +
    overdueInvoices.length +
    staleProposals.length +
    tasksDueToday.length +
    onboardingClients.length;

  // Breakdown so "N items need your attention" actually says WHAT
  const attentionBreakdown = [
    { label: "overdue meeting", labelPlural: "overdue meetings", count: overdueMeetings?.length ?? 0 },
    { label: "missed follow-up", labelPlural: "missed follow-ups", count: missedFollowUps?.length ?? 0 },
    { label: "meeting today", labelPlural: "meetings today", count: meetingsToday.length },
    { label: "follow-up due", labelPlural: "follow-ups due", count: followUpsDue?.length ?? 0 },
    { label: "overdue invoice", labelPlural: "overdue invoices", count: overdueInvoices.length },
    { label: "stale proposal", labelPlural: "stale proposals", count: staleProposals.length },
    { label: "task due", labelPlural: "tasks due", count: tasksDueToday.length },
    { label: "client onboarding", labelPlural: "clients onboarding", count: onboardingClients.length },
  ]
    .filter((b) => b.count > 0)
    .map((b) => `${b.count} ${b.count > 1 ? b.labelPlural : b.label}`)
    .join(", ");

  const formatINR = (n: number) =>
    n >= 100000
      ? `₹${(n / 100000).toFixed(1)}L`
      : `₹${n.toLocaleString("en-IN")}`;

  const daysSince = (dateStr: string) =>
    Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);

  return (
    <div className="min-h-full bg-canvas px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* ── HEADER ─────────────────────────────────────── */}
        <div className="fmos-aurora overflow-hidden rounded-2xl border border-brand-line/70 px-6 py-5 shadow-[0_12px_40px_-18px_rgba(12,124,78,0.22)]">
        <PageHeader
          title={`${timeGreeting}, ${userName}`}
          subtitle={
            <>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
              {totalActionItems > 0 ? (
                <>
                  {" · "}
                  <a href="#action-list" className="font-medium text-slate-700 underline decoration-line-strong underline-offset-2 transition-colors hover:text-brand-deep hover:decoration-brand">
                    {attentionBreakdown}
                  </a>
                </>
              ) : (
                " · All clear — nothing urgent"
              )}
            </>
          }
          actions={
            <Link href="/admin/briefing" className={buttonVariants({ variant: "primary" })}>
              <CalendarDays className="h-4 w-4" /> Daily Briefing
            </Link>
          }
        />
        </div>

        {/* E4: Monthly Invoice Reminder (1st-5th of month) */}
        {new Date().getDate() <= 5 && activeClients > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-warn-line bg-warn-soft px-5 py-3">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-5 w-5 shrink-0 text-warn" />
              <p className="text-sm font-medium text-warn">
                Monthly invoices due — <span className="font-semibold">{activeClients}</span> active clients need invoices raised.
              </p>
            </div>
            <Link href="/admin/finance/invoices" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              Go to Finance
            </Link>
          </div>
        )}

        {/* ── 5 KPI CARDS ───────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            {
              label: "MRR This Month",
              value: formatINR(mrr),
              sub: `Build month — no target set`,
              icon: DollarSign,
              alert: false,
            },
            {
              label: "Outstanding",
              value: formatINR(outstandingTotal),
              sub: `${outstanding.length} invoice${outstanding.length !== 1 ? "s" : ""}`,
              icon: AlertTriangle,
              alert: outstanding.length > 0,
            },
            {
              label: "Active Clients",
              value: activeClients.toString(),
              sub: "Currently on retainer",
              icon: Users,
              alert: false,
            },
            {
              label: "Leads in Pipeline",
              value: leadsInPipeline.toString(),
              sub: "Not won or lost",
              icon: Target,
              alert: false,
            },
            {
              label: "Meetings Today",
              value: meetingsToday.length.toString(),
              sub: meetingsToday.length > 0 ? "On the books" : "None scheduled",
              icon: CalendarDays,
              alert: false,
            },
          ].map((kpi) => (
            <StatCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              icon={kpi.icon}
              hint={kpi.sub}
              delta={kpi.alert ? { value: "Action needed", direction: "down" } : undefined}
            />
          ))}
        </div>

        {/* MRR Progress Bar */}
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <TrendingUp className="h-3.5 w-3.5" /> MRR vs Target
            </span>
            <span className="text-sm font-semibold tabular-nums text-slate-400">
              {formatINR(mrr)} — build month
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${mrrBarColor}`}
              style={{ width: `${mrrPct}%` }}
            />
          </div>
        </Card>

        {/* ── MAIN GRID: Left Action List + Right Column ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: Today's Action List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-slate-900">
              <ClipboardList className="h-5 w-5 text-slate-500" />
              Today&apos;s Action List
            </h2>

            {totalActionItems === 0 && (
              <EmptyState
                icon={CheckCircle}
                title="Nothing urgent today."
                description={`${timeGreeting}, ${userName}.`}
              />
            )}

            {/* Anchor for the "needs your attention" header link */}
            <div id="action-list" className="scroll-mt-16" />

            {/* 0. Overdue Meetings — most urgent, always on top */}
            {(overdueMeetings?.length ?? 0) > 0 && (
              <ActionSection title="Overdue Meetings" icon={AlertTriangle} tone="danger" count={overdueMeetings?.length ?? 0}>
                {overdueMeetings?.map((lead: any) => (
                  <ActionCard key={lead.id}>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{lead.company_name}</p>
                      <p className="text-xs text-slate-500">{lead.industry} · {lead.city}</p>
                      <p className="mt-0.5 text-xs font-medium text-danger">
                        Was scheduled {new Date(lead.follow_up_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} — mark attended, no-show, or reschedule
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                          Call
                        </a>
                      )}
                      <Link href="/admin/meetings" className={buttonVariants({ variant: "danger-soft", size: "sm" })}>
                        Resolve
                      </Link>
                    </div>
                  </ActionCard>
                ))}
              </ActionSection>
            )}

            {/* 0b. Missed Follow-ups */}
            {(missedFollowUps?.length ?? 0) > 0 && (
              <ActionSection title="Missed Follow-ups" icon={PhoneCall} tone="warning" count={missedFollowUps?.length ?? 0}>
                {missedFollowUps?.map((lead: any) => (
                  <ActionCard key={lead.id}>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{lead.company_name}</p>
                      <p className="text-xs text-slate-500">{lead.industry} · {lead.city}</p>
                      <p className="mt-0.5 text-xs font-medium text-warn">
                        Due {new Date(lead.follow_up_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} — never actioned
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                          Call
                        </a>
                      )}
                      <Link href={`/admin/leads/${lead.id}`} className={buttonVariants({ variant: "subtle", size: "sm" })}>
                        Profile
                      </Link>
                    </div>
                  </ActionCard>
                ))}
              </ActionSection>
            )}

            {/* 1. Meetings Today */}
            {meetingsToday.length > 0 && (
            <ActionSection title="Meetings Today" icon={CalendarDays} count={meetingsToday.length}>
              {meetingsToday.map((lead: any) => (
                  <ActionCard key={lead.id}>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{lead.company_name}</p>
                      <p className="text-xs text-slate-500">{lead.industry} · {lead.city}</p>
                      {lead.follow_up_date && (
                        <p className="mt-0.5 text-xs font-medium text-brand-deep">
                          {new Date(lead.follow_up_date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                    <Link href={`/admin/leads/${lead.id}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                      Open Lead
                    </Link>
                  </ActionCard>
                ))}
            </ActionSection>
            )}

            {/* 2. Follow-ups Due Today */}
            {(followUpsDue?.length ?? 0) > 0 && (
            <ActionSection title="Follow-ups Due Today" icon={PhoneCall} count={followUpsDue?.length ?? 0}>
              {followUpsDue?.map((lead: any) => (
                  <ActionCard key={lead.id}>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{lead.company_name}</p>
                      <p className="text-xs text-slate-500">{lead.city} · {lead.industry}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <a href={`tel:${lead.phone}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                        Call
                      </a>
                      <Link href={`/admin/leads/${lead.id}`} className={buttonVariants({ variant: "subtle", size: "sm" })}>
                        Profile
                      </Link>
                    </div>
                  </ActionCard>
                ))}
            </ActionSection>
            )}

            {/* 3. Overdue Invoices */}
            {overdueInvoices.length > 0 && (
            <ActionSection title="Overdue Invoices" icon={AlertTriangle} tone="danger" count={overdueInvoices.length}>
              {overdueInvoices.map((inv: any) => {
                  const days = daysSince(inv.due_date || inv.created_at);
                  return (
                    <ActionCard key={inv.id}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">{(inv.client as any)?.business_name || "Unknown"}</p>
                          {days >= 7 && (
                            <Badge tone="danger" size="sm" className="shrink-0 uppercase">
                              <Flame className="h-2.5 w-2.5" /> Pause ads
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{formatINR(inv.total_amount)} · {days}d overdue</p>
                      </div>
                      <Link href="/admin/finance/invoices" className={buttonVariants({ variant: "secondary", size: "sm" })}>
                        View Invoice
                      </Link>
                    </ActionCard>
                  );
                })}
            </ActionSection>
            )}

            {/* 4. Stale Proposals (48h+) */}
            {staleProposals.length > 0 && (
              <ActionSection title="Proposals Not Replied (48h+)" icon={FileText} tone="warning" count={staleProposals.length}>
                {staleProposals.map((p: any) => (
                  <ActionCard key={p.id}>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{(p.lead as any)?.company_name || "Unknown"}</p>
                      <p className="text-xs text-slate-500">
                        {(p.total_monthly ?? p.monthly_value) ? formatINR(p.total_monthly ?? p.monthly_value) : "—"} · Sent {daysSince(p.sent_at)}d ago
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {(p.lead as any)?.phone && (
                        <a
                          href={`https://wa.me/91${String((p.lead as any).phone).replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(`Hi! Jabeer here from FortuneMarq. Just checking in on the growth proposal I sent over for ${(p.lead as any).company_name} — did you get a chance to go through it? Happy to jump on a quick call if anything needs clarifying.`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className={buttonVariants({ variant: "primary", size: "sm" })}
                        >
                          Follow up
                        </a>
                      )}
                      <Link href={`/admin/leads/${(p.lead as any)?.id}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                        Open
                      </Link>
                    </div>
                  </ActionCard>
                ))}
              </ActionSection>
            )}

            {/* 4. Tasks Due Today */}
            {tasksDueToday.length > 0 && (
              <ActionSection title="Tasks Due Today" icon={CheckSquare} count={tasksDueToday.length}>
                {tasksDueToday.slice(0, 5).map((task: any) => (
                  <ActionCard key={task.id}>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{task.title}</p>
                      <p className="text-xs text-slate-500">
                        {(task.projects as any)?.name || "No project"} · {(task.assignee as any)?.full_name || "Unassigned"}
                      </p>
                    </div>
                    <Link href="/tasks" className={buttonVariants({ variant: "secondary", size: "sm" })}>
                      Open Task
                    </Link>
                  </ActionCard>
                ))}
              </ActionSection>
            )}

            {/* 6. Onboarding Pending */}
            {onboardingClients.length > 0 && (
            <ActionSection title="Clients in Onboarding" icon={UserCheck} count={onboardingClients.length}>
              {onboardingClients.map((client: any) => (
                  <ActionCard key={client.id}>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{client.business_name}</p>
                      <p className="text-xs text-slate-500">Onboarding checklist incomplete</p>
                    </div>
                    <Link href={`/admin/clients/${client.id}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                      Open Client
                    </Link>
                  </ActionCard>
                ))}
            </ActionSection>
            )}
          </div>

          {/* RIGHT: Pipeline + Telecaller Activity */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-slate-900">
              <Target className="h-5 w-5 text-slate-500" />
              Pipeline Snapshot
            </h2>

            <Card className="space-y-2 p-5">
              {pipelineStages.map((stage) => {
                const count = stageCounts[stage.key] || 0;
                const maxCount = Math.max(...pipelineStages.map((s) => stageCounts[s.key] || 0), 1);
                return (
                  <Link
                    key={stage.key}
                    href={`/sales?stage=${stage.key}`}
                    className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-medium text-slate-700 transition-colors group-hover:text-brand-deep">
                        {stage.label}
                      </p>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-brand transition-all"
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-8 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-900">
                      {count}
                    </span>
                    <ArrowRight className="h-3 w-3 shrink-0 text-slate-300 transition-colors group-hover:text-brand-deep" />
                  </Link>
                );
              })}
              {pipelineLeads.length === 0 && (
                <p className="py-4 text-center text-xs italic text-slate-400">No active leads</p>
              )}
            </Card>

            {/* E2: Revenue Forecast Widget */}
            <Suspense fallback={<div className="h-48 animate-pulse rounded-xl border border-line bg-surface" />}>
              <RevenueForecastWidget />
            </Suspense>

            {/* Telecaller Activity Today */}
            <Card className="p-5">
              <h3 className="mb-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Phone className="h-3.5 w-3.5" /> Telecaller Activity Today
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Calls Made", value: callsToday, icon: Phone },
                  { label: "Meetings Booked", value: meetingsBookedToday, icon: CalendarDays },
                  { label: "PDFs Sent", value: pdfsSentToday, icon: FileText },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs text-slate-600">
                        <Icon className="h-3.5 w-3.5 text-slate-400" />
                        {stat.label}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-slate-900">
                        {stat.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-5">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/admin/users" className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
                  <Users className="h-4 w-4 text-slate-400" /> Manage Users
                </Link>
                <Link href="/admin/finance" className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
                  <DollarSign className="h-4 w-4 text-slate-400" /> Finance Dashboard
                </Link>
                <Link href="/tasks" className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
                  <CheckSquare className="h-4 w-4 text-slate-400" /> All Tasks
                </Link>
                <Link href="/admin/team" className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
                  <Clock className="h-4 w-4 text-slate-400" /> Team SOPs
                </Link>
                <Link href="/admin/audit-log" className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
                  <History className="h-4 w-4 text-slate-400" /> Audit Log
                </Link>
              </div>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Small helper components (server-side, no "use client" needed) ──

function ActionSection({
  title, icon: Icon, count, tone = "neutral", children
}: {
  title: string;
  icon: React.ElementType;
  count: number;
  tone?: "neutral" | "danger" | "warning";
  children: React.ReactNode;
}) {
  // Map the section tone to one of the five system tones for the count badge.
  const badgeTone: Tone = count > 0 && tone === "danger"
    ? "danger"
    : count > 0 && tone === "warning"
      ? "warning"
      : "neutral";
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <Icon className="h-4 w-4 text-slate-400" />
        <span className="font-display text-sm font-semibold text-slate-800">{title}</span>
        <Badge tone={badgeTone} size="sm" className="ml-auto tabular-nums">
          {count}
        </Badge>
      </div>
      <div className="divide-y divide-line">{children}</div>
    </Card>
  );
}

function ActionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50">
      {children}
    </div>
  );
}
