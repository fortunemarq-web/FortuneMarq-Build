import type { Metadata } from "next";
import Link from "next/link";
import { createServerClientWithCookies } from "@/lib/supabase-server";
import { fetchStrategyArchive, fetchStrategyRunCompletion, fetchStrategyRunOutcome } from "@/app/admin/strategy/actions";
import {
  Megaphone,
  Brain,
  TrendingUp,
  BarChart3,
  Users,
  FileText,
  DollarSign,
  Trophy,
  ArrowRight,
  CalendarDays,
  Search,
  MapPin,
  Target,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Marketing Hub — FortuneMarq",
};

const INBOUND_SOURCES = ["lp", "meta_lead_ad", "ctwa", "whatsapp", "google_lead_form", "call", "gbp", "referral", "dm", "walk_in"];

function fmtINR(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export default async function MarketingHubPage() {
  const supabase = await createServerClientWithCookies();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const monthStartDate = monthStart.split("T")[0];

  // ── Top-line metrics (all real) ──
  const [
    leadsRes,
    inboundLeadsRes,
    wonRes,
    contentRes,
    contentPipelineRes,
    spendRes,
    archiveRaw,
  ] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", monthStart),
    supabase.from("leads").select("source").gte("created_at", monthStart),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("outreach_stage", "won").gte("created_at", monthStart),
    supabase.from("content_pieces" as any).select("id", { count: "exact", head: true }).eq("status", "published").gte("published_date", monthStart),
    supabase.from("content_pieces" as any).select("id", { count: "exact", head: true }).neq("status", "published"),
    supabase.from("ad_insights_daily" as any).select("spend").gte("date", monthStartDate),
    fetchStrategyArchive() as Promise<any[]>,
  ]);

  const leadsMtd = leadsRes.count || 0;
  const inboundMtd = ((inboundLeadsRes.data as any[]) || []).filter((l) => INBOUND_SOURCES.includes(l.source)).length;
  const wonMtd = wonRes.count || 0;
  const contentMtd = contentRes.count || 0;
  const contentPipeline = contentPipelineRes.count || 0;
  const spendMtd = ((spendRes.data as any[]) || []).reduce((s, r) => s + Number(r.spend || 0), 0);

  // ── Recent strategies with progress + outcomes (the loop) ──
  const recentRuns = (archiveRaw || []).slice(0, 5);
  const runsEnriched = await Promise.all(
    recentRuns.map(async (run: any) => {
      const [counts, outcome] = await Promise.all([
        fetchStrategyRunCompletion(run.id),
        fetchStrategyRunOutcome(run),
      ]);
      return { run, counts, outcome };
    })
  );
  const totalStrategies = (archiveRaw || []).length;

  const kpis = [
    { label: "Leads (MTD)", value: String(leadsMtd), sub: `${inboundMtd} inbound`, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Clients Won (MTD)", value: String(wonMtd), sub: "from all sources", icon: Trophy, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Content Published (MTD)", value: String(contentMtd), sub: `${contentPipeline} in pipeline`, icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Ad Spend (MTD)", value: fmtINR(spendMtd), sub: "from imported reports", icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const loopCards = [
    {
      stage: "1 · Plan",
      title: "Strategy Engine",
      desc: "Turn a strategy into a dated, assigned task plan with AI.",
      href: "/admin/strategy",
      icon: Brain,
      accent: "from-indigo-500 to-purple-600",
      stat: `${totalStrategies} ${totalStrategies === 1 ? "strategy" : "strategies"} run`,
    },
    {
      stage: "2 · Execute",
      title: "Growth Hub",
      desc: "Do the work — publish content and run city/niche acquisition.",
      href: "/admin/growth",
      icon: TrendingUp,
      accent: "from-emerald-500 to-green-600",
      stat: `${contentMtd} published · ${contentPipeline} in pipeline`,
    },
    {
      stage: "3 · Track",
      title: "Marketing Analytics",
      desc: "Measure the inbound funnel, CPL, spend and conversion.",
      href: "/admin/marketing",
      icon: BarChart3,
      accent: "from-blue-500 to-cyan-600",
      stat: `${inboundMtd} inbound leads (MTD)`,
    },
  ];

  const quickLinks = [
    { label: "Content Calendar", href: "/admin/marketing?tab=content", icon: CalendarDays },
    { label: "Paid Campaigns", href: "/admin/marketing?tab=paid", icon: Megaphone },
    { label: "Inbound Funnel", href: "/admin/marketing?tab=inbound", icon: BarChart3 },
    { label: "Organic & SEO", href: "/admin/growth/seo", icon: Search },
    { label: "Client Acquisition", href: "/admin/growth?tab=acquisition", icon: MapPin },
    { label: "Strategy Archive", href: "/admin/strategy/archive", icon: Target },
  ];

  return (
    <div className="min-h-full bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/20">
            <Megaphone className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Marketing Hub</h1>
            <p className="text-sm text-slate-500 mt-1">
              One front door for FortuneMarq&apos;s growth engine — plan, execute, and measure in one flow.
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${k.bg} flex items-center justify-center`}>
                  <k.icon className={`h-5 w-5 ${k.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 font-mono">{k.value}</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{k.label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* The loop */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">The Loop</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loopCards.map((c) => (
              <Link
                key={c.title}
                href={c.href}
                className="group bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col hover:border-[#42CA80]/50 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${c.accent} text-white shadow-sm`}>
                    <c.icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{c.stage}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{c.title}</h3>
                <p className="text-sm text-slate-500 mt-1 flex-1">{c.desc}</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-600">{c.stat}</span>
                  <ArrowRight className="h-4 w-4 text-[#42CA80] group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent strategies → outcomes */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">Recent Strategies → Results</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Did the plan produce real output? Tracked live during each timeframe.</p>
            </div>
            <Link href="/admin/strategy/archive" className="text-xs font-bold text-[#42CA80] hover:text-[#38b571] inline-flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {runsEnriched.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Brain className="h-10 w-10 text-slate-200 mx-auto" />
              <p className="text-sm text-slate-400 mt-3">No strategies run yet.</p>
              <Link href="/admin/strategy" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#42CA80] hover:underline">
                Create your first strategy <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {runsEnriched.map(({ run, counts, outcome }) => {
                const progress = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;
                return (
                  <li key={run.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-slate-50/60 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{run.title}</p>
                      <p className="text-[11px] font-mono text-slate-400 truncate">{run.destination}</p>
                    </div>
                    <div className="flex items-center gap-2 sm:w-40">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#42CA80]" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 min-w-[34px] text-right">{progress}%</span>
                    </div>
                    <div className="sm:w-48 sm:text-right">
                      <span className={`text-xs font-semibold ${outcome.value > 0 ? "text-emerald-700" : "text-slate-400"}`}>
                        {outcome.label}
                      </span>
                      {!outcome.windowElapsed && outcome.kind !== "other" && (
                        <span className="ml-1.5 text-[9px] uppercase tracking-wide text-amber-500 font-bold">live</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Quick links */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Jump To</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickLinks.map((q) => (
              <Link
                key={q.label}
                href={q.href}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col items-center gap-2 text-center hover:border-[#42CA80]/50 hover:shadow-md transition-all group"
              >
                <q.icon className="h-5 w-5 text-slate-400 group-hover:text-[#42CA80] transition-colors" />
                <span className="text-xs font-semibold text-slate-700">{q.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
