"use server";

import { createAdminClient } from "@/lib/supabase-admin";
import { sendWhatsAppTemplate, toWaNumber } from "@/lib/whatsapp/send";
import { computeGstAmount, resolveGstRate } from "@/lib/finance/gst";

const APP_URL = () =>
  (process.env.NEXT_PUBLIC_APP_URL || "https://fmos.fortunemarq.com").replace(/\/$/, "");

const IST = "Asia/Kolkata";

/** GST rate (percent) from business_settings, falling back to 18. */
async function getGstRatePercent(supabase: ReturnType<typeof createAdminClient>): Promise<number> {
  const { data } = await (supabase as any)
    .from("business_settings")
    .select("gst_rate")
    .limit(1)
    .maybeSingle();
  return resolveGstRate(data?.gst_rate);
}

function fmtINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { timeZone: IST, day: "numeric", month: "short", year: "numeric" });
}

export interface IssueInvoiceInput {
  /** Client ID (from clients table) — required for recurring invoices */
  clientId?: string;
  /** Lead ID — used for advance / pre-client invoices */
  leadId?: string;
  /** Subtotal before GST (INR) */
  subtotal: number;
  /** Invoice label: "Advance Payment" | "Monthly Retainer — June 2026" etc. */
  notes: string;
  /** ISO due date string */
  dueDate: string;
  /** revenue_type: "setup" | "monthly" | "advance" | "other" */
  revenueType?: string;
  /** Send WhatsApp invoice_sent template after creating */
  sendWA?: boolean;
}

export interface IssueInvoiceResult {
  ok: boolean;
  invoiceId?: string;
  invoiceNumber?: string;
  error?: string;
}

export async function issueInvoice(input: IssueInvoiceInput): Promise<IssueInvoiceResult> {
  const supabase = createAdminClient();

  if (!input.clientId && !input.leadId) {
    return { ok: false, error: "clientId or leadId required" };
  }

  const gstRate = await getGstRatePercent(supabase);
  const gstAmount = computeGstAmount(input.subtotal, gstRate);
  const totalAmount = input.subtotal + gstAmount;

  // Generate invoice number
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true });

  const seq = ((count ?? 0) + 1).toString().padStart(4, "0");
  const invoiceNumber = `INV-${year}-${seq}`;
  const dueDate = input.dueDate;
  const issueDate = new Date().toISOString().split("T")[0];

  const { data: invoice, error: insertErr } = await supabase
    .from("invoices")
    .insert({
      invoice_number: invoiceNumber,
      client_id: input.clientId ?? null,
      subtotal: input.subtotal,
      gst_amount: gstAmount,
      total_amount: totalAmount,
      due_date: dueDate,
      issue_date: issueDate,
      notes: input.notes,
      revenue_type: input.revenueType ?? "other",
      status: "unpaid",
    })
    .select("id")
    .single();

  if (insertErr || !invoice) {
    return { ok: false, error: insertErr?.message || "Failed to create invoice" };
  }

  const invoiceId = (invoice as any).id as string;
  const invoiceUrl = `${APP_URL()}/inv/${invoiceId}`;

  if (input.sendWA) {
    // Resolve phone — prefer client, fall back to lead
    let phone: string | null = null;
    let contactName = "there";

    if (input.clientId) {
      const { data: client } = await (supabase as any)
        .from("clients")
        .select("business_name, phone, owner_name")
        .eq("id", input.clientId)
        .maybeSingle();
      phone = client?.phone ?? null;
      contactName = client?.owner_name || client?.business_name || "there";
    } else if (input.leadId) {
      const { data: lead } = await (supabase.from("leads") as any)
        .select("company_name, contact_person, phone")
        .eq("id", input.leadId)
        .maybeSingle();
      phone = lead?.phone ?? null;
      contactName = lead?.contact_person || lead?.company_name || "there";
    }

    if (phone && toWaNumber(phone)) {
      // invoice_sent: {{1}}=contact, {{2}}=invoice_number, {{3}}=amount, {{4}}=url
      await sendWhatsAppTemplate(phone, "invoice_sent", {
        language: "en",
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: contactName },
              { type: "text", text: invoiceNumber },
              { type: "text", text: fmtINR(totalAmount) },
              { type: "text", text: invoiceUrl },
            ],
          },
        ],
        leadId: input.leadId,
      }).catch((e) => console.error("[issue-invoice] WA send failed:", e));
    }
  }

  return { ok: true, invoiceId, invoiceNumber };
}

/** Record full or partial payment on an invoice and send the appropriate WA template. */
export interface RecordPaymentInput {
  invoiceId: string;
  amountPaid: number;
  paymentMethod?: string;
}

export interface RecordPaymentResult {
  ok: boolean;
  status?: "paid" | "partial";
  error?: string;
}

export async function recordPayment(input: RecordPaymentInput): Promise<RecordPaymentResult> {
  const supabase = createAdminClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, invoice_number, total_amount, paid_amount, client_id, status")
    .eq("id", input.invoiceId)
    .maybeSingle();

  if (!invoice) return { ok: false, error: "Invoice not found" };

  const alreadyPaid = Number(invoice.paid_amount ?? 0);
  const newPaid = alreadyPaid + input.amountPaid;
  const total = Number(invoice.total_amount);
  const remaining = total - newPaid;
  const isPaidInFull = remaining <= 0;

  await supabase
    .from("invoices")
    .update({
      paid_amount: newPaid,
      status: isPaidInFull ? "paid" : "partial",
      paid_at: isPaidInFull ? new Date().toISOString() : null,
      payment_method: input.paymentMethod ?? null,
    } as any)
    .eq("id", input.invoiceId);

  // Resolve client phone
  let phone: string | null = null;
  let contactName = "there";

  if (invoice.client_id) {
    const { data: client } = await (supabase as any)
      .from("clients")
      .select("business_name, phone, owner_name")
      .eq("id", invoice.client_id)
      .maybeSingle();
    phone = client?.phone ?? null;
    contactName = client?.owner_name || client?.business_name || "there";
  }

  if (phone && toWaNumber(phone)) {
    const invoiceUrl = `${APP_URL()}/inv/${input.invoiceId}`;

    if (isPaidInFull) {
      // payment_received: {{1}}=contact, {{2}}=amount, {{3}}=invoice_number
      await sendWhatsAppTemplate(phone, "payment_received", {
        language: "en",
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: contactName },
              { type: "text", text: fmtINR(input.amountPaid) },
              { type: "text", text: invoice.invoice_number },
            ],
          },
        ],
      }).catch(() => null);
    } else {
      // payment_partial_received: {{1}}=contact, {{2}}=amount_paid, {{3}}=invoice_number, {{4}}=remaining, {{5}}=url
      await sendWhatsAppTemplate(phone, "payment_partial_received", {
        language: "en",
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: contactName },
              { type: "text", text: fmtINR(input.amountPaid) },
              { type: "text", text: invoice.invoice_number },
              { type: "text", text: fmtINR(remaining) },
              { type: "text", text: invoiceUrl },
            ],
          },
        ],
      }).catch(() => null);
    }
  }

  return { ok: true, status: isPaidInFull ? "paid" : "partial" };
}
