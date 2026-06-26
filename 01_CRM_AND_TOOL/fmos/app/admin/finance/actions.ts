"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { sendNotification } from "@/lib/notifications";
import { computeGstAmount, resolveGstRate } from "@/lib/finance/gst";

/**
 * Auto-mark unpaid invoices as overdue if the due date has passed.
 * Fired on finance dashboard and invoice manager page loads.
 */
export async function autoMarkOverdueInvoices() {
  const supabase = await createServerClientWithCookies();
  const today = new Date().toISOString().split('T')[0];

  const { error } = await (supabase.from('invoices') as any)
    .update({ status: 'overdue' })
    .match({ status: 'unpaid' })
    .lt('due_date', today);

  if (error) {
    console.error("Failed to auto-mark overdue invoices:", error);
    return { success: false, error: error.message };
  }

  // Fetch all overdue invoices to notify admin daily
  const { data: allOverdue } = await (supabase.from('invoices') as any)
    .select('id, invoice_number')
    .eq('status', 'overdue');

  if (allOverdue && allOverdue.length > 0) {
    const { data: adminProfile } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();
    if (adminProfile) {
      for (const inv of allOverdue) {
        await sendNotification({
          userId: adminProfile.id,
          type: "system",
          title: "Invoice Overdue",
          body: `Invoice ${inv.invoice_number || inv.id} is overdue.`,
          link: `/admin/finance/invoices`,
          entityType: "invoice",
          entityId: inv.id
        });
      }
    }
  }

  return { success: true };
}

/**
 * Fetch financial dashboard data (MRR, MTD Revenue, Collected, Outstanding, Expenses)
 */
export async function getFinanceDashboardStats() {
  const supabase = await createServerClientWithCookies();
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  // 1. MRR from active clients
  const { data: clients } = await (supabase.from('clients') as any)
    .select('monthly_value')
    .eq('status', 'active');
  
  const mrr = clients?.reduce((acc: number, c: any) => acc + (Number(c.monthly_value) || 0), 0) || 0;

  // 2. MTD One-time Revenue (non-recurring invoices issued this month)
  // Logic: All invoices issued this month. (In a real app, you'd distinguish recurring vs one-time)
  const { data: mtdInvoices } = await (supabase.from('invoices') as any)
    .select('total_amount, status, paid_amount')
    .gte('issue_date', firstDayOfMonth);

  const mtdRevenue = mtdInvoices?.reduce((acc: number, inv: any) => acc + Number(inv.total_amount), 0) || 0;

  // 3. MTD Collected (paid_amount from invoices marked paid this month)
  const { data: collectedInvoices } = await (supabase.from('invoices') as any)
    .select('paid_amount')
    .eq('status', 'paid')
    .gte('paid_at', firstDayOfMonth + 'T00:00:00Z');

  const mtdCollected = collectedInvoices?.reduce((acc: number, inv: any) => acc + (Number(inv.paid_amount) || 0), 0) || 0;

  // 4. Outstanding (total_amount of all current unpaid/overdue invoices)
  const { data: outstandingInvoices } = await (supabase.from('invoices') as any)
    .select('total_amount')
    .in('status', ['unpaid', 'overdue']);
  
  const totalOutstanding = outstandingInvoices?.reduce((acc: number, inv: any) => acc + Number(inv.total_amount), 0) || 0;

  // 5. MTD Expenses
  const { data: expenses } = await (supabase.from('expenses') as any)
    .select('amount')
    .gte('expense_date', firstDayOfMonth);
  
  const mtdExpenses = expenses?.reduce((acc: number, exp: any) => acc + Number(exp.amount), 0) || 0;

  return {
    mrr,
    mtdRevenue,
    mtdCollected,
    totalOutstanding,
    mtdExpenses
  };
}

/**
 * Fetch chart data for Revenue vs Expenses over 6 months
 */
