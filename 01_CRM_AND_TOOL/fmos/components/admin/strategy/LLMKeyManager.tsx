"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, Key, Settings2, Code, ArrowRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { ANTHROPIC_MODELS } from "@/lib/ai-models";

export default function LLMKeyManager() {
  const [key, setKey] = useState("");
  const [model, setModel] = useState<string>(ANTHROPIC_MODELS.smart);
  const [saved, setSaved] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const sessionKey = sessionStorage.getItem("ANTHROPIC_API_KEY");
    if (sessionKey) {
      setKey(sessionKey);
      setSaved(true);
    }
    const sessionModel = sessionStorage.getItem("ANTHROPIC_MODEL");
    if (sessionModel) {
      setModel(sessionModel);
    }
  }, []);

  const handleSave = () => {
    sessionStorage.setItem("ANTHROPIC_API_KEY", key);
    sessionStorage.setItem("ANTHROPIC_MODEL", model);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    sessionStorage.removeItem("ANTHROPIC_API_KEY");
    setKey("");
    setSaved(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
          <Settings2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Step 2: LLM Configuration</h2>
          <p className="text-[11px] font-semibold text-slate-500 max-w-sm mt-0.5">
            Key is stored exclusively in your browser session storage. It is never sent to our servers.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5 flex items-center justify-between">
            Anthropic API Key
            {key && (
              <button onClick={() => setIsVisible(!isVisible)} className="text-[10px] text-[#42CA80] hover:underline">
                {isVisible ? 'Hide' : 'Show'}
              </button>
            )}
          </label>
          <div className="relative flex items-center">
            <Key className="absolute left-3 h-4 w-4 text-slate-400" />
            <input 
              type={isVisible ? "text" : "password"}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="w-full pl-9 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:border-indigo-400 focus:outline-none"
            />
            {key && (
              <button 
                onClick={handleClear}
                className="absolute right-3 p-1 rounded hover:bg-slate-200 text-slate-400"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="w-full sm:w-1/2">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Model</label>
            <div className="relative flex items-center">
              <Code className="absolute left-3 h-4 w-4 text-slate-400" />
              <select 
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:border-indigo-400 focus:outline-none appearance-none"
              >
                <option value={ANTHROPIC_MODELS.smart}>Claude Sonnet 4.6 (recommended)</option>
                <option value={ANTHROPIC_MODELS.fast}>Claude Haiku 4.5 (faster, cheaper)</option>
              </select>
            </div>
          </div>
          
          <button 
            onClick={handleSave}
            disabled={!key}
            className={`w-full sm:w-1/2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors
              ${saved 
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 pointer-events-none' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'}`}
          >
            {saved ? 'Saved to Session ✓' : 'Save Key'}
          </button>
        </div>
      </div>
    </div>
  );
}
