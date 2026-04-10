"use client";

import { useState } from "react";
import { Plus, GripVertical, CheckCircle2, Clock } from "lucide-react";
import { ContentPiece, upsertContentPiece } from "@/app/admin/growth/actions";
import ContentPostModal from "@/components/admin/growth/ContentPostModal";

interface KanbanProps {
  channel: string;
  initialPieces: ContentPiece[];
  availableTypes: { id: string; label: string; icon: string }[];
}

const COLUMNS = [
  { id: "idea", label: "Idea", bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" },
  { id: "drafted", label: "Drafted", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  { id: "ready", label: "Ready", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  { id: "published", label: "Published", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-[#42CA80]" },
];

export default function ContentKanbanBoard({ channel, initialPieces, availableTypes }: KanbanProps) {
  const [pieces, setPieces] = useState<ContentPiece[]>(initialPieces);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  
  const [modalPost, setModalPost] = useState<Partial<ContentPiece> | null>(null);

  const getColPieces = (colId: string) => pieces.filter(p => p.status === colId).sort((a, b) => {
    // Sort by scheduled date
    if (!a.scheduled_date && !b.scheduled_date) return 0;
    if (!a.scheduled_date) return 1;
    if (!b.scheduled_date) return -1;
    return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime();
  });

  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  
  const handleDrop = async (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    if (!draggedId) return;

    const piece = pieces.find(p => p.id === draggedId);
    if (!piece || piece.status === statusId) return;

    // Optimistic update
    setPieces(prev => prev.map(p => p.id === draggedId ? { ...p, status: statusId, updated_at: new Date().toISOString() } : p));
    setDraggedId(null);

    // Save
    await upsertContentPiece({
      id: draggedId,
      channel,
      status: statusId,
      published_date: statusId === "published" && !piece.published_date ? new Date().toISOString() : piece.published_date
    });
  };

  const handleSaveModal = (savedPost: ContentPiece) => {
    setPieces(prev => {
      const exists = prev.find(p => p.id === savedPost.id);
      if (exists) {
        return prev.map(p => p.id === savedPost.id ? savedPost : p);
      } else {
        return [...prev, savedPost];
      }
    });
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-6 h-[calc(100vh-280px)] min-h-[500px]">
        {COLUMNS.map(col => {
          const colPieces = getColPieces(col.id);
          return (
            <div
              key={col.id}
              className={`flex-1 min-w-[300px] max-w-md rounded-xl border border-slate-200 bg-slate-100/50 flex flex-col`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Header */}
              <div className={`px-4 py-3 flex items-center justify-between rounded-t-xl ${col.bg} border-b border-slate-200`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                  <h3 className={`text-sm font-bold uppercase tracking-wide ${col.text}`}>
                    {col.label}
                  </h3>
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/60 text-[10px] font-bold text-slate-700">
                    {colPieces.length}
                  </span>
                </div>
                <button
                  onClick={() => setModalPost({ status: col.id })}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-900 transition-colors bg-white/40"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {colPieces.map(piece => {
                  const type = availableTypes.find(t => t.id === piece.content_type) || { icon: "📝", label: "Post" };
                  const isOverdue = piece.scheduled_date && new Date(piece.scheduled_date) < new Date() && piece.status !== "published";
                  
                  return (
                    <div
                      key={piece.id}
                      draggable
                      onDragStart={() => handleDragStart(piece.id)}
                      onClick={() => setModalPost(piece)}
                      className={`group relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-[#42CA80]/50 hover:shadow-md transition-all cursor-pointer ${draggedId === piece.id ? 'opacity-50 ring-2 ring-[#42CA80] ring-offset-2' : ''}`}
                    >
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab hover:text-slate-900 active:cursor-grabbing text-slate-400">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                          {type.icon} {type.label}
                        </span>
                        {piece.status === 'published' && piece.engagement_rate > 0 && (
                          <span className="text-[10px] font-bold text-emerald-600 border border-emerald-100 bg-emerald-50 px-2 py-0.5 rounded-full">
                            {piece.engagement_rate}% Eng
                          </span>
                        )}
                      </div>
                      
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-2 pr-4">{piece.title}</h4>
                      
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 font-medium">
                        {piece.scheduled_date ? (
                          <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-bold' : ''}`}>
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(piece.scheduled_date).toLocaleDateString("en-IN", { month: "short", day: "2-digit" })}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No date</span>
                        )}
                        
                        {piece.status === "published" && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {modalPost && (
        <ContentPostModal
          post={modalPost}
          channel={channel}
          onClose={() => setModalPost(null)}
          onSave={handleSaveModal}
          availableTypes={availableTypes}
        />
      )}
    </>
  );
}
