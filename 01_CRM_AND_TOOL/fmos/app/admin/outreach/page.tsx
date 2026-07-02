import { createServerClientWithCookies } from "@/lib/supabase-server";
import OutreachBoardClient from "./outreach-board-client";

export const dynamic = "force-dynamic"; // live admin list — must reflect just-created rows

export default async function OutreachBoardPage() {
  const supabase = await createServerClientWithCookies();

  // Get current user role
  const [userResult, profileResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("profiles").select("role, full_name").single(),
  ]);

  const user = userResult.data?.user;
  const userRole = (profileResult.data as any)?.role || "admin";
  const isAdmin = userRole === "admin";

  // Fetch all active leads with outreach data.
  // last_activity_at + assigned_sales_exec are required by the board (stalled
  // badges, assignee filter); capped to keep the page responsive
  // at scale.
  // Page through ALL leads. Supabase caps each request at 1000 rows, so a single
  // .limit() truncated the board and the niche/city/assignee filters derived from
  // it. Loop with .range() until a short page returns.
  const LEAD_COLS = "id, company_name, industry, city, lead_type, outreach_stage, follow_up_date, created_at, last_activity_at, assigned_sales_exec, phone, status, last_contacted_at, last_outcome";
  // Count first, then fetch every page in PARALLEL — was 8 sequential round-trips.
  const { count: leadCount } = await supabase.from("leads").select("id", { count: "exact", head: true });
  const pageCount = Math.max(1, Math.ceil((leadCount || 0) / 1000));
  const pageResults = await Promise.all(
    Array.from({ length: pageCount }, (_, i) =>
      supabase
        .from("leads")
        .select(LEAD_COLS)
        .order("created_at", { ascending: false })
        .range(i * 1000, i * 1000 + 999)
    )
  );
  const error = pageResults.find((r) => r.error)?.error ?? null;
  const leads: any[] = pageResults.flatMap((r) => r.data || []);

  if (error) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50">
        <p className="text-red-500">Error loading leads: {error.message}</p>
      </div>
    );
  }

  // Fetch assignee profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, role");

  return (
    <OutreachBoardClient
      initialLeads={(leads || []) as any[]}
      profiles={(profiles || []) as any[]}
      isAdmin={isAdmin}
      userId={user?.id || null}
    />
  );
}
