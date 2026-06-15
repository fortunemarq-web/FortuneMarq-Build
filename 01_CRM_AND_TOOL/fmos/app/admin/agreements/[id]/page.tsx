import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle, Clock, Check } from "lucide-react";
import SERVICES_DATA from "@/lib/data/services_data.json";
import PrintButton from "@/components/ui/print-button";
import AgreementConfirmButton from "@/components/admin/agreements/AgreementConfirmButton";

const SERVICE_DETAILS: Record<string, { whatWeDo: string; deliverables: string[]; timeline: string; importantNote?: string }> =
  Object.fromEntries(
    SERVICES_DATA.services.map((s) => [
      s.id,
      {
        whatWeDo: s.whatWeDo,
        deliverables: s.deliverables,
        timeline: s.timeline,
        importantNote: (s as any).importantNote,
      },
    ])
  );

const formatINR = (n: number | null) => (n ? `₹${n.toLocaleString("en-IN")}` : "—");
const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—";

export default async function AgreementViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClientWithCookies();

  const { data: agreement, error } = await (supabase as any)
    .from("agreements")
    .select(`
      id, agreement_number, proposal_ref, status,
      total_setup, total_monthly, start_date,
      created_at, confirmed_at, services,
      lead:leads(id, company_name, contact_person, city, industry),
      proposal:proposals(id, proposal_number)
    `)
    .eq("id", id)
    .single();

  if (error || !agreement) notFound();

  const lead = agreement.lead;
  const services: any[] = Array.isArray(agreement.services) ? agreement.services : [];
  const isConfirmed = agreement.status === "confirmed";

  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="min-h-full bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">

        {/* Back + status bar */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link href="/admin/agreements" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-4 w-4" /> All Agreements
          </Link>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${
              isConfirmed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}>
              {isConfirmed
                ? <><CheckCircle className="h-3.5 w-3.5" /> Confirmed</>
                : <><Clock className="h-3.5 w-3.5" /> Pending</>
              }
            </span>
            {!isConfirmed && (
              <AgreementConfirmButton agreementId={agreement.id} clientName={lead?.company_name || "Client"} />
            )}
            <PrintButton />
          </div>
        </div>

        {/* Agreement document */}
        <div className="print-area bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

          {/* Header */}
          <div className="bg-slate-900 text-white px-8 py-8">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">FortuneMarq Media & Marketing</p>
                <h2 className="text-2xl font-bold mt-2">Service Agreement</h2>
              </div>
              <div className="text-right text-xs text-slate-400 space-y-0.5">
                <p className="font-mono">{agreement.agreement_number || "—"}</p>
                {agreement.proposal_ref && <p>Ref: {agreement.proposal_ref}</p>}
                <p>{formatDate(agreement.created_at)}</p>
                {isConfirmed && (
                  <p className="text-emerald-400 font-semibold mt-1">Confirmed {formatDate(agreement.confirmed_at)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Parties */}
          <div className="px-8 py-6 border-b border-slate-100">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Service Provider</p>
                <p className="text-sm font-semibold text-slate-900">FortuneMarq Media & Marketing</p>
                <p className="text-xs text-slate-500">Hubli, Karnataka</p>
                <p className="text-xs text-slate-500">fortunemarq.com</p>
                <p className="text-xs text-slate-500">+91 93530 82656</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Client</p>
                <p className="text-sm font-semibold text-slate-900">{lead?.company_name || "—"}</p>
                {lead?.contact_person && <p className="text-xs text-slate-500">{lead.contact_person}</p>}
                {lead?.city && <p className="text-xs text-slate-500">{lead.city}</p>}
              </div>
            </div>
          </div>

          {/* Pricing summary */}
          <div className="px-8 py-6 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">Services & Pricing</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 text-xs font-bold text-slate-500">Service</th>
                  <th className="text-right py-2 text-xs font-bold text-slate-500">Setup Fee</th>
                  <th className="text-right py-2 text-xs font-bold text-slate-500">Monthly</th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc: any) => (
                  <tr key={svc.id} className="border-b border-slate-50">
                    <td className="py-2.5 font-medium text-slate-700">{svc.label}</td>
                    <td className="py-2.5 text-right font-mono text-slate-800">
                      {svc.setupFee ? formatINR(svc.setupFee) : "—"}
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-800">
                      {svc.monthlyRetainer ? `${formatINR(svc.monthlyRetainer)}/mo` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-900">
                  <td className="py-3 font-bold text-slate-900">Total</td>
                  <td className="py-3 text-right font-bold font-mono">{formatINR(agreement.total_setup)}</td>
                  <td className="py-3 text-right font-bold font-mono text-brand-deep">
                    {formatINR(agreement.total_monthly)}/mo
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Scope of work */}
          <div className="px-8 py-6 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-6">Scope of Work</p>
            <div className="space-y-8">
              {services.map((svc: any, idx: number) => {
                const detail = SERVICE_DETAILS[svc.id];
                return (
                  <div key={svc.id} className="avoid-break">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">{svc.label}</h3>
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        {svc.setupFee ? <span className="mr-3">Setup: <span className="font-mono font-semibold text-slate-700">{formatINR(svc.setupFee)}</span></span> : null}
                        {svc.monthlyRetainer ? <span>Monthly: <span className="font-mono font-semibold text-brand-deep">{formatINR(svc.monthlyRetainer)}/mo</span></span> : null}
                      </div>
                    </div>

                    {detail ? (
                      <div className="ml-8 space-y-4">
                        <p className="text-xs text-slate-600 leading-relaxed">{detail.whatWeDo}</p>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">What's included</p>
                          <ul className="space-y-1">
                            {detail.deliverables.map((d, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                                <Check className="h-3.5 w-3.5 text-brand-deep shrink-0 mt-px" />
                                {d}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Timeline:</span>
                          <span className="text-xs text-slate-600">{detail.timeline}</span>
                        </div>
                        {detail.importantNote && (
                          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                            <p className="text-xs text-amber-700">Note: {detail.importantNote}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="ml-8 text-xs text-slate-400 italic">Scope details not available.</p>
                    )}

                    {idx < services.length - 1 && <div className="mt-6 border-b border-slate-100" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment terms */}
          <div className="px-8 py-6 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Payment Terms</p>
            {[
              "Setup fee is due before work begins",
              "Monthly retainer invoice raised on the 1st of every month",
              "Payment due by the 5th of every month",
              "Ads paused if payment is overdue by 7 days — resumed same day payment is received",
            ].map((pt, i) => (
              <p key={i} className="text-xs text-slate-600 mb-1.5 flex items-start gap-2">
                <span className="text-slate-300 shrink-0">·</span>{pt}
              </p>
            ))}
          </div>

          {/* Start date + confirmation status */}
          <div className="px-8 py-6">
            {agreement.start_date && (
              <p className="text-sm text-slate-700 mb-4">
                <strong>Start Date:</strong> {formatDate(agreement.start_date)}
              </p>
            )}
            {isConfirmed ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Agreement confirmed</p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    {lead?.company_name} confirmed on {formatDate(agreement.confirmed_at)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-slate-800 mb-1">Awaiting Confirmation</p>
                <p className="text-xs text-slate-600">
                  Please reply with <strong>'Yes, confirmed'</strong> to this agreement to get started.
                </p>
              </div>
            )}
          </div>

          {/* Signatures */}
          <div className="px-8 py-8 border-t border-slate-100 avoid-break">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-8">Agreed & Accepted</p>
            <div className="grid grid-cols-2 gap-12">
              <div>
                <div className="h-12 border-b border-slate-300" />
                <p className="text-sm font-semibold text-slate-900 mt-3">FortuneMarq Media & Marketing</p>
                <p className="text-xs text-slate-500 mt-0.5">Authorised Signatory</p>
                <p className="text-xs text-slate-400 mt-2">Date: {formatDate(agreement.created_at)}</p>
              </div>
              <div>
                <div className="h-12 border-b border-slate-300" />
                <p className="text-sm font-semibold text-slate-900 mt-3">{lead?.company_name || "Client"}</p>
                <p className="text-xs text-slate-500 mt-0.5">{lead?.contact_person || "Authorised Signatory"}</p>
                <p className="text-xs text-slate-400 mt-2">
                  Date: {isConfirmed ? formatDate(agreement.confirmed_at) : "____________"}
                </p>
              </div>
            </div>
          </div>

          {/* Document footer */}
          <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] text-slate-400">
              FortuneMarq Media & Marketing · Hubli, Karnataka · +91 93530 82656
            </p>
            <p className="text-[10px] font-mono text-slate-400">{agreement.agreement_number || ""}</p>
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-4 flex items-center gap-4 text-xs text-slate-400 print:hidden">
          <Link href="/admin/agreements" className="hover:text-slate-700 transition-colors">← Back to all agreements</Link>
          {lead && (
            <Link href={`/admin/leads/${lead.id}`} className="hover:text-slate-700 transition-colors">View lead profile</Link>
          )}
        </div>
      </div>
    </div>
  );
}
