import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";
import { FileText, Plus, ArrowRight, Clock, Users } from "lucide-react";
import ProposalRowActions from "@/components/proposals/proposal-row-actions";

export const dynamic = "force-dynamic"; // live admin list — must reflect just-created rows

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-500",
  sent: "bg-blue-100 text-blue-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-600",
};

export default async function ProposalsListPage() {
  const supabase = await createServerClientWithCookies();

  const [{ data: proposals, error }, { data: proposalLeads }, { data: clients }] = await Promise.all([
    supabase
      .from("proposals")
      .select("id, proposal_number, status, total_setup, total_monthly, monthly_value, onetime_value, created_at, sent_at, services, lead:leads(id, company_name, city, industry)")
      .order("created_at", { ascending: false }),
    supabase
      .from("leads")
      .select("id, company_name, city, industry, phone, meeting_notes, follow_up_date")
      .eq("outreach_stage", "proposal_sent")
      .order("follow_up_date", { ascending: false }),
    supabase
      .from("clients")
      .select("id, business_name"),
  ]);

  // Map business_name → client id for confirmed proposal linking
  const clientMap = Object.fromEntries((clients || []).map((c: any) => [c.business_name?.toLowerCase(), c.id]));

  // Filter out leads that already have a proposal
  const { data: existingProposalLeadIds } = await supabase
    .from("proposals")
    .select("lead_id");
  const takenIds = new Set((existingProposalLeadIds || []).map((p: any) => p.lead_id));
  const leadsNeedingProposal = (proposalLeads || []).filter((l: any) => !takenIds.has(l.id));

  if (error) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-red-500">Error: {error.message}</p>
      </div>
    );
  }

  const formatINR = (n: number | null) => n ? `₹${n.toLocaleString("en-IN")}` : "—";
  const formatDate = (d: string | null) => d
    ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  return (
    <div className="min-h-full bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-6 w-6 text-purple-500" /> Proposals
            </h1>
            <p className="text-sm text-slate-500 mt-1">{(proposals || []).length} total</p>
          </div>
        </div>

        {/* Leads ready for proposal */}
        {leadsNeedingProposal.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Awaiting Proposal ({leadsNeedingProposal.length})</h2>
            </div>
            <div className="space-y-2">
              {leadsNeedingProposal.map((lead: any) => (
                <div key={lead.id} className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{lead.company_name}</p>
                    <p className="text-xs text-slate-500">{lead.industry}{lead.city ? ` · ${lead.city}` : ""}{lead.phone ? ` · ${lead.phone}` : ""}</p>
                    {lead.meeting_notes && (
                      <p className="text-xs text-amber-700 mt-1 truncate max-w-md italic">{lead.meeting_notes}</p>
                    )}
                  </div>
                  <Link
                    href={`/admin/leads/${lead.id}/proposal/new`}
                    className="shrink-0 flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                  >
                    Create Proposal <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

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
                    {["Proposal No", "Lead / Client", "Services", "Setup", "Monthly", "Status", "Created", "Sent", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(proposals || []).map((p: any) => {
                    const clientId = p.status === "confirmed"
                      ? clientMap[(p.lead?.company_name || "").toLowerCase()]
                      : null;
                    return (
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
                      <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-800">{formatINR(p.total_setup ?? p.onetime_value ?? 0)}</td>
                      <td className="px-4 py-3 font-mono text-sm font-semibold text-[#42CA80]">{formatINR(p.total_monthly ?? p.monthly_value ?? 0)}/mo</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[p.status] || "bg-slate-100 text-slate-500"}`}>
                          {p.status || "draft"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(p.created_at)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(p.sent_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {clientId ? (
                            <Link href={`/admin/clients/${clientId}`} className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-800 hover:underline whitespace-nowrap">
                              <Users className="h-3 w-3" /> View Client
                            </Link>
                          ) : p.status === "sent" && p.lead?.id ? (
                            <Link href={`/admin/leads/${p.lead.id}`} className="text-[10px] font-bold text-blue-600 hover:underline whitespace-nowrap">
                              Confirm →
                            </Link>
                          ) : null}
                          <ProposalRowActions
                            proposalId={p.id}
                            proposalNumber={p.proposal_number}
                            status={p.status}
                            leadId={p.lead?.id || null}
                            companyName={p.lead?.company_name || null}
                            totalAmount={p.total_setup ?? p.onetime_value ?? 0}
                          />
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
