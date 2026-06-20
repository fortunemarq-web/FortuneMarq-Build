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
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

// Priority collapses to the five-tone scale.
const PRIORITY_CONFIG: Record<string, { label: string; tone: Tone }> = {
  high: { label: "High", tone: "danger" },
  medium: { label: "Medium", tone: "warning" },
  low: { label: "Low", tone: "neutral" },
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

  const totalCount = moduleList.length;
  const doneCount = moduleList.filter((m) => m.status === "done").length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const handleStatusChange = (id: string, newStatus: ModuleStatus) => {
    setModuleList((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
    );
  };

  return (
    <Card className="overflow-hidden">
      {/* System Header */}
      <div className="px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="font-display text-lg font-semibold text-slate-900 tracking-tight">
                {systemName}
              </h2>
              <span className="text-2xl font-semibold tabular-nums text-brand-deep">
                {pct}%
              </span>
              <span className="text-sm text-slate-500">
                {doneCount} of {totalCount} done
              </span>
            </div>
            {/* Progress Bar */}
            <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-brand"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
          <button
            onClick={() => setIsCollapsed((c) => !c)}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-line text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
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
        <div className="border-t border-line">
          <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <THead>
                <TR className="hover:bg-transparent">
                  <TH className="w-full">Module</TH>
                  <TH className="whitespace-nowrap">Status</TH>
                  <TH className="whitespace-nowrap">Priority</TH>
                  <TH className="w-52">Notes</TH>
                  <TH className="whitespace-nowrap">Updated</TH>
                </TR>
              </THead>
              <TBody>
                {moduleList.map((mod) => {
                  const pri =
                    PRIORITY_CONFIG[mod.priority] ?? PRIORITY_CONFIG.medium;
                  return (
                    <TR
                      key={mod.id}
                      className={`group ${
                        mod.status === "done" ? "opacity-60" : ""
                      }`}
                    >
                      <TD>
                        <span
                          className={`text-sm font-medium ${
                            mod.status === "done"
                              ? "line-through text-slate-400"
                              : "text-slate-800"
                          }`}
                        >
                          {mod.module_name}
                        </span>
                      </TD>
                      <TD>
                        <StatusBadge
                          id={mod.id}
                          initialStatus={mod.status}
                          onStatusChange={(s) =>
                            handleStatusChange(mod.id, s)
                          }
                        />
                      </TD>
                      <TD>
                        <Badge tone={pri.tone} variant="outline" size="sm">
                          {pri.label}
                        </Badge>
                      </TD>
                      <TD>
                        <NotesEditor
                          id={mod.id}
                          initialNotes={mod.notes}
                        />
                      </TD>
                      <TD className="text-xs text-slate-400 whitespace-nowrap">
                        {mod.last_updated
                          ? new Date(mod.last_updated).toLocaleDateString(
                              "en-IN",
                              { day: "2-digit", month: "short" }
                            )
                          : "—"}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </div>

          {/* Add Module */}
          <div className="px-6 pb-4">
            <AddModuleModal systemId={systemId} systemName={systemName} />
          </div>
        </div>
      )}
    </Card>
  );
}
