"use client";

import { useMemo, useState } from "react";

interface LogRow {
  id: string;
  lead_id: string | null;
  phone: string | null;
  template_id: string | null;
  delivery_status: string | null;
  sent_at: string | null;
  outcome: string | null;
  city: string | null;
  industry: string | null;
  company_name: string | null;
}

interface Props {
  logs: LogRow[];
}

// Delivery status → ordered funnel tier
const STATUS_TIER: Record<string, number> = {
  sent: 1,
  delivered: 2,
  read: 3,
  clicked: 4,
  booked: 5,
};

function tier(status: string | null): number {
  if (!status) return 0;
  const s = status.toLowerCase();
  for (const [k, v] of Object.entries(STATUS_TIER)) {
    if (s.includes(k)) return v;
  }
  return 1; // treat unknown as "sent"
}

function funnelCounts(rows: LogRow[]) {
  let sent = 0, delivered = 0, read = 0, clicked = 0, booked = 0;
  for (const r of rows) {
    const t = tier(r.delivery_status);
    if (t >= 1) sent++;
    if (t >= 2) delivered++;
    if (t >= 3) read++;
    if (t >= 4) clicked++;
    if (r.outcome === "meeting_booked" || t >= 5) booked++;
  }
  return { sent, delivered, read, clicked, booked };
}

function pct(num: number, den: number) {
  if (!den) return "—";
  return `${Math.round((num / den) * 100)}%`;
}

export default function TrackingClient({ logs }: Props) {
  const [cityFilter, setCityFilter] = useState("");
  const [nicheFilter, setNicheFilter] = useState("");

  const cities = useMemo(
    () => Array.from(new Set(logs.map((l) => l.city).filter(Boolean))).sort() as string[],
    [logs]
  );

  const niches = useMemo(() => {
    const src = cityFilter ? logs.filter((l) => l.city === cityFilter) : logs;
    return Array.from(new Set(src.map((l) => l.industry).filter(Boolean))).sort() as string[];
  }, [logs, cityFilter]);

  const filtered = useMemo(() => {
    let rows = logs;
    if (cityFilter) rows = rows.filter((l) => l.city === cityFilter);
    if (nicheFilter) rows = rows.filter((l) => l.industry === nicheFilter);
    return rows;
  }, [logs, cityFilter, nicheFilter]);

  // Aggregate by city × niche
  const grouped = useMemo(() => {
    const map = new Map<string, LogRow[]>();
    for (const r of filtered) {
      const k = `${r.city || "—"}__${r.industry || "—"}`;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    }
    return Array.from(map.entries())
      .map(([k, rows]) => {
        const [city, industry] = k.split("__");
        return { city, industry, rows, ...funnelCounts(rows) };
      })
      .sort((a, b) => b.sent - a.sent);
  }, [filtered]);

  const totals = useMemo(() => funnelCounts(filtered), [filtered]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-36">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">City</label>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            value={cityFilter}
            onChange={(e) => { setCityFilter(e.target.value); setNicheFilter(""); }}
          >
            <option value="">All cities</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-40">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Niche</label>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            value={nicheFilter}
            onChange={(e) => setNicheFilter(e.target.value)}
          >
            <option value="">All niches</option>
            {niches.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          No direct reports sent yet. Send from the{" "}
          <a href="/admin/direct-report" className="underline text-brand-deep">Direct Report</a> page.
        </div>
      ) : (
        <>
          {/* Summary funnel */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">
              Funnel — {filtered.length} send{filtered.length !== 1 ? "s" : ""}
              {cityFilter ? ` · ${cityFilter}` : ""}
              {nicheFilter ? ` · ${nicheFilter}` : ""}
            </h2>
            <div className="grid grid-cols-5 gap-3 text-center">
              <FunnelStat label="Sent" value={totals.sent} base={totals.sent} color="slate" />
              <FunnelStat label="Delivered" value={totals.delivered} base={totals.sent} color="blue" />
              <FunnelStat label="Read" value={totals.read} base={totals.sent} color="emerald" />
              <FunnelStat label="Clicked / Replied" value={totals.clicked} base={totals.sent} color="violet" />
              <FunnelStat label="Booked" value={totals.booked} base={totals.sent} color="brand" />
            </div>
          </div>

          {/* Per niche×city breakdown */}
          {grouped.length > 1 && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                  By niche × city
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">City</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Niche</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Sent</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Delivered</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Read</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Clicked</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Booked</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Read %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {grouped.map((g) => (
                      <tr key={`${g.city}__${g.industry}`} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-medium text-slate-800">{g.city}</td>
                        <td className="px-4 py-2 text-slate-600">{g.industry}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{g.sent}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-blue-700">{g.delivered}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-emerald-700">{g.read}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-violet-700">{g.clicked}</td>
                        <td className="px-4 py-2 text-right tabular-nums font-semibold text-brand-deep">{g.booked}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-slate-500">{pct(g.read, g.sent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent sends */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                Recent sends {filtered.length > 100 ? "(last 100)" : ""}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Business</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">City · Niche</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Template</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500">Status</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Sent at</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.slice(0, 100).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium text-slate-800">
                        {log.company_name || log.phone || "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-500 text-xs">
                        {log.city || "—"} · {log.industry || "—"}
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-500 font-mono">
                        {log.template_id || "—"}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <StatusBadge status={log.delivery_status} />
                      </td>
                      <td className="px-4 py-2 text-right text-xs text-slate-400">
                        {log.sent_at
                          ? new Date(log.sent_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FunnelStat({
  label, value, base, color,
}: {
  label: string; value: number; base: number; color: string;
}) {
  const colorMap: Record<string, string> = {
    slate: "text-slate-700 bg-slate-50 border-slate-200",
    blue: "text-blue-700 bg-blue-50 border-blue-200",
    emerald: "text-emerald-700 bg-emerald-50 border-emerald-200",
    violet: "text-violet-700 bg-violet-50 border-violet-200",
    brand: "text-brand-deep bg-emerald-50 border-emerald-200",
  };
  return (
    <div className={`rounded-xl border p-3 ${colorMap[color] || colorMap.slate}`}>
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wide font-semibold mt-0.5">{label}</p>
      <p className="text-xs mt-1 opacity-60">{pct(value, base)}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const s = (status || "sent").toLowerCase();
  if (s.includes("read"))
    return <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Read</span>;
  if (s.includes("delivered"))
    return <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">Delivered</span>;
  if (s.includes("failed") || s.includes("error"))
    return <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">Failed</span>;
  if (s.includes("clicked"))
    return <span className="text-xs font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">Clicked</span>;
  return <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Sent</span>;
}
