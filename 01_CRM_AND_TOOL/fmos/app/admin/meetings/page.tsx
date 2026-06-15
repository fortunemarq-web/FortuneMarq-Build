import { createServerClientWithCookies } from "@/lib/supabase-server";
import MeetingsClient from "./meetings-client";

export const revalidate = 30;

export default async function MeetingsPage() {
  const supabase = await createServerClientWithCookies();

  const { data: meetings, error } = await supabase
    .from("leads")
    .select("id, company_name, contact_person, phone, industry, city, follow_up_date, outreach_stage, last_outcome, notes, has_website, lead_type, website_link, gmb_link, serp_ranked, meeting_link, meeting_notes")
    .eq("outreach_stage", "meeting_booked")
    .order("follow_up_date", { ascending: true });

  if (error) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50">
        <p className="text-red-500">Error loading meetings: {error.message}</p>
      </div>
    );
  }

  return <MeetingsClient initialMeetings={meetings || []} />;
}
