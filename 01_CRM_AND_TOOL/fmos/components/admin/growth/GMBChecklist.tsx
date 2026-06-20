"use client";

import { useTransition, useState } from "react";
import { toggleGmbChecklistItem } from "@/app/admin/growth/actions";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function GMBChecklist({ items }: { items: any[] }) {
  const [localItems, setLocalItems] = useState(items);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    // Optimistic UI
    setLocalItems(prev => prev.map(item => item.id === id ? { ...item, is_completed: !currentStatus } : item));
    
    const result = await toggleGmbChecklistItem(id, !currentStatus);
    if (!result.success) {
      // Revert on error
      setLocalItems(prev => prev.map(item => item.id === id ? { ...item, is_completed: currentStatus } : item));
    }
  };

  const completedCount = localItems.filter(i => i.is_completed).length;
  const progress = localItems.length > 0 ? (completedCount / localItems.length) * 100 : 0;

  return (
    <Card className="overflow-hidden flex flex-col min-h-full">
      <div className="px-5 py-4 flex items-center justify-between border-b border-line bg-slate-50">
        <h3 className="font-display text-[15px] font-semibold text-slate-900">
          Optimization Checklist
        </h3>
        <span className="text-xs font-semibold tabular-nums text-brand-deep">
          {completedCount}/{localItems.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-slate-100">
        <div
          className="h-full bg-brand transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-2">
        {localItems.map(item => (
          <label
            key={item.id}
            className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
              item.is_completed ? 'border-brand-line bg-brand-soft/40 opacity-75' : 'border-line hover:bg-slate-50 hover:border-line-strong'
            }`}
          >
            <button
              type="button"
              disabled={false}
              onClick={(e) => {
                e.preventDefault();
                handleToggle(item.id, item.is_completed);
              }}
              className="mt-0.5 flex-shrink-0"
            >
              {item.is_completed ? (
                <CheckCircle2 className="h-5 w-5 text-brand-deep" />
              ) : (
                <Circle className="h-5 w-5 text-slate-300 hover:text-slate-400" />
              )}
            </button>
            <span className={`text-sm font-medium ${item.is_completed ? 'text-slate-500 line-through' : 'text-slate-700'}`}>
              {item.item_text}
            </span>
          </label>
        ))}
      </div>
    </Card>
  );
}
