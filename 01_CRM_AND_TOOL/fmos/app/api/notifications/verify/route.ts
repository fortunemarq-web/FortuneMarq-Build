import { createServerClientWithCookies } from "@/lib/supabase-server";
import { sendNotification } from "@/lib/notifications";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        const supabase = await createServerClientWithCookies();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

        // 1. Check for follow-ups due soon (within 1 hour)
        const { data: dueSoon } = await supabase
            .from("follow_ups")
            .select("*, lead:leads(company_name)")
            .eq("assigned_to", user.id)
            .eq("status", "pending")
            .gt("scheduled_at", now.toISOString())
            .lt("scheduled_at", oneHourFromNow.toISOString());

        if (dueSoon) {
            for (const fu of (dueSoon as any[])) {
                // Check if we already sent a due_soon notification for this FU
                const { data: existing } = await supabase
                    .from("notifications")
                    .select("id")
                    .eq("type", "follow_up_due" as any)
                    .eq("entity_id", (fu as any).id)
                    .maybeSingle();

                if (!existing) {
                    await sendNotification({
                        userId: user.id,
                        type: 'follow_up_due',
                        title: 'Follow-up Due Soon',
                        body: `Reminder: Call ${(fu as any).lead?.company_name || 'Prospect'} scheduled for ${new Date((fu as any).scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                        link: `/sales`,
                        entityId: (fu as any).id,
                        entityType: 'follow_up'
                    });
                }
            }
        }

        // 2. Check for overdue follow-ups
        const { data: overdue } = await supabase
            .from("follow_ups")
            .select("*, lead:leads(company_name)")
            .eq("assigned_to", user.id)
            .eq("status", "pending")
            .lt("scheduled_at", now.toISOString());

        if (overdue) {
            for (const fu of (overdue as any[])) {
                // Check if we already sent an overdue notification
                const { data: existing } = await supabase
                    .from("notifications")
                    .select("id")
                    .eq("type", "follow_up_overdue" as any)
                    .eq("entity_id", (fu as any).id)
                    .maybeSingle();

                if (!existing) {
                    await sendNotification({
                        userId: user.id,
                        type: 'follow_up_overdue',
                        title: 'Follow-up Overdue!',
                        body: `Action Required: You missed the scheduled follow-up for ${(fu as any).lead?.company_name || 'Prospect'}.`,
                        link: `/sales`,
                        entityId: (fu as any).id,
                        entityType: 'follow_up'
                    });
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Notification Check Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
