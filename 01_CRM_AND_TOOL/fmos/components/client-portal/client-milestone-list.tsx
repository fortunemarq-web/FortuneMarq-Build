"use client";

import { useState } from "react";
import { Check, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import clsx from "clsx";
import { toast } from "@/components/ui/toast";
import { Badge, type Tone } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

interface Milestone {
  id: string;
  project_id: string;
  name: string;
  status: string;
  order_index: number;
  created_at: string;
}

interface ClientMilestoneListProps {
  initialMilestones: Milestone[];
  projectId: string;
  milestonesError: any;
}

type MilestoneStatus = "not_started" | "in_progress" | "ready_for_approval" | "approved";

const STATUS: Record<MilestoneStatus, { label: string; tone: Tone; icon: React.ReactNode }> = {
  not_started: { label: "Upcoming", tone: "neutral", icon: <Clock className="h-4 w-4" /> },
  in_progress: { label: "In progress", tone: "info", icon: <Clock className="h-4 w-4" /> },
  ready_for_approval: { label: "Needs approval", tone: "warning", icon: <AlertCircle className="h-4 w-4" /> },
  approved: { label: "Approved", tone: "brand", icon: <CheckCircle2 className="h-4 w-4" /> },
};

const TONE_TEXT: Record<Tone, string> = {
  neutral: "text-slate-500",
  brand: "text-brand-deep",
  info: "text-info",
  warning: "text-warn",
  danger: "text-danger",
};

const CIRCLE: Record<MilestoneStatus, string> = {
  approved: "border-brand bg-brand text-white",
  in_progress: "border-info bg-info-soft text-info",
  ready_for_approval: "border-warn bg-warn-soft text-warn",
  not_started: "border-line bg-slate-50 text-slate-500",
};

export default function ClientMilestoneList({
  initialMilestones,
  projectId,
  milestonesError,
}: ClientMilestoneListProps) {
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const handleApprove = async (milestoneId: string) => {
    setApprovingId(milestoneId);

    try {
      const supabase = createClient();

      const query = (supabase
        .from("project_milestones") as any)
        .update({ status: "approved" })
        .eq("id", milestoneId);
      const { error } = await query;

      if (error) {
        console.error("Error approving milestone:", error);
        toast.error("Failed to approve milestone", "Please try again.");
        return;
      }

      // Update local state
      setMilestones((prev) =>
        prev.map((m) =>
          m.id === milestoneId ? { ...m, status: "approved" } : m
        )
      );
    } catch (error) {
      console.error("Error approving milestone:", error);
      toast.error("Failed to approve milestone", "Please try again.");
    } finally {
      setApprovingId(null);
    }
  };

  if (milestonesError) {
    return (
      <div className="rounded-xl border border-danger-line bg-danger-soft p-6 text-center">
        <p className="text-sm text-danger">
          Error loading milestones: {milestonesError.message}
        </p>
      </div>
    );
  }

  if (!milestones || milestones.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface p-8 text-center">
        <p className="text-sm text-slate-500">No milestones found for this project.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {milestones.map((milestone, index) => {
        const status = (milestone.status as MilestoneStatus) || "not_started";
        const config = STATUS[status] || STATUS.not_started;
        const isApproving = approvingId === milestone.id;
        const isLastItem = index === milestones.length - 1;

        return (
          <div key={milestone.id} className="relative">
            {/* Timeline connector */}
            {!isLastItem && (
              <div
                className={clsx(
                  "absolute left-6 top-16 h-full w-0.5",
                  status === "approved" ? "bg-brand/40" : "bg-line"
                )}
              />
            )}

            {/* Milestone Card */}
            <div
              className={clsx(
                "relative flex items-center gap-4 rounded-xl border p-4 transition-all",
                status === "approved"
                  ? "border-brand-line bg-brand-soft"
                  : "border-line bg-surface hover:border-line-strong"
              )}
            >
              {/* Order Number Circle */}
              <div
                className={clsx(
                  "relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 text-lg font-semibold",
                  CIRCLE[status]
                )}
              >
                {status === "approved" ? (
                  <Check className="h-6 w-6" />
                ) : (
                  milestone.order_index || index + 1
                )}
              </div>

              {/* Milestone Info */}
              <div className="min-w-0 flex-1">
                <h3
                  className={clsx(
                    "font-semibold",
                    status === "approved" ? "text-brand-deep" : "text-slate-900"
                  )}
                >
                  {milestone.name}
                </h3>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={TONE_TEXT[config.tone]}>{config.icon}</span>
                  <span className={clsx("text-sm font-medium", TONE_TEXT[config.tone])}>
                    {config.label}
                  </span>
                </div>
              </div>

              {/* Status Badge / Approve Button */}
              <div className="flex-shrink-0">
                {status === "ready_for_approval" ? (
                  <button
                    onClick={() => handleApprove(milestone.id)}
                    disabled={isApproving}
                    className={buttonVariants({ variant: "primary" })}
                    aria-label={`Approve ${milestone.name}`}
                  >
                    {isApproving ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Approve
                      </>
                    )}
                  </button>
                ) : (
                  <Badge tone={config.tone} variant="outline">
                    {config.icon}
                    {config.label}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
