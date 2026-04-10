"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import StatusBadge from "./StatusBadge";
import NotesEditor from "./NotesEditor";
import AddModuleModal from "./AddModuleModal";
import type {
  BuildTrackerModule,
  ModuleStatus,
} from "@/app/admin/build-tracker/actions";
import { ChevronDown, ChevronUp } from "lucide-react";

const PRIORITY_CONFIG = {
  high: { label: "High", color: "text-red-600 bg-red-50 border-red-200" },
  medium: {
    label: "Medium",
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
  low: { label: "Low", color: "text-slate-500 bg-slate-50 border-slate-200" },
};

const SYSTEM_ACCENT: Record<number, { border: string; bar: string; text: string }> = {
  1: { border: "border-t-[#42CA80]", bar: "bg-[#42CA80]", text: "text-[#42CA80]" },
  2: { border: "border-t-blue-500", bar: "bg-blue-500", text: "text-blue-600" },
  3: { border: "border-t-purple-500", bar: "bg-purple-500", text: "text-purple-600" },
};

interface SystemCardProps {
  systemId: number;
  systemName: string;
  modules: BuildTrackerModule[];
}

export default function SystemCard({
  systemId,
  systemName,
  modules,
}: SystemCardProps) {
  const [moduleList, setModuleList] = useState(modules);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const accent = SYSTEM_ACCENT[systemId] ?? SYSTEM_ACCENT[1];

  const totalCount = moduleList.length;
  const doneCount = moduleList.filter((m) => m.status === "done").length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const handleStatusChange = (id: string, newStatus: ModuleStatus) => {
    setModuleList((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
    );
  };

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-t-4 ${accent.border}`}
    >
      {/* System Header */}
      <div className="px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {systemName}
              </h2>
              <span
                className={`text-2xl font-mono font-black tabular-nums ${accent.text}`}
              >
                {pct}%
              </span>
              <span className="text-sm text-slate-500">
                {doneCount} of {totalCount} done
              </span>
            </div>
            {/* Progress Bar */}
            <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${accent.bar}`}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
          <button
            onClick={() => setIsCollapsed((c) => !c)}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Table */}
      {!isCollapsed && (
        <div className="border-t border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-full">
                    Module
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
                    Priority
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-52">
                    Notes
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {moduleList.map((mod) => {
                  const pri =
                    PRIORITY_CONFIG[mod.priority] ?? PRIORITY_CONFIG.medium;
                  return (
                    <tr
                      key={mod.id}
                      className={`group transition-colors hover:bg-slate-50/80 ${
                        mod.status === "done" ? "opacity-60" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`text-sm font-medium ${
                            mod.status === "done"
                              ? "line-through text-slate-400"
                              : "text-slate-800"
                          }`}
                        >
                          {mod.module_name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          id={mod.id}
                          initialStatus={mod.status}
                          onStatusChange={(s) =>
                            handleStatusChange(mod.id, s)
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${pri.color}`}
                        >
                          {pri.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <NotesEditor
                          id={mod.id}
                          initialNotes={mod.notes}
                        />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {mod.last_updated
                          ? new Date(mod.last_updated).toLocaleDateString(
                              "en-IN",
                              { day: "2-digit", month: "short" }
                            )
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add Module */}
          <div className="px-6 pb-4">
            <AddModuleModal systemId={systemId} systemName={systemName} />
          </div>
        </div>
      )}
    </div>
  );
}
