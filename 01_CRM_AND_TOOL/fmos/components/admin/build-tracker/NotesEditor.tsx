"use client";

import { useState, useTransition, useRef } from "react";
import { updateModuleNotes } from "@/app/admin/build-tracker/actions";
import { Loader2, Pencil } from "lucide-react";

interface NotesEditorProps {
  id: string;
  initialNotes: string | null;
}

export default function NotesEditor({ id, initialNotes }: NotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    setIsEditing(false);
    startTransition(async () => {
      await updateModuleNotes(id, notes);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setNotes(initialNotes ?? "");
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none ring-2 ring-[#42CA80]/30 focus:border-[#42CA80]"
        placeholder="Add a note..."
        maxLength={200}
      />
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="group flex min-h-[28px] w-full items-center gap-1.5 rounded-lg px-2 py-1 text-left text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
      title={notes || "Click to add notes"}
    >
      {isPending ? (
        <Loader2 className="h-3 w-3 animate-spin flex-shrink-0 text-slate-400" />
      ) : (
        <Pencil className="h-3 w-3 flex-shrink-0 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
      <span className="truncate max-w-[180px]">
        {notes || (
          <span className="italic text-slate-300 group-hover:text-slate-400">
            Add note...
          </span>
        )}
      </span>
    </button>
  );
}
