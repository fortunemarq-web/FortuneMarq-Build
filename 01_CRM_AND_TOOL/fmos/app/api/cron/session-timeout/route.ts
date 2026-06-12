import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { verifyCronSecret } from "@/lib/cron-auth";

export async function POST(req: NextRequest) {
    const denied = verifyCronSecret(req);
    if (denied) return denied;

    const supabase = createAdminClient() as any;

    try {
        // Call security definer function to clean up
        const { data: count, error } = await supabase.rpc('cleanup_inactive_sessions', {
            timeout_minutes: 20
        });

        if (error) throw error;

        return NextResponse.json({ success: true, sessions_closed: count });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