export async function getRevenueVsExpensesChartData() {
  const supabase = await createServerClientWithCookies();
  const months = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = d.toLocaleString('default', { month: 'short' });
    const year = d.getFullYear();
    const startDate = d.toISOString().split('T')[0];
    const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];

    // Fetch Revenue (collected in this month)
    const { data: rev } = await (supabase.from('invoices') as any)
      .select('paid_amount, revenue_type')
      .eq('status', 'paid')
      .gte('paid_at', startDate + 'T00:00:00Z')
      .lte('paid_at', endDate + 'T23:59:59Z');

    // Fetch Expenses this month
    const { data: exp } = await (supabase.from('expenses') as any)
      .select('amount')
      .gte('expense_date', startDate)
      .lte('expense_date', endDate);

    const mrr = rev?.filter((r: any) => (r.revenue_type || 'mrr') === 'mrr').reduce((acc: number, r: any) => acc + (Number(r.paid_amount) || 0), 0) || 0;
    const setupFee = rev?.filter((r: any) => r.revenue_type === 'setup_fee' || r.revenue_type === 'setup').reduce((acc: number, r: any) => acc + (Number(r.paid_amount) || 0), 0) || 0;
    const oneTime = rev?.filter((r: any) => r.revenue_type === 'one_time').reduce((acc: number, r: any) => acc + (Number(r.paid_amount) || 0), 0) || 0;
    
    const revenue = mrr + setupFee + oneTime;
    const expense = exp?.reduce((acc: number, e: any) => acc + Number(e.amount), 0) || 0;

    months.push({
      name: `${monthName} ${year}`,
      revenue,
      mrr,
      setupFee,
      oneTime,
      expenses: expense,
      profit: revenue - expense
    });
  }

  return months;
}

/**
 * Create a new invoice
 */
export async function createInvoice(invoiceData: any, lineItems: any[]) {
  const supabase = await createServerClientWithCookies();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: invoice, error: invError } = await (supabase.from('invoices') as any)
    .insert({
      ...invoiceData,
      created_by: user?.id
    })
    .select()
    .single();

  if (invError) throw new Error(invError.message);

  const { error: itemsError } = await (supabase.from('invoice_line_items') as any)
    .insert(
      lineItems.map((item: any, i: number) => ({
        ...item,
        invoice_id: invoice.id,
        sort_order: i
      }))
    );

  if (itemsError) throw new Error(itemsError.message);

  revalidatePath("/admin/finance/invoices");
  return invoice;
}

/**
 * Create a new expense
 */
