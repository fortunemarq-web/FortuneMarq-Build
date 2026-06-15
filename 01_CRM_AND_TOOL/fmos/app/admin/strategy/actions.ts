"use server";

import { createServerClientWithCookies } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { ANTHROPIC_MODELS } from "@/lib/ai-models";

// ─── Strategy AI extraction (server-side, key never touches the browser) ───

export async function extractStrategyTasks({
  text,
  destination,
  timeframe,
  assignee,
  client,
  strategyLabel,
}: {
  text: string;
  destination: string;
  timeframe: string;
  assignee: string;
  client?: {
    business_name: string;
    niche?: string | null;
    city?: string | null;
    services?: string[] | null;
  };
  strategyLabel?: string;
}): Promise<{ success: true; data: any } | { success: false; error: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { success: false, error: "ANTHROPIC_API_KEY is not configured on the server." };
  }

  const clientContext = client
    ? `
CLIENT CONTEXT:
- Client Name: ${client.business_name}
- Niche: ${client.niche || "N/A"}
- City: ${client.city || "N/A"}
- Active Services: ${client.services?.join(", ") || "N/A"}
- Strategy Type: ${strategyLabel || "N/A"}
`
    : "";

  const systemPrompt = `You are a task extraction engine for FortuneMarq, a digital marketing agency.

You will receive a strategy document. Your job is to extract ALL actionable tasks and return them as a JSON array.

DESTINATION CONTEXT: ${strategyLabel ? `${strategyLabel} (${destination})` : destination}
TIMEFRAME: ${timeframe}
DEFAULT ASSIGNEE: ${assignee}
TODAY'S DATE: ${new Date().toISOString().split("T")[0]}
${clientContext}
Rules:
1. Extract EVERY specific action item from the document
2. If a task has no explicit due date, distribute tasks evenly across the timeframe
3. If a task has no assignee, use the default assignee
4. Break large vague tasks into smaller specific ones (max 2 hours of work per task)
5. Priority: use 'high' for week 1 items, 'medium' for week 2-3, 'low' for later
6. Every task MUST have: title, description, due_date (YYYY-MM-DD), priority, assignee, section_tag

Return ONLY valid JSON, no preamble, no explanation. Format:
{
  "strategy_title": "string",
  "total_tasks": number,
  "tasks": [
    {
      "title": "string (max 80 chars, action verb first)",
      "description": "string (1-2 sentences of context/guidance)",
      "due_date": "YYYY-MM-DD",
      "priority": "high|medium|low",
      "assignee": "admin|telecaller|user_id",
      "section_tag": "${destination}",
      "estimated_minutes": number
    }
  ]
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODELS.smart,
        max_tokens: 4000,
        temperature: 0,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Here is the strategy document. Please extract the tasks into the requested JSON format:\n\n${text}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      return { success: false, error: errData.error?.message || `API Error: ${response.status}` };
    }

    const data = await response.json();
    const resultText = data.content?.[0]?.text || "{}";
    const cleaned = resultText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return { success: true, data: JSON.parse(cleaned) };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error calling Anthropic API",
    };
  }
}

export async function fetchStrategyTeam() {
  const supabase = await createServerClientWithCookies();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .order("full_name", { ascending: true });
    
  return data || [];
}

export async function saveApprovedTasks(
  tasks: any[], 
  strategyTitle: string, 
  destination: string, 
  timeframe: string, 
  strategyText: string,
  client_id?: string,
  strategy_type?: string
) {
  const supabase = await createServerClientWithCookies();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error("Not authenticated");

  // 1. Create strategy run
  const { data: runData, error: runError } = await supabase
    .from("strategy_runs")
    .insert({
      title: strategyTitle,
      destination,
      timeframe,
      strategy_text: strategyText,
      tasks_generated: tasks.length,
      created_by: userData.user.id,
      ...(client_id ? { client_id } : {}),
      ...(strategy_type ? { strategy_type } : {}),
    })
    .select()
    .single() as any;

  if (runError) {
    console.error("Error creating strategy run:", runError);
    return { success: false, error: runError.message };
  }

  // 2. Insert tasks
  const tasksToInsert = tasks.map((t) => ({
    title: t.title,
    description: t.description,
    due_date: t.due_date,
    priority: t.priority,
    assigned_to: t.assignee, // Map assignee to assigned_to in tasks table
    section_tag: t.section_tag,
    estimated_minutes: t.estimated_minutes,
    strategy_run_id: runData.id,
    status: 'pending' as any,
    type: 'admin', // Default value for task type
    ...(t.client_id ? { client_id: t.client_id } : {}),
  }));

  const { data: insertedTasks, error: tasksError } = await supabase
    .from("tasks")
    .insert(tasksToInsert)
    .select() as any;

  if (tasksError) {
    console.error("Error creating tasks:", tasksError);
    return { success: false, error: tasksError.message };
  }

  // 3. Create linking records
  if (insertedTasks && insertedTasks.length > 0) {
    const linkingRecords = insertedTasks.map((t: any) => ({
      strategy_run_id: runData.id,
      task_id: t.id
    }));
    
    const { error: linkError } = await supabase.from("strategy_run_tasks").insert(linkingRecords);
    if (linkError) console.error("Error creating strategy links:", linkError);
  }

  revalidatePath("/admin/strategy/archive");
  revalidatePath("/tasks");
  return { success: true, count: insertedTasks?.length || 0 };
}

export async function fetchStrategyArchive() {
  const supabase = await createServerClientWithCookies();
  const { data, error } = await supabase
    .from("strategy_runs")
    .select("*, profiles!created_by(full_name)")
    .order("created_at", { ascending: false });
    
  if (error) console.error("Error fetching strategy archive:", error);
  return data || [];
}

export async function fetchStrategyRunCompletion(runId: string) {
  const supabase = await createServerClientWithCookies();
  
  const { data } = await supabase
    .from("tasks")
    .select("id, status")
    .eq("strategy_run_id", runId);
    
  const total = data?.length || 0;
  const completed = (data as any[])?.filter(t => t.status === 'completed' || t.status === 'approved').length || 0;
  
  return {
    total,
    completed,
    remaining: total - completed
  };
}

// ─── Close the loop: measure real outcomes for a strategy run ───
// Maps a run's destination + timeframe window to actual results:
//   organic channels  → content pieces published on that channel
//   acquisition city   → leads / meetings / clients won in that city
function timeframeToDays(tf: string): number {
  const m = (tf || "").match(/^(\d+)_days$/);
  return m ? parseInt(m[1], 10) : 30;
}

function slugifyCity(s: string): string {
  return (s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
}

export interface StrategyOutcome {
  kind: "organic" | "acquisition" | "other";
  label: string;       // human summary, e.g. "3 posts published"
  value: number;       // primary metric
  windowElapsed: boolean; // has the timeframe fully elapsed?
}

export async function fetchStrategyRunOutcome(run: {
  id: string;
  destination: string;
  timeframe: string;
  created_at: string;
}): Promise<StrategyOutcome> {
  const supabase = await createServerClientWithCookies();
  const start = new Date(run.created_at);
  const days = timeframeToDays(run.timeframe);
  const plannedEnd = new Date(start.getTime() + days * 86400000);
  const now = new Date();
  const end = now < plannedEnd ? now : plannedEnd;
  const windowElapsed = now >= plannedEnd;
  const startISO = start.toISOString();
  const endISO = end.toISOString();

  const dest = run.destination || "";

  // Organic growth destination: agency_growth.<channel>
  if (dest.startsWith("agency_growth.")) {
    const channel = dest.split(".")[1];
    const { data } = await supabase
      .from("content_pieces")
      .select("id, channel, status, published_date")
      .eq("channel", channel)
      .eq("status", "published")
      .gte("published_date", startISO)
      .lte("published_date", endISO);
    const n = (data as any[])?.length || 0;
    return { kind: "organic", label: `${n} post${n === 1 ? "" : "s"} published`, value: n, windowElapsed };
  }

  // Acquisition destination: acquisition.<city_slug>.<niche>
  if (dest.startsWith("acquisition.")) {
    const citySlug = dest.split(".")[1];
    const { data } = await supabase
      .from("leads")
      .select("city, outreach_stage, created_at, meeting_booked_at, last_activity_at")
      .gte("created_at", startISO)
      .lte("created_at", endISO);
    const rows = ((data as any[]) || []).filter((l) => slugifyCity(l.city) === citySlug);
    const won = rows.filter((l) => l.outreach_stage === "won").length;
    const meetings = rows.filter((l) => l.meeting_booked_at && l.meeting_booked_at >= startISO).length;
    const label = `${rows.length} lead${rows.length === 1 ? "" : "s"} · ${meetings} mtg · ${won} won`;
    return { kind: "acquisition", label, value: rows.length, windowElapsed };
  }

  return { kind: "other", label: "—", value: 0, windowElapsed };
}

export async function fetchClientStrategyRuns(clientId: string) {
  const supabase = await createServerClientWithCookies();
  
  const { data: runs, error } = await supabase
    .from("strategy_runs")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
    
  if (error) console.error("Error fetching client strategy runs:", error);
  if (!runs || runs.length === 0) return [];
  
  // Enrich each run with completion counts
  const enriched = [];
  for (const run of runs) {
    const counts = await fetchStrategyRunCompletion((run as any).id);
    enriched.push({ ...(run as any), counts });
  }
  
  return enriched;
}
