"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, FileText, CheckCircle2, Clock, MapPin, Trash2, Plus } from "lucide-react";
import Link from "next/link";
import { saveApprovedTasks } from "@/app/admin/strategy/actions";
import { toast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Task {
  title: string;
  description: string;
  due_date: string;
  priority: string;
  assignee: string;
  section_tag: string;
  estimated_minutes: number;
}

export default function ReviewPageClient({ team }: { team: any[] }) {
  const router = useRouter();
  const [data, setData] = useState<{
    sourceText: string;
    destination: string;
    timeframe: string;
    generated: { strategy_title: string; total_tasks: number; tasks: Task[] };
  } | null>(null);

  const [activeTasks, setActiveTasks] = useState<(Task & { id: string; checked: boolean })[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("STRATEGY_REVIEW_DATA");
    if (!raw) {
      router.push("/admin/strategy");
      return;
    }
    const parsed = JSON.parse(raw);
    setData(parsed);
    
    // Map tasks and generate temp IDs
    const mapped = parsed.generated.tasks.map((t: Task, i: number) => ({
      ...t,
      id: `tmp_${i}_${Date.now()}`,
      checked: true
    }));
    setActiveTasks(mapped);

  }, [router]);

  const handleTaskChange = (id: string, field: keyof Task, value: any) => {
    setActiveTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleToggleCheck = (id: string) => {
    setActiveTasks(prev => prev.map(t => t.id === id ? { ...t, checked: !t.checked } : t));
  };
  
  const handleToggleAll = (check: boolean) => {
    setActiveTasks(prev => prev.map(t => ({ ...t, checked: check })));
  };

  const handleDeleteSelected = () => {
    setActiveTasks(prev => prev.filter(t => !t.checked));
  };

  const handleAddTask = () => {
    setActiveTasks(prev => [...prev, {
      id: `manual_${Date.now()}`,
      title: "",
      description: "",
      due_date: new Date().toISOString().split('T')[0],
      priority: "medium",
      assignee: team[0]?.id || "admin",
      section_tag: data?.destination || "",
      estimated_minutes: 30,
      checked: true
    }]);
  };

  const handleApproveAndSave = async () => {
    if (!data) return;
    setIsSaving(true);
    
    const tasksToSave = activeTasks.filter(t => t.checked);
    
    const result = await saveApprovedTasks(
      tasksToSave,
      data.generated.strategy_title || "Unnamed Strategy Build",
      data.destination,
      data.timeframe,
      data.sourceText,
      (data as any).client_id || undefined,
      (data as any).strategy_type || undefined
    );

    if (result.success) {
      sessionStorage.removeItem("STRATEGY_REVIEW_DATA");
      
      // Attempt to route directly to where the tasks live based on section_tag destination parsing
      const dest = data.destination;
      const clientId = (data as any).client_id;
      let path = "/tasks"; // fallback
      
      if (clientId && dest.startsWith("client_")) {
        // Client-originated strategy — go back to client profile
        path = `/admin/clients/${clientId}`;
      } else if (dest.startsWith("agency_growth.")) {
        const route = dest.split(".")[1];
        path = `/admin/growth/${route === 'seo' ? 'seo' : route === 'gmb' ? 'gmb' : route}`;
      } else if (dest.startsWith("acquisition.")) {
        const citySlug = dest.split(".")[1];
        path = `/admin/growth/acquisition/${citySlug}`;
      }
      
      router.push(path);
    } else {
      toast.error("Failed to save tasks", result.error ?? "");
      setIsSaving(false);
    }
  };

  if (!data) return <div className="animate-pulse p-8 text-center text-slate-500">Loading review panel...</div>;

  const checkedCount = activeTasks.filter(t => t.checked).length;

  return (
    <div className="min-h-full bg-canvas px-4 py-8 pb-32">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <Card className="mb-6 p-6">
          <Link href="/admin/strategy" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-700">
            <ArrowLeft className="h-4 w-4" /> Discard and go back
          </Link>

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-slate-900">{data.generated.strategy_title || "Strategy Task Extraction"}</h1>
              <div className="mt-2 flex items-center gap-3">
                <Badge tone="info" size="sm">
                  <FileText className="h-3.5 w-3.5" />
                  {activeTasks.length} tasks generated
                </Badge>
                <Badge tone="brand" size="sm">
                  <MapPin className="h-3.5 w-3.5" />
                  Destination: {data.destination}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={() => router.push("/admin/strategy")} variant="secondary">
                Cancel
              </Button>
              <Button
                onClick={handleApproveAndSave}
                disabled={isSaving || checkedCount === 0}
                variant="primary"
              >
                {isSaving ? "Saving..." : "Approve & Save Tasks"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Task Review Table */}
        <Card className="flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-line bg-slate-50/50 px-6 py-4">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Task Review &amp; Edit
            </h3>

            <div className="flex items-center gap-3">
              <button onClick={() => handleToggleAll(true)} className="text-xs font-semibold text-slate-500 hover:text-brand-deep">Select All</button>
              <span className="text-slate-700">|</span>
              <button onClick={() => handleToggleAll(false)} className="text-xs font-semibold text-slate-500 hover:text-brand-deep">Deselect All</button>
              <span className="text-slate-700">|</span>
              <button onClick={handleDeleteSelected} className="flex items-center gap-1 text-xs font-semibold text-danger hover:text-red-700">
                <Trash2 className="h-3 w-3" /> Delete Selected
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <tr className="border-b border-line bg-slate-50">
                  <th className="w-10 px-4 py-2.5 text-center"></th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Task Title &amp; Details</th>
                  <th className="w-40 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Due Date</th>
                  <th className="w-32 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</th>
                  <th className="w-48 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Assignee</th>
                  <th className="w-24 px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Est. Min</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-surface">
                {activeTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                      Zero tasks remaining. Add a task manually or run extraction again.
                    </td>
                  </tr>
                ) : (
                  activeTasks.map((task) => (
                    <tr key={task.id} className={`transition-colors ${task.checked ? 'hover:bg-slate-50/70' : 'bg-slate-50 opacity-40'}`}>
                      <td className="px-4 py-3 pt-5 text-center align-top">
                        <input
                          type="checkbox"
                          checked={task.checked}
                          onChange={() => handleToggleCheck(task.id)}
                          className="h-4 w-4 cursor-pointer appearance-none rounded border-2 border-slate-300 transition-colors checked:border-brand-deep checked:bg-brand-deep"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={task.title}
                          onChange={(e) => handleTaskChange(task.id, "title", e.target.value)}
                          className={`w-full rounded p-1 text-sm font-semibold focus:bg-brand-soft/40 focus:outline-none ${task.checked ? 'bg-transparent text-slate-900' : 'bg-transparent text-slate-500'}`}
                          placeholder="Task Title..."
                        />
                        <textarea
                          rows={2}
                          value={task.description}
                          onChange={(e) => handleTaskChange(task.id, "description", e.target.value)}
                          className={`mt-1 min-h-[40px] w-full resize-none rounded p-1 text-xs focus:bg-brand-soft/40 focus:outline-none ${task.checked ? 'bg-transparent text-slate-600' : 'bg-transparent text-slate-400'}`}
                          placeholder="Short description or context..."
                        />
                      </td>
                      <td className="px-4 py-3 pt-4 align-top">
                        <input
                          type="date"
                          value={task.due_date}
                          onChange={(e) => handleTaskChange(task.id, "due_date", e.target.value)}
                          className="w-full rounded border border-transparent bg-transparent px-2 py-1 text-sm tabular-nums text-slate-700 hover:border-line focus:border-brand-deep focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-3 pt-4 align-top">
                        <select
                          value={task.priority}
                          onChange={(e) => handleTaskChange(task.id, "priority", e.target.value)}
                          className={`w-full cursor-pointer appearance-none rounded border border-transparent bg-transparent px-2 py-1.5 text-xs font-semibold uppercase tracking-wide hover:border-line focus:border-brand-deep focus:outline-none ${
                            task.priority === 'high' ? 'text-danger' : task.priority === 'medium' ? 'text-warn' : 'text-slate-500'
                          }`}
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 pt-4 align-top">
                        <select
                          value={task.assignee}
                          onChange={(e) => handleTaskChange(task.id, "assignee", e.target.value)}
                          className="w-full cursor-pointer rounded border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-slate-700 hover:border-line focus:border-brand-deep focus:outline-none"
                        >
                          {team.map(m => (
                            <option key={m.id} value={m.id}>{m.full_name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 pt-4 text-right align-top">
                        <input
                          type="number"
                          value={task.estimated_minutes}
                          onChange={(e) => handleTaskChange(task.id, "estimated_minutes", parseInt(e.target.value) || 0)}
                          className="w-full rounded border border-transparent bg-transparent px-2 py-1 text-right text-sm font-semibold tabular-nums text-slate-700 hover:border-line focus:border-brand-deep focus:outline-none"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-line bg-slate-50 p-4 text-center">
            <button
              onClick={handleAddTask}
              className="inline-flex items-center gap-2 rounded-lg border border-dashed border-line bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-wide text-brand-deep transition-colors hover:border-brand-line hover:bg-brand-soft"
            >
              <Plus className="h-4 w-4" /> Add Blank Task manually
            </button>
          </div>
        </Card>
      </div>
      
      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t border-line bg-surface p-4 shadow-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Saving <span className="tabular-nums text-brand-deep">{checkedCount}</span> / {activeTasks.length} tasks
            </h3>
            <div className="hidden items-center gap-3 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500 sm:flex">
              <span>Timeframe: <b>{data.timeframe.replace('_',' ')}</b></span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => router.push("/admin/strategy")} variant="ghost">
              Back to Edit
            </Button>
            <Button
              onClick={handleApproveAndSave}
              disabled={isSaving || checkedCount === 0}
              variant="primary"
              size="lg"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSaving ? "Saving Tasks..." : "Approve & Save"}
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}
