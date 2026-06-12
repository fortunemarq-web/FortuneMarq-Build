"use client";

import { useState } from "react";
import { X, Save, Plus, Loader2, Calendar, Layout } from "lucide-react";
import { createAssignedTask } from "@/app/admin/team/actions";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";

interface AssignTaskModalProps {
  profiles: any[];
  defaultAssignee?: string;
  onClose: () => void;
}

export default function AssignTaskModal({ profiles, defaultAssignee, onClose }: AssignTaskModalProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [task, setTask] = useState({
    title: "",
    description: "",
    assigned_to: defaultAssignee || profiles[0]?.id || "",
    due_date: new Date().toISOString().split('T')[0],
    priority: "medium"
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.title) return;
    setIsSaving(true);
    try {
      const { success, error } = await createAssignedTask(task);
      if (success) {
        onClose();
        router.refresh();
      } else {
        toast.error("Error assigning task", String(error));
      }
    } catch (e) {
      console.error(e);
      toast.error("Error assigning task");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-tight">Assign Team Task</h2>
              <p className="text-xs font-medium text-slate-400">Directly assign specific tasks to team members.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-slate-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Assign To</label>
              <select 
                value={task.assigned_to}
                onChange={e => setTask({ ...task, assigned_to: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
              >
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Task Title</label>
              <input 
                value={task.title}
                onChange={e => setTask({ ...task, title: e.target.value })}
                required
                placeholder="e.g. Audit follow-up leads"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Description (Optional)</label>
              <textarea 
                value={task.description}
                onChange={e => setTask({ ...task, description: e.target.value })}
                rows={3}
                placeholder="Detailed instructions..."
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Due Date</label>
                <input 
                  type="date"
                  value={task.due_date}
                  onChange={e => setTask({ ...task, due_date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Priority</label>
                <select 
                  value={task.priority}
                  onChange={e => setTask({ ...task, priority: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 transition-colors">
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="bg-slate-900 text-white px-8 py-3.5 rounded-[1.25rem] text-sm font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3 disabled:opacity-50 shadow-lg shadow-slate-900/10"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Assign Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
