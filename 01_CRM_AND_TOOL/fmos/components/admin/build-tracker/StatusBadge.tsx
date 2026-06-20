"use client";

import { useState, useTransition } from "react";
import { updateModuleStatus } from "@/app/admin/build-tracker/actions";
import type { ModuleStatus } from "@/app/admin/build-tracker/actions";
import { ChevronDown, Loader2, Check } from "lucide-react";

// Each status collapses to one of the five tones — no per-status colours.
const STATUS_CONFIG: Record<
  ModuleStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  not_started: {
    label: "Not Started",
    bg: "bg-slate-100",
    text: "text-slate-700",
    dot: "bg-slate-400",
  },
  in_progress: {
    label: "In Progress",
    bg: "bg-warn-soft",
    text: "text-warn",
    dot: "bg-warn",
  },
  done: {
    label: "Done",
    bg: "bg-brand-soft",
    text: "text-brand-deep",
    dot: "bg-brand",
  },
  blocked: {
    label: "Blocked",
    bg: "bg-danger-soft",
    text: "text-danger",
    dot: "bg-danger",
  },
};

const ALL_STATUSES: ModuleStatus[] = [
  "not_started",
  "in_progress",
  "done",
  "blocked",
];

interface StatusBadgeProps {
  id: string;
  initialStatus: ModuleStatus;
  onStatusChange?: (newStatus: ModuleStatus) => void;
}

export default function StatusBadge({
  id,
  initialStatus,
  onStatusChange,
}: StatusBadgeProps) {
  const [status, setStatus] = useState<ModuleStatus>(initialStatus);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const current = STATUS_CONFIG[status];

  const handleSelect = (newStatus: ModuleStatus) => {
    if (newStatus === status) {
      setIsOpen(false);
      return;
    }
    setIsOpen(false);
    const prev = status;
    setStatus(newStatus); // optimistic update
    onStatusChange?.(newStatus);

    startTransition(async () => {
      const result = await updateModuleStatus(id, newStatus);
      if (!result.success) {
        setStatus(prev); // rollback on error
        onStatusChange?.(prev);
      }
    });
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen((o) => !o)}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all hover:opacity-80 ${current.bg} ${current.text}`}
      >
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
        )}
        <span>{current.label}</span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full z-20 mt-1 w-36 rounded-lg border border-line bg-surface shadow-md">
            {ALL_STATUSES.map((s) => {
              const cfg = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => handleSelect(s)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-xs font-medium transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-slate-50 ${
                    s === status ? "bg-slate-50" : ""
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                  <span className="text-slate-700">{cfg.label}</span>
                  {s === status && (
                    <Check className="ml-auto h-3 w-3 text-brand-deep" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
