"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { sendNotification } from "@/lib/notifications";

export default function FollowupChecker() {
    const supabase = createClient();

    useEffect(() => {
        const checkFollowups = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const now = new Date().toISOString();
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
            const twoHoursAhead = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

            // 1. Check for OVERDUE follow-ups
            const { data: overdue } = await (supabase.from("follow_ups" as any)
                .select("*, leads(company_name)")
                .eq("status", "pending")
                .lt("scheduled_at", now)
                .eq("assigned_to", user.id) as any);

            if (overdue) {
                for (const f of overdue) {
                    await sendNotification({
                        userId: user.id,
                        type: 'follow_up_overdue',
                        title: 'Follow-up Overdue!',
                        body: `You missed a follow-up for ${(f.leads as any)?.company_name || 'a lead'}.`,
                        link: '/sales', // Assuming sales page shows follow-ups
                        entityType: 'lead',
                        entityId: f.lead_id
                    });
                }
            }

            // 2. Check for UPCOMING (Due) follow-ups (next 15 mins)
            const fifteenMinsFromNow = new Date(Date.now() + 15 * 60 * 1000).toISOString();
            const { data: due } = await (supabase.from("follow_ups" as any)
                .select("*, leads(company_name)")
                .eq("status", "pending")
                .gte("scheduled_at", now)
                .lte("scheduled_at", fifteenMinsFromNow)
                .eq("assigned_to", user.id) as any);

            if (due) {
                for (const f of due) {
                    await sendNotification({
                        userId: user.id,
                        type: 'follow_up_due',
                        title: 'Follow-up Due Soon',
                        body: `Follow-up for ${(f.leads as any)?.company_name || 'a lead'} is scheduled in 15 mins.`,
                        link: '/sales',
                        entityType: 'lead',
                        entityId: f.lead_id
                    });
                }
            }
        };

        // Run check on mount
        checkFollowups();

        // And every 5 minutes
        const interval = setInterval(checkFollowups, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return null; // Silent component
}
