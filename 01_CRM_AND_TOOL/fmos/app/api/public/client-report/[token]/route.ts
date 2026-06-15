import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

/**
 * Public magic-link report fetch. The token IS the credential, so this
 * runs on the service-role client. We only ever return a single report that
 * is PUBLISHED and UNEXPIRED, and only the columns the public page renders —
 * never client_id, created_by, or the token itself.
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
    .from("client_reports")
    .select(
      "report_month, report_type, ai_summary, pdf_url, data_snapshot, is_published, magic_link_expires_at, clients(business_name)"
    )
    .eq("magic_link_token", token)
    .maybeSingle();

  if (error) {
    console.error("[public client-report]", error.message);
    return NextResponse.json({ error: "Could not load report" }, { status: 500 });
  }

  const row = data as any;

  // Missing or still a draft → same 404 (don't reveal that a draft exists)
  if (!row || !row.is_published) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // Expired link → 410 Gone. Legacy rows with a null expiry stay valid.
  if (
    row.magic_link_expires_at &&
    new Date(row.magic_link_expires_at).getTime() < Date.now()
  ) {
    return NextResponse.json(
      { error: "This report link has expired" },
      { status: 410 }
    );
  }

  // Return only the fields the public report page actually renders
  return NextResponse.json({
    report: {
      report_month: row.report_month,
      report_type: row.report_type,
      ai_summary: row.ai_summary,
      pdf_url: row.pdf_url,
      data_snapshot: row.data_snapshot,
      clients: row.clients,
    },
  });
}
