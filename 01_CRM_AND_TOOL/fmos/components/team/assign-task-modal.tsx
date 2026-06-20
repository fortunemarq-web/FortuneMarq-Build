"use client";

import { useState } from "react";
import { X, Save, Plus, Loader2 } from "lucide-react";
import { createAssignedTask } from "@/app/admin/team/actions";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-surface rounded-2xl w-full max-w-lg border border-line shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-brand-soft text-brand-deep">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900 leading-tight">Assign Team Task</h2>
              <p className="text-xs text-slate-500">Directly assign specific tasks to team members.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Assign To</Label>
              <Select
                value={task.assigned_to}
                onChange={e => setTask({ ...task, assigned_to: e.target.value })}
              >
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Task Title</Label>
              <Input
                value={task.title}
                onChange={e => setTask({ ...task, title: e.target.value })}
                required
                placeholder="e.g. Audit follow-up leads"
              />
            </div>

            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                value={task.description}
                onChange={e => setTask({ ...task, description: e.target.value })}
                rows={3}
                placeholder="Detailed instructions..."
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={task.due_date}
                  onChange={e => setTask({ ...task, due_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Priority</Label>
                <Select
                  value={task.priority}
                  onChange={e => setTask({ ...task, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Select>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-line flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Assign Task
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
