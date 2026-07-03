"use client";

import { Clock, FileText, ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";

interface SopCardProps {
  sop: any;
}

export default function SopCard({ sop }: SopCardProps) {
  const stepsCount = Array.isArray(sop.steps) ? sop.steps.length : (JSON.parse(sop.steps || '[]')).length;

  return (
    <div className="bg-surface rounded-[2rem] p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all group relative overflow-hidden">
      {/* Category Accent */}
      <div className="absolute top-0 right-0 p-4">
        <div className="bg-slate-50 border border-slate-100 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{sop.category}</span>
        </div>
      </div>

      <div className="flex flex-col h-full">
        <div className="mb-6">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors leading-tight">
                {sop.title}
            </h3>
        </div>

        <div className="mt-auto space-y-4">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600">{stepsCount} steps</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600">{sop.estimated_minutes} mins</span>
                </div>
            </div>

            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Last updated {new Date(sop.updated_at).toLocaleDateString()}
                </span>
                <Link 
                    href={`/admin/team/sops/${sop.id}`}
                    className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#141613] group-hover:text-white transition-all shadow-sm"
                >
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
}
