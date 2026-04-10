import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";
import ProjectDashboard from "@/components/projects/project-dashboard";
import FileManager from "@/components/ui/file-manager";

interface ProjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const supabase = await createServerClientWithCookies();

  // Fetch project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  // Fetch client if client_id exists
  let clientData = null;
  if (project && (project as any).client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("id, business_name, primary_email")
      .eq("id", (project as any).client_id)
      .single();
    clientData = client;
  }

  // Fetch tasks - explicitly join profiles to avoid expansion into 'users' table
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select(`
      id,
      title,
      status,
      due_date,
      assigned_to,
      assignee:profiles (
        id,
        full_name
      )
    `)
    .eq("project_id", id)
    .order("due_date", { ascending: true, nullsFirst: false });

  // Fetch Milestones
  const { data: milestones } = await supabase
    .from("project_milestones")
    .select("*")
    .eq("project_id", id)
    .order("due_date", { ascending: true });

  // Fetch Deliverables
  const { data: deliverables } = await supabase
    .from("deliverables" as any)
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  // Fetch Change Requests
  const { data: changeRequests } = await supabase
    .from("change_requests" as any)
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  // Merge client data
  const projectWithClient = project
    ? {
        ...(project as any),
        clients: clientData,
      }
    : null;

  if (projectError || !projectWithClient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <p className="text-red-500">
            {projectError ? `Error: ${projectError.message}` : "Project not found"}
          </p>
          <Link
            href="/projects"
            className="mt-4 inline-block text-[#42CA80] hover:underline"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ProjectDashboard
      project={projectWithClient}
      tasks={tasks || []}
      milestones={milestones || []}
      deliverables={deliverables || []}
      changeRequests={changeRequests || []}
      tasksError={tasksError}
      // Pass the FileManager as a component to be rendered inside the dashboard
      fileManager={
        <FileManager 
          bucket="project-assets" 
          projectId={id} 
          isClientVisible={false} 
        />
      }
    />
  );
}
