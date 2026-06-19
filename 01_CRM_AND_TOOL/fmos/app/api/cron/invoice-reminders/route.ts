import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { sendWhatsAppTemplate, toWaNumber } from "@/lib/whatsapp/send";

const APP_URL = () =>
  (process.env.NEXT_PUBLIC_APP_URL || "https://fmos.fortunemarq.com").replace(/\/$/, "");

const IST = "Asia/Kolkata";
function fmtINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { timeZone: IST, day: "numeric", month: "short" });
}

function verifyCronSecret(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") || "";
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

/**
 * Daily cron — fires payment_reminder on due date, payment_overdue after due date.
 * Skips already-paid/partial invoices.
 */
export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient() as any;
  const today = new Date().toISOString().split("T")[0];

  // Fetch all unpaid invoices with a client that has a phone
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, total_amount, due_date, status, client_id")
    .in("status", ["unpaid", "partial"])
    .not("client_id", "is", null);

  let reminded = 0;
  let overdue = 0;

  for (const inv of invoices ?? []) {
    const dueDate = inv.due_date as string;
    const isDueToday = dueDate === today;
    const isOverdue = dueDate < today;

    if (!isDueToday && !isOverdue) continue;

    const { data: client } = await supabase
      .from("clients")
      .select("business_name, phone, owner_name")
      .eq("id", inv.client_id)
      .maybeSingle();

    if (!client?.phone || !toWaNumber(client.phone)) continue;

    const contactName = client.owner_name || client.business_name || "there";
    const invoiceUrl = `${APP_URL()}/inv/${inv.id}`;
    const total = fmtINR(Number(inv.total_amount));

    if (isDueToday) {
      // payment_reminder: {{1}}=contact, {{2}}=invoice_number, {{3}}=amount, {{4}}=due_date, {{5}}=url
      await sendWhatsAppTemplate(client.phone, "payment_reminder", {
        language: "en",
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: contactName },
              { type: "text", text: inv.invoice_number },
              { type: "text", text: total },
              { type: "text", text: fmtDate(dueDate) },
              { type: "text", text: invoiceUrl },
            ],
          },
        ],
      }).catch(() => null);
      reminded++;
    } else if (isOverdue) {
      // payment_overdue: {{1}}=contact, {{2}}=invoice_number, {{3}}=amount, {{4}}=url
      const r = await sendWhatsAppTemplate(client.phone, "payment_overdue", {
        language: "en",
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: contactName },
              { type: "text", text: inv.invoice_number },
              { type: "text", text: total },
              { type: "text", text: invoiceUrl },
            ],
          },
        ],
      }).catch(() => null);

      // Only flag overdue (which removes it from future runs) when the reminder
      // actually sent — otherwise a throttled/failed first send silences it forever.
      if (r?.success) {
        await supabase
          .from("invoices")
          .update({ status: "overdue" })
          .eq("id", inv.id);
        overdue++;
      }
    }
  }

  return NextResponse.json({ ok: true, reminded, overdue });
}
