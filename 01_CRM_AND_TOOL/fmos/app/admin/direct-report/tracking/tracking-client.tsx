"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge, type Tone } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

interface LogRow {
  id: string;
  lead_id: string | null;
  phone: string | null;
  template_id: string | null;
  template: string | null;
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
          <Label htmlFor="city-filter">City</Label>
          <Select
            id="city-filter"
            value={cityFilter}
            onChange={(e) => { setCityFilter(e.target.value); setNicheFilter(""); }}
          >
            <option value="">All cities</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        <div className="flex-1 min-w-40">
          <Label htmlFor="niche-filter">Niche</Label>
          <Select
            id="niche-filter"
            value={nicheFilter}
            onChange={(e) => setNicheFilter(e.target.value)}
          >
            <option value="">All niches</option>
            {niches.map((n) => <option key={n} value={n}>{n}</option>)}
          </Select>
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
          <Card className="p-5">
            <h2 className="font-display text-sm font-semibold text-slate-900 mb-4">
              Funnel — {filtered.length} send{filtered.length !== 1 ? "s" : ""}
              {cityFilter ? ` · ${cityFilter}` : ""}
              {nicheFilter ? ` · ${nicheFilter}` : ""}
            </h2>
            <div className="grid grid-cols-5 gap-3 text-center">
              <FunnelStat label="Sent" value={totals.sent} base={totals.sent} tone="neutral" />
              <FunnelStat label="Delivered" value={totals.delivered} base={totals.sent} tone="info" />
              <FunnelStat label="Read" value={totals.read} base={totals.sent} tone="info" />
              <FunnelStat label="Clicked / Replied" value={totals.clicked} base={totals.sent} tone="brand" />
              <FunnelStat label="Booked" value={totals.booked} base={totals.sent} tone="brand" />
            </div>
          </Card>

          {/* Per niche×city breakdown */}
          {grouped.length > 1 && (
            <Card className="overflow-hidden">
              <div className="px-5 py-3 border-b border-line">
                <h2 className="font-display text-sm font-semibold text-slate-900">
                  By niche × city
                </h2>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <TR className="hover:bg-transparent">
                      <TH>City</TH>
                      <TH>Niche</TH>
                      <TH className="text-right">Sent</TH>
                      <TH className="text-right">Delivered</TH>
                      <TH className="text-right">Read</TH>
                      <TH className="text-right">Clicked</TH>
                      <TH className="text-right">Booked</TH>
                      <TH className="text-right">Read %</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {grouped.map((g) => (
                      <TR key={`${g.city}__${g.industry}`}>
                        <TD className="font-medium text-slate-800">{g.city}</TD>
                        <TD className="text-slate-600">{g.industry}</TD>
                        <TD className="text-right tabular-nums">{g.sent}</TD>
                        <TD className="text-right tabular-nums text-info">{g.delivered}</TD>
                        <TD className="text-right tabular-nums text-info">{g.read}</TD>
                        <TD className="text-right tabular-nums text-brand-deep">{g.clicked}</TD>
                        <TD className="text-right tabular-nums font-semibold text-brand-deep">{g.booked}</TD>
                        <TD className="text-right tabular-nums text-slate-500">{pct(g.read, g.sent)}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            </Card>
          )}

          {/* Recent sends */}
          <Card className="overflow-hidden">
            <div className="px-5 py-3 border-b border-line">
              <h2 className="font-display text-sm font-semibold text-slate-900">
                Recent sends {filtered.length > 100 ? "(last 100)" : ""}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    <TH>Business</TH>
                    <TH>City · Niche</TH>
                    <TH>Template</TH>
                    <TH className="text-center">Status</TH>
                    <TH className="text-right">Sent at</TH>
                  </TR>
                </THead>
                <TBody>
                  {filtered.slice(0, 100).map((log) => (
                    <TR key={log.id}>
                      <TD className="font-medium text-slate-800">
                        {log.company_name || log.phone || "—"}
                      </TD>
                      <TD className="text-slate-500 text-xs">
                        {log.city || "—"} · {log.industry || "—"}
                      </TD>
                      <TD className="text-xs text-slate-500 tabular-nums">
                        {log.template || log.template_id || "—"}
                      </TD>
                      <TD className="text-center">
                        <StatusBadge status={log.delivery_status} />
                      </TD>
                      <TD className="text-right text-xs text-slate-400">
                        {log.sent_at
                          ? new Date(log.sent_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })
                          : "—"}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function FunnelStat({
  label, value, base, tone,
}: {
  label: string; value: number; base: number; tone: Tone;
}) {
  const toneMap: Record<Tone, string> = {
    neutral: "text-slate-700 bg-slate-50 border-line",
    info: "text-info bg-info-soft border-info-line",
    brand: "text-brand-deep bg-brand-soft border-brand-line",
    warning: "text-warn bg-warn-soft border-warn-line",
    danger: "text-danger bg-danger-soft border-danger-line",
  };
  return (
    <div className={`rounded-xl border p-3 ${toneMap[tone] || toneMap.neutral}`}>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] uppercase tracking-wide font-semibold mt-0.5">{label}</p>
      <p className="text-xs mt-1 opacity-60">{pct(value, base)}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const s = (status || "sent").toLowerCase();
  if (s.includes("read"))
    return <Badge tone="brand" size="sm">Read</Badge>;
  if (s.includes("delivered"))
    return <Badge tone="info" size="sm">Delivered</Badge>;
  if (s.includes("failed") || s.includes("error"))
    return <Badge tone="danger" size="sm">Failed</Badge>;
  if (s.includes("clicked"))
    return <Badge tone="brand" size="sm">Clicked</Badge>;
  return <Badge tone="neutral" size="sm">Sent</Badge>;
}
