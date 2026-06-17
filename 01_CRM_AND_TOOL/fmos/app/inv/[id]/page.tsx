import { createAdminClient } from "@/lib/supabase-admin";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PublicInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, invoice_number, subtotal, gst_amount, total_amount, due_date, issue_date, notes, status, paid_amount, client_id")
    .eq("id", id)
    .maybeSingle();

  if (!invoice) notFound();

  let clientName = "";
  if (invoice.client_id) {
    const { data: client } = await (supabase as any)
      .from("clients")
      .select("business_name, city")
      .eq("id", invoice.client_id)
      .maybeSingle();
    clientName = client?.business_name || "";
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const isPaid = invoice.status === "paid";
  const isPartial = invoice.status === "partial";
  const paidAmount = Number(invoice.paid_amount ?? 0);
  const remaining = Number(invoice.total_amount) - paidAmount;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className={`px-8 py-7 text-white ${isPaid ? "bg-emerald-700" : "bg-[#1E7A4F]"}`}>
          <p className="text-sm font-medium opacity-80 mb-1">FortuneMarq</p>
          <h1 className="text-2xl font-bold">Tax Invoice</h1>
          {clientName && <p className="mt-1 opacity-90 text-sm">{clientName}</p>}
          {isPaid && (
            <span className="mt-3 inline-block text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">
              Paid
            </span>
          )}
          {isPartial && (
            <span className="mt-3 inline-block text-sm font-semibold bg-amber-400/80 text-amber-900 px-3 py-1 rounded-full">
              Partially Paid
            </span>
          )}
          <p className="mt-2 text-xs opacity-60">{invoice.invoice_number}</p>
        </div>

        <div className="px-8 py-7 space-y-5">
          {/* Dates */}
          <div className="flex justify-between text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Issue Date</p>
              <p className="font-medium">{fmtDate(invoice.issue_date)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-0.5">Due Date</p>
              <p className={`font-medium ${!isPaid && new Date(invoice.due_date) < new Date() ? "text-red-600" : ""}`}>
                {fmtDate(invoice.due_date)}
              </p>
            </div>
          </div>

          {/* Description */}
          {invoice.notes && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-800">{invoice.notes}</p>
            </div>
          )}

          {/* Amount breakdown */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>{fmt(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">GST (18%)</span>
              <span>{fmt(invoice.gst_amount)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2 mt-1">
              <span>Total</span>
              <span className="text-[#1E7A4F]">{fmt(invoice.total_amount)}</span>
            </div>
            {isPartial && (
              <>
                <div className="flex justify-between text-sm text-emerald-700">
                  <span>Paid</span>
                  <span>{fmt(paidAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-red-700">
                  <span>Remaining</span>
                  <span>{fmt(remaining)}</span>
                </div>
              </>
            )}
          </div>

          {/* Bank details */}
          {!isPaid && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-gray-700 space-y-1">
              <p className="font-semibold text-gray-800 mb-2">Bank Transfer</p>
              <p>Karnataka Bank</p>
              <p>A/C Name: FortuneMarq Media &amp; Marketing</p>
              <p>A/C No: <span className="font-mono">0332202500001101</span></p>
              <p>IFSC: <span className="font-mono">KARB0000332</span></p>
            </div>
          )}
        </div>

        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-400">
          FortuneMarq Media &amp; Marketing · GSTIN: [Add GSTIN] · Hubli, Karnataka
        </div>
      </div>
    </div>
  );
}
