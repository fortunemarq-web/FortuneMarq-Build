import { createServerClientWithCookies } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import LeadProfileClient from "./lead-profile-client";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServerClientWithCookies();
  const { data: lead } = await supabase.from("leads").select("company_name").eq("id", id).single();
  return {
    title: `${lead?.company_name || "Lead"} — FMOS`,
  };
}

export default async function LeadProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClientWithCookies();

  // Fetch lead first
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (leadError || !lead) {
    notFound();
  }

  // Fetch all related data in parallel
  const [
    sequenceResult,
    callOutcomesResult,
    pdfDeliveriesResult,
    meetingsResult,
    proposalsResult,
    activityEventsResult,
  ] = await Promise.all([
    supabase.from("outreach_sequences").select("*").eq("lead_id", id).single(),
    supabase.from("lead_outcomes").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
    supabase.from("pdf_deliveries").select("*").eq("lead_id", id).order("sent_at", { ascending: false }),
    supabase.from("meetings").select("*").eq("lead_id", id).order("scheduled_at", { ascending: false }),
    supabase.from("proposals").select("*").eq("lead_id", id).order("sent_at", { ascending: false }),
    supabase.from("activity_events").select("*").eq("entity_id", id).order("created_at", { ascending: false }).limit(50),
  ]);

  // Fetch market insight (depends on lead data)
  const { data: marketInsight } = await supabase
    .from("market_insights")
    .select("*")
    .eq("industry", lead?.industry || "")
    .eq("city", lead?.city || "")
    .single();

  return (
    <LeadProfileClient
      lead={lead as any}
      sequence={sequenceResult.data}
      callOutcomes={callOutcomesResult.data ?? []}
      pdfDeliveries={pdfDeliveriesResult.data ?? []}
      meetings={meetingsResult.data ?? []}
      proposals={proposalsResult.data ?? []}
      activityEvents={activityEventsResult.data ?? []}
      marketInsight={marketInsight as any}
    />
  );
}
