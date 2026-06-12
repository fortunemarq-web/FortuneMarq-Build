// ─────────────────────────────────────────────────────────────
// PIPELINE STATE MACHINE — single source of truth
//
// `leads.outreach_stage` is the canonical pipeline position.
// `leads.status` is a legacy enum still used by dashboards and the
// strategist views; it must always be DERIVED from the stage via
// stageToStatus(). Never set one without the other — use
// leadStageUpdate() for every stage write.
// ─────────────────────────────────────────────────────────────

export type StageGroup = "active" | "parked" | "closed";

export interface StageDef {
  key: string;
  label: string;
  group: StageGroup;
  /** Tailwind classes for board columns / badges */
  color: string;
  badge: string;
  /** Should this stage surface in the telecaller follow-up queue? */
  followUpQueue: boolean;
}

export const PIPELINE_STAGES: StageDef[] = [
  // ── Active outreach ──────────────────────────────────────
  { key: "touch1_pending",     label: "Touch 1 Pending",   group: "active", color: "bg-slate-100 border-slate-300",  badge: "bg-slate-200 text-slate-700",    followUpQueue: false },
  { key: "no_answer",          label: "No Answer",         group: "active", color: "bg-gray-50 border-gray-300",     badge: "bg-gray-200 text-gray-600",      followUpQueue: true },
  { key: "follow_back",        label: "Follow Back",       group: "active", color: "bg-yellow-50 border-yellow-200", badge: "bg-yellow-100 text-yellow-700",  followUpQueue: true },
  { key: "curiosity_sent",     label: "Curiosity Sent",    group: "active", color: "bg-blue-50 border-blue-200",     badge: "bg-blue-100 text-blue-700",      followUpQueue: false },
  { key: "pdf_sent",           label: "PDF Sent",          group: "active", color: "bg-indigo-50 border-indigo-200", badge: "bg-indigo-100 text-indigo-700",  followUpQueue: false },
  { key: "follow_up_due",      label: "Follow-up Due",     group: "active", color: "bg-amber-50 border-amber-200",   badge: "bg-amber-100 text-amber-700",    followUpQueue: true },
  { key: "gatekeeper",         label: "Gatekeeper",        group: "active", color: "bg-orange-50 border-orange-200", badge: "bg-orange-100 text-orange-700",  followUpQueue: true },
  { key: "meeting_booked",     label: "Meeting Booked",    group: "active", color: "bg-green-50 border-green-200",   badge: "bg-green-100 text-green-700",    followUpQueue: false },
  { key: "proposal_sent",      label: "Proposal Sent",     group: "active", color: "bg-purple-50 border-purple-200", badge: "bg-purple-100 text-purple-700",  followUpQueue: false },

  // ── Parked (recoverable, out of the calling rotation) ────
  { key: "unreachable",        label: "Unreachable",       group: "parked", color: "bg-stone-50 border-stone-300",   badge: "bg-stone-200 text-stone-600",    followUpQueue: false },
  { key: "gatekeeper_flagged", label: "Gatekeeper Wall",   group: "parked", color: "bg-orange-50 border-orange-300", badge: "bg-orange-200 text-orange-700",  followUpQueue: true },
  { key: "language_barrier",   label: "Language Barrier",  group: "parked", color: "bg-cyan-50 border-cyan-200",     badge: "bg-cyan-100 text-cyan-700",      followUpQueue: false },
  { key: "revival",            label: "Revival",           group: "parked", color: "bg-rose-50 border-rose-200",     badge: "bg-rose-100 text-rose-700",      followUpQueue: false },

  // ── Closed ───────────────────────────────────────────────
  { key: "not_interested",     label: "Not Interested",    group: "closed", color: "bg-orange-50 border-orange-200", badge: "bg-orange-100 text-orange-700",  followUpQueue: false },
  { key: "won",                label: "Won",               group: "closed", color: "bg-emerald-50 border-emerald-200", badge: "bg-emerald-100 text-emerald-700", followUpQueue: false },
  { key: "lost",               label: "Lost",              group: "closed", color: "bg-red-50 border-red-200",       badge: "bg-red-100 text-red-700",        followUpQueue: false },
  { key: "dead",               label: "Dead",              group: "closed", color: "bg-slate-100 border-slate-200",  badge: "bg-slate-100 text-slate-500",    followUpQueue: false },
];

