import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { generateReportsForNiche } from "@/actions/generate-reports";
import type { ReportLang } from "@/lib/reports/content";

// Batch-generate the report library for every market_insights row.
// Guarded by CRON_SECRET. POST with header x-cron-secret.
// Body (optional): { langs?: ("en"|"kn")[] } — defaults to English only.
export const maxDuration = 800;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (req.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let langs: ReportLang[] = ["en"];
  try {
    const body = await req.json();
    if (Array.isArray(body?.langs) && body.langs.length) langs = body.langs;
  } catch {
    /* default en */
  }

  const admin = createAdminClient();
  const { data: rows, error } = await (admin.from("market_insights") as any)
    .select("industry, city")
    .not("competitor_insights", "is", null)
    .not("general_insights", "is", null)
    .order("city")
    .order("industry");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: { industry: string; city: string; generated: number; errors: string[] }[] = [];
  let totalPdfs = 0;
  for (const r of (rows || []) as { industry: string; city: string }[]) {
    const res = await generateReportsForNiche(r.industry, r.city, langs);
    totalPdfs += res.generated.length;
    results.push({ industry: r.industry, city: r.city, generated: res.generated.length, errors: res.errors });
  }

  return NextResponse.json({
    combos: results.length,
    langs,
    totalPdfs,
    failures: results.filter((r) => r.errors.length),
  });
}
