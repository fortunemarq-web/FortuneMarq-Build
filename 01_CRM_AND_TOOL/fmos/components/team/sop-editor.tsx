"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, Save, Loader2 } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
        <div>
            <Label>Procedure Title</Label>
            <Input
                name="title"
                defaultValue={sop?.title}
                required
                placeholder="e.g. Weekly Client SEO Reporting"
            />
        </div>
        <div>
            <Label>Category</Label>
            <Select
                name="category"
                defaultValue={sop?.category || "Website Delivery"}
            >
                <option>Sales & Outreach</option>
                <option>Website Delivery</option>
                <option>Client Onboarding</option>
                <option>Monthly Reporting</option>
                <option>Social Media</option>
                <option>Finance</option>
            </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <Label>Tools Required</Label>
            <Input
                name="tools"
                defaultValue={sop?.tools_required}
                placeholder="e.g. Screaming Frog, Google Search Console"
            />
        </div>
        <div>
            <Label>Estimated Time (mins)</Label>
            <Input
                name="mins"
                type="number"
                defaultValue={sop?.estimated_minutes}
                placeholder="60"
                className="tabular-nums"
            />
        </div>
      </div>

      <div className="space-y-4 pt-6">
        <Label>Step-by-Step Instructions</Label>

        <div className="space-y-4">
            {steps.map((step, idx) => (
                <div key={idx} className="flex gap-4 group">
                    <div className="flex-none pt-2">
                        <div className="h-8 w-8 rounded-full bg-brand-soft flex items-center justify-center text-xs font-semibold text-brand-deep tabular-nums">
                            {step.step_number}
                        </div>
                    </div>
                    <div className="flex-1 relative">
                        <Textarea
                            value={step.instruction}
                            onChange={(e) => updateStep(idx, e.target.value)}
                            placeholder="Describe what needs to be done in this step..."
                            rows={2}
                            className="resize-none pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => removeStep(idx)}
                            className="absolute right-3 top-2.5 p-1 text-slate-700 hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
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
            className="w-full py-3 border border-dashed border-line-strong rounded-lg text-xs font-semibold text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center gap-2"
        >
            <Plus className="h-4 w-4" />
            Add Step
        </button>
      </div>

      <div className="pt-10 border-t border-line">
        <Button type="submit" size="lg" disabled={isSaving} className="w-full">
          {isSaving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Save className="h-5 w-5" />
              Save Standard Procedure
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
