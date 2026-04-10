import { createServerClientWithCookies } from "@/lib/supabase-server";
import OutreachBoard from "@/components/sales/outreach/outreach-board";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Outreach Board — FMOS",
  description: "Kanban-style outreach pipeline for lead sales sequences",
};

export default async function OutreachPage() {
  const supabase = await createServerClientWithCookies();

  const today = new Date().toISOString().split("T")[0];

  const [sequencesResult, meetingsResult] = await Promise.all([
    supabase
      .from("outreach_sequences")
      .select(`
        *,
        lead:leads(
          id, company_name, contact_person, phone, industry, city,
          status, notes, has_website, website_link, outreach_stage,
          meeting_booked_at, proposal_sent_at, created_at
        )
      `)
      .order("updated_at", { ascending: false }),

    supabase
      .from("meetings")
      .select("*, lead:leads(company_name, contact_person, phone)")
      .gte("scheduled_at", today + "T00:00:00")
      .lte("scheduled_at", today + "T23:59:59")
      .eq("status", "scheduled")
      .order("scheduled_at", { ascending: true }),
  ]);

  return (
    <OutreachBoard
      sequences={sequencesResult.data ?? []}
      todayMeetings={meetingsResult.data ?? []}
    />
  );
}
