"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

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
