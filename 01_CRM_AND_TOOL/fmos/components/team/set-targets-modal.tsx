"use client";

import { useState } from "react";
import { X, Save, Plus, Trash2, Loader2, Target } from "lucide-react";
import { upsertTeamTargets } from "@/app/admin/team/actions";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-surface rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-line shadow-lg">
        <div className="flex items-center justify-between px-6 py-5 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-warn-soft text-warn">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900 leading-tight">Set Team Targets</h2>
              <p className="text-xs text-slate-500">Manage daily and weekly KPIs for every member.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Team Member</TH>
                <TH>Target Type</TH>
                <TH>Daily Target</TH>
                <TH>Weekly Target</TH>
                <TH></TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((row, idx) => (
                <TR key={idx} className="group">
                  <TD>
                    <Select
                      value={row.user_id}
                      onChange={e => updateRow(idx, "user_id", e.target.value)}
                    >
                      {profiles.map(p => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                    </Select>
                  </TD>
                  <TD>
                    <Select
                      value={row.target_type}
                      onChange={e => updateRow(idx, "target_type", e.target.value)}
                    >
                      <option value="calls">Calls</option>
                      <option value="tasks">Tasks</option>
                      <option value="revenue">Revenue</option>
                      <option value="sites">Sites</option>
                      <option value="demos">Demos</option>
                    </Select>
                  </TD>
                  <TD>
                    <Input
                      type="number"
                      value={row.daily_target}
                      onChange={e => updateRow(idx, "daily_target", parseInt(e.target.value) || 0)}
                      className="tabular-nums"
                    />
                  </TD>
                  <TD>
                    <Input
                      type="number"
                      value={row.weekly_target}
                      onChange={e => updateRow(idx, "weekly_target", parseInt(e.target.value) || 0)}
                      className="tabular-nums"
                    />
                  </TD>
                  <TD className="text-right">
                    <button onClick={() => removeRow(idx)} className="p-2 text-slate-300 hover:text-danger hover:bg-danger-soft rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>

          <button
            onClick={addRow}
            className="mt-6 flex items-center justify-center gap-2 w-full py-3 border border-dashed border-line-strong rounded-lg text-xs font-semibold text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Row
          </button>
        </div>

        <div className="p-6 border-t border-line flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Daily Targets
          </Button>
        </div>
      </div>
    </div>
  );
}
