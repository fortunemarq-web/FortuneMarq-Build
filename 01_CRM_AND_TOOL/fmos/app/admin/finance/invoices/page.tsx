import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";
import { autoMarkOverdueInvoices } from "../actions";
import { getBusinessSettings } from "@/app/admin/settings/actions";
import InvoiceManagerClient from "@/components/admin/finance/InvoiceManagerClient";

export const dynamic = "force-dynamic"; // live admin list — must reflect just-created rows

export default async function InvoiceManagerPage() {
  const supabase = await createServerClientWithCookies();

  await autoMarkOverdueInvoices();

  const [invoicesResult, clientsResult, settings] = await Promise.all([
    supabase.from('invoices').select('*, clients(id, business_name, primary_email, phone), invoice_line_items(*)').order('invoice_number', { ascending: false }),
    supabase.from('clients').select('id, business_name, primary_email, phone').eq('status', 'active'),
    getBusinessSettings(),
  ]);

  return (
    <div className="min-h-full bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <InvoiceManagerClient
          initialInvoices={invoicesResult.data || []}
          clients={clientsResult.data || []}
          settings={settings}
        />
      </div>
    </div>
  );
}
