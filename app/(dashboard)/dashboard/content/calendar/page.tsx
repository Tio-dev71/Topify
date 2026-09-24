'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, CheckCircle2, AlertCircle, X, Calendar as CalendarIcon, StickyNote } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
  addMonths,
  subMonths
} from 'date-fns';
import { vi } from 'date-fns/locale/vi';

type Post = {
  id: string;
  title: string;
  status: string;
  scheduledAt: string | null;
  createdAt: string;
  platform?: string;
  content?: string;
};

type CalendarNote = {
  id: string;
  title: string;
  content: string;
  date: string;
  color?: string;
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<Post[]>([]);
  const [notes, setNotes] = useState<CalendarNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  
  // Note Modal state
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedDateForNote, setSelectedDateForNote] = useState<Date>(new Date());
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  useEffect(() => {
    const fetchCalendarData = async () => {
      setLoading(true);
      try {
        const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
        
        const [postsRes, notesRes] = await Promise.all([
          fetch(`/api/posts?startDate=${start.toISOString()}&endDate=${end.toISOString()}&limit=500`),
          fetch(`/api/calendar-notes?startDate=${start.toISOString()}&endDate=${end.toISOString()}`)
        ]);

        if (postsRes.ok) {
          const data = await postsRes.json();
          setPosts(data.posts || []);
        }
        
        if (notesRes.ok) {
          const data = await notesRes.json();
          setNotes(data.notes || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCalendarData();
  }, [currentDate]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    setIsSubmittingNote(true);
    try {
      const res = await fetch('/api/calendar-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: noteTitle,
          content: noteContent,
          date: selectedDateForNote.toISOString(),
        }),
      });

      if (res.ok) {
        const newNote = await res.json();
        setNotes([...notes, newNote]);
        setIsNoteModalOpen(false);
        setNoteTitle('');
        setNoteContent('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const openNoteModal = (date: Date = new Date()) => {
    setSelectedDateForNote(date);
    setIsNoteModalOpen(true);
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />;
      case 'SCHEDULED':
        return <Clock className="w-3 h-3 text-blue-500 shrink-0" />;
      case 'FAILED':
      case 'PARTIAL_FAILED':
        return <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-yellow-500 shrink-0 mx-0.5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Đã xuất bản</span>;
      case 'SCHEDULED':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs rounded-full font-medium flex items-center gap-1"><Clock className="w-3 h-3"/> Đã lên lịch</span>;
      case 'PENDING_REVIEW':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs rounded-full font-medium">Chờ duyệt</span>;
      case 'FAILED':
      case 'PARTIAL_FAILED':
        return <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs rounded-full font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Thất bại</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 text-xs rounded-full font-medium">Bản nháp</span>;
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Lịch đăng bài & Note</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Xem lịch trình nội dung và thêm ghi chú</p>
        </div>
        <button 
          onClick={() => openNoteModal(new Date())}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#5B3DF5] to-[#3B82F6] text-white shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          Tạo note
        </button>
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
        {/* Calendar Header */}
        <div className="p-4 sm:p-6 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--color-foreground)] capitalize">
            Tháng {format(currentDate, 'M - yyyy', { locale: vi })}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-[var(--color-muted)] transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-[var(--color-muted)] transition-colors">
              Hôm nay
            </button>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-[var(--color-muted)] transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 border-b border-[var(--color-border)] bg-[var(--color-muted)]/30">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, i) => (
            <div key={i} className="py-3 text-center text-xs font-bold text-[var(--color-muted-foreground)]">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 auto-rows-[120px]">
          {days.map((day, i) => {
            const isSelectedMonth = isSameMonth(day, monthStart);
            const isTodayDate = isToday(day);
            const dayPosts = posts.filter(post => {
              const targetDate = post.scheduledAt ? new Date(post.scheduledAt) : new Date(post.createdAt);
              return isSameDay(targetDate, day);
            });
            const dayNotes = notes.filter(note => isSameDay(new Date(note.date), day));

            return (
              <div 
                key={day.toString()} 
                onDoubleClick={() => openNoteModal(day)}
                className={`border-b border-r border-[var(--color-border)] p-2 transition-colors flex flex-col
                  ${!isSelectedMonth ? 'bg-[var(--color-muted)]/10 opacity-50' : ''}
                  ${isTodayDate ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-[var(--color-muted)]/20'}
                  ${(i + 1) % 7 === 0 ? 'border-r-0' : ''}
                `}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                    ${isTodayDate ? 'bg-[#5B3DF5] text-white shadow-sm' : 'text-[var(--color-foreground)]'}
                  `}>
                    {format(day, dateFormat)}
                  </span>
                  {(dayPosts.length > 0 || dayNotes.length > 0) && (
                    <span className="text-[10px] font-bold text-[var(--color-muted-foreground)] px-1.5 py-0.5 rounded-full bg-[var(--color-muted)]">
                      {dayPosts.length + dayNotes.length} mục
                    </span>
                  )}
                </div>
                
                <div className="mt-1 space-y-1 overflow-y-auto flex-1 hide-scrollbar">
                  {dayPosts.map(post => (
                    <div 
                      key={post.id} 
                      onClick={() => setSelectedPost(post)}
                      className="text-[11px] bg-[var(--color-background)] border border-[var(--color-border)] rounded p-1 truncate flex items-center gap-1 cursor-pointer hover:border-[#5B3DF5]/50 hover:shadow-sm transition-all" 
                      title={post.title}
                    >
                      {getStatusIcon(post.status)}
                      <span className="truncate">{post.title}</span>
                    </div>
                  ))}
                  {dayNotes.map(note => (
                    <div 
                      key={note.id}
                      className="text-[11px] bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded p-1 truncate flex items-center gap-1 cursor-pointer hover:border-yellow-400 transition-all text-yellow-800 dark:text-yellow-200"
                      title={note.title}
                    >
                      <StickyNote className="w-3 h-3 shrink-0" />
                      <span className="truncate">{note.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedPost(null)}>
          <div className="bg-[var(--color-background)] rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-[var(--color-border)] animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 sm:p-6 border-b border-[var(--color-border)] flex items-start justify-between gap-4 bg-[var(--color-card)]">
              <div>
                <h3 className="text-xl font-bold text-[var(--color-foreground)] line-clamp-2">{selectedPost.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge(selectedPost.status)}
                </div>
              </div>
              <button 
                onClick={() => setSelectedPost(null)}
                className="p-1.5 rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[var(--color-muted)] shrink-0">
                    <CalendarIcon className="w-4 h-4 text-[var(--color-muted-foreground)]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--color-muted-foreground)]">Thời gian lên lịch</p>
                    <p className="text-sm font-medium text-[var(--color-foreground)]">
                      {selectedPost.scheduledAt 
                        ? format(new Date(selectedPost.scheduledAt), "HH:mm, dd/MM/yyyy", { locale: vi }) 
                        : "Không có (Đăng ngay)"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[var(--color-muted)] shrink-0">
                    <Clock className="w-4 h-4 text-[var(--color-muted-foreground)]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--color-muted-foreground)]">Thời gian tạo</p>
                    <p className="text-sm font-medium text-[var(--color-foreground)]">
                      {format(new Date(selectedPost.createdAt), "HH:mm, dd/MM/yyyy", { locale: vi })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-2 justify-end border-t border-[var(--color-border)]">
                <button 
                  onClick={() => setSelectedPost(null)}
                  className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-[var(--color-muted)] transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Note Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsNoteModalOpen(false)}>
          <div className="bg-[var(--color-background)] rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-[var(--color-border)] animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 sm:p-6 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-card)]">
              <h3 className="text-xl font-bold text-[var(--color-foreground)]">Tạo ghi chú mới</h3>
              <button 
                onClick={() => setIsNoteModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateNote} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Ngày</label>
                <p className="text-sm text-[var(--color-muted-foreground)] p-2 bg-[var(--color-muted)] rounded-lg">
                  {format(selectedDateForNote, "EEEE, dd/MM/yyyy", { locale: vi })}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Tiêu đề</label>
                <input 
                  type="text" 
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-foreground)] focus:ring-2 focus:ring-[#5B3DF5]/50 focus:border-[#5B3DF5] transition-all"
                  placeholder="Ví dụ: Kế hoạch tuần tới"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Nội dung</label>
                <textarea 
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-foreground)] focus:ring-2 focus:ring-[#5B3DF5]/50 focus:border-[#5B3DF5] transition-all min-h-[100px] resize-y"
                  placeholder="Nhập nội dung ghi chú..."
                />
              </div>

              <div className="pt-4 flex gap-2 justify-end border-t border-[var(--color-border)]">
                <button 
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-[var(--color-muted)] transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={isSubmittingNote || !noteTitle.trim()}
                  className="px-4 py-2 text-sm font-medium rounded-xl bg-[#5B3DF5] text-white hover:bg-[#5B3DF5]/90 transition-colors disabled:opacity-50"
                >
                  {isSubmittingNote ? "Đang lưu..." : "Lưu ghi chú"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

