import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ClientMilestoneList from "@/components/client-portal/client-milestone-list";

interface ClientPortalPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClientPortalPage({ params }: ClientPortalPageProps) {
  const { id } = await params;

  const supabase = await createServerClientWithCookies();

  // Fetch project with client details
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  // Fetch client if client_id exists
  let clientData: { id: string; business_name: string | null; primary_email: string | null } | null = null;
  if (project?.client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("id, business_name, primary_email")
      .eq("id", project.client_id)
      .single();
    clientData = client;
  }

  // Fetch milestones ordered by order_index
  const { data: milestones, error: milestonesError } = await supabase
    .from("project_milestones")
    .select("*")
    .eq("project_id", id)
    .order("order_index", { ascending: true });

  if (projectError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <p className="text-red-500">
            Error loading project: {projectError.message}
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-[#42CA80] hover:underline"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <p className="text-slate-500">Project not found.</p>
          <Link
            href="/"
            className="mt-4 inline-block text-[#42CA80] hover:underline"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const formatServiceType = (serviceType: string) => {
    return serviceType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const clientName = clientData?.business_name || "Your Project";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-[#42CA80]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <div className="mt-6 text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-[#42CA80]">
              Client Portal
            </p>
            <h1 className="mt-2 text-4xl font-mono tabular-nums font-bold text-slate-900 md:text-4xl">
              {clientName}
            </h1>
            <p className="mt-2 text-slate-500">
              {formatServiceType(project.service_type || "")}
            </p>
          </div>
        </div>

        {/* Project Info Summary */}
        <div className="mb-8 rounded-xl border border-slate-200 bg-slate-200/50 p-5">
          <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Status
              </p>
              <p className="mt-1 font-semibold capitalize text-slate-900">
                {project.status?.replace("_", " ") || "Not Started"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Start Date
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {formatDate(project.start_date)}
              </p>
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Deadline
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {formatDate(project.deadline)}
              </p>
            </div>
          </div>
        </div>

        {/* Milestones Section */}
        <div>
          <h2 className="mb-6 text-center text-xl font-bold text-slate-900">
            Project Milestones
          </h2>
          <ClientMilestoneList
            initialMilestones={(milestones || []) as any[]}
            projectId={id}
            milestonesError={milestonesError}
          />
        </div>
      </div>
    </div>
  );
}

