"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
    Inbox, Upload, Link2, Copy, Check, Zap, Loader2, RefreshCw, AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { importSpendRows, SpendRow } from "@/app/admin/marketing/actions";
import { toast } from "@/components/ui/toast";
import clsx from "clsx";

const RANGES = [
    { label: "7d", days: 7 },
    { label: "30d", days: 30 },
    { label: "90d", days: 90 },
];

const INBOUND_SOURCES = ["lp", "meta_lead_ad", "ctwa", "whatsapp", "google_lead_form", "call", "gbp", "referral", "dm", "walk_in"];

const STAGE_ORDER = ["touch1_pending", "no_answer", "follow_back", "curiosity_sent", "pdf_sent", "follow_up_due", "meeting_booked", "proposal_sent", "won"];
const MEETING_PLUS = ["meeting_booked", "proposal_sent", "won"];
const PROPOSAL_PLUS = ["proposal_sent", "won"];

function fmtINR(n: number) {
    return "₹" + Math.round(n).toLocaleString("en-IN");
}

function median(values: number[]): number | null {
    if (!values.length) return null;
    const s = [...values].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
}

function fmtMins(mins: number | null): string {
    if (mins === null) return "—";
    if (mins < 60) return `${Math.round(mins)}m`;
    if (mins < 1440) return `${(mins / 60).toFixed(1)}h`;
    return `${(mins / 1440).toFixed(1)}d`;
}

/** Tolerant CSV line parser (handles quoted fields with commas). */
function parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [], field = "", inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuotes) {
            if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
            else if (c === '"') inQuotes = false;
            else field += c;
        } else if (c === '"') inQuotes = true;
        else if (c === ",") { row.push(field); field = ""; }
        else if (c === "\n" || c === "\r") {
            if (field || row.length) { row.push(field); rows.push(row); row = []; field = ""; }
            if (c === "\r" && text[i + 1] === "\n") i++;
        } else field += c;
    }
    if (field || row.length) { row.push(field); rows.push(row); }
    return rows.filter((r) => r.some((f) => f.trim()));
}

