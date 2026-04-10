"use client";

import { useState, useTransition } from "react";
import { toggleOnboardingItem } from "@/app/admin/clients/actions";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

interface ChecklistItem {
  id: string;
  category: string;
  item_text: string;
  is_completed: boolean | null;
  completed_at: string | null;
  notes: string | null;
  sort_order: number | null;
}

export default function OnboardingTab({
  items: initialItems,
  clientId,
}: {
  items: ChecklistItem[];
  clientId: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const completed = items.filter((i) => i.is_completed).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Group by category
  const grouped: Record<string, ChecklistItem[]> = {};
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  const handleToggle = (itemId: string, currentState: boolean) => {
    setPendingId(itemId);
    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? {
              ...i,
              is_completed: !currentState,
              completed_at: !currentState
                ? new Date().toISOString()
                : null,
            }
          : i
      )
    );

    startTransition(async () => {
      const result = await toggleOnboardingItem(itemId, !currentState);
      if (!result.success) {
        // Rollback
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? { ...i, is_completed: currentState, completed_at: null }
              : i
          )
        );
      }
      setPendingId(null);
    });
  };

  return (
    <div>
      {/* Progress Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">
            Onboarding Progress
          </h3>
          <span className="text-lg font-black font-mono tabular-nums text-[#42CA80]">
            {pct}%
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#42CA80] transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {completed} of {total} items completed
        </p>
      </div>

      {/* Checklist Categories */}
      {total === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <p className="text-sm text-slate-500">
            No onboarding checklist found. Run the migration to enable
            auto-creation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, categoryItems]) => {
            const catDone = categoryItems.filter((i) => i.is_completed).length;
            return (
              <div
                key={category}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    {category}
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400">
                    {catDone}/{categoryItems.length}
                  </span>
                </div>
                <div className="divide-y divide-slate-50">
                  {categoryItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() =>
                        handleToggle(item.id, !!item.is_completed)
                      }
                      disabled={pendingId === item.id}
                      className="flex items-center gap-3 w-full px-5 py-3 text-left hover:bg-slate-50/60 transition-colors group min-h-[48px]"
                    >
                      {pendingId === item.id ? (
                        <Loader2 className="h-5 w-5 text-[#42CA80] animate-spin flex-shrink-0" />
                      ) : item.is_completed ? (
                        <CheckCircle2 className="h-5 w-5 text-[#42CA80] flex-shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-300 group-hover:text-slate-400 flex-shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          item.is_completed
                            ? "text-slate-400 line-through"
                            : "text-slate-700"
                        }`}
                      >
                        {item.item_text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
