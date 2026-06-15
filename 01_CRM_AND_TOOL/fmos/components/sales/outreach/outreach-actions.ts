"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";
import { leadStageUpdate } from "@/lib/pipeline";

export async function advanceOutreachStage(
  sequenceId: string,
  leadId: string,
  currentStage: string,
  data: {
    pdf_name?: string;
    followup_date?: string;
    meeting_date?: string;
    location?: string;
    proposal_type?: string;
    outcome?: string;
    notes?: string;
  }
) {
  const supabase = await createServerClientWithCookies();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  let newStage = currentStage;
  let updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };

  try {
    switch (currentStage) {
      case "touch1_pending": {
        newStage = "touch1_sent";
        updatePayload = {
          ...updatePayload,
          stage: newStage,
          touch1_sent_at: new Date().toISOString(),
          touch1_sent_by: user.id,
        };
        break;
      }

      case "touch1_sent":
      case "pdf_pending": {
        newStage = "pdf_sent";
        updatePayload = {
          ...updatePayload,
          stage: newStage,
          pdf_sent_at: new Date().toISOString(),
          pdf_sent_by: user.id,
          pdf_name: data.pdf_name || null,
        };
        // Insert PDF delivery record
        await supabase.from("pdf_deliveries").insert({
          lead_id: leadId,
          sequence_id: sequenceId,
          pdf_name: data.pdf_name || "Niche Report",
          pdf_type: "niche_report",
          sent_by: user.id,
        });
        break;
      }

      case "pdf_sent": {
        newStage = "followup_due";
        updatePayload = {
          ...updatePayload,
          stage: newStage,
          followup_scheduled_at: data.followup_date || null,
        };
        break;
      }

      case "followup_due": {
        newStage = "meeting_booked";
        updatePayload = {
          ...updatePayload,
          stage: newStage,
          meeting_booked_at: new Date().toISOString(),
          meeting_date: data.meeting_date || null,
          meeting_booked_by: user.id,
        };
        // Insert meeting
        await supabase.from("meetings").insert({
          lead_id: leadId,
          sequence_id: sequenceId,
          scheduled_at: data.meeting_date || "",
          booked_by: user.id,
          status: "scheduled" as any,
          location: data.location || "In-person (office)",
        });
        // Update lead
        await supabase
          .from("leads")
          .update(leadStageUpdate("meeting_booked", { meeting_booked_at: new Date().toISOString() }) as any)
          .eq("id", leadId);
        break;
      }

      case "meeting_booked": {
        newStage = "proposal_sent";
        const proposalNumber = `FM-P-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
        updatePayload = {
          ...updatePayload,
          stage: newStage,
          proposal_sent_at: new Date().toISOString(),
          proposal_sent_by: user.id,
          proposal_type: data.proposal_type || null,
        };
        // Insert proposal
        await supabase.from("proposals").insert({
          lead_id: leadId,
          sequence_id: sequenceId,
          proposal_number: proposalNumber,
          proposal_type: data.proposal_type || null,
          sent_by: user.id,
          status: "sent",
        });
        // Update lead
        await supabase
          .from("leads")
          .update(leadStageUpdate("proposal_sent", { proposal_sent_at: new Date().toISOString() }) as any)
          .eq("id", leadId);
        break;
      }

      case "proposal_sent": {
        newStage = data.outcome || "won";
        updatePayload = {
          ...updatePayload,
          stage: newStage,
          outcome: data.outcome,
          outcome_at: new Date().toISOString(),
          outcome_notes: data.notes || null,
        };
        // won/lost map directly; anything else parks the lead in
        // revival (status derives to "nurture" via the state machine)
        const closedStage =
          data.outcome === "won" || data.outcome === "lost" ? data.outcome : "revival";

        await supabase
          .from("leads")
          .update(leadStageUpdate(closedStage) as any)
          .eq("id", leadId);
        break;
      }
    }

    // Update outreach sequence
    const { error: seqError } = await supabase
      .from("outreach_sequences")
      .update(updatePayload as any)
      .eq("id", sequenceId);

    if (seqError) return { error: seqError.message };

    // Log activity event
    await supabase.from("activity_events").insert({
      entity_type: "lead" as any,
      entity_id: leadId,
      event_type: "outreach_stage_advance" as any,
      description: `Stage advanced to ${newStage}`,
      created_by: user.id,
    } as any);

    return {};
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { error: message };
  }
}