/** Map a Meta / Google / generic spend export to SpendRow[]. */
function mapSpendCsv(rows: string[][]): { rows: SpendRow[]; platform: string } | { error: string } {
    if (rows.length < 2) return { error: "CSV has no data rows" };
    const header = rows[0].map((h) => h.trim().toLowerCase());
    const idx = (...names: string[]) => header.findIndex((h) => names.some((n) => h === n || h.startsWith(n)));

    const dateI = idx("day", "date");
    const metaCampI = idx("campaign name");
    const googleCampI = idx("campaign");
    const metaSpendI = idx("amount spent");
    const googleSpendI = idx("cost");
    const imprI = idx("impressions", "impr.");
    const metaClicksI = idx("link clicks");
    const googleClicksI = idx("clicks");
    const resultsI = idx("results", "leads", "conversions");

    const isMeta = metaCampI !== -1 && metaSpendI !== -1;
    const isGoogle = !isMeta && googleCampI !== -1 && googleSpendI !== -1;
    if (dateI === -1 || (!isMeta && !isGoogle)) {
        return { error: "Unrecognised format. Export a daily report with Day + Campaign + Spend columns from Meta or Google." };
    }

    const campI = isMeta ? metaCampI : googleCampI;
    const spendI = isMeta ? metaSpendI : googleSpendI;
    const clicksI = isMeta ? (metaClicksI !== -1 ? metaClicksI : googleClicksI) : googleClicksI;
    const platform = isMeta ? "meta" : "google";
    const num = (v?: string) => parseFloat((v || "0").replace(/[₹,"\s]/g, "")) || 0;

    const out: SpendRow[] = [];
    for (const r of rows.slice(1)) {
        const rawDate = (r[dateI] || "").trim();
        const d = new Date(rawDate);
        if (!rawDate || isNaN(d.getTime())) continue;
        out.push({
            date: d.toISOString().split("T")[0],
            campaign_name: (r[campI] || "").trim(),
            platform,
            spend: num(r[spendI]),
            impressions: Math.round(num(r[imprI >= 0 ? imprI : -1])),
            clicks: Math.round(num(r[clicksI >= 0 ? clicksI : -1])),
            leads: Math.round(num(r[resultsI >= 0 ? resultsI : -1])),
        });
    }
    return { rows: out.filter((r) => r.campaign_name), platform };
}

export default function InboundFunnelTab({ initialDays = 30 }: { initialDays?: number }) {
    const supabase = createClient() as any;
    const [days, setDays] = useState(initialDays);
    useEffect(() => { setDays(initialDays); }, [initialDays]);
    const [loading, setLoading] = useState(true);
    const [leads, setLeads] = useState<any[]>([]);
    const [insights, setInsights] = useState<any[]>([]);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [niches, setNiches] = useState<any[]>([]);
    const [importing, setImporting] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    // UTM builder state
    const [utmCampaign, setUtmCampaign] = useState("");
    const [utmSource, setUtmSource] = useState("facebook");
    const [utmNiche, setUtmNiche] = useState("");
    const [copied, setCopied] = useState(false);

    const load = async () => {
        setLoading(true);
        const since = new Date(Date.now() - days * 86400000).toISOString();
        const sinceDate = since.split("T")[0];
        const [l, i, c, e, n] = await Promise.all([
            supabase.from("leads")
                .select("id, source, lead_source, captured_at, first_contact_at, outreach_stage, created_at")
                .gte("created_at", since).limit(5000),
            supabase.from("ad_insights_daily").select("date, platform, spend, impressions, clicks, leads").gte("date", sinceDate),
            supabase.from("ad_campaigns").select("id, campaign_name, platform, status, cpl_target").order("campaign_name"),
            supabase.from("inbound_events").select("id, channel, status, error, created_at").order("created_at", { ascending: false }).limit(20),
            supabase.from("niches").select("name, slug").eq("is_active", true).order("name"),
        ]);
        setLeads(l.data || []);
        setInsights(i.data || []);
        setCampaigns(c.data || []);
        setEvents(e.data || []);
        setNiches(n.data || []);
        if (!utmNiche && n.data?.length) setUtmNiche(n.data[0].slug);
        setLoading(false);
    };

    useEffect(() => { load(); }, [days]);

    const inboundLeads = useMemo(() => leads.filter((l) => INBOUND_SOURCES.includes(l.source)), [leads]);

    const stats = useMemo(() => {
        const spend = insights.reduce((s, r) => s + Number(r.spend || 0), 0);
        const contacted = inboundLeads.filter((l) => l.first_contact_at);
        const meetings = inboundLeads.filter((l) => MEETING_PLUS.includes(l.outreach_stage));
        const proposals = inboundLeads.filter((l) => PROPOSAL_PLUS.includes(l.outreach_stage));
        const won = inboundLeads.filter((l) => l.outreach_stage === "won");
        const responseMins = contacted
            .filter((l) => l.captured_at)
            .map((l) => (new Date(l.first_contact_at).getTime() - new Date(l.captured_at).getTime()) / 60000)
            .filter((m) => m >= 0);
        return {
            spend,
            leads: inboundLeads.length,
            cpl: inboundLeads.length > 0 ? spend / inboundLeads.length : null,
            contacted: contacted.length,
            meetings: meetings.length,
            costPerMeeting: meetings.length > 0 ? spend / meetings.length : null,
            proposals: proposals.length,
            won: won.length,
            cac: won.length > 0 ? spend / won.length : null,
            medianResponse: median(responseMins),
        };
    }, [inboundLeads, insights]);

    const funnel = [
        { label: "Leads", value: stats.leads },
        { label: "Contacted", value: stats.contacted },
        { label: "Meetings", value: stats.meetings },
        { label: "Proposals", value: stats.proposals },
        { label: "Won", value: stats.won },
    ];
    const funnelMax = Math.max(stats.leads, 1);

    const channels = useMemo(() => {
        const by: Record<string, { label: string; leads: number; contacted: number; meetings: number; won: number }> = {};
        inboundLeads.forEach((l) => {
            const key = l.source;
            by[key] ??= { label: l.lead_source || key, leads: 0, contacted: 0, meetings: 0, won: 0 };
            by[key].leads++;
            if (l.first_contact_at) by[key].contacted++;
            if (MEETING_PLUS.includes(l.outreach_stage)) by[key].meetings++;
            if (l.outreach_stage === "won") by[key].won++;
        });
        return Object.entries(by).map(([key, v]) => ({ key, ...v })).sort((a, b) => b.leads - a.leads);
    }, [inboundLeads]);

    const utmUrl = useMemo(() => {
        if (!utmNiche) return "";
        const base = typeof window !== "undefined" ? window.location.origin : "";
        const p = new URLSearchParams();
        p.set("utm_source", utmSource);
        p.set("utm_medium", utmSource === "google" ? "cpc" : "paid_social");
        if (utmCampaign) p.set("utm_campaign", utmCampaign);
        return `${base}/lp/${utmNiche}?${p.toString()}`;
    }, [utmNiche, utmSource, utmCampaign]);

    const handleFile = async (file: File) => {
        setImporting(true);
        try {
            const text = await file.text();
            const mapped = mapSpendCsv(parseCsv(text));
            if ("error" in mapped) {
                toast.error("Import failed", mapped.error);
                return;
            }
            if (!mapped.rows.length) {
                toast.error("No usable rows", "Check the export has Day, Campaign and Spend columns.");
                return;
            }
            const res = await importSpendRows(mapped.rows);
            if (res.success) {
                toast.success(`${res.imported} day-rows imported`, res.campaignsCreated ? `${res.campaignsCreated} new campaign(s) auto-created` : "");
                load();
            } else {
                toast.error("Import failed", res.error);
            }
        } finally {
            setImporting(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    return (
        <div className="space-y-6 mt-6">
            {/* Range picker */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {RANGES.map((r) => (
                        <button
                            key={r.days}
                            onClick={() => setDays(r.days)}
                            className={clsx(
                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                                days === r.days ? "bg-[#42CA80] text-black" : "bg-[#1a1a1a] text-[#a1a1aa] border border-[#333] hover:text-white"
                            )}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
                <button onClick={load} className="flex items-center gap-2 text-xs text-[#a1a1aa] hover:text-white transition-colors">
                    <RefreshCw className={clsx("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
                </button>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                    { label: "Ad Spend", value: fmtINR(stats.spend) },
                    { label: "Inbound Leads", value: stats.leads },
                    { label: "CPL", value: stats.cpl !== null ? fmtINR(stats.cpl) : "—" },
                    { label: "Meetings", value: stats.meetings },
                    { label: "Cost / Meeting", value: stats.costPerMeeting !== null ? fmtINR(stats.costPerMeeting) : "—" },
                    { label: "Clients Won", value: stats.won },
                    { label: "Speed to Lead", value: fmtMins(stats.medianResponse) },
                ].map((k) => (
                    <div key={k.label} className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#71717a] mb-1">{k.label}</p>
                        <p className="text-xl font-bold text-white">{k.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Funnel */}
                <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Zap className="h-4 w-4 text-[#42CA80]" /> Inbound Funnel</h3>
                    <div className="space-y-3">
                        {funnel.map((s, i) => {
                            const prev = i > 0 ? funnel[i - 1].value : null;
                            const conv = prev && prev > 0 ? Math.round((s.value / prev) * 100) : null;
                            return (
                                <div key={s.label}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-bold text-[#a1a1aa]">{s.label}</span>
                                        <span className="text-white font-bold">
                                            {s.value}
                                            {conv !== null && <span className="text-[#71717a] font-medium ml-2">{conv}% of prev</span>}
                                        </span>
                                    </div>
                                    <div className="h-3 bg-[#0f0f0f] rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-[#42CA80] to-emerald-700 rounded-full transition-all duration-700" style={{ width: `${(s.value / funnelMax) * 100}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {stats.leads === 0 && !loading && (
                        <p className="text-xs text-[#71717a] italic mt-4">No inbound leads in this period yet. Leads from LPs, lead ads, calls and referrals appear here automatically.</p>
                    )}
                </div>

                {/* Channel scoreboard */}
                <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Inbox className="h-4 w-4 text-blue-400" /> Channels</h3>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-[10px] uppercase tracking-widest text-[#71717a]">
                                <th className="text-left pb-2">Channel</th>
                                <th className="text-right pb-2">Leads</th>
                                <th className="text-right pb-2">Contacted</th>
                                <th className="text-right pb-2">Meetings</th>
                                <th className="text-right pb-2">Won</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#262626]">
                            {channels.map((c) => (
                                <tr key={c.key}>
                                    <td className="py-2 text-white font-medium">{c.label}</td>
                                    <td className="py-2 text-right text-white">{c.leads}</td>
                                    <td className="py-2 text-right text-[#a1a1aa]">{c.contacted} <span className="text-[#71717a]">({c.leads ? Math.round((c.contacted / c.leads) * 100) : 0}%)</span></td>
                                    <td className="py-2 text-right text-[#a1a1aa]">{c.meetings}</td>
                                    <td className="py-2 text-right text-[#42CA80] font-bold">{c.won}</td>
                                </tr>
                            ))}
                            {channels.length === 0 && (
                                <tr><td colSpan={5} className="py-6 text-center text-[#71717a] italic text-xs">No inbound leads yet in this period.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* UTM builder */}
                <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
                    <h3 className="text-white font-bold mb-1 flex items-center gap-2"><Link2 className="h-4 w-4 text-purple-400" /> UTM Link Builder</h3>
                    <p className="text-xs text-[#71717a] mb-4">Every ad must use a link built here — that&apos;s what makes attribution work.</p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#71717a]">Landing Page</label>
                            <select value={utmNiche} onChange={(e) => setUtmNiche(e.target.value)} className="mt-1 w-full bg-[#0f0f0f] border border-[#333] rounded-lg px-2 py-2 text-sm text-white">
                                {niches.map((n) => <option key={n.slug} value={n.slug}>{n.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#71717a]">Source</label>
                            <select value={utmSource} onChange={(e) => setUtmSource(e.target.value)} className="mt-1 w-full bg-[#0f0f0f] border border-[#333] rounded-lg px-2 py-2 text-sm text-white">
                                <option value="facebook">Facebook / Instagram</option>
                                <option value="google">Google</option>
                                <option value="whatsapp">WhatsApp</option>
                                <option value="linkedin">LinkedIn</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#71717a]">Campaign</label>
                            <select value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} className="mt-1 w-full bg-[#0f0f0f] border border-[#333] rounded-lg px-2 py-2 text-sm text-white">
                                <option value="">— pick a campaign —</option>
                                {campaigns.map((c) => <option key={c.id} value={c.campaign_name}>{c.campaign_name} ({c.platform})</option>)}
                            </select>
                        </div>
                    </div>
                    {utmUrl && (
                        <div className="flex items-center gap-2 bg-[#0f0f0f] border border-[#333] rounded-lg px-3 py-2">
                            <code className="text-[11px] text-[#42CA80] flex-1 truncate">{utmUrl}</code>
                            <button
                                onClick={() => { navigator.clipboard.writeText(utmUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                                className="text-[#a1a1aa] hover:text-white"
                            >
                                {copied ? <Check className="h-4 w-4 text-[#42CA80]" /> : <Copy className="h-4 w-4" />}
                            </button>
                        </div>
                    )}
                </div>

                {/* Spend CSV import + inbound events */}
                <div className="space-y-6">
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-1 flex items-center gap-2"><Upload className="h-4 w-4 text-amber-400" /> Import Ad Spend (CSV)</h3>
                        <p className="text-xs text-[#71717a] mb-4">Daily report export from Meta Ads Manager or Google Ads. Campaigns are matched by name (auto-created if new).</p>
                        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                        <button
                            onClick={() => fileRef.current?.click()}
                            disabled={importing}
                            className="flex items-center gap-2 bg-[#42CA80] hover:bg-[#35A66A] disabled:opacity-50 text-black font-bold px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            {importing ? "Importing…" : "Choose CSV"}
                        </button>
                    </div>

                    <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2"><AlertCircle className="h-4 w-4 text-[#a1a1aa]" /> Recent Inbound Events</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {events.map((ev) => (
                                <div key={ev.id} className="flex items-center justify-between text-xs">
                                    <span className="text-[#a1a1aa]">{ev.channel}</span>
                                    <span className={clsx(
                                        "font-bold uppercase text-[10px] px-2 py-0.5 rounded-full",
                                        ev.status === "processed" ? "bg-emerald-500/10 text-emerald-400" :
                                        ev.status === "duplicate" ? "bg-blue-500/10 text-blue-400" :
                                        ev.status === "failed" ? "bg-red-500/10 text-red-400" : "bg-[#333] text-[#a1a1aa]"
                                    )}>{ev.status}</span>
                                    <span className="text-[#71717a]">{new Date(ev.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                                </div>
                            ))}
                            {events.length === 0 && <p className="text-xs text-[#71717a] italic">No inbound webhook events yet.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
