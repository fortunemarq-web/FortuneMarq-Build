import { createServerClientWithCookies } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import ProposalCreator from "@/components/proposals/proposal-creator";

export default async function NewProposalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const { edit } = await searchParams;
  const supabase = await createServerClientWithCookies();

  const [userResult, leadResult, countResult, proposalResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("leads").select("id, company_name, contact_person, city, industry, lead_type, phone").eq("id", id).single(),
    supabase.from("proposals").select("id", { count: "exact", head: true }),
    edit
      ? supabase.from("proposals").select("id, proposal_number, services, total_setup, total_monthly, start_date, status").eq("id", edit).single()
      : Promise.resolve({ data: null, error: null } as any),
  ]);

  if (leadResult.error || !leadResult.data) notFound();

  const existingProposal = (proposalResult?.data as any) || null;
  const count = countResult.count || 0;
  const proposalNumber = existingProposal?.proposal_number || `PRO-2026-${String(count + 1).padStart(3, "0")}`;

  return (
    <ProposalCreator
      lead={leadResult.data as any}
      proposalNumber={proposalNumber}
      userId={userResult.data?.user?.id || null}
      existingProposal={existingProposal}
    />
  );
}
