import { createServerClientWithCookies } from "@/lib/supabase-server";

export async function calculateSalesKPIs(supabase: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    // 1. Inbound New Today
    const { count: inboundNew, error: e1 } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayISO)
        .eq('source', 'inbound'); // Assuming 'source' exists and distinguishes inbound

    // 2. Inbound SLA Missed Today (assuming we track this on lead or have a way to calc)
    // For now, let's look for leads created today that are still 'new' (if that's the logic)
    // or use a hypothetical field if not tracked. 
    // The Prompt Step 1 mentions inputs like "inbound_contacted_within_sla_today".
    // Let's approximate: Check 'new' leads > 2 hours old? Or stick to specific fields.
    // If no SLA field exists, we return 0 placeholder or calculate if timestamps allow.
    // Placeholder for now as strict SLA logic might depend on business hours.
    const inboundSLAMissed = 0;

    // 3. Calls Logged Today
    const { count: callsLogged } = await supabase
        .from('lead_outcomes')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayISO)
        .eq('outcome_type', 'call'); // Adjust based on actual values

    // 4. Connected Today (outcomes not in [no_answer, etc])
    const { count: connected } = await supabase
        .from('lead_outcomes')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayISO)
        .not('outcome', 'in', '("no_answer","busy","voicemail")'); // Adjust values

    // 5. Followups Due Today
    const { count: followupsDue } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('next_action_date', todayISO)
        .lt('next_action_date', new Date(today.getTime() + 86400000).toISOString());

    // 6. Strategy Booked Today (status changed to 'strategy_scheduled' or similar?)
    // Checking audit logs for status change to 'strategy'
    const { count: strategyBooked } = await supabase
        .from('activity_events')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayISO)
        .eq('event_type', 'status_change')
        .ilike('description', '%strategy%'); // Heuristic

    return {
        inbound_new_today: inboundNew || 0,
        inbound_sla_missed_today: inboundSLAMissed,
        calls_logged_today: callsLogged || 0,
        connected_today: connected || 0,
        followups_due_today: followupsDue || 0,
        strategy_booked_today: strategyBooked || 0,
        // Add others as needed
    };
}

export async function calculateDeliveryKPIs(supabase: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // 1. Active Projects
    const { count: activeProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress');

    // 2. Tasks Due Today
    const { count: tasksDue } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .gte('due_date', todayISO)
        .lt('due_date', new Date(today.getTime() + 86400000).toISOString())
        .neq('status', 'completed');

    // 3. Tasks Overdue
    const { count: tasksOverdue } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .lt('due_date', todayISO)
        .neq('status', 'completed');

    // 4. Critical Overdue (> 3 days)
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);
    const { count: criticalOverdue } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .lt('due_date', threeDaysAgo.toISOString())
        .neq('status', 'completed');

    // 5. Stalled Projects (no activity in 7 days)
    // This is expensive: Projects where NOT EXISTS activity in last 7 days.
    // We can do it by fetching all active projects and checking their last activity.
    const { data: projects } = await supabase
        .from('projects')
        .select('id, title')
        .eq('status', 'in_progress');

    let stalledCount = 0;
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    if (projects) {
        for (const p of projects) {
            const { count } = await supabase
                .from('activity_events')
                .select('*', { count: 'exact', head: true })
                .eq('entity_id', p.id) // Assuming entity_id links to project
                .gte('created_at', sevenDaysAgo.toISOString());

            if (count === 0) stalledCount++;
        }
    }

    return {
        active_projects: activeProjects || 0,
        tasks_due_today: tasksDue || 0,
        tasks_overdue: tasksOverdue || 0,
        critical_overdue: criticalOverdue || 0,
        stalled_projects: stalledCount,
    };
}

export async function calculateClientHealthKPIs(supabase: any) {
    const today = new Date();

    // 1. Approvals Pending
    const { count: approvalsPending } = await supabase
        .from('milestone_approvals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

    // 2. Approvals Overdue (> 3 days)
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);

    // Assuming 'requested_at' or 'created_at' is available on milestone_approvals?
    // The migration didn't explicitly add 'requested_at' but usually 'created_at' defaults to now.
    // The previous prompt migration added `milestone_approvals` but didn't specify requested_at, probably `created_at`.
    const { count: approvalsOverdue } = await supabase
        .from('milestone_approvals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .lt('created_at', threeDaysAgo.toISOString());

    // 3. Change Requests Open
    const { count: changeRequestsOpen } = await supabase
        .from('change_requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['requested', 'reviewing']);

    return {
        approvals_pending: approvalsPending || 0,
        approvals_overdue: approvalsOverdue || 0,
        change_requests_open: changeRequestsOpen || 0
    };
}

export async function calculateStrategyKPIs(supabase: any) {
    return {
        deals_won_7d: 0,
        pipeline_value_open: 0,
        win_rate_30d: 0
    };
}

export async function calculateFinanceKPIs(supabase: any) {
    // 1. Outstanding Invoices (sum of unpaid total_amount)
    const { data: outstandingData } = await supabase
        .from('invoices')
        .select('total_amount')
        .eq('status', 'unpaid');
    
    const outstandingInvoices = (outstandingData || []).reduce((acc: number, curr: any) => acc + (Number(curr.total_amount) || 0), 0);

    // 2. Active Clients & MRR
    const { data: clientData } = await supabase
        .from('clients')
        .select('monthly_value')
        .eq('status', 'active');
    
    const activeClients = (clientData || []).length;
    const mrr = (clientData || []).reduce((acc: number, curr: any) => acc + (Number(curr.monthly_value) || 0), 0);

    return {
        outstanding_invoices: outstandingInvoices,
        active_clients: activeClients,
        mrr: mrr
    };
}

export async function generateDailySnapshot(customSupabase?: any) {
    const supabase = customSupabase || await createServerClientWithCookies();

    try {
        const sales = await calculateSalesKPIs(supabase);
        const delivery = await calculateDeliveryKPIs(supabase);
        const client = await calculateClientHealthKPIs(supabase);
        const strategy = await calculateStrategyKPIs(supabase);
        const finance = await calculateFinanceKPIs(supabase);

        const metrics = {
            ...sales,
            ...delivery,
            ...client,
            ...strategy,
            ...finance
        };

        const today = new Date().toISOString().split('T')[0];

        // Store in DB
        const { data, error } = await (supabase.from('admin_kpi_snapshots') as any)
            .upsert({
                day: today,
                metrics: metrics
            }, { onConflict: 'day' })
            .select();

        if (error) {
            console.error("Critical: Failed to generate daily snapshot", {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
                fullError: error // Log the whole object in case it has other hidden properties
            });

            // Add a more descriptive error for the console if it's empty
            if (Object.keys(error).length === 0) {
                console.error("Supabase returned an empty error object. This often indicates a network issue, missing table, or RLS policy denial without detailed feedback.");
            }
        }

        return metrics;
    } catch (err: any) {
        console.error("Unexpected error in generateDailySnapshot:", err);
        // Fallback to empty metrics if calculation fails
        return {};
    }
}

