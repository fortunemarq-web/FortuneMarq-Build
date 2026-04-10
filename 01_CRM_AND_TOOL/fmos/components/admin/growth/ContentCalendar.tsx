"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { ContentPiece } from "@/app/admin/growth/actions";
import ContentPostModal from "@/components/admin/growth/ContentPostModal";

interface CalendarProps {
  channel: string;
  initialPieces: ContentPiece[];
  availableTypes: { id: string; label: string; icon: string }[];
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
      case 'published': return 'bg-emerald-500 text-white border-emerald-600';
      case 'ready': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'drafted': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">
              Content Calendar
            </h3>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
              <button onClick={prevMonth} className="hover:text-[#42CA80] transition-colors"><ChevronLeft className="h-4 w-4" /></button>
              <span className="min-w-[120px] text-center">
                {currentDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </span>
              <button onClick={nextMonth} className="hover:text-[#42CA80] transition-colors"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
          
          <button 
            onClick={() => setModalPost({ scheduled_date: new Date().toISOString() })}
            className="flex items-center gap-1.5 rounded-lg bg-[#42CA80] px-3 py-2 text-xs font-semibold text-white hover:bg-[#38b571] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Post
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/80">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-2 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500 border-r border-slate-100 last:border-0">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 bg-slate-100 gap-[1px]">
          {days.map((dayObj, i) => (
            <div key={i} className={`min-h-[120px] bg-white p-2 flex flex-col ${!dayObj ? 'opacity-50 bg-slate-50 relative' : 'relative group'}`}>
              {dayObj && (
                <>
                  <span className={`text-xs font-bold ${
                    dayObj.dateStr === new Date().toISOString().split("T")[0] 
                      ? 'flex h-5 w-5 items-center justify-center rounded-full bg-[#42CA80] text-white' 
                      : 'text-slate-400'
                  }`}>
                    {dayObj.day}
                  </span>
                  
                  <button 
                    onClick={() => setModalPost({ scheduled_date: dayObj.dateStr })}
                    className="absolute top-2 right-2 p-1 rounded-md text-slate-300 hover:bg-slate-100 hover:text-[#42CA80] opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Plus className="h-3 w-3" />
                  </button>

                  <div className="mt-2 space-y-1.5 flex-1 overflow-y-auto pr-1">
                    {dayObj.pieces.map((p: any) => {
                      const type = availableTypes.find(t => t.id === p.content_type) || { icon: "📝" };
                      return (
                        <div 
                          key={p.id} 
                          onClick={() => setModalPost(p)}
                          className={`text-[10px] font-semibold leading-tight rounded-md px-1.5 py-1 cursor-pointer border hover:opacity-80 transition-all truncate ${statusColor(p.status)}`}
                          title={p.title}
                        >
                          <span className="mr-1">{type.icon}</span> {p.title}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
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
