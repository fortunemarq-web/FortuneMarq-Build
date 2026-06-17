"use server";

/**
 * 4.6 — Execute & results.
 *
 * Server actions for the client delivery board:
 *   - setTaskDriveLinks: store raw/edited/final Drive URLs on a task (links only)
 *   - setTaskStatus:     mark a task done / not-done, then re-check its milestone
 *   - completeMilestone: the MILESTONE-COMPLETE TRIGGER. When every task under a
 *                        milestone is done, flip the milestone to "approved" and
 *                        return the client contact so the caller can fire the
 *                        project_update WA. This function does NOT send WhatsApp —
 *                        the send is wired separately (see lib/whatsapp/delivery-sends.ts)
 *                        and gated behind WHATSAPP_SEND_MODE.
 */

import { createServerClientWithCookies } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { sendProjectUpdate } from "@/lib/whatsapp/delivery-sends";

const DONE = "completed";

export interface MilestoneCompletionInfo {
  milestoneId: string;
  milestoneName: string;
  complete: boolean;           // are all tasks done?
  justCompleted: boolean;      // did THIS call flip it to complete (and not already notified)?
  alreadyNotified: boolean;    // client_notified_at was already set
  clientId: string | null;
  contactName: string | null;  // owner_name || business_name
  phone: string | null;        // client phone for the project_update WA
}

// ─── Drive links ──────────────────────────────────────────────────────────────

export async function setTaskDriveLinks(input: {
  taskId: string;
  clientId: string;
  raw?: string | null;
  edited?: string | null;
  final?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = (await createServerClientWithCookies()) as any;

  const patch: Record<string, string | null> = {};
  if (input.raw !== undefined) patch.drive_raw_url = normalizeUrl(input.raw);
  if (input.edited !== undefined) patch.drive_edited_url = normalizeUrl(input.edited);
  if (input.final !== undefined) patch.drive_final_url = normalizeUrl(input.final);

  const { error } = await supabase.from("tasks").update(patch).eq("id", input.taskId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/clients/${input.clientId}`);
  return { ok: true };
}

function normalizeUrl(url: string | null | undefined): string | null {
  const u = (url ?? "").trim();
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

// ─── Task status + milestone re-check ─────────────────────────────────────────

export async function setTaskStatus(input: {
  taskId: string;
  clientId: string;
  done: boolean;
}): Promise<{ ok: boolean; milestone?: MilestoneCompletionInfo; notified?: boolean; error?: string }> {
  const supabase = (await createServerClientWithCookies()) as any;

  const { data: task, error: tErr } = await supabase
    .from("tasks")
    .update({
      status: input.done ? DONE : "in_progress",
      completion_date: input.done ? new Date().toISOString() : null,
    })
    .eq("id", input.taskId)
    .select("milestone_id")
    .single();

  if (tErr) return { ok: false, error: tErr.message };

  // Re-check the milestone. If checking off this task just completed it, flip the
  // milestone to approved and fire project_update (once).
  let milestone: MilestoneCompletionInfo | undefined;
  let notified = false;
  if (task?.milestone_id) {
    milestone = await inspectMilestone(supabase, task.milestone_id);
    if (input.done && milestone.justCompleted) {
      await supabase
        .from("project_milestones")
        .update({ status: "approved", approval_date: new Date().toISOString() })
        .eq("id", task.milestone_id);
      notified = await notifyMilestoneComplete(supabase, milestone);
    }
  }

  revalidatePath(`/admin/clients/${input.clientId}`);
  return { ok: true, milestone, notified };
}

// ─── The milestone-complete trigger ───────────────────────────────────────────

/**
 * Inspect a milestone's completion state and resolve the client contact.
 * Pure read — no writes, no sends. Used both by setTaskStatus (to report state)
 * and by completeMilestone (to decide whether to flip + notify).
 */
async function inspectMilestone(supabase: any, milestoneId: string): Promise<MilestoneCompletionInfo> {
  const { data: ms } = await supabase
    .from("project_milestones")
    .select("id, name, client_notified_at, project_id")
    .eq("id", milestoneId)
    .single();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("status")
    .eq("milestone_id", milestoneId);

  const taskList = (tasks ?? []) as { status: string | null }[];
  const complete = taskList.length > 0 && taskList.every((t) => t.status === DONE);

  // Resolve client contact via the milestone's project.
  let clientId: string | null = null;
  let contactName: string | null = null;
  let phone: string | null = null;
  if (ms?.project_id) {
    const { data: proj } = await supabase
      .from("projects")
      .select("client_id, clients(business_name, owner_name, phone)")
      .eq("id", ms.project_id)
      .single();
    clientId = proj?.client_id ?? null;
    const c = proj?.clients as { business_name?: string; owner_name?: string | null; phone?: string | null } | null;
    contactName = c?.owner_name || c?.business_name || null;
    phone = c?.phone ?? null;
  }

  const alreadyNotified = !!ms?.client_notified_at;

  return {
    milestoneId,
    milestoneName: ms?.name ?? "Milestone",
    complete,
    justCompleted: complete && !alreadyNotified,
    alreadyNotified,
    clientId,
    contactName,
    phone,
  };
}

/**
 * Send the project_update WA for a freshly-completed milestone and stamp
 * client_notified_at so it never fires twice. Idempotent: re-stamps only if not
 * already notified. The send is gated by WHATSAPP_SEND_MODE inside the template
 * layer. Returns whether a message was actually dispatched.
 */
async function notifyMilestoneComplete(
  supabase: any,
  info: MilestoneCompletionInfo
): Promise<boolean> {
  if (!info.justCompleted || !info.phone || !info.contactName) return false;

  const res = await sendProjectUpdate(info.phone, info.contactName, info.milestoneName).catch(
    (e) => {
      console.error("[delivery] project_update send failed:", e);
      return { success: false } as { success: boolean };
    }
  );
  if (!res.success) return false;

  await supabase
    .from("project_milestones")
    .update({ client_notified_at: new Date().toISOString() })
    .eq("id", info.milestoneId);
  return true;
}

/**
 * Mark a milestone complete. Flips status → "approved", stamps approval_date.
 * Returns the completion info (including client contact) so the caller can fire
 * the project_update WA. The WA send itself lives in the wiring layer and is
 * gated by WHATSAPP_SEND_MODE — this action never sends on its own.
 *
 * `force` lets an admin mark a milestone done even if not every task is checked
 * off (e.g. a task was cancelled).
 */
export async function completeMilestone(input: {
  milestoneId: string;
  clientId: string;
  force?: boolean;
}): Promise<{ ok: boolean; milestone?: MilestoneCompletionInfo; notified?: boolean; error?: string }> {
  const supabase = (await createServerClientWithCookies()) as any;

  const info = await inspectMilestone(supabase, input.milestoneId);
  if (!info.complete && !input.force) {
    return { ok: false, error: "Not all tasks are done yet.", milestone: info };
  }

  const { error } = await supabase
    .from("project_milestones")
    .update({ status: "approved", approval_date: new Date().toISOString() })
    .eq("id", input.milestoneId);

  if (error) return { ok: false, error: error.message };

  // complete (forced or not) + not yet notified → send project_update once.
  const completedInfo: MilestoneCompletionInfo = {
    ...info,
    complete: true,
    justCompleted: !info.alreadyNotified,
  };
  const notified = await notifyMilestoneComplete(supabase, completedInfo);

  revalidatePath(`/admin/clients/${input.clientId}`);
  return { ok: true, milestone: completedInfo, notified };
}
