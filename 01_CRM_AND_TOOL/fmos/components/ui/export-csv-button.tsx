"use client";

import { Download } from "lucide-react";
import { toast } from "@/components/ui/toast";

interface ExportCsvButtonProps {
  /** Rows to export — plain objects; keys of `columns` are picked out */
  rows: Record<string, any>[];
  /** column key → CSV header label */
  columns: Record<string, string>;
  filename: string;
  label?: string;
  className?: string;
}

function csvEscape(v: any): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * Client-side CSV export for already-fetched table data.
 * No server round-trip; works on any page that has the rows in props.
 */
export default function ExportCsvButton({ rows, columns, filename, label = "Export CSV", className }: ExportCsvButtonProps) {
  const handleExport = () => {
    if (!rows || rows.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    const keys = Object.keys(columns);
    const header = keys.map((k) => csvEscape(columns[k])).join(",");
    const body = rows
      .map((r) => keys.map((k) => csvEscape(r[k])).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + header + "\n" + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported", `${rows.length} rows → ${a.download}`);
  };

  return (
    <button
      onClick={handleExport}
      className={
        className ??
        "flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
      }
    >
      <Download className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
