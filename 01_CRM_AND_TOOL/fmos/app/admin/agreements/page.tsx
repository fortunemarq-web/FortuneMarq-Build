import type { ElementType } from "react";
import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";
import { FileSignature, CheckCircle, Clock, XCircle } from "lucide-react";
import AgreementRowActions from "@/components/proposals/agreement-row-actions";

export const revalidate = 60;

const STATUS_CONFIG: Record<string, { label: string; classes: string; icon: ElementType }> = {
  // agreements.status CHECK allows only pending / confirmed / cancelled.
  pending:   { label: "Pending",   classes: "bg-amber-100 text-amber-700",   icon: Clock },
  confirmed: { label: "Confirmed", classes: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  cancelled: { label: "Cancelled", classes: "bg-red-100 text-red-600",       icon: XCircle },
};

export default async function AgreementsPage() {
  const supabase = await createServerClientWithCookies();

  const { data: agreements, error } = await supabase
    .from("agreements")
    .select(`
      id,
      agreement_number,
      proposal_ref,
      status,
      total_setup,
      total_monthly,
      start_date,
      created_at,
      confirmed_at,
      services,
      lead:leads(id, company_name, city, industry),
      proposal:proposals(id, proposal_number)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-red-500">Error loading agreements: {error.message}</p>
      </div>
    );
  }

  // Resolve clients by business_name so "Client ↗" can deep-link to the right client.
  const { data: clientRows } = await supabase.from("clients").select("id, business_name");
  const clientByName = new Map(
    (clientRows || []).map((c: any) => [String(c.business_name || "").trim().toLowerCase(), c.id])
  );
  const clientHref = (companyName: string | null | undefined) => {
    const id = clientByName.get(String(companyName || "").trim().toLowerCase());
    return id ? `/admin/clients/${id}` : "/admin/clients";
  };

  const formatINR = (n: number | null) => (n ? `₹${n.toLocaleString("en-IN")}` : "—");
  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const total = (agreements || []).length;
  const confirmed = (agreements || []).filter((a: any) => a.status === "confirmed").length;
  const pending = (agreements || []).filter((a: any) => a.status === "pending").length;
  const totalMRR = (agreements || [])
    .filter((a: any) => a.status === "confirmed")
    .reduce((s: number, a: any) => s + (a.total_monthly || 0), 0);

  return (
    <div className="min-h-full bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileSignature className="h-6 w-6 text-indigo-500" /> Agreements
            </h1>
            <p className="text-sm text-slate-500 mt-1">{total} total</p>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total", value: total, color: "text-slate-900" },
            { label: "Confirmed", value: confirmed, color: "text-emerald-600" },
            { label: "Pending", value: pending, color: "text-amber-600" },
            { label: "Confirmed MRR", value: formatINR(totalMRR) + "/mo", color: "text-indigo-600" },
          ].map((k) => (
            <div key={k.label} className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{k.label}</p>
              <p className={`text-xl font-bold font-mono mt-0.5 ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {!agreements || agreements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <FileSignature className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No agreements yet.</p>
              <p className="text-xs mt-1">Generate one from a lead's proposal.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["Agreement No", "Lead / Client", "Services", "Setup", "Monthly", "Status", "Start Date", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(agreements as any[]).map((a) => {
                    const sc = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending;
                    const StatusIcon = sc.icon;
                    const services = Array.isArray(a.services)
                      ? a.services.map((s: any) => s.label || s.id).join(", ")
                      : "—";

                    return (
                      <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Agreement number */}
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-bold text-slate-700">
                            {a.agreement_number || "—"}
                          </span>
                          {a.proposal_ref && (
                            <p className="text-[10px] text-slate-400">Ref: {a.proposal_ref}</p>
                          )}
                        </td>

                        {/* Lead */}
                        <td className="px-4 py-3">
                          {a.lead ? (
                            <Link
                              href={`/admin/leads/${a.lead.id}`}
                              className="font-semibold text-slate-900 hover:text-[#42CA80] transition-colors"
                            >
                              {a.lead.company_name}
                            </Link>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                          {a.lead?.city && (
                            <p className="text-[10px] text-slate-400">{a.lead.city}</p>
                          )}
                        </td>

                        {/* Services */}
                        <td className="px-4 py-3 max-w-[160px]">
                          <p className="text-xs text-slate-600 truncate" title={services}>{services}</p>
                        </td>

                        {/* Setup */}
                        <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-800 whitespace-nowrap">
                          {formatINR(a.total_setup)}
                        </td>

                        {/* Monthly */}
                        <td className="px-4 py-3 font-mono text-sm font-semibold text-[#42CA80] whitespace-nowrap">
                          {formatINR(a.total_monthly)}/mo
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${sc.classes}`}>
                            <StatusIcon className="h-3 w-3" />
                            {sc.label}
                          </span>
                          {a.confirmed_at && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {formatDate(a.confirmed_at)}
                            </p>
                          )}
                        </td>

                        {/* Start date */}
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {formatDate(a.start_date)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/agreements/${a.id}`}
                              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline whitespace-nowrap"
                            >
                              View →
                            </Link>
                            {a.status === "confirmed" && a.lead && (
                              <Link
                                href={clientHref(a.lead?.company_name)}
                                className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 hover:underline whitespace-nowrap"
                              >
                                Client ↗
                              </Link>
                            )}
                            <AgreementRowActions
                              agreementId={a.id}
                              agreementNumber={a.agreement_number}
                              status={a.status}
                              companyName={a.lead?.company_name || null}
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
