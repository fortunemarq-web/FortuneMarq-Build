"use server";
import { createServerClientWithCookies } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function addClientResource(clientId: string, title: string, url: string) {
  const supabase = await createServerClientWithCookies();
  const { error } = await supabase
    .from("client_resources")
    .insert({ client_id: clientId, title, url, resource_type: "link" });
  if (error) return { error: error.message };
  revalidatePath("/projects");
  return { success: true };
}

export async function deleteClientResource(id: string) {
  const supabase = await createServerClientWithCookies();
  const { error } = await supabase
    .from("client_resources")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  return { success: true };
}
