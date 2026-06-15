"use client";

import { useState } from "react";
import { X, Save, Plus, Trash2, Loader2, Target } from "lucide-react";
import { upsertTeamTargets } from "@/app/admin/team/actions";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";

interface SetTargetsModalProps {
  profiles: any[];
  existingTargets: any[];
  onClose: () => void;
}

export default function SetTargetsModal({ profiles, existingTargets, onClose }: SetTargetsModalProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [rows, setRows] = useState<any[]>(() => {
    if (existingTargets.length > 0) {
      // Stored rows are period-prefixed (daily_<metric> / weekly_<metric>) with the
      // number in target_value. Merge them back into one editable row per (user, metric).
      const map = new Map<string, any>();
      for (const t of existingTargets) {
        const tt = String(t.target_type || "");
        const period = tt.startsWith("daily_") ? "daily" : tt.startsWith("weekly_") ? "weekly" : null;
        const base = period ? tt.slice(period.length + 1) : tt; // legacy bare rows → treated as daily
        const key = `${t.user_id}:${base}`;
        if (!map.has(key)) map.set(key, { user_id: t.user_id, target_type: base, daily_target: 0, weekly_target: 0 });
        const row = map.get(key);
        const value = Number(t.target_value) || 0;
        if (period === "weekly") row.weekly_target = value;
        else row.daily_target = value;
      }
      return Array.from(map.values());
    }
    // Default rows: one per member for 'calls'
    return profiles.map(p => ({
      user_id: p.id,
      target_type: "calls",
      daily_target: 0,
      weekly_target: 0
    }));
  });

  const updateRow = (index: number, field: string, value: any) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const addRow = () => {
    setRows([...rows, { user_id: profiles[0]?.id, target_type: "calls", daily_target: 0, weekly_target: 0 }]);
  };

  const removeRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { success, error } = await upsertTeamTargets(rows);
      if (success) {
        onClose();
        router.refresh();
      } else {
        toast.error("Error saving targets", String(error));
      }
    } catch (e) {
      console.error(e);
      toast.error("Error saving targets");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-tight">Set Team Targets</h2>
              <p className="text-xs font-medium text-slate-400">Manage daily and weekly KPIs for every member.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-slate-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Team Member</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Target Type</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Daily Target</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Weekly Target</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((row, idx) => (
                <tr key={idx} className="group">
                  <td className="px-4 py-4">
                    <select 
                      value={row.user_id}
                      onChange={e => updateRow(idx, "user_id", e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
                    >
                      {profiles.map(p => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <select 
                      value={row.target_type}
                      onChange={e => updateRow(idx, "target_type", e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
                    >
                      <option value="calls">Calls</option>
                      <option value="tasks">Tasks</option>
                      <option value="revenue">Revenue</option>
                      <option value="sites">Sites</option>
                      <option value="demos">Demos</option>
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <input 
                      type="number"
                      value={row.daily_target}
                      onChange={e => updateRow(idx, "daily_target", parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <input 
                      type="number"
                      value={row.weekly_target}
                      onChange={e => updateRow(idx, "weekly_target", parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
                    />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button onClick={() => removeRow(idx)} className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <button 
            onClick={addRow}
            className="mt-6 flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-slate-200 rounded-[1.5rem] text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-slate-400 hover:text-slate-600 transition-all group"
          >
            <Plus className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
            Add Row
          </button>
        </div>

        <div className="p-8 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/30">
          <button onClick={onClose} className="px-6 py-3 text-sm font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#42CA80] text-slate-900 px-8 py-4 rounded-[1.25rem] text-sm font-black uppercase tracking-widest hover:bg-[#3ab872] transition-all flex items-center gap-3 disabled:opacity-50 shadow-lg shadow-[#42CA80]/20"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Daily Targets
          </button>
        </div>
      </div>
    </div>
  );
}
