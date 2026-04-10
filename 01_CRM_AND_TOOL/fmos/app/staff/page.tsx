import { createServerClientWithCookies } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import StaffDashboard from "@/components/staff/staff-dashboard";

export default async function StaffPage() {
  const supabase = await createServerClientWithCookies();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get placeholder name or real name
  let staffName = "Staff Member";
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  if (profile?.full_name) {
    staffName = profile.full_name;
  } else if (user.email) {
    staffName = user.email.split("@")[0];
  }

  // Fetch all tasks with project and client info
  // The RLS policies will filter what this user can actually see
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select(`
      *,
      projects (
        service_type,
        clients (
          business_name
        )
      )
    `)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <p className="text-red-500">Error loading tasks: {error.message}</p>
        </div>
      </div>
    );
  }

  // Filter tasks to only those assigned to the logged-in user
  const staffTasks = tasks?.filter(task => task.assigned_to === user.id) ?? [];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex justify-end mb-4">
          {/* Link to advanced Task Manager */}
          <Link href="/tasks/list" className="text-sm text-[#42CA80] hover:underline">
            Go to Advanced Task Manager &rarr;
          </Link>
        </div>
        <StaffDashboard tasks={staffTasks as any[]} staffName={staffName} />
      </div>
    </div>
  );
}

