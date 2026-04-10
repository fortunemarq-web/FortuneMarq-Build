import { createServerClientWithCookies } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import ProposalCreator from "@/components/proposals/proposal-creator";

export default async function NewProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClientWithCookies();

  const [userResult, leadResult, countResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("leads").select("id, company_name, contact_person, city, industry, lead_type").eq("id", id).single(),
    supabase.from("proposals").select("id", { count: "exact", head: true }),
  ]);

  if (leadResult.error || !leadResult.data) notFound();

  const count = countResult.count || 0;
  const proposalNumber = `PRO-2026-${String(count + 1).padStart(3, "0")}`;

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <ProposalCreator
        lead={leadResult.data as any}
        proposalNumber={proposalNumber}
        userId={userResult.data?.user?.id || null}
      />
    </div>
  );
}
