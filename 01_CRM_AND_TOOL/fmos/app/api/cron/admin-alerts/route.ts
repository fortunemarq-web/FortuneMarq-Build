import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { verifyCronSecret } from "@/lib/cron-auth";

export async function POST(req: NextRequest) {
    const denied = verifyCronSecret(req);
    if (denied) return denied;

    const supabase = createAdminClient();

    try {
        // 2. Call DB Function (Security Definer handles permissions)
        const { data, error } = await supabase.rpc('generate_admin_alerts' as any);

        if (error) throw error;

        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// Vercel Cron invokes via GET; same handler, same secret check.
export { POST as GET };
