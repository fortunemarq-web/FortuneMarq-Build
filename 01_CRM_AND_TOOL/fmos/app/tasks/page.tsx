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

  // Get user role (scoped to the signed-in user — .single() without a
  // filter returns an arbitrary row)
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .single()
    : { data: null };

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
      <div className="flex min-h-full items-center justify-center bg-slate-50 px-4">
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
    <div className="min-h-full bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft">
            <ListTodo className="h-4 w-4 text-brand-deep" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Tasks</h1>
            <p className="text-[13px] text-slate-500">Manage and track all project tasks</p>
          </div>
        </div>
        <TaskBoard
          initialTasks={(tasks || []) as any[]}
          projects={projectsData || []}
          currentUserId={user?.id ?? null}
        />
      </div>
    </div>
  );
}
