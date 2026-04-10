import { createServerClientWithCookies } from "@/lib/supabase-server";
import PMDashboard from "@/components/projects/pm-dashboard";

export default async function ProjectsPage() {
  const supabase = await createServerClientWithCookies();

  // Fetch all projects with client relationship
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select(`
      *,
      clients (
        id,
        business_name,
        primary_email
      )
    `)
    .order("deadline", { ascending: true, nullsFirst: false });

  // Fetch all tasks
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("*")
    .order("due_date", { ascending: true, nullsFirst: false });

  if (tasksError) console.error("tasks fetch failed:", tasksError.message);

  // If projects don't have client_id, try to get it from deals
  const projectsWithoutClients = projects?.filter((p: any) => !p.client_id && p.deal_id) || [];
  const dealsMap = new Map();

  if (projectsWithoutClients.length > 0) {
    const dealIds = projectsWithoutClients.map((p: any) => p.deal_id);
    const { data: deals, error: dealsError } = await supabase
      .from("deals")
      .select("id, client_id")
      .in("id", dealIds);

    if (dealsError) console.error("deals fetch failed:", dealsError.message);

    if (deals) {
      deals.forEach((deal: any) => {
        if (deal.client_id) {
          dealsMap.set(deal.id, deal.client_id);
        }
      });
    }
  }

  // Fetch clients for deals that have client_id
  const clientIdsFromDeals = Array.from(dealsMap.values());
  const clientsFromDealsMap = new Map();

  if (clientIdsFromDeals.length > 0) {
    const { data: clientsFromDeals, error: clientsEnrichError } = await supabase
      .from("clients")
      .select("id, business_name, primary_email")
      .in("id", clientIdsFromDeals);

    if (clientsEnrichError) console.error("clients enrichment fetch failed:", clientsEnrichError.message);

    if (clientsFromDeals) {
      clientsFromDeals.forEach((client: any) => {
        clientsFromDealsMap.set(client.id, client);
      });
    }
  }

  // Fetch client resources (table not yet in generated types)
  const { data: clientResources, error: resourcesError } = await supabase
    .from("client_resources" as any)
    .select("*");
  if (resourcesError) console.error("client_resources fetch failed:", resourcesError.message);

  if (projectsError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <p className="text-red-500">Error loading projects: {projectsError.message}</p>
          <p className="mt-2 text-sm text-slate-500">
            Debug: Check if projects table exists and has data.
          </p>
        </div>
      </div>
    );
  }

  // Enrich projects with clients from deals if needed
  const enrichedProjects = (projects || []).map((project: any) => {
    let client = project.clients;

    if (!client && project.deal_id) {
      const clientIdFromDeal = dealsMap.get(project.deal_id);
      if (clientIdFromDeal) {
        client = clientsFromDealsMap.get(clientIdFromDeal) || null;
      }
    }

    return {
      ...project,
      clients: client,
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-7xl">
        <PMDashboard
          projects={enrichedProjects}
          tasks={(tasks || []) as any[]}
          clientResources={(clientResources || []) as any[]}
        />
      </div>
    </div>
  );
}
