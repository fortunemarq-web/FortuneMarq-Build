"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { ContentPiece } from "@/app/admin/growth/actions";
import ContentPostModal from "@/components/admin/growth/ContentPostModal";
import { getContentTypeIcon } from "@/components/admin/growth/content-type-icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CalendarProps {
  channel: string;
  initialPieces: ContentPiece[];
  availableTypes: { id: string; label: string; icon?: string }[];
}

export default function ContentCalendar({ channel, initialPieces, availableTypes }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [pieces, setPieces] = useState<ContentPiece[]>(initialPieces);
  const [modalPost, setModalPost] = useState<Partial<ContentPiece> | null>(null);

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  const daysInMonth = endOfMonth.getDate();
  const firstDayOfWeek = startOfMonth.getDay(); // 0 is Sunday

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Build calendar matrix
  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), i).toISOString().split("T")[0];
    const dayPieces = pieces.filter(p => p.scheduled_date && p.scheduled_date.startsWith(dateStr));
    days.push({ day: i, dateStr, pieces: dayPieces });
  }

  const handleSaveModal = (savedPost: ContentPiece) => {
    setPieces(prev => {
      const exists = prev.find(p => p.id === savedPost.id);
      if (exists) return prev.map(p => p.id === savedPost.id ? savedPost : p);
      return [...prev, savedPost];
    });
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-brand-soft text-brand-deep border-brand-line';
      case 'ready': return 'bg-warn-soft text-warn border-warn-line';
      case 'drafted': return 'bg-info-soft text-info border-info-line';
      default: return 'bg-slate-100 text-slate-600 border-line';
    }
  };

  return (
    <>
      <Card className="overflow-hidden flex flex-col">
        <div className="flex items-center justify-between border-b border-line px-5 py-4 bg-slate-50">
          <div className="flex items-center gap-4">
            <h3 className="font-display text-[15px] font-semibold text-slate-900">
              Content Calendar
            </h3>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 bg-surface border border-line rounded-lg px-3 py-1.5">
              <button onClick={prevMonth} className="hover:text-brand-deep transition-colors"><ChevronLeft className="h-4 w-4" /></button>
              <span className="min-w-[120px] text-center">
                {currentDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </span>
              <button onClick={nextMonth} className="hover:text-brand-deep transition-colors"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>

          <Button
            onClick={() => setModalPost({ scheduled_date: new Date().toISOString() })}
            variant="primary"
            size="sm"
          >
            <Plus className="h-3.5 w-3.5" /> Post
          </Button>
        </div>

        <div className="grid grid-cols-7 border-b border-line bg-slate-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500 border-r border-line last:border-0">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 bg-slate-100 gap-[1px]">
          {days.map((dayObj, i) => (
            <div key={i} className={`min-h-[120px] bg-surface p-2 flex flex-col ${!dayObj ? 'opacity-50 bg-slate-50 relative' : 'relative group'}`}>
              {dayObj && (
                <>
                  <span className={`text-xs font-semibold ${
                    dayObj.dateStr === new Date().toISOString().split("T")[0]
                      ? 'flex h-5 w-5 items-center justify-center rounded-full bg-brand-deep text-white'
                      : 'text-slate-400'
                  }`}>
                    {dayObj.day}
                  </span>

                  <button
                    onClick={() => setModalPost({ scheduled_date: dayObj.dateStr })}
                    className="absolute top-2 right-2 p-1 rounded-md text-slate-300 hover:bg-slate-100 hover:text-brand-deep opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Plus className="h-3 w-3" />
                  </button>

                  <div className="mt-2 space-y-1.5 flex-1 overflow-y-auto pr-1">
                    {dayObj.pieces.map((p: any) => {
                      const TypeIcon = getContentTypeIcon(p.content_type);
                      return (
                        <div
                          key={p.id}
                          onClick={() => setModalPost(p)}
                          className={`flex items-center gap-1 text-[11px] font-semibold leading-tight rounded-md px-1.5 py-1 cursor-pointer border hover:opacity-80 transition-all ${statusColor(p.status)}`}
                          title={p.title}
                        >
                          <TypeIcon className="h-3 w-3 shrink-0" />
                          <span className="truncate">{p.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </Card>

      {modalPost && (
        <ContentPostModal
          post={modalPost}
          channel={channel}
          onClose={() => setModalPost(null)}
          onSave={handleSaveModal}
          onDelete={(id) => setPieces(prev => prev.filter(p => p.id !== id))}
          availableTypes={availableTypes}
        />
      )}
    </>
  );
}
