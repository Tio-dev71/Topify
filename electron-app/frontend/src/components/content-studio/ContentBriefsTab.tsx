import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Calendar,
  X,
  ArrowRight,
  Target,
  Users,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';

export interface ContentBrief {
  id: string;
  title: string;
  objective?: string | null;
  audience?: string | null;
  keyMessage?: string | null;
  cta?: string | null;
  deadline?: string | null;
  notes?: string | null;
  status: 'DRAFT' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
  createdBy?: { name: string | null; email: string } | null;
}

export function ContentBriefsTab() {
  const navigate = useNavigate();
  const [briefs, setBriefs] = useState<ContentBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    objective: '',
    audience: '',
    keyMessage: '',
    cta: '',
    deadline: '',
    notes: '',
  });

  const fetchBriefs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/content/briefs');
      if (res.data?.briefs) {
        setBriefs(res.data.briefs);
      }
    } catch {
      toast.error('Lỗi khi tải danh sách Content Brief');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBriefs();
  }, []);

  const handleCreateBrief = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề brief');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/content/briefs', formData);
      if (res.data) {
        toast.success(`Đã tạo brief "${formData.title}" thành công!`);
        setIsModalOpen(false);
        setFormData({
          title: '',
          objective: '',
          audience: '',
          keyMessage: '',
          cta: '',
          deadline: '',
          notes: '',
        });
        fetchBriefs();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi tạo brief');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBrief = async (id: string, title: string) => {
    if (!window.confirm(`Bạn có chắc muốn xoá brief "${title}"?`)) return;
    try {
      await api.delete(`/content/briefs?id=${id}`);
      toast.success('Đã xoá brief');
      setBriefs(prev => prev.filter(b => b.id !== id));
    } catch {
      toast.error('Lỗi khi xoá brief');
    }
  };

  const handleCreatePostFromBrief = (brief: ContentBrief) => {
    navigate('/create', {
      state: {
        prefilledTitle: brief.title,
        prefilledCaption: `[Mục tiêu: ${brief.objective || 'Tiếp thị'}]\n[Tệp khách hàng: ${brief.audience || 'Đại chúng'}]\n\n${brief.keyMessage || ''}\n\n👉 ${brief.cta || ''}`,
      },
    });
    toast.success(`Đã nạp brief "${brief.title}" sang màn hình Tạo Bài Viết!`);
  };

  const filteredBriefs = briefs.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    (b.objective || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.keyMessage || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-gray-900 text-sm">
              Quản Lý Content Brief (Bản Yêu Cầu Bài Viết - F077)
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Lập brief chuẩn chỉnh gồm mục tiêu, chân dung độc giả (audience), thông điệp then chốt (key message), CTA và deadline
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary py-2 px-3.5 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Brief Mới</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Tìm kiếm brief theo tiêu đề, mục tiêu hoặc thông điệp..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-gray-400">Đang tải danh sách brief...</div>
      ) : filteredBriefs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-gray-900">Chưa có Content Brief nào</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Tạo brief chi tiết để người viết hoặc AI bám sát định hướng truyền thông của thương hiệu.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary py-2 px-4 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Brief Đầu Tiên</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBriefs.map((b) => (
            <div
              key={b.id}
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs hover:border-purple-200 hover:shadow-xs transition space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-100 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-purple-600" />
                    {b.status || 'DRAFT'}
                  </span>

                  {b.deadline && (
                    <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Hạn: {new Date(b.deadline).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-gray-900 text-sm leading-snug">{b.title}</h4>

                {b.objective && (
                  <div className="text-xs text-gray-700">
                    <span className="font-bold text-gray-500 text-[10px] uppercase block">🎯 Mục tiêu:</span>
                    <p className="mt-0.5 font-medium">{b.objective}</p>
                  </div>
                )}

                {b.audience && (
                  <div className="text-xs text-gray-700">
                    <span className="font-bold text-gray-500 text-[10px] uppercase block">👥 Đối tượng (Audience):</span>
                    <p className="mt-0.5">{b.audience}</p>
                  </div>
                )}

                {b.keyMessage && (
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-800 space-y-0.5">
                    <span className="font-bold text-[10px] text-gray-500 uppercase block">🔑 Thông điệp then chốt:</span>
                    <p className="italic font-medium">"{b.keyMessage}"</p>
                  </div>
                )}

                {b.cta && (
                  <div className="text-xs text-amber-900 bg-amber-50/60 p-2 rounded-lg border border-amber-100 font-medium">
                    📢 CTA: {b.cta}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDeleteBrief(b.id, b.title)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-rose-600 transition"
                  title="Xoá brief"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleCreatePostFromBrief(b)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  Tạo bài viết từ Brief
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tạo Brief */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <span>Tạo Content Brief Mới (F077)</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBrief} className="p-5 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Tiêu Đề Brief <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Giới thiệu tính năng AI Content Studio cho chủ shop online..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Mục Tiêu (Objective)</label>
                  <input
                    type="text"
                    placeholder="Tăng leads, chuyển đổi, branding..."
                    value={formData.objective}
                    onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Đối Tượng (Audience)</label>
                  <input
                    type="text"
                    placeholder="Chủ doanh nghiệp nhỏ, Marketers 22-35t..."
                    value={formData.audience}
                    onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Thông Điệp Then Chốt (Key Message)</label>
                <textarea
                  rows={2}
                  placeholder="Điểm nhấn quan trọng nhất người đọc cần nhớ..."
                  value={formData.keyMessage}
                  onChange={(e) => setFormData({ ...formData, keyMessage: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-purple-500 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Lời kêu gọi (CTA)</label>
                  <input
                    type="text"
                    placeholder="Click link / Inbox ngay..."
                    value={formData.cta}
                    onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Thời Hạn Hoàn Thành (Deadline)</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary py-2 px-5 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  {submitting ? 'Đang tạo...' : 'Lưu Brief'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
