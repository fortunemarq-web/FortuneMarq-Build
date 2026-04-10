import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";
import { FileText, Plus, Filter } from "lucide-react";

export const revalidate = 60;

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-500",
  sent: "bg-blue-100 text-blue-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-600",
};

export default async function ProposalsListPage() {
  const supabase = await createServerClientWithCookies();

  const { data: proposals, error } = await supabase
    .from("proposals")
    .select("id, proposal_number, status, total_setup, total_monthly, created_at, sent_at, services, lead:leads(id, company_name, city, industry)")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">Error: {error.message}</p>
      </div>
    );
  }

  const formatINR = (n: number | null) => n ? `₹${n.toLocaleString("en-IN")}` : "—";
  const formatDate = (d: string | null) => d
    ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-6 w-6 text-purple-500" /> Proposals
            </h1>
            <p className="text-sm text-slate-500 mt-1">{(proposals || []).length} total</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {(!proposals || proposals.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <FileText className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No proposals yet.</p>
              <p className="text-xs mt-1">Create one from a Lead Profile.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["Proposal No", "Lead / Client", "Services", "Setup", "Monthly", "Status", "Created", "Sent"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(proposals || []).map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-slate-700">{p.proposal_number || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/leads/${p.lead?.id}`} className="font-semibold text-slate-900 hover:text-[#42CA80] transition-colors">
                          {p.lead?.company_name || "—"}
                        </Link>
                        <p className="text-[10px] text-slate-400">{p.lead?.city}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-600">
                          {Array.isArray(p.services) ? p.services.map((s: any) => s.label).join(", ") : "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-800">{formatINR(p.total_setup)}</td>
                      <td className="px-4 py-3 font-mono text-sm font-semibold text-[#42CA80]">{formatINR(p.total_monthly)}/mo</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[p.status] || "bg-slate-100 text-slate-500"}`}>
                          {p.status || "draft"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(p.created_at)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(p.sent_at)}</td>
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
