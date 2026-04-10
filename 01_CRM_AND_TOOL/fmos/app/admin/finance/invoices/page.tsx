import { createServerClientWithCookies } from "@/lib/supabase-server";
import { Plus, Search, Filter, Download, MoreVertical, Send, CheckCircle2, AlertCircle, FileText, Trash2 } from "lucide-react";
import Link from "next/link";
import { autoMarkOverdueInvoices } from "../actions";
import InvoiceManagerClient from "@/components/admin/finance/InvoiceManagerClient";

export default async function InvoiceManagerPage() {
  const supabase = await createServerClientWithCookies();
  
  // 1. Auto-mark overdue invoices on page load
  await autoMarkOverdueInvoices();

  // 2. Fetch all invoices with client details
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, clients(id, business_name, email)')
    .order('invoice_number', { ascending: false });

  // 3. Fetch all clients for the "Create Invoice" modal
  const { data: clients } = await supabase
    .from('clients')
    .select('id, business_name, email')
    .eq('status', 'active');

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <InvoiceManagerClient 
          initialInvoices={invoices || []} 
          clients={clients || []} 
        />
      </div>
    </div>
  );
}
