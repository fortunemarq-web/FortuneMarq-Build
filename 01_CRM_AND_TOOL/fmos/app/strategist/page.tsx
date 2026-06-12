import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";
import StrategistPipeline from "@/components/strategist/strategist-pipeline";

export default async function StrategistDashboardPage() {
  const supabase = await createServerClientWithCookies();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Unauthorized</h1>
          <p className="mt-2 text-slate-600">Please log in to access the Strategist Dashboard.</p>
          <Link href="/login" className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  // Fetch leads in the strategist pipeline (active)
  const { data: activeLeads, error } = await supabase
    .from("leads")
    .select("*")
    .in("status", ["qualified", "strategy_booked", "strategy_completed", "proposal_sent", "contract_signed"] as any)
    .order("created_at", { ascending: false })
    .limit(500);

  // Fetch closed won leads
  const { data: closedWonLeads, error: wonError } = await supabase
    .from("leads")
    .select("*")
    .eq("status", "closed_won")
    .order("created_at", { ascending: false })
    .limit(50);
  if (wonError) console.error("closed_won fetch failed:", wonError.message);

  // Fetch closed lost leads
  const { data: closedLostLeads, error: lostError } = await supabase
    .from("leads")
    .select("*")
    .eq("status", "closed_lost")
    .order("created_at", { ascending: false })
    .limit(50);
  if (lostError) console.error("closed_lost fetch failed:", lostError.message);

  // Fetch recent call activities for follow-up tracking
  const { data: activities, error: activitiesError } = await supabase
    .from("lead_outcomes")
    .select("id, lead_id, outcome, notes:call_notes, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (activitiesError) console.error("lead_outcomes fetch failed:", activitiesError.message);

  // Fetch metrics for Dashboard view
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();

  const [needsProposalResult, needsContractResult] = await Promise.all([
    supabase
      .from("leads")
      .select("*")
      .eq("status", "strategy_completed")
      .order("next_action_date", { ascending: true })
      .limit(200),

    supabase
      .from("leads")
      .select("*")
      .eq("status", "proposal_sent")
      .lte("proposal_sent_at", threeDaysAgo)
      .order("proposal_sent_at", { ascending: true })
      .limit(200),
  ]);

  if (needsProposalResult.error) console.error("needs_proposal fetch failed:", needsProposalResult.error.message);
  if (needsContractResult.error) console.error("needs_contract fetch failed:", needsContractResult.error.message);

  const needsProposal = needsProposalResult.data ?? [];
  const needsContract = needsContractResult.data ?? [];

  if (error) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <p className="text-red-500">Error loading leads: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Strategist Dashboard</h1>
          <Link
            href="/strategist/deals"
            className="px-4 py-2 bg-[#42CA80] text-white shadow-sm transition-all duration-150 hover:bg-[#35A66A] hover:shadow active:scale-[0.98] active:bg-[#2d9960] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#42CA80] focus-visible:ring-offset-2 text-white font-medium rounded-lg "
          >
            Manage All Deals
          </Link>
        </div>

        <StrategistPipeline
          initialLeads={activeLeads || []}
          closedWonLeads={closedWonLeads || []}
          closedLostLeads={closedLostLeads || []}
          callActivities={activities || []}
          needsProposal={needsProposal}
          needsContract={needsContract}
          userId={user?.id}
        />
      </div>
    </div>
  );
}
