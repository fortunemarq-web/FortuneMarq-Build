"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, Save, Loader2 } from "lucide-react";
import clsx from "clsx";

interface SopEditorProps {
  sop: any;
  onSave: (formData: FormData) => Promise<void>;
}

export default function SopEditor({ sop, onSave }: SopEditorProps) {
  const [steps, setSteps] = useState<any[]>(
    sop?.steps || [{ step_number: 1, instruction: "" }]
  );
  const [isSaving, setIsSaving] = useState(false);

  const addStep = () => {
    setSteps([...steps, { step_number: steps.length + 1, instruction: "" }]);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index).map((s, i) => ({
        ...s,
        step_number: i + 1
    }));
    setSteps(newSteps);
  };

  const updateStep = (index: number, text: string) => {
    const newSteps = [...steps];
    newSteps[index].instruction = text;
    setSteps(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    formData.append("steps", JSON.stringify(steps));
    await onSave(formData);
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Procedure Title</label>
            <input 
                name="title"
                defaultValue={sop?.title}
                required
                placeholder="e.g. Weekly Client SEO Reporting"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
            />
        </div>
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Category</label>
            <select 
                name="category"
                defaultValue={sop?.category || "Website Delivery"}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all outline-none cursor-pointer appearance-none"
            >
                <option>Sales & Outreach</option>
                <option>Website Delivery</option>
                <option>Client Onboarding</option>
                <option>Monthly Reporting</option>
                <option>Social Media</option>
                <option>Finance</option>
            </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Tools Required</label>
            <input 
                name="tools"
                defaultValue={sop?.tools_required}
                placeholder="e.g. Screaming Frog, Google Search Console"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
            />
        </div>
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Estimated Time (mins)</label>
            <input 
                name="mins"
                type="number"
                defaultValue={sop?.estimated_minutes}
                placeholder="60"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
            />
        </div>
      </div>

      <div className="space-y-4 pt-6">
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Step-by-Step Instructions</label>
        
        <div className="space-y-4">
            {steps.map((step, idx) => (
                <div key={idx} className="flex gap-4 group">
                    <div className="flex-none pt-4">
                        <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-black text-white">
                            {step.step_number}
                        </div>
                    </div>
                    <div className="flex-1 relative">
                        <textarea 
                            value={step.instruction}
                            onChange={(e) => updateStep(idx, e.target.value)}
                            placeholder="Describe what needs to be done in this step..."
                            rows={2}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all outline-none resize-none"
                        />
                        <button 
                            type="button"
                            onClick={() => removeStep(idx)}
                            className="absolute right-4 top-4 p-1 text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            ))}
        </div>

        <button 
            type="button"
            onClick={addStep}
            className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black text-slate-400 uppercase tracking-widest hover:border-slate-400 hover:text-slate-600 transition-all flex items-center justify-center gap-2"
        >
            <Plus className="h-4 w-4" />
            Add Step
        </button>
      </div>

      <div className="pt-10 border-t border-slate-100">
        <button 
          type="submit"
          disabled={isSaving}
          className="w-full bg-[#42CA80] text-slate-900 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-[#3ab872] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-[#42CA80]/20"
        >
          {isSaving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Save className="h-5 w-5" />
              Save Standard Procedure
            </>
          )}
        </button>
      </div>
    </form>
  );
}
