import { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Search,
  Eye,
  Edit2,
  X,
  Calendar,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/axios';

export interface ContentPillar {
  id: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: string;
  _count?: {
    plans: number;
  };
}

export interface ContentPlanItem {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  pillarId: string | null;
}

export function ContentPillarsTab() {
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', color: '#5B3DF5' });

  const [editingPillar, setEditingPillar] = useState<ContentPillar | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', description: '', color: '#5B3DF5' });
  const [isUpdating, setIsUpdating] = useState(false);

  // Sub-tab: Pillars vs Plans
  const [viewMode, setViewMode] = useState<'pillars' | 'plans'>('pillars');

  const predefinedColors = [
    '#5B3DF5', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#14B8A6', '#F97316'
  ];

  const fetchPillars = async () => {
    try {
      setLoading(true);
      const res = await api.get('/content/pillars');
      if (res.data) {
        setPillars(res.data.pillars || []);
      }
    } catch {
      toast.error('Lỗi khi tải danh sách Trụ cột nội dung');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPillars();
  }, []);

  const handleCreatePillar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên trụ cột nội dung');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/content/pillars', formData);
      if (res.data) {
        toast.success(`Đã thêm trụ cột nội dung "${formData.name}" thành công!`);
        setIsModalOpen(false);
        setFormData({ name: '', description: '', color: '#5B3DF5' });
        fetchPillars();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi tạo trụ cột nội dung');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePillar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPillar) return;
    try {
      setIsUpdating(true);
      const res = await api.patch('/content/pillars', {
        id: editingPillar.id,
        ...editFormData
      });
      if (res.data) {
        toast.success('Đã cập nhật trụ cột nội dung thành công!');
        setPillars(prev => prev.map(p => p.id === editingPillar.id ? { ...p, ...editFormData } : p));
        setEditingPillar(null);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Lỗi khi cập nhật trụ cột nội dung');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePillar = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xoá trụ cột "${name}"? Các bài viết và kế hoạch liên quan sẽ được tách ra.`)) {
      return;
    }
    try {
      await api.delete(`/content/pillars?id=${id}`);
      toast.success(`Đã xoá trụ cột "${name}"`);
      setPillars(prev => prev.filter(p => p.id !== id));
    } catch {
      toast.error('Lỗi khi xoá trụ cột');
    }
  };

  const filteredPillars = pillars.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900 text-sm">
              Trụ Cột Nội Dung (Content Pillar - F073) & Kế Hoạch Tháng/Quý (F074)
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Phân bổ tỷ trọng chủ đề cốt lõi (Kiến thức, Bán hàng, Giải trí, Review) để giữ nhịp độ kênh đa dạng, chuyên nghiệp
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white p-1 rounded-xl border border-indigo-200">
            <button
              onClick={() => setViewMode('pillars')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                viewMode === 'pillars'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Trụ cột (Pillars)
            </button>
            <button
              onClick={() => setViewMode('plans')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                viewMode === 'plans'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Kế hoạch tháng/quý (Plans)
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary py-2 px-3.5 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Trụ Cột Mới</span>
          </button>
        </div>
      </div>

      {viewMode === 'pillars' ? (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm trụ cột theo tên hoặc mô tả chiến dịch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Pillars Grid */}
          {loading ? (
            <div className="py-12 text-center text-xs text-gray-400">Đang tải danh sách trụ cột nội dung...</div>
          ) : filteredPillars.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-gray-900">Chưa có Trụ Cột Nội Dung nào</h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Hãy định hình các trụ cột chính (ví dụ: "70% Chia sẻ kiến thức & Mẹo", "20% Review & Case Study", "10% Giảm giá & Bán hàng") để chiến lược nội dung đồng nhất.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-primary py-2 px-4 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Khởi tạo Trụ Cột Đầu Tiên</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredPillars.map((pillar) => (
                <div
                  key={pillar.id}
                  className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs hover:border-indigo-200 hover:shadow-xs transition space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-2xs"
                          style={{ backgroundColor: pillar.color || '#5B3DF5' }}
                        />
                        <h4 className="font-bold text-gray-900 text-sm">{pillar.name}</h4>
                      </div>
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-gray-50 text-gray-600 border border-gray-100">
                        {pillar._count?.plans || 0} kế hoạch
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed min-h-[40px]">
                      {pillar.description || <span className="text-gray-400 italic">Chưa có mô tả chi tiết cho trụ cột này.</span>}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">
                      Tạo ngày {new Date(pillar.createdAt).toLocaleDateString('vi-VN')}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingPillar(pillar);
                          setEditFormData({
                            name: pillar.name,
                            description: pillar.description || '',
                            color: pillar.color || '#5B3DF5'
                          });
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePillar(pillar.id, pillar.name)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-rose-600 transition"
                        title="Xoá trụ cột"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Content Plan Tháng/Quý (F074) */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Lập Kế Hoạch Nội Dung Tháng & Quý (F074)
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Xếp lịch các đợt phát hành bài viết theo tuần, tháng và quý gắn liền với mục tiêu tăng trưởng
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-2">
              <span className="text-xs font-bold text-indigo-900">Tuần 1: Nhận diện & Giáo dục</span>
              <p className="text-[11px] text-gray-600">Trọng tâm: Chia sẻ kiến thức ngành, mẹo vặt, giải quyết nỗi đau phổ biến.</p>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-indigo-700 font-semibold border border-indigo-200 inline-block">
                Target: 10 bài / 4 kênh
              </span>
            </div>

            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 space-y-2">
              <span className="text-xs font-bold text-blue-900">Tuần 2: Tương tác & Trải nghiệm</span>
              <p className="text-[11px] text-gray-600">Trọng tâm: Đặt câu hỏi, mini-game, video tình huống hài hước giữ chân người xem.</p>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-blue-700 font-semibold border border-blue-200 inline-block">
                Target: 12 bài / 4 kênh
              </span>
            </div>

            <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/40 space-y-2">
              <span className="text-xs font-bold text-amber-900">Tuần 3: Case Study & Niềm tin</span>
              <p className="text-[11px] text-gray-600">Trọng tâm: Đánh giá của khách hàng, bằng chứng thực tế, so sánh ưu điểm.</p>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-amber-700 font-semibold border border-amber-200 inline-block">
                Target: 8 bài / 4 kênh
              </span>
            </div>

            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-2">
              <span className="text-xs font-bold text-emerald-900">Tuần 4: Chốt đơn & Bùng nổ</span>
              <p className="text-[11px] text-gray-600">Trọng tâm: Ưu đãi chớp nhoáng, Livestream bán hàng, Call-to-action mạnh mẽ.</p>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-emerald-700 font-semibold border border-emerald-200 inline-block">
                Target: 15 bài / 4 kênh
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo Trụ Cột Mới */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Tạo Trụ Cột Nội Dung (F073)</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePillar} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Tên Trụ Cột <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Kiến thức chuyên môn, Review sản phẩm, Khuyến mãi..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Mô Tả Định Hướng</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả mục tiêu, phong cách và thông điệp cốt lõi cho trụ cột này..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-gray-700">Màu Sắc Nhận Diện</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-7 h-7 rounded-xl transition-transform ${
                        formData.color === color ? 'scale-115 ring-2 ring-offset-2 ring-indigo-500' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
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
                  disabled={isSubmitting}
                  className="btn-primary py-2 px-5 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Tạo Trụ Cột'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Sửa Trụ Cột */}
      {editingPillar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                <span>Chỉnh Sửa Trụ Cột</span>
              </h3>
              <button
                onClick={() => setEditingPillar(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePillar} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Tên Trụ Cột</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Mô Tả Định Hướng</label>
                <textarea
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-gray-700">Màu Sắc Nhận Diện</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, color })}
                      className={`w-7 h-7 rounded-xl transition-transform ${
                        editFormData.color === color ? 'scale-115 ring-2 ring-offset-2 ring-indigo-500' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPillar(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="btn-primary py-2 px-5 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  {isUpdating ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
