import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  CheckCircle2, 
  Calendar as CalendarIcon, 
  StickyNote,
  Trash2,
  X,
  ExternalLink
} from 'lucide-react';
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
import { toast } from 'sonner';
import api from '../lib/axios';

interface CalendarPost {
  id: string;
  title: string;
  status: string;
  scheduledAt: string | null;
  createdAt: string;
  platform?: string;
  content?: string;
}

interface CalendarNote {
  id: string;
  title: string;
  content: string;
  date: string;
  color?: string;
}

export default function CalendarView() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [notes, setNotes] = useState<CalendarNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: '', content: '', date: format(new Date(), 'yyyy-MM-dd'), color: '#5B3DF5' });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const monthStr = format(currentDate, 'yyyy-MM');
      const startIso = startDate.toISOString();
      const endIso = endDate.toISOString();
      const [postsRes, notesRes] = await Promise.all([
        api.get(`/posts/calendar?month=${monthStr}&start=${startIso}&end=${endIso}`),
        api.get(`/calendar/notes?month=${monthStr}&start=${startIso}&end=${endIso}`)
      ]);

      if (postsRes.data) {
        const rawList = postsRes.data.posts || postsRes.data.events || (Array.isArray(postsRes.data) ? postsRes.data : []);
        const formatted: CalendarPost[] = rawList.map((p: any) => ({
          id: p.id,
          title: p.title || p.caption?.substring(0, 50) || 'Chưa có tiêu đề',
          status: p.status,
          scheduledAt: p.scheduledAt || p.start || null,
          createdAt: p.createdAt || p.scheduledAt || p.start || new Date().toISOString(),
          platform: Array.isArray(p.platforms) ? p.platforms.join(', ') : p.platform,
          content: p.caption || p.content || '',
        }));
        setPosts(formatted);
      }
      if (notesRes.data) {
        setNotes(notesRes.data.notes || []);
      }
    } catch {
      // Fallback: fetch from general posts if calendar endpoint is filtered
      try {
        const res = await api.get('/posts');
        if (res.data) {
          const rawList = Array.isArray(res.data) ? res.data : res.data.posts || [];
          const formatted: CalendarPost[] = rawList.map((p: any) => ({
            id: p.id,
            title: p.title || p.caption?.substring(0, 50) || 'Chưa có tiêu đề',
            status: p.status,
            scheduledAt: p.scheduledAt || p.publishedAt || null,
            createdAt: p.createdAt,
            platform: Array.isArray(p.platforms) ? p.platforms.map((pl: any) => pl.platform || pl).join(', ') : p.platform,
            content: p.caption || '',
          }));
          setPosts(formatted);
        }
      } catch (e) {
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/calendar/notes', noteForm);
      if (res.data) {
        setNotes([res.data, ...notes]);
        setIsNoteModalOpen(false);
        setNoteForm({ title: '', content: '', date: format(new Date(), 'yyyy-MM-dd'), color: '#5B3DF5' });
        toast.success('Đã thêm ghi chú lịch thành công');
      }
    } catch {
      // Local fallback
      const localNote: CalendarNote = {
        id: Date.now().toString(),
        ...noteForm
      };
      setNotes([localNote, ...notes]);
      setIsNoteModalOpen(false);
      toast.success('Đã lưu ghi chú');
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await api.delete(`/calendar/notes/${id}`);
    } catch {}
    setNotes(notes.filter(n => n.id !== id));
    toast.success('Đã xóa ghi chú');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Lịch nội dung & Kế hoạch xuất bản (F021)</h1>
          <p className="text-sm text-gray-500 mt-1">Lập kế hoạch phân bổ bài viết trực quan theo tuần và tháng trên toàn bộ mạng xã hội</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNoteModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1.5"
          >
            <StickyNote className="w-4 h-4 text-amber-500" />
            <span>Thêm Ghi Chú</span>
          </button>
          <button
            onClick={() => navigate('/create')}
            className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Lên Lịch Bài Mới</span>
          </button>
        </div>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-gray-900 capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: vi })}
            </h2>
            <p className="text-xs text-gray-400">
              {posts.filter(p => {
                const target = p.scheduledAt || (p as any).start;
                return target && isSameMonth(new Date(target), monthStart);
              }).length} bài viết đã xếp lịch trong tháng này
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600"
            title="Tháng trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700"
          >
            Hôm nay
          </button>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600"
            title="Tháng sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/70 text-center text-[11px] font-bold text-gray-500 py-2.5">
          <span>Thứ 2</span>
          <span>Thứ 3</span>
          <span>Thứ 4</span>
          <span>Thứ 5</span>
          <span>Thứ 6</span>
          <span className="text-indigo-600">Thứ 7</span>
          <span className="text-rose-600">Chủ Nhật</span>
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-gray-100 min-h-[500px]">
          {calendarDays.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isCurrentDay = isToday(day);
            const dayPosts = posts.filter(p => {
              const targetDate = p.scheduledAt || (p as any).start;
              return targetDate && isSameDay(new Date(targetDate), day);
            });
            const dayNotes = notes.filter(n => isSameDay(new Date(n.date), day));

            return (
              <div
                key={idx}
                className={`p-2 min-h-[90px] flex flex-col justify-between transition-colors ${
                  !isCurrentMonth ? 'bg-gray-50/40 text-gray-300' : 'bg-white'
                } ${isCurrentDay ? 'bg-indigo-50/20' : ''}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center ${
                      isCurrentDay
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : isCurrentMonth
                        ? 'text-gray-700'
                        : 'text-gray-400'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {(dayPosts.length > 0 || dayNotes.length > 0) && (
                    <span className="text-[10px] font-bold text-gray-400">
                      {dayPosts.length + dayNotes.length}
                    </span>
                  )}
                </div>

                {/* Day content */}
                <div className="space-y-1 overflow-y-auto max-h-[85px] pr-0.5">
                  {dayNotes.map(note => (
                    <div
                      key={note.id}
                      className="p-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-medium flex items-center justify-between group"
                    >
                      <span className="truncate">{note.title}</span>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="opacity-0 group-hover:opacity-100 text-amber-700 hover:text-rose-600"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}

                  {dayPosts.map(post => {
                    const postTime = post.scheduledAt || (post as any).start;
                    const timeFormatted = postTime ? format(new Date(postTime), 'HH:mm') : null;

                    return (
                      <div
                        key={post.id}
                        onClick={() => setSelectedPost(post)}
                        className={`p-1.5 rounded-md text-[10px] font-medium truncate cursor-pointer transition flex items-center gap-1 ${
                          post.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                            : post.status === 'SCHEDULED'
                            ? 'bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        title={`${timeFormatted ? `[${timeFormatted}] ` : ''}${post.title}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                        {timeFormatted && (
                          <span className="font-mono text-[9px] font-bold opacity-80 flex-shrink-0">
                            {timeFormatted}
                          </span>
                        )}
                        <span className="truncate">{post.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Note Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5 border border-gray-100 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900">Thêm Ghi Chú Lịch</h3>
              <button onClick={() => setIsNoteModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateNote} className="space-y-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Tiêu đề ghi chú *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Họp duyệt video tuần 1"
                  value={noteForm.title}
                  onChange={e => setNoteForm({ ...noteForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Ngày diễn ra</label>
                <input
                  type="date"
                  required
                  value={noteForm.date}
                  onChange={e => setNoteForm({ ...noteForm, date: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 rounded-xl font-semibold"
                >
                  Lưu Ghi Chú
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5 border border-gray-100 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900">Chi tiết bài đăng</h3>
              <button onClick={() => setSelectedPost(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <span className="font-bold text-gray-500 block mb-0.5">Tiêu đề:</span>
                <p className="font-bold text-sm text-gray-900">{selectedPost.title}</p>
              </div>
              <div>
                <span className="font-bold text-gray-500 block mb-0.5">Trạng thái:</span>
                <span className={`inline-flex px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                  selectedPost.status === 'PUBLISHED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : selectedPost.status === 'SCHEDULED'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {selectedPost.status === 'PUBLISHED' ? 'Đã xuất bản' : selectedPost.status === 'SCHEDULED' ? 'Đã lên lịch' : selectedPost.status}
                </span>
              </div>
              {selectedPost.scheduledAt && (
                <div>
                  <span className="font-bold text-gray-500 block mb-0.5">Thời gian lên lịch:</span>
                  <p className="font-mono text-indigo-600 font-semibold">
                    {format(new Date(selectedPost.scheduledAt), 'HH:mm - dd/MM/yyyy')}
                  </p>
                </div>
              )}
              {selectedPost.platform && (
                <div>
                  <span className="font-bold text-gray-500 block mb-0.5">Nền tảng:</span>
                  <p className="text-gray-700 font-medium">{selectedPost.platform}</p>
                </div>
              )}
              {selectedPost.content && (
                <div>
                  <span className="font-bold text-gray-500 block mb-0.5">Nội dung:</span>
                  <p className="p-3 bg-gray-50 rounded-xl text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {selectedPost.content}
                  </p>
                </div>
              )}
            </div>
            <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
              <button
                onClick={() => navigate('/posts')}
                className="text-indigo-600 hover:underline font-semibold inline-flex items-center gap-1"
              >
                <span>Xem trong Quản lý bài viết</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSelectedPost(null)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
