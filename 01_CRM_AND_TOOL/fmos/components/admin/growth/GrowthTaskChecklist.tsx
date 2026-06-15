"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { toast } from "@/components/ui/toast";

interface Task {
  id: string;
  title: string;
  due_date: string | null;
}

export default function GrowthTaskChecklist({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const supabase = createClient();

  const handleComplete = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const { error } = await supabase
      .from("tasks")
      .update({ status: "completed", completed_at: new Date().toISOString() } as any)
      .eq("id", id);
    if (error) {
      toast.error("Failed to update task", error.message);
      // Restore task on failure
      const original = initialTasks.find((t) => t.id === id);
      if (original) setTasks((prev) => [...prev, original]);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 m-auto">
        <CheckCircle2 className="h-12 w-12 text-slate-200 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-500">All marketing tasks complete!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 flex-1 overflow-y-auto pr-2">
      {tasks.map((task) => (
        <label
          key={task.id}
          className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors group"
        >
          <input
            type="checkbox"
            onChange={() => handleComplete(task.id)}
            className="mt-1 flex-shrink-0 appearance-none h-4 w-4 rounded-full border-2 border-slate-300 checked:bg-[#42CA80] checked:border-[#42CA80] transition-all cursor-pointer"
          />
          <div>
            <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{task.title}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Due {task.due_date ? new Date(task.due_date).toLocaleDateString() : "N/A"}
            </p>
          </div>
        </label>
      ))}
    </div>
  );
}
