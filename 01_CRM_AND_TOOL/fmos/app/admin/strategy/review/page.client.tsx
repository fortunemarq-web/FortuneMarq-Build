"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, FileText, CheckCircle2, Clock, MapPin, Trash2, Plus } from "lucide-react";
import Link from "next/link";
import { saveApprovedTasks } from "@/app/admin/strategy/actions";
import { toast } from "@/components/ui/toast";

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

  if (!data) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading review panel...</div>;

  const checkedCount = activeTasks.filter(t => t.checked).length;

  return (
    <div className="min-h-full bg-slate-50 px-4 py-8 pb-32">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
          <Link href="/admin/strategy" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" /> Discard and go back
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{data.generated.strategy_title || "Strategy Task Extraction"}</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                  <FileText className="h-3.5 w-3.5" />
                  {activeTasks.length} tasks generated
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <MapPin className="h-3.5 w-3.5" />
                  Destination: {data.destination}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.push("/admin/strategy")}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleApproveAndSave}
                disabled={isSaving || checkedCount === 0}
                className="flex items-center gap-2 rounded-lg bg-[#42CA80] px-4 py-2 text-sm font-bold text-white shadow hover:bg-[#38b571] disabled:opacity-50 transition-colors"
              >
                {isSaving ? "Saving..." : "Approve & Save Tasks"} 
              </button>
            </div>
          </div>
        </div>

        {/* Task Review Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">
              Task Review & Edit
            </h3>
            
            <div className="flex items-center gap-3">
              <button onClick={() => handleToggleAll(true)} className="text-xs font-bold text-slate-500 hover:text-indigo-600">Select All</button>
              <span className="text-slate-300">|</span>
              <button onClick={() => handleToggleAll(false)} className="text-xs font-bold text-slate-500 hover:text-indigo-600">Deselect All</button>
              <span className="text-slate-300">|</span>
              <button onClick={handleDeleteSelected} className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1">
                <Trash2 className="h-3 w-3" /> Delete Selected
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  <th className="px-4 py-3 w-10 text-center"></th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Task Title & Details</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-40">Due Date</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-32">Priority</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-48">Assignee</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400 w-24">Est. Min</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {activeTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                      Zero tasks remaining. Add a task manually or run extraction again.
                    </td>
                  </tr>
                ) : (
                  activeTasks.map((task) => (
                    <tr key={task.id} className={`transition-colors ${task.checked ? 'hover:bg-slate-50/60' : 'opacity-40 bg-slate-50'}`}>
                      <td className="px-4 py-3 text-center align-top pt-5">
                        <input 
                          type="checkbox" 
                          checked={task.checked}
                          onChange={() => handleToggleCheck(task.id)}
                          className="h-4 w-4 appearance-none rounded border-2 border-slate-300 checked:bg-[#42CA80] checked:border-[#42CA80] transition-colors cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="text" 
                          value={task.title}
                          onChange={(e) => handleTaskChange(task.id, "title", e.target.value)}
                          className={`w-full text-sm font-semibold p-1 focus:outline-none focus:bg-indigo-50/50 rounded ${task.checked ? 'text-slate-900 bg-transparent' : 'text-slate-500 bg-transparent'}`}
                          placeholder="Task Title..."
                        />
                        <textarea
                          rows={2}
                          value={task.description}
                          onChange={(e) => handleTaskChange(task.id, "description", e.target.value)}
                          className={`w-full mt-1 text-xs p-1 focus:outline-none focus:bg-indigo-50/50 rounded resize-none min-h-[40px] ${task.checked ? 'text-slate-600 bg-transparent' : 'text-slate-400 bg-transparent'}`}
                          placeholder="Short description or context..."
                        />
                      </td>
                      <td className="px-4 py-3 align-top pt-4">
                        <input 
                          type="date"
                          value={task.due_date}
                          onChange={(e) => handleTaskChange(task.id, "due_date", e.target.value)}
                          className="w-full text-sm font-mono text-slate-700 bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-400 focus:outline-none rounded px-2 py-1"
                        />
                      </td>
                      <td className="px-4 py-3 align-top pt-4">
                        <select
                          value={task.priority}
                          onChange={(e) => handleTaskChange(task.id, "priority", e.target.value)}
                          className={`w-full text-xs font-bold uppercase tracking-widest bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-400 focus:outline-none rounded px-2 py-1.5 appearance-none cursor-pointer ${
                            task.priority === 'high' ? 'text-red-600' : task.priority === 'medium' ? 'text-amber-600' : 'text-slate-500'
                          }`}
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 align-top pt-4">
                        <select
                          value={task.assignee}
                          onChange={(e) => handleTaskChange(task.id, "assignee", e.target.value)}
                          className="w-full text-sm font-medium text-slate-700 bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-400 focus:outline-none rounded px-2 py-1 cursor-pointer"
                        >
                          {team.map(m => (
                            <option key={m.id} value={m.id}>{m.full_name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 align-top pt-4 text-right">
                        <input 
                          type="number"
                          value={task.estimated_minutes}
                          onChange={(e) => handleTaskChange(task.id, "estimated_minutes", parseInt(e.target.value) || 0)}
                          className="w-full font-mono text-sm text-right text-slate-700 font-bold bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-400 focus:outline-none rounded px-2 py-1"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="bg-slate-50 p-4 border-t border-slate-200 text-center">
            <button 
              onClick={handleAddTask}
              className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#42CA80] hover:border-[#42CA80] hover:bg-emerald-50 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Blank Task manually
            </button>
          </div>
        </div>
      </div>
      
      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] p-4 flex items-center justify-between z-40">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-bold text-slate-900">
              Saving <span className="text-[#42CA80]">{checkedCount}</span> / {activeTasks.length} tasks
            </h3>
            <div className="hidden sm:flex items-center gap-3 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              <span>Timeframe: <b>{data.timeframe.replace('_',' ')}</b></span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push("/admin/strategy")}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              ← Back to Edit
            </button>
            <button 
              onClick={handleApproveAndSave}
              disabled={isSaving || checkedCount === 0}
              className="flex items-center gap-2 rounded-lg bg-[#42CA80] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#38b571] disabled:opacity-50 transition-colors"
            >
              {isSaving ? "Saving Tasks..." : "✓ Approve & Save →"} 
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
