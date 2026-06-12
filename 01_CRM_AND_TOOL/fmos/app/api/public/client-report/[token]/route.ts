import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

/**
 * Public magic-link report fetch. The token IS the credential, so this
 * runs on the service-role client and returns exactly one report when
 * the token matches. RLS keeps client_reports locked for anon.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Tokens are UUIDs/long random strings — reject junk before querying
  if (!token || token.length < 16 || token.length > 128) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("client_reports" as any)
    .select("*, clients(business_name)")
    .eq("magic_link_token", token)
    .maybeSingle();

  if (error) {
    console.error("[public client-report]", error.message);
    return NextResponse.json({ error: "Could not load report" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json({ report: data });
}
