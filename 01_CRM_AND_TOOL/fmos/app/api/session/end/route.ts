import { NextRequest, NextResponse } from "next/server";
import { createServerClientWithCookies } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
    const sessionId = req.cookies.get("app_session_id")?.value;
    const response = NextResponse.json({ success: true });

    // Clear cookie immediately
    response.cookies.delete("app_session_id");

    if (sessionId) {
        const supabase = await createServerClientWithCookies();

        await supabase.from("user_sessions" as any)
            .update({
                logout_at: new Date().toISOString(),
                ended_reason: 'logout'
            })
            .eq("id", sessionId);

        // Audit Log could go here
    }

    return response;
}
