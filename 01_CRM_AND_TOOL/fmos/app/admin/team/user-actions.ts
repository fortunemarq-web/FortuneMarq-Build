"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

const VALID_ROLES = ["admin", "manager", "pm", "strategist", "telecaller", "staff"];

/** Server-side audit write (lib/audit.ts is browser-only). Best-effort, never throws. */
async function auditTeamAction(
  adminId: string,
  action: string,
  targetId: string,
  summary: string
) {
  try {
    const admin = createAdminClient();
    const { data: actor } = await admin
      .from("profiles")
      .select("full_name, role")
      .eq("id", adminId)
      .single();
    await (admin.from("audit_logs") as any).insert({
      actor_id: adminId,
      user_name: (actor as any)?.full_name ?? "admin",
      user_role: (actor as any)?.role ?? "admin",
      action: "update",
      resource_type: "profile",
      resource_id: targetId,
      summary: `${action}: ${summary}`,
      entity_type: "profile",
      entity_id: targetId,
    });
  } catch (err) {
    console.error("[audit] team action:", err);
  }
}

/**
 * Every action here mutates auth.users via the service-role key, so the
 * caller must be a signed-in admin — verified against their own profile row,
 * not anything client-supplied.
 */
async function requireAdmin() {
  const supabase = await createServerClientWithCookies();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { ok: false as const, error: "Admin access required" };
  }
  return { ok: true as const, adminId: user.id };
}

export async function inviteTeamMember(input: {
  email: string;
  full_name: string;
  role: string;
  password: string;
}) {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  const email = input.email.trim().toLowerCase();
  const full_name = input.full_name.trim();
  if (!email || !full_name) return { success: false, error: "Name and email are required" };
  if (!VALID_ROLES.includes(input.role)) return { success: false, error: "Invalid role" };
  if (input.password.length < 8) return { success: false, error: "Password must be at least 8 characters" };

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (createError) return { success: false, error: createError.message };

  const { error: profileError } = await admin
    .from("profiles")
    .upsert({ id: created.user.id, email, full_name, role: input.role } as any);
  if (profileError) return { success: false, error: `User created but profile failed: ${profileError.message}` };

  await auditTeamAction(guard.adminId, "Member invited", created.user.id, `${email} as ${input.role}`);

  revalidatePath("/admin/team");
  return { success: true };
}

export async function updateMemberRole(userId: string, role: string) {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };
  if (!VALID_ROLES.includes(role)) return { success: false, error: "Invalid role" };
  if (userId === guard.adminId && role !== "admin") {
    return { success: false, error: "You can't remove your own admin role" };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ role } as any).eq("id", userId);
  if (error) return { success: false, error: error.message };

  await auditTeamAction(guard.adminId, "Role changed", userId, `now ${role}`);

  revalidatePath("/admin/team");
  return { success: true };
}

export async function resetMemberPassword(userId: string, newPassword: string) {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };
  if (newPassword.length < 8) return { success: false, error: "Password must be at least 8 characters" };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
  if (error) return { success: false, error: error.message };

  await auditTeamAction(guard.adminId, "Password reset", userId, "admin-set new password");

  return { success: true };
}

export async function setMemberActive(userId: string, active: boolean) {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };
  if (userId === guard.adminId && !active) {
    return { success: false, error: "You can't deactivate your own account" };
  }

  const admin = createAdminClient();
  // Ban blocks sign-in; ~100 years is effectively permanent until reactivated
  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: active ? "none" : "876000h",
  });
  if (error) return { success: false, error: error.message };

  // Best-effort flag on the profile so the UI can show state.
  // Ignore failure if the is_active column hasn't been migrated yet.
  await admin.from("profiles").update({ is_active: active } as any).eq("id", userId);

  await auditTeamAction(guard.adminId, active ? "Member reactivated" : "Member deactivated", userId, active ? "sign-in unblocked" : "sign-in blocked");

  revalidatePath("/admin/team");
  return { success: true };
}

export async function removeMember(userId: string) {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };
  if (userId === guard.adminId) {
    return { success: false, error: "You can't remove your own account" };
  }

  const admin = createAdminClient();
  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) return { success: false, error: authError.message };

  // Profile may cascade from auth.users; delete explicitly in case it doesn't
  await admin.from("profiles").delete().eq("id", userId);

  await auditTeamAction(guard.adminId, "Member removed", userId, "auth user deleted");

  revalidatePath("/admin/team");
  return { success: true };
}