export type OutreachStage = (typeof PIPELINE_STAGES)[number]["key"];

export const STAGES_BY_GROUP = {
  active: PIPELINE_STAGES.filter((s) => s.group === "active"),
  parked: PIPELINE_STAGES.filter((s) => s.group === "parked"),
  closed: PIPELINE_STAGES.filter((s) => s.group === "closed"),
};

export const STAGE_LABELS: Record<string, string> = Object.fromEntries(
  PIPELINE_STAGES.map((s) => [s.key, s.label])
);

export const FOLLOW_UP_QUEUE_STAGES = PIPELINE_STAGES.filter((s) => s.followUpQueue).map(
  (s) => s.key
);

export function getStage(key: string | null | undefined): StageDef | undefined {
  return PIPELINE_STAGES.find((s) => s.key === key);
}

// ─────────────────────────────────────────────────────────────
// Legacy `leads.status` derivation. The status enum is:
// new | first_call_pending | calling | contacted | qualified |
// strategy_booked | strategy_completed | nurture | disqualified |
// closed_won | closed_lost | proposal_sent
// ─────────────────────────────────────────────────────────────
const STAGE_TO_STATUS: Record<string, string> = {
  touch1_pending: "new",
  no_answer: "calling",
  follow_back: "calling",
  curiosity_sent: "calling",
  pdf_sent: "calling",
  follow_up_due: "calling",
  gatekeeper: "calling",
  meeting_booked: "strategy_booked",
  proposal_sent: "proposal_sent",

  unreachable: "nurture",
  gatekeeper_flagged: "nurture",
  language_barrier: "nurture",
  revival: "nurture",

  not_interested: "closed_lost",
  won: "closed_won",
  lost: "closed_lost",
  dead: "closed_lost",
};

export function stageToStatus(stage: string): string {
  return STAGE_TO_STATUS[stage] ?? "calling";
}

/**
 * Reverse mapping for views that operate in legacy-status space
 * (the strategist pipeline). Returns the outreach_stage a status
 * implies, or null when the status doesn't move the pipeline
 * position (e.g. qualified/strategy_completed stay in
 * meeting_booked).
 */
const STATUS_TO_STAGE: Record<string, string> = {
  new: "touch1_pending",
  calling: "follow_up_due",
  strategy_booked: "meeting_booked",
  strategy_completed: "meeting_booked",
  qualified: "meeting_booked",
  proposal_sent: "proposal_sent",
  closed_won: "won",
  closed_lost: "lost",
  nurture: "revival",
};

export function statusToStage(status: string): string | null {
  return STATUS_TO_STAGE[status] ?? null;
}

/**
 * Payload for status-space writes (strategist views): sets the
 * requested status verbatim and keeps outreach_stage consistent.
 */
export function leadStatusUpdate(
  status: string,
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
  const stage = statusToStage(status);
  return {
    status,
    ...(stage ? { outreach_stage: stage } : {}),
    last_activity_at: new Date().toISOString(),
    ...(stage === "meeting_booked" ? { meeting_booked_at: new Date().toISOString() } : {}),
    ...extra,
  };
}

/**
 * The ONLY correct payload for moving a lead through the pipeline.
 * Keeps outreach_stage (canonical) and status (legacy, dashboards)
 * in lockstep.
 *
 *   await supabase.from("leads")
 *     .update(leadStageUpdate("won", { last_outcome: "MEETING" }))
 *     .eq("id", leadId);
 */
export function leadStageUpdate(
  stage: string,
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    outreach_stage: stage,
    status: stageToStatus(stage),
    last_activity_at: new Date().toISOString(),
    ...(stage === "meeting_booked" ? { meeting_booked_at: new Date().toISOString() } : {}),
    ...extra,
  };
}
