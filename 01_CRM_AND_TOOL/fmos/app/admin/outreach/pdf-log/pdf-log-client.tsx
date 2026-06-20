"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { inputClasses } from "@/components/ui/input";
import { cn } from "@/lib/cn";

interface PdfLog {
  id: string;
  created_at: string;
  pdf_name: string | null;
  lead_id: string;
  lead?: { company_name: string; industry: string | null; city: string | null; outreach_stage: string | null };
  actor?: { full_name: string };
}

const STAGE_LABELS: Record<string, string> = {
  touch1_pending: "Touch 1 Pending",
  curiosity_sent: "Direct Report Sent",
  pdf_sent: "PDF Sent",
  follow_up_due: "Follow-up Due",
  meeting_booked: "Meeting Booked",
  proposal_sent: "Proposal Sent",
  won: "Won",
  lost: "Lost",
  dead: "Dead",
  revival: "Revival",
};

export default function PdfLogClient({ logs }: { logs: PdfLog[] }) {
  const [query, setQuery] = useState("");
  const [filterNiche, setFilterNiche] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterPdf, setFilterPdf] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const niches = [...new Set(logs.map(l => l.lead?.industry).filter(Boolean))] as string[];
  const cities = [...new Set(logs.map(l => l.lead?.city).filter(Boolean))] as string[];
  const pdfNames = [...new Set(logs.map(l => l.pdf_name).filter(Boolean))] as string[];

  const filtered = logs.filter(log => {
    const name = log.lead?.company_name?.toLowerCase() || "";
    if (query && !name.includes(query.toLowerCase()) && !(log.pdf_name?.toLowerCase().includes(query.toLowerCase()))) return false;
    if (filterNiche && log.lead?.industry !== filterNiche) return false;
    if (filterCity && log.lead?.city !== filterCity) return false;
    if (filterPdf && log.pdf_name !== filterPdf) return false;
    if (filterDateFrom && new Date(log.created_at) < new Date(filterDateFrom)) return false;
    if (filterDateTo && new Date(log.created_at) > new Date(filterDateTo + "T23:59:59")) return false;
    return true;
  });

  return (
    <div className="min-h-full bg-canvas">
      {/* Header */}
      <div className="border-b border-line bg-surface px-4 py-4 shadow-sm">
        <div className="mx-auto max-w-7xl">
          <Link href="/admin/outreach" className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-brand-deep">
            <ArrowLeft className="h-4 w-4" /> Outreach Board
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-2 font-display text-xl font-semibold tracking-[-0.02em] text-slate-900">
                <FileText className="h-5 w-5 text-brand-deep" /> PDF Delivery Log
              </h1>
              <p className="mt-1 text-xs text-slate-500 tabular-nums">{filtered.length} PDFs sent</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Filters */}
        <Card className="mb-5 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="Search lead name or PDF..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <Select value={filterNiche} onChange={e => setFilterNiche(e.target.value)} className="w-auto min-w-[130px]">
              <option value="">All Niches</option>
              {niches.map(n => <option key={n} value={n}>{n}</option>)}
            </Select>
            <Select value={filterCity} onChange={e => setFilterCity(e.target.value)} className="w-auto min-w-[120px]">
              <option value="">All Cities</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select value={filterPdf} onChange={e => setFilterPdf(e.target.value)} className="w-auto min-w-[130px]">
              <option value="">All PDFs</option>
              {pdfNames.map(p => <option key={p} value={p}>{p}</option>)}
            </Select>
            <div className="flex items-center gap-2">
              <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                className={cn(inputClasses, "w-auto")} />
              <span className="text-xs text-slate-400">to</span>
              <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                className={cn(inputClasses, "w-auto")} />
            </div>
            {(query || filterNiche || filterCity || filterPdf || filterDateFrom || filterDateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setQuery(""); setFilterNiche(""); setFilterCity(""); setFilterPdf(""); setFilterDateFrom(""); setFilterDateTo(""); }}
              >
                Clear
              </Button>
            )}
          </div>
        </Card>

        {/* Table */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No PDFs sent yet"
            description="PDF deliveries to leads will appear here once you start sending reports."
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    {["Lead Name", "Niche", "City", "PDF Name", "Sent By", "Sent At", "Lead Stage"].map(h => (
                      <TH key={h}>{h}</TH>
                    ))}
                  </TR>
                </THead>
                <TBody>
                  {filtered.map(log => (
                    <TR key={log.id}>
                      <TD>
                        <Link href={`/admin/leads/${log.lead_id}`} className="font-semibold text-slate-900 transition-colors hover:text-brand-deep">
                          {log.lead?.company_name || "—"}
                        </Link>
                      </TD>
                      <TD className="text-xs text-slate-500">{log.lead?.industry || "—"}</TD>
                      <TD className="text-xs text-slate-500">{log.lead?.city || "—"}</TD>
                      <TD>
                        {log.pdf_name ? (
                          <Badge tone="neutral" size="sm">
                            <FileText className="h-3 w-3" /> {log.pdf_name}
                          </Badge>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </TD>
                      <TD className="text-xs text-slate-500">{log.actor?.full_name || "—"}</TD>
                      <TD className="whitespace-nowrap text-xs text-slate-500 tabular-nums">
                        {new Date(log.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </TD>
                      <TD>
                        {log.lead?.outreach_stage && (
                          <Badge tone="neutral" variant="outline" size="sm">
                            {STAGE_LABELS[log.lead.outreach_stage] || log.lead.outreach_stage}
                          </Badge>
                        )}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
