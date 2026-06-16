"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, FileText, Filter } from "lucide-react";

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
    <div className="min-h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 shadow-sm">
        <div className="mx-auto max-w-7xl">
          <Link href="/admin/outreach" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#42CA80] transition-colors mb-3">
            <ArrowLeft className="h-4 w-4" /> Outreach Board
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-500" /> PDF Delivery Log
              </h1>
              <p className="text-xs text-slate-500 mt-1">{filtered.length} PDFs sent</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 mb-5">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#42CA80]/30 focus:border-[#42CA80] focus:bg-white"
                placeholder="Search lead name or PDF..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <select value={filterNiche} onChange={e => setFilterNiche(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none">
              <option value="">All Niches</option>
              {niches.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select value={filterCity} onChange={e => setFilterCity(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none">
              <option value="">All Cities</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterPdf} onChange={e => setFilterPdf(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none">
              <option value="">All PDFs</option>
              {pdfNames.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none" />
              <span className="text-slate-400 text-xs">to</span>
              <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none" />
            </div>
            {(query || filterNiche || filterCity || filterPdf || filterDateFrom || filterDateTo) && (
              <button
                onClick={() => { setQuery(""); setFilterNiche(""); setFilterCity(""); setFilterPdf(""); setFilterDateFrom(""); setFilterDateTo(""); }}
                className="text-xs font-semibold text-slate-500 hover:text-red-500 transition-colors px-3"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <FileText className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No PDFs sent yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["Lead Name", "Niche", "City", "PDF Name", "Sent By", "Sent At", "Lead Stage"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/leads/${log.lead_id}`} className="font-semibold text-slate-900 hover:text-[#42CA80] transition-colors">
                          {log.lead?.company_name || "—"}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{log.lead?.industry || "—"}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{log.lead?.city || "—"}</td>
                      <td className="px-4 py-3">
                        {log.pdf_name ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg">
                            <FileText className="h-3 w-3" /> {log.pdf_name}
                          </span>
                        ) : <span className="text-slate-400 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{log.actor?.full_name || "—"}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3">
                        {log.lead?.outreach_stage && (
                          <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                            {STAGE_LABELS[log.lead.outreach_stage] || log.lead.outreach_stage}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
