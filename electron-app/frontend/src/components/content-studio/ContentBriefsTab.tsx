import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  X,
  ArrowRight,
  Search,
  Sparkles,
  Calendar,
  AlertCircle
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
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  createdBy?: { name: string | null; email: string } | null;
}

const STATUS_CONFIG: Record<
  ContentBrief['status'],
  { label: string; bg: string; text: string; border: string }
> = {
  DRAFT: {
    label: 'Bản nháp',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  IN_PROGRESS: {
    label: 'Đang triển khai',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  CANCELLED: {
    label: 'Đã hủy',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
  },
};

export function ContentBriefsTab() {
  const navigate = useNavigate();
  const [briefs, setBriefs] = useState<ContentBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBrief, setEditingBrief] = useState<ContentBrief | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [formData, setFormData] = useState({
    title: '',
    objective: '',
    audience: '',
    keyMessage: '',
    cta: '',
    deadline: '',
    notes: '',
  });

  const [editFormData, setEditFormData] = useState({
    title: '',
    status: 'DRAFT' as ContentBrief['status'],
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
        setIsCreateModalOpen(false);
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

  const handleOpenEditModal = (brief: ContentBrief) => {
    setEditingBrief(brief);
    let deadlineStr = '';
    if (brief.deadline) {
      try {
        deadlineStr = new Date(brief.deadline).toISOString().split('T')[0];
      } catch {
        deadlineStr = '';
      }
    }
    setEditFormData({
      title: brief.title || '',
      status: brief.status || 'DRAFT',
      objective: brief.objective || '',
      audience: brief.audience || '',
      keyMessage: brief.keyMessage || '',
      cta: brief.cta || '',
      deadline: deadlineStr,
      notes: brief.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateBrief = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrief) return;
    if (!editFormData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề brief');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.patch('/content/briefs', {
        id: editingBrief.id,
        ...editFormData,
      });
      if (res.data?.success || res.data?.brief) {
        toast.success(`Đã cập nhật brief "${editFormData.title}" thành công!`);
        setIsEditModalOpen(false);
        setEditingBrief(null);
        fetchBriefs();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi cập nhật brief');
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

  const filteredBriefs = briefs.filter(b => {
    const matchesSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.objective || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.keyMessage || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.audience || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      selectedStatus === 'ALL' || b.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const countByStatus = {
    ALL: briefs.length,
    DRAFT: briefs.filter(b => b.status === 'DRAFT').length,
    IN_PROGRESS: briefs.filter(b => b.status === 'IN_PROGRESS').length,
    COMPLETED: briefs.filter(b => b.status === 'COMPLETED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/40 to-white border border-purple-100 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">
                Quản Lý Content Brief (Bản Yêu Cầu Bài Viết - F077)
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Lập brief chuẩn chỉnh gồm mục tiêu, chân dung độc giả (audience), thông điệp then chốt (key message), CTA và hạn chót
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary py-2.5 px-4 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto hover:scale-[1.02] transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Brief Mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedStatus('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              selectedStatus === 'ALL'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Tất cả ({countByStatus.ALL})
          </button>
          <button
            onClick={() => setSelectedStatus('DRAFT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              selectedStatus === 'DRAFT'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Bản nháp ({countByStatus.DRAFT})
          </button>
          <button
            onClick={() => setSelectedStatus('IN_PROGRESS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              selectedStatus === 'IN_PROGRESS'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Đang triển khai ({countByStatus.IN_PROGRESS})
          </button>
          <button
            onClick={() => setSelectedStatus('COMPLETED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              selectedStatus === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Hoàn thành ({countByStatus.COMPLETED})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm brief theo tiêu đề, mục tiêu, đối tượng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 focus:outline-none focus:border-purple-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Grid of Briefs */}
      {loading ? (
        <div className="py-16 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Đang tải danh sách Content Brief...</span>
        </div>
      ) : filteredBriefs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-gray-900">Chưa tìm thấy Content Brief nào</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {briefs.length === 0
              ? 'Tạo brief chi tiết để người viết hoặc AI bám sát định hướng truyền thông của thương hiệu.'
              : 'Không có brief nào khớp với bộ lọc hoặc từ khóa tìm kiếm.'}
          </p>
          {briefs.length === 0 && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary py-2 px-4 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Brief Đầu Tiên</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBriefs.map((b) => {
            const statusCfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.DRAFT;
            return (
              <div
                key={b.id}
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs hover:border-purple-200 hover:shadow-xs transition space-y-3.5 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Status, Deadline and Quick Edit */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1.5 ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {b.status || 'DRAFT'} ({statusCfg.label})
                    </span>

                    <div className="flex items-center gap-1.5">
                      {b.deadline && (
                        <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                          <Clock className="w-3 h-3" />
                          Hạn: {new Date(b.deadline).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(b)}
                        className="p-1 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition cursor-pointer"
                        title="Chỉnh sửa brief"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-purple-700 transition-colors">
                    {b.title}
                  </h4>

                  {/* Objective */}
                  {b.objective && (
                    <div className="text-xs text-gray-700">
                      <span className="font-bold text-gray-400 text-[10px] uppercase block tracking-wider">
                        🎯 Mục tiêu:
                      </span>
                      <p className="mt-0.5 font-medium text-gray-800">{b.objective}</p>
                    </div>
                  )}

                  {/* Audience */}
                  {b.audience && (
                    <div className="text-xs text-gray-700">
                      <span className="font-bold text-gray-400 text-[10px] uppercase block tracking-wider">
                        👥 Đối tượng (Audience):
                      </span>
                      <p className="mt-0.5 text-gray-800">{b.audience}</p>
                    </div>
                  )}

                  {/* Key Message */}
                  {b.keyMessage && (
                    <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 text-xs text-gray-800 space-y-1">
                      <span className="font-bold text-[10px] text-gray-500 uppercase block tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-600" />
                        Thông điệp then chốt:
                      </span>
                      <p className="italic font-medium leading-relaxed">"{b.keyMessage}"</p>
                    </div>
                  )}

                  {/* CTA */}
                  {b.cta && (
                    <div className="text-xs text-amber-900 bg-amber-50/70 p-2.5 rounded-xl border border-amber-100 font-medium flex items-center gap-1.5">
                      <span className="font-bold text-amber-700">📢 CTA:</span>
                      <span>{b.cta}</span>
                    </div>
                  )}

                  {/* Notes snippet if present */}
                  {b.notes && (
                    <div className="text-[11px] text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <span className="font-semibold text-gray-600">Ghi chú:</span> {b.notes}
                    </div>
                  )}
                </div>

                {/* Card Action Bar with Explicit Edit and Delete buttons */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(b)}
                      className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-800 border border-purple-100 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-2xs whitespace-nowrap"
                      title="Chỉnh sửa toàn bộ nội dung brief"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Chỉnh sửa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteBrief(b.id, b.title)}
                      className="p-1.5 rounded-xl hover:bg-rose-50 text-gray-400 hover:text-rose-600 border border-transparent hover:border-rose-100 transition cursor-pointer"
                      title="Xoá brief"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCreatePostFromBrief(b)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition flex items-center gap-1.5 shadow-2xs cursor-pointer hover:shadow-xs whitespace-nowrap flex-shrink-0"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Tạo bài viết</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tạo Brief Mới */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <span>Tạo Content Brief Mới (F077)</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBrief} className="p-5 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">
                  Tiêu Đề Brief <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Giới thiệu AI, Ra mắt bộ sưu tập thu đông..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-purple-500 focus:outline-none shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Mục Tiêu (Objective)</label>
                  <input
                    type="text"
                    placeholder="Chuyển đổi, Tăng nhận diện, Bán hàng..."
                    value={formData.objective}
                    onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-purple-500 focus:outline-none shadow-2xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Đối Tượng (Audience)</label>
                  <input
                    type="text"
                    placeholder="Doanh nghiệp tư nhân, Chủ shop online..."
                    value={formData.audience}
                    onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-purple-500 focus:outline-none shadow-2xs"
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
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-purple-500 focus:outline-none resize-none shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Lời kêu gọi (CTA)</label>
                  <input
                    type="text"
                    placeholder="Click link dùng thử, Đăng ký ngay..."
                    value={formData.cta}
                    onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-purple-500 focus:outline-none shadow-2xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Thời Hạn Hoàn Thành (Deadline)</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-purple-500 focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Ghi Chú Thêm (Notes)</label>
                <textarea
                  rows={2}
                  placeholder="Yêu cầu tone giọng, hashtag, lưu ý thương hiệu..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-purple-500 focus:outline-none resize-none shadow-2xs"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary py-2 px-5 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting ? 'Đang tạo...' : 'Lưu Brief'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chỉnh Sửa Content Brief */}
      {isEditModalOpen && editingBrief && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-indigo-50/40 to-white">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-purple-600" />
                <span>Chỉnh Sửa Content Brief (F077)</span>
              </h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingBrief(null);
                }}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateBrief} className="p-5 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">
                  Tiêu Đề Brief <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Giới thiệu AI, Ra mắt sản phẩm..."
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-purple-500 focus:outline-none shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Trạng Thái Brief</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        status: e.target.value as ContentBrief['status'],
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-purple-500 focus:outline-none shadow-2xs font-medium cursor-pointer"
                  >
                    <option value="DRAFT">🟣 Bản nháp (DRAFT)</option>
                    <option value="IN_PROGRESS">🔵 Đang triển khai (IN_PROGRESS)</option>
                    <option value="COMPLETED">🟢 Hoàn thành (COMPLETED)</option>
                    <option value="CANCELLED">⚪ Đã hủy (CANCELLED)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Thời Hạn Hoàn Thành (Deadline)</label>
                  <input
                    type="date"
                    value={editFormData.deadline}
                    onChange={(e) => setEditFormData({ ...editFormData, deadline: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-purple-500 focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Mục Tiêu (Objective)</label>
                  <input
                    type="text"
                    placeholder="Chuyển đổi, Giáo dục, Tương tác..."
                    value={editFormData.objective}
                    onChange={(e) => setEditFormData({ ...editFormData, objective: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-purple-500 focus:outline-none shadow-2xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Đối Tượng (Audience)</label>
                  <input
                    type="text"
                    placeholder="Doanh nghiệp tư nhân, Gen Z..."
                    value={editFormData.audience}
                    onChange={(e) => setEditFormData({ ...editFormData, audience: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-purple-500 focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Thông Điệp Then Chốt (Key Message)</label>
                <textarea
                  rows={2}
                  placeholder="Điểm nhấn quan trọng nhất người đọc cần nhớ..."
                  value={editFormData.keyMessage}
                  onChange={(e) => setEditFormData({ ...editFormData, keyMessage: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-purple-500 focus:outline-none resize-none shadow-2xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Lời kêu gọi (CTA)</label>
                <input
                  type="text"
                  placeholder="Click link dùng thử, Nhắn tin ngay..."
                  value={editFormData.cta}
                  onChange={(e) => setEditFormData({ ...editFormData, cta: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-purple-500 focus:outline-none shadow-2xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Ghi Chú Thêm (Notes)</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú thêm về hashtag, lưu ý quan trọng..."
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-purple-500 focus:outline-none resize-none shadow-2xs"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingBrief(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary py-2 px-5 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
