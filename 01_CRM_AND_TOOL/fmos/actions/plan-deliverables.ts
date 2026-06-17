"use server";

/**
 * 4.5 — Plan deliverables.
 *
 * Takes a Cowork-style bulk paste, parses it server-side (single source of
 * truth) into milestones + nested tasks, and writes them to a client's project.
 *
 *   - Finds the client's most recent project, or creates one if none exists.
 *   - Milestones → project_milestones (name, due_date, status, order_index).
 *   - Tasks → tasks (title, milestone_id, due_date, assigned_to resolved from
 *     "@owner" against profiles, section_tag = milestone name).
 *
 * Re-parsing the raw text here (rather than trusting a client-sent structure)
 * keeps the parse logic in one place and matches the preview exactly.
 */

import { createServerClientWithCookies } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { parseMilestones } from "@/lib/delivery/parseMilestones";

export interface PlanDeliverablesResult {
  ok: boolean;
  projectId?: string;
  milestonesCreated?: number;
  tasksCreated?: number;
  warnings?: string[];
  error?: string;
}

export async function planDeliverables(input: {
  clientId: string;
  rawText: string;
}): Promise<PlanDeliverablesResult> {
  const { clientId, rawText } = input;
  const supabase = (await createServerClientWithCookies()) as any;

  const parsed = parseMilestones(rawText);
  if (parsed.milestones.length === 0) {
    return { ok: false, error: "Nothing to plan — no milestones or tasks found in the paste." };
  }

  // 1. Find or create a project for this client.
  let projectId: string;
  const { data: existing } = await supabase
    .from("projects")
    .select("id")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    projectId = existing.id;
  } else {
    const { data: created, error: projErr } = await supabase
      .from("projects")
      .insert({
        client_id: clientId,
        name: "Delivery Plan",
        status: "in_progress",
        delivery_stage: "brief",
        completion_percentage: 0,
      })
      .select("id")
      .single();
    if (projErr || !created) {
      return { ok: false, error: `Couldn't create a project: ${projErr?.message ?? "unknown error"}` };
    }
    projectId = created.id;
  }

  // 2. Build an owner-name → profile-id map (single fetch, resolved in memory).
  const { data: profiles } = await supabase.from("profiles").select("id, full_name");
  const ownerMap = new Map<string, string>();
  for (const p of (profiles ?? []) as { id: string; full_name: string | null }[]) {
    if (p.full_name) {
      // index by full name and by first name, lowercased
      ownerMap.set(p.full_name.toLowerCase(), p.id);
      const first = p.full_name.trim().split(/\s+/)[0]?.toLowerCase();
      if (first && !ownerMap.has(first)) ownerMap.set(first, p.id);
    }
  }

  // 3. Determine the next order_index so we append rather than collide.
  const { data: lastMs } = await supabase
    .from("project_milestones")
    .select("order_index")
    .eq("project_id", projectId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();
  let orderIndex = (lastMs?.order_index ?? -1) + 1;

  let milestonesCreated = 0;
  let tasksCreated = 0;

  // 4. Insert each milestone, then its tasks.
  for (const m of parsed.milestones) {
    const { data: msRow, error: msErr } = await supabase
      .from("project_milestones")
      .insert({
        project_id: projectId,
        name: m.name,
        due_date: m.dueIso,
        status: "not_started",
        order_index: orderIndex++,
      })
      .select("id")
      .single();

    if (msErr || !msRow) {
      console.error("[planDeliverables] milestone insert failed:", msErr);
      continue;
    }
    milestonesCreated++;

    if (m.tasks.length === 0) continue;

    const taskRows = m.tasks.map((t) => {
      const ownerId = t.owner ? ownerMap.get(t.owner.toLowerCase()) ?? null : null;
      return {
        project_id: projectId,
        client_id: clientId,
        milestone_id: msRow.id,
        title: t.title,
        // keep the raw "@owner" visible even when it doesn't match a profile
        description: t.owner && !ownerId ? `Owner: ${t.owner}` : null,
        assigned_to: ownerId,
        due_date: t.dueIso,
        status: "not_started",
        section_tag: m.name,
        type: "delivery",
      };
    });

    const { error: tErr, count } = await supabase
      .from("tasks")
      .insert(taskRows, { count: "exact" });

    if (tErr) {
      console.error("[planDeliverables] task insert failed:", tErr);
    } else {
      tasksCreated += count ?? taskRows.length;
    }
  }

  revalidatePath(`/admin/clients/${clientId}`);

  return {
    ok: true,
    projectId,
    milestonesCreated,
    tasksCreated,
    warnings: parsed.warnings,
  };
}
