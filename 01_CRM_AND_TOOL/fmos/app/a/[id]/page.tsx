import { createAdminClient } from "@/lib/supabase-admin";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PublicAgreementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: agreement } = await supabase
    .from("agreements")
    .select("id, agreement_number, services, total_setup, total_monthly, start_date, status, lead_id, confirmed_at")
    .eq("id", id)
    .maybeSingle();

  if (!agreement) notFound();

  const { data: lead } = await supabase
    .from("leads")
    .select("company_name, contact_person, city")
    .eq("id", agreement.lead_id ?? "")
    .maybeSingle();

  const services: { id: string; label: string; setupFee?: number; monthlyRetainer?: number }[] =
    Array.isArray(agreement.services) ? (agreement.services as any[]) : [];

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const confirmed = agreement.status === "signed" || !!agreement.confirmed_at;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className={`px-8 py-7 text-white ${confirmed ? "bg-emerald-700" : "bg-[#1E7A4F]"}`}>
          <p className="text-sm font-medium opacity-80 mb-1">FortuneMarq</p>
          <h1 className="text-2xl font-bold">Service Agreement</h1>
          {lead && (
            <p className="mt-1 opacity-90 text-sm">
              {lead.company_name}{lead.city ? ` · ${lead.city}` : ""}
            </p>
          )}
          {confirmed && (
            <p className="mt-3 text-sm font-semibold bg-white/20 inline-block px-3 py-1 rounded-full">
              Confirmed
            </p>
          )}
          <p className="mt-2 text-xs opacity-60">{agreement.agreement_number}</p>
        </div>

        <div className="px-8 py-7 space-y-6">
          {/* Intro */}
          <p className="text-sm text-gray-700 leading-relaxed">
            This agreement is between <strong>FortuneMarq Media &amp; Marketing</strong> and{" "}
            <strong>{lead?.company_name || "Client"}</strong>. By replying{" "}
            <strong>&quot;Yes, confirmed&quot;</strong> to our WhatsApp message, you agree to the
            services and terms outlined below.
          </p>

          {/* Services */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Services</h2>
            <div className="space-y-2">
              {services.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm font-medium text-gray-800">{s.label}</span>
                  <div className="text-right text-xs text-gray-500 space-y-0.5">
                    {(s.setupFee ?? 0) > 0 && <div>{fmt(s.setupFee!)}</div>}
                    {(s.monthlyRetainer ?? 0) > 0 && <div>{fmt(s.monthlyRetainer!)}/mo</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Totals */}
          <section className="bg-gray-50 rounded-xl p-4 space-y-2">
            {(agreement.total_setup ?? 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">One-time setup</span>
                <span className="font-semibold">{fmt(agreement.total_setup ?? 0)}</span>
              </div>
            )}
            {(agreement.total_monthly ?? 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Monthly retainer</span>
                <span className="font-semibold text-[#1E7A4F]">{fmt(agreement.total_monthly ?? 0)}/mo</span>
              </div>
            )}
            {agreement.start_date && (
              <div className="flex justify-between text-sm pt-1 border-t border-gray-200 mt-1">
                <span className="text-gray-500">Start date</span>
                <span className="text-gray-700">
                  {new Date(agreement.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
            )}
          </section>

          {/* Terms summary */}
          <section className="text-xs text-gray-500 space-y-1.5 leading-relaxed">
            <p>• Payment is due on the 1st of each month. Late payments beyond 7 days may pause active services.</p>
            <p>• Either party may discontinue with 30 days written notice after the first 3 months.</p>
            <p>• All work is owned by the client upon full payment for that month.</p>
            <p>• FortuneMarq reserves the right to showcase the work as a case study unless otherwise agreed.</p>
          </section>

          {/* Confirmation instruction */}
          {!confirmed && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
              To confirm, reply <strong>&quot;Yes, confirmed&quot;</strong> to the WhatsApp message you received. That&apos;s it — we&apos;ll handle the rest.
            </div>
          )}
          {confirmed && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
              This agreement has been confirmed. Onboarding is in progress — we&apos;ll be in touch shortly.
            </div>
          )}
        </div>

        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-400">
          FortuneMarq Media &amp; Marketing · Hubli, Karnataka ·{" "}
          <a href="https://wa.me/919353082656" className="underline">+91 93530 82656</a>
        </div>
      </div>
    </div>
  );
}