export async function createExpense(expenseData: any) {
  const supabase = await createServerClientWithCookies();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await (supabase.from('expenses') as any)
    .insert({
      ...expenseData,
      created_by: user?.id
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/admin/finance/expenses");
  revalidatePath("/admin/finance");
  return data;
}

/**
 * Generate this month's MRR invoices — one per active client with a
 * monthly retainer, skipping clients already billed this month.
 * This is the monthly "press one button, bill everyone" flow.
 */
export async function generateMonthlyInvoices(): Promise<{
  created: number;
  skipped: number;
  errors: string[];
}> {
  const supabase = await createServerClientWithCookies();
  const { data: { user } } = await supabase.auth.getUser();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthLabel = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  // 1. Active clients with a retainer
  const { data: clients, error: clientsError } = await (supabase.from("clients") as any)
    .select("id, business_name, monthly_value")
    .eq("status", "active")
    .gt("monthly_value", 0);
  if (clientsError) throw new Error(clientsError.message);

  // GST rate from business settings (falls back to 18).
  const { data: settingsRow } = await (supabase.from("business_settings") as any)
    .select("gst_rate")
    .limit(1)
    .maybeSingle();
  const gstRate = resolveGstRate(settingsRow?.gst_rate);

  // 2. Clients already billed (mrr invoice issued this month, not cancelled)
  const { data: existing, error: existingError } = await (supabase.from("invoices") as any)
    .select("client_id")
    .eq("revenue_type", "mrr")
    .neq("status", "cancelled")
    .gte("issue_date", monthStart.split("T")[0]);
  if (existingError) throw new Error(existingError.message);
  const billedIds = new Set((existing || []).map((i: any) => i.client_id));

  const toBill = (clients || []).filter((c: any) => !billedIds.has(c.id));

  // 3. Sequence numbers: FM-YYYYMM-###
  const prefix = `FM-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const { count: monthCount } = await (supabase.from("invoices") as any)
    .select("id", { count: "exact", head: true })
    .ilike("invoice_number", `${prefix}%`);
  let seq = (monthCount || 0) + 1;

  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + 7);

  let created = 0;
  const errors: string[] = [];

  for (const client of toBill) {
    const subtotal = client.monthly_value;
    const gstAmount = computeGstAmount(subtotal, gstRate);
    const { data: invoice, error: invError } = await (supabase.from("invoices") as any)
      .insert({
        invoice_number: `${prefix}-${String(seq).padStart(3, "0")}`,
        client_id: client.id,
        issue_date: now.toISOString().split("T")[0],
        due_date: dueDate.toISOString().split("T")[0],
        subtotal,
        gst_amount: gstAmount,
        total_amount: subtotal + gstAmount,
        status: "unpaid",
        revenue_type: "mrr",
        notes: `Monthly retainer — ${monthLabel}`,
        created_by: user?.id,
      })
      .select("id")
      .single();

    if (invError || !invoice) {
      errors.push(`${client.business_name}: ${invError?.message ?? "no row returned"}`);
      continue;
    }

    const { error: itemError } = await (supabase.from("invoice_line_items") as any)
      .insert({
        invoice_id: invoice.id,
        description: `Monthly retainer — ${monthLabel}`,
        amount: subtotal,
        sort_order: 0,
      });
    if (itemError) errors.push(`${client.business_name} (line item): ${itemError.message}`);

    created++;
    seq++;
  }

  revalidatePath("/admin/finance/invoices");
  revalidatePath("/admin/finance");
  return { created, skipped: billedIds.size, errors };
}

/**
 * Update an existing invoice (only while not paid).
 * Replaces line items with the provided set.
 */
export async function updateInvoice(invoiceId: string, invoiceData: any, lineItems: any[]) {
  const supabase = await createServerClientWithCookies();

  const { data: existing, error: fetchError } = await (supabase.from('invoices') as any)
    .select('id, status')
    .eq('id', invoiceId)
    .single();
  if (fetchError) throw new Error(fetchError.message);
  if (existing.status === 'paid') throw new Error("Paid invoices can't be edited. Cancel and reissue instead.");

  const { data: invoice, error: invError } = await (supabase.from('invoices') as any)
    .update(invoiceData)
    .eq('id', invoiceId)
    .select()
    .single();
  if (invError) throw new Error(invError.message);

  const { error: delError } = await (supabase.from('invoice_line_items') as any)
    .delete()
    .eq('invoice_id', invoiceId);
  if (delError) throw new Error(delError.message);

  const { error: itemsError } = await (supabase.from('invoice_line_items') as any)
    .insert(lineItems.map((item: any, i: number) => ({
      description: item.description,
      amount: item.amount,
      invoice_id: invoiceId,
      sort_order: i,
    })));
  if (itemsError) throw new Error(itemsError.message);

  revalidatePath("/admin/finance/invoices");
  revalidatePath("/admin/finance");
  return invoice;
}

/**
 * Cancel (void) an invoice — soft delete that keeps the record for audit.
 */
export async function cancelInvoice(invoiceId: string) {
  const supabase = await createServerClientWithCookies();

  const { error } = await (supabase.from('invoices') as any)
    .update({ status: 'cancelled' })
    .eq('id', invoiceId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/finance/invoices");
  revalidatePath("/admin/finance");
  return { success: true };
}

/**
 * Hard-delete an invoice. Only allowed when not paid (mistakes/drafts).
 */
export async function deleteInvoice(invoiceId: string) {
  const supabase = await createServerClientWithCookies();

  const { data: existing, error: fetchError } = await (supabase.from('invoices') as any)
    .select('id, status')
    .eq('id', invoiceId)
    .single();
  if (fetchError) throw new Error(fetchError.message);
  if (existing.status === 'paid') throw new Error("Paid invoices can't be deleted — cancel instead.");

  const { error: itemsError } = await (supabase.from('invoice_line_items') as any)
    .delete()
    .eq('invoice_id', invoiceId);
  if (itemsError) throw new Error(itemsError.message);

  const { error } = await (supabase.from('invoices') as any)
    .delete()
    .eq('id', invoiceId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/finance/invoices");
  revalidatePath("/admin/finance");
  return { success: true };
}

/**
 * Update an expense
 */
export async function updateExpense(expenseId: string, expenseData: any) {
  const supabase = await createServerClientWithCookies();

  const { data, error } = await (supabase.from('expenses') as any)
    .update(expenseData)
    .eq('id', expenseId)
    .select()
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/admin/finance/expenses");
  revalidatePath("/admin/finance");
  return data;
}

/**
 * Delete an expense
 */
export async function deleteExpense(expenseId: string) {
  const supabase = await createServerClientWithCookies();

  const { error } = await (supabase.from('expenses') as any)
    .delete()
    .eq('id', expenseId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/finance/expenses");
  revalidatePath("/admin/finance");
  return { success: true };
}

/**
 * Mark invoice as paid
 */
export async function markInvoiceAsPaid(invoiceId: string, paidAmount: number) {
  const supabase = await createServerClientWithCookies();

  const { data, error } = await (supabase.from('invoices') as any)
    .update({
      status: 'paid',
      paid_amount: paidAmount,
      paid_at: new Date().toISOString()
    })
    .eq('id', invoiceId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/finance/invoices");
  revalidatePath("/admin/finance");
  return { success: true };
}

/**
 * Record a (possibly partial) payment against an invoice.
 * Accumulates paid_amount; flips status to 'paid' when fully covered,
 * 'partially_paid' otherwise. paid_at = date of the latest payment.
 */
export async function recordInvoicePayment(
  invoiceId: string,
  amount: number,
  paymentMethod?: string
) {
  const supabase = await createServerClientWithCookies();

  if (!amount || amount <= 0) return { success: false, error: "Amount must be positive" };

  const { data: inv, error: fetchError } = await (supabase.from('invoices') as any)
    .select('total_amount, paid_amount, status')
    .eq('id', invoiceId)
    .single();
  if (fetchError) return { success: false, error: fetchError.message };
  if (inv.status === 'cancelled') return { success: false, error: "Invoice is cancelled" };

  const newPaid = (Number(inv.paid_amount) || 0) + amount;
  const fullyPaid = newPaid >= Number(inv.total_amount) - 0.01;

  const { error } = await (supabase.from('invoices') as any)
    .update({
      paid_amount: newPaid,
      status: fullyPaid ? 'paid' : 'partially_paid',
      paid_at: new Date().toISOString(),
      ...(paymentMethod ? { payment_method: paymentMethod } : {}),
    })
    .eq('id', invoiceId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/finance/invoices");
  revalidatePath("/admin/finance");
  return {
    success: true,
    paidAmount: newPaid,
    status: fullyPaid ? 'paid' : 'partially_paid',
    remaining: Math.max(0, Number(inv.total_amount) - newPaid),
  };
}

/**
 * Fetch invoices for a specific client
 */
export async function getInvoicesByClient(clientId: string) {
  const supabase = await createServerClientWithCookies();
  
  const { data, error } = await (supabase.from('invoices') as any)
    .select('*, invoice_line_items(*)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}
