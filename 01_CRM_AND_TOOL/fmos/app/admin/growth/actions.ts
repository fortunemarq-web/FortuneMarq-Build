"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

// ───────────────────────────────────────────
// 1. Content Pieces (Instagram, LinkedIn, FB, GMB posts)
// ───────────────────────────────────────────

export interface ContentPiece {
  id: string;
  title: string;
  content_type: string;
  platform: string;
  channel: string; // 'instagram', 'linkedin', 'facebook', 'gmb', etc.
  status: string;
  scheduled_date: string | null;
  published_date: string | null;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagement_rate: number;
  notes?: string;
  caption_draft?: string;
  image_prompt?: string;
  cta_type?: string;
  cta_url?: string;
}

export async function fetchContentPieces(channel: string) {
  const supabase = await createServerClientWithCookies();
  const { data, error } = await supabase
    .from("content_pieces")
    .select("*")
    .eq("channel", channel)
    .order("scheduled_date", { ascending: true });
    
  if (error) {
    console.error(`Error fetching ${channel} content:`, error);
    return [];
  }
  return data as ContentPiece[];
}

export async function upsertContentPiece(data: Partial<ContentPiece>) {
  const supabase = await createServerClientWithCookies();
  
  // Calculate engagement rate
  let engagement_rate = 0;
  const reach = data.reach || 0;
  const interactions = (data.likes || 0) + (data.comments || 0) + (data.shares || 0) + (data.saves || 0);
  
  if (reach > 0) {
    engagement_rate = parseFloat(((interactions / reach) * 100).toFixed(2));
  }
  
  const payload = {
    ...data,
    engagement_rate,
    updated_at: new Date().toISOString()
  };
  
  const { data: result, error } = await supabase
    .from("content_pieces")
    .upsert(payload as any, { onConflict: "id" })
    .select()
    .single();
    
  if (error) {
    return { success: false, error: error.message };
  }
  
  revalidatePath(`/admin/growth/${data.channel}`);
  return { success: true, data: result };
}

export async function deleteContentPiece(id: string, channel: string) {
  const supabase = await createServerClientWithCookies();

  const { error } = await supabase
    .from("content_pieces")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/growth/${channel}`);
  return { success: true };
}

// ───────────────────────────────────────────
// 2. City & Niche Acquisition
// ───────────────────────────────────────────

export interface AcquisitionTarget {
  id: string;
  city: string;
  city_slug: string;
  niche: string;
  is_active: boolean;
  notes: string | null;
  next_actions: string | null;
}

export async function fetchAcquisitionTargets() {
  const supabase = await createServerClientWithCookies();
  const { data, error } = await supabase
    .from("acquisition_targets")
    .select("*")
    .order("city", { ascending: true });
    
  if (error) {
    console.error("Error fetching acquisition targets:", error);
    return [];
  }
  return data as AcquisitionTarget[];
}

export async function addAcquisitionCity(city: string, state: string, niches: string[]) {
  const supabase = await createServerClientWithCookies();
  const city_slug = city.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  const payloads = niches.map(niche => ({
    city,
    city_slug,
    niche,
    is_active: true
  }));
  
  const { error } = await supabase
    .from("acquisition_targets")
    .insert(payloads)
    .select();
    
  if (error) {
    return { success: false, error: error.message };
  }
  
  revalidatePath("/admin/growth/acquisition");
  return { success: true, city_slug };
}

export async function updateAcquisitionTarget(id: string, updates: Partial<AcquisitionTarget>) {
  const supabase = await createServerClientWithCookies();
  const { error } = await supabase
    .from("acquisition_targets")
    .update(updates)
    .eq("id", id);
    
  if (error) return { success: false, error: error.message };
  
  revalidatePath("/admin/growth/acquisition");
  return { success: true };
}

// ───────────────────────────────────────────
// 3. SEO Tracker (FortuneMarq Pages)
// ───────────────────────────────────────────

export async function fetchSeoPages() {
  const supabase = await createServerClientWithCookies();
  const { data, error } = await supabase
    .from("seo_pages")
    .select("*")
    .order("page_name", { ascending: true });
    
  if (error) {
    console.error("Error fetching seo pages:", error);
    return [];
  }
  return data;
}

export async function fetchAgencyKeywords() {
  const supabase = await createServerClientWithCookies();
  const { data, error } = await supabase
    .from("seo_keywords")
    .select("*")
    .eq("belongs_to", "agency")
    .order("current_position", { ascending: true });
    
  if (error) {
    console.error("Error fetching agency keywords:", error);
    return [];
  }
  return data;
}

export async function fetchBacklinks() {
  const supabase = await createServerClientWithCookies();
  const { data, error } = await supabase
    .from("backlinks")
    .select("*")
    .order("acquired_date", { ascending: false });
    
  if (error) {
    console.error("Error fetching backlinks:", error);
    return [];
  }
  return data;
}

// ───────────────────────────────────────────
// 4. GMB Management
// ───────────────────────────────────────────

export async function fetchGmbChecklist() {
  const supabase = await createServerClientWithCookies();
  const { data, error } = await supabase
    .from("gmb_checklist_items")
    .select("*")
    .order("sort_order", { ascending: true });
    
  if (error) {
    console.error("Error fetching gmb checklist:", error);
    return [];
  }
  return data;
}

export async function toggleGmbChecklistItem(id: string, is_completed: boolean) {
  const supabase = await createServerClientWithCookies();
  const { error } = await supabase
    .from("gmb_checklist_items")
    .update({ 
      is_completed, 
      completed_at: is_completed ? new Date().toISOString() : null 
    })
    .eq("id", id);
    
  if (error) return { success: false, error: error.message };
  
  revalidatePath("/admin/growth/gmb");
  return { success: true };
}

export async function fetchGmbSnapshots() {
  const supabase = await createServerClientWithCookies();
  const { data, error } = await supabase
    .from("gmb_snapshots")
    .select("*")
    .order("snapshot_month", { ascending: false })
    .limit(12);
    
  if (error) {
    console.error("Error fetching GMB snapshots:", error);
    return [];
  }
  return data;
}

export async function saveGmbSnapshot(snapshot: {
  profile_views: number;
  direction_requests: number;
  calls: number;
  website_clicks: number;
  photo_views: number;
}) {
  const supabase = await createServerClientWithCookies();
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  const { error } = await (supabase as any)
    .from("gmb_snapshots")
    .upsert({ ...snapshot, snapshot_month: month }, { onConflict: "snapshot_month" });
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/growth/gmb");
  return { success: true };
}

export async function fetchReviewRequests() {
  const supabase = await createServerClientWithCookies();
  const { data, error } = await supabase
    .from("review_requests")
    .select("*, clients(business_name, services)")
    .order("requested_at", { ascending: false });
    
  if (error) {
    console.error("Error fetching review requests:", error);
    return [];
  }
  return data;
}

export async function logReviewRequest(data: any) {
  const supabase = await createServerClientWithCookies();
  const { error } = await supabase
    .from("review_requests")
    .insert(data);
    
  if (error) return { success: false, error: error.message };
  
  revalidatePath("/admin/growth/gmb");
  return { success: true };
}

export async function updateReviewRequest(id: string, data: any) {
  const supabase = await createServerClientWithCookies();
  const { error } = await supabase
    .from("review_requests")
    .update(data)
    .eq("id", id);
    
  if (error) return { success: false, error: error.message };
  
  revalidatePath("/admin/growth/gmb");
  return { success: true };
}
