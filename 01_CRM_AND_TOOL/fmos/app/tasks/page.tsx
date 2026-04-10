import { createServerClientWithCookies } from "@/lib/supabase-server";
import TaskBoard from "@/components/tasks/task-board";
import StaffTaskBoard from "@/components/tasks/staff-task-board";
import Link from "next/link";
import { ArrowLeft, ListTodo } from "lucide-react";

// Phase B3: Role-based task view
// - staff / execution_specialist → StaffTaskBoard (only their own tasks, 4-column kanban)
// - admin / pm / manager → Full TaskBoard (all tasks)

export default async function TasksPage() {
  const supabase = await createServerClientWithCookies();
  const { data: { user } } = await supabase.auth.getUser();

  // Get user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .single();

  const userRole = (profile as any)?.role || null;
  const isStaff = userRole === "execution_specialist" || userRole === "staff";

  // ── STAFF VIEW: Only this user's tasks ───────────────────────
  if (isStaff && user) {
    let tasks: any[] = [];
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          id,
          title,
          status,
          due_date,
          description,
          revision_notes,
          revision_count,
          client_id,
          project_id,
          projects (
            id,
            name,
            service_type,
            clients (
              business_name
            )
          )
        `)
        .eq("assigned_to", user.id)
        .not("status", "eq", "cancelled")
        .order("due_date", { ascending: true, nullsFirst: false });

      if (!error) tasks = data || [];
    } catch (e) {}

    return <StaffTaskBoard initialTasks={tasks} userId={user.id} />;
  }

  // ── ADMIN / PM VIEW: All tasks ────────────────────────────────
  let tasks = null;
  let tasksError = null;

  try {
    const { data, error } = await supabase
      .from("tasks")
      .select(`
        id,
        title,
        status,
        due_date,
        project_id,
        priority,
        sop_content,
        assigned_to,
        section_tag,
        estimated_minutes,
        client_id,
        assignee:profiles (
          id,
          full_name
        ),
        projects (
          id,
          name,
          service_type,
          clients (
            business_name
          )
        )
      `)
      .order("due_date", { ascending: true, nullsFirst: false });

    tasks = data;
    tasksError = error;
  } catch (e: any) {
    tasksError = e;
  }

  let projectsData = null;
  try {
    const { data } = await supabase
      .from("projects")
      .select("id, name, status, clients(business_name)")
      .order("name", { ascending: true });
    projectsData = data;
  } catch (e: any) {}

  if (tasksError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <p className="text-red-500">Error loading tasks: {tasksError.message}</p>
          <Link href="/" className="mt-4 inline-block text-[#42CA80] hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-[#42CA80]">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#42CA80]/10">
              <ListTodo className="h-5 w-5 text-[#42CA80]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Task Board</h1>
              <p className="text-sm text-slate-500">Manage and track all project tasks</p>
            </div>
          </div>
        </div>
        <TaskBoard initialTasks={(tasks || []) as any[]} projects={projectsData || []} />
      </div>
    </div>
  );
}
