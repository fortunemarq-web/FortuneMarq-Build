import { createServerClientWithCookies } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import AgreementGenerator from "@/components/proposals/agreement-generator";

export default async function GenerateAgreementPage({ params }: { params: Promise<{ id: string; proposalId: string }> }) {
  const { id: leadId, proposalId } = await params;
  const supabase = await createServerClientWithCookies();

  const [proposalResult, leadResult, countResult, userResult] = await Promise.all([
    supabase.from("proposals").select("*").eq("id", proposalId).single(),
    supabase.from("leads").select("id, company_name, contact_person, city, industry").eq("id", leadId).single(),
    supabase.from("agreements" as any).select("id", { count: "exact", head: true }),
    supabase.auth.getUser(),
  ]);

  if (proposalResult.error || !proposalResult.data) notFound();
  if (leadResult.error || !leadResult.data) notFound();

  const count = (countResult as any).count || 0;
  const agreementNumber = `AGR-2026-${String(count + 1).padStart(3, "0")}`;

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <AgreementGenerator
        proposal={proposalResult.data as any}
        lead={leadResult.data as any}
        agreementNumber={agreementNumber}
        userId={userResult.data?.user?.id || null}
      />
    </div>
  );
}
