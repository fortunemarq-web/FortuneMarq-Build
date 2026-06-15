import { createServerClientWithCookies } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import LeadProfileAdminClient from "./lead-profile-admin-client";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServerClientWithCookies();
  const { data: lead } = await supabase.from("leads").select("company_name").eq("id", id).single();
  return { title: `${lead?.company_name || "Lead"} — FMOS` };
}

export default async function AdminLeadProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClientWithCookies();

  // User and role
  const [userResult, profileResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("profiles").select("role, full_name").single(),
  ]);
  const user = userResult.data?.user;
  const userRole = (profileResult.data as any)?.role || "admin";
  const isAdmin = userRole === "admin";

  // Lead data
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (leadError || !lead) notFound();

  // All related data in parallel
  const [
    outreachLogsResult,
    proposalsResult,
    agreementsResult,
    marketInsightResult,
    whatsappTemplatesResult,
  ] = await Promise.all([
    supabase
      .from("outreach_logs")
      .select("*, actor:profiles(full_name)")
      .eq("lead_id", id)
      .order("created_at", { ascending: false }),

    supabase
      .from("proposals")
      .select("*")
      .eq("lead_id", id)
      .order("sent_at", { ascending: false }),

    supabase
      .from("agreements")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false }),

    supabase
      .from("market_insights")
      .select("*")
      .eq("industry", lead?.industry || "")
      .eq("city", lead?.city || "")
      .single(),

    supabase
      .from("whatsapp_templates")
      .select("*")
      .order("name", { ascending: true }),
  ]);

  return (
    <LeadProfileAdminClient
      lead={lead as any}
      outreachLogs={(outreachLogsResult.data || []) as any[]}
      proposals={(proposalsResult.data || []) as any[]}
      agreements={(agreementsResult.data || []) as any[]}
      marketInsight={marketInsightResult.data as any}
      whatsappTemplates={(whatsappTemplatesResult.data || []) as any[]}
      isAdmin={isAdmin}
      userId={user?.id || null}
    />
  );
}
