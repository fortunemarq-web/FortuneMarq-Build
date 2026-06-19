"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";
import { sendNotification } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export interface CreateClientDeliverableInput {
  projectId: string;
  title: string;
  description?: string;
  deliverableType?: string;
  fileUrl?: string;
}

export interface CreateClientDeliverableResult {
  ok: boolean;
  error?: string;
  id?: string;
}

/**
 * Publish a deliverable to the client portal for review. It lands as
 * status='pending_review' — the only state the client dashboard lets a client
 * approve or request a revision on. Notifies the client's portal user if linked.
 */
export async function createClientDeliverable(
  input: CreateClientDeliverableInput
): Promise<CreateClientDeliverableResult> {
  if (!input.projectId || !input.title?.trim()) {
    return { ok: false, error: "Project and title are required" };
  }
  const supabase = await createServerClientWithCookies();

  const { data: created, error } = await supabase
    .from("client_deliverables")
    .insert({
      project_id: input.projectId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      deliverable_type: input.deliverableType?.trim() || "general",
      file_url: input.fileUrl?.trim() || null,
      status: "pending_review",
    } as any)
    .select("id")
    .single();

  if (error || !created) return { ok: false, error: error?.message || "Failed to create deliverable" };

  // Notify the client's portal user (project -> client -> user_id), best-effort.
  try {
    const { data: project } = await supabase
      .from("projects")
      .select("client_id, name")
      .eq("id", input.projectId)
      .maybeSingle();
    const clientId = (project as any)?.client_id;
    if (clientId) {
      const { data: client } = await supabase
        .from("clients")
        .select("user_id, business_name")
        .eq("id", clientId)
        .maybeSingle();
      const userId = (client as any)?.user_id;
      if (userId) {
        await sendNotification({
          userId,
          type: "deliverable_approval_requested",
          title: "New deliverable for review",
          body: `"${input.title.trim()}" is ready for your review.`,
          link: "/client/dashboard",
        });
      }
    }
  } catch (e) {
    console.error("[client-deliverable] notify failed:", e);
  }

  await logAudit({
    action: "create",
    resourceType: "deliverable",
    resourceId: (created as any).id,
    resourceLabel: `Published deliverable for review: ${input.title.trim()}`,
    newValue: { project_id: input.projectId, status: "pending_review" },
  });

  revalidatePath(`/projects/${input.projectId}`);
  return { ok: true, id: (created as any).id };
}
