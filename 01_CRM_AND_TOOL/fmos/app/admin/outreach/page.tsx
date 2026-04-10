import { createServerClientWithCookies } from "@/lib/supabase-server";
import OutreachBoardClient from "./outreach-board-client";

export const revalidate = 60;

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

  // Fetch all active leads with outreach data
  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, company_name, industry, city, lead_type, outreach_stage, follow_up_date, last_outreach_at, assigned_to, created_at, updated_at, phone, status")
    .order("updated_at", { ascending: false });

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
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
