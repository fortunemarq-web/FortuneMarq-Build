import { createAdminClient } from "@/lib/supabase-admin";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PublicProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, proposal_number, services, total_setup, total_monthly, start_date, status, lead_id")
    .eq("id", id)
    .maybeSingle();

  if (!proposal) notFound();

  const { data: lead } = await supabase
    .from("leads")
    .select("company_name, contact_person, city, industry")
    .eq("id", proposal.lead_id)
    .maybeSingle();

  const services: { id: string; label: string; setupFee: number; monthlyRetainer: number }[] =
    Array.isArray(proposal.services) ? (proposal.services as any[]) : [];

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-surface rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-[#1E7A4F] px-8 py-7 text-white">
          <p className="text-sm font-medium opacity-80 mb-1">FortuneMarq</p>
          <h1 className="text-2xl font-bold">Growth Proposal</h1>
          {lead && (
            <p className="mt-1 opacity-90 text-sm">
              Prepared for {lead.company_name}{lead.city ? ` · ${lead.city}` : ""}
            </p>
          )}
          <p className="mt-3 text-xs opacity-60">{proposal.proposal_number}</p>
        </div>

        <div className="px-8 py-7 space-y-6">
          {/* Services */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Services</h2>
            <div className="space-y-2">
              {services.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm font-medium text-gray-800">{s.label}</span>
                  <div className="text-right text-xs text-gray-500 space-y-0.5">
                    {s.setupFee > 0 && <div>{fmt(s.setupFee)} setup</div>}
                    {s.monthlyRetainer > 0 && <div>{fmt(s.monthlyRetainer)}/mo</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Totals */}
          <section className="bg-gray-50 rounded-xl p-4 space-y-2">
            {(proposal.total_setup ?? 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">One-time setup</span>
                <span className="font-semibold">{fmt(proposal.total_setup ?? 0)}</span>
              </div>
            )}
            {(proposal.total_monthly ?? 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Monthly retainer</span>
                <span className="font-semibold text-[#1E7A4F]">{fmt(proposal.total_monthly ?? 0)}/mo</span>
              </div>
            )}
            {proposal.start_date && (
              <div className="flex justify-between text-sm pt-1 border-t border-gray-200 mt-1">
                <span className="text-gray-500">Proposed start</span>
                <span className="text-gray-700">
                  {new Date(proposal.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
            )}
          </section>

          {/* CTA */}
          <div className="text-sm text-gray-600 leading-relaxed bg-green-50 border border-green-100 rounded-xl p-4">
            Questions? WhatsApp or call Jabeer at{" "}
            <a href="https://wa.me/919353082656" className="text-[#1E7A4F] font-medium underline">
              +91 93530 82656
            </a>
            . Happy to walk you through anything.
          </div>
        </div>

        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-400">
          FortuneMarq Media &amp; Marketing · Hubli, Karnataka
        </div>
      </div>
    </div>
  );
}
